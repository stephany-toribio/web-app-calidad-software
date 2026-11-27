import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { MarkdownPipe } from '../../../core/pipes/markdown.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';
import { VacantesService } from '../../../core/api/vacantes.service';
import { MetaPaginacion } from '../../../core/api/models/api-response.model';
import { RevisionModeracion, VacanteRevision } from '../../../core/api/models/vacante-empresa.model';

export type ReportStatus = "pending" | "unpublished" | "approved";

type FiltroModeracion = "all" | ReportStatus;

const REVISION_POR_FILTRO: Record<FiltroModeracion, RevisionModeracion> = {
  pending: 'pendiente',
  approved: 'aprobada',
  unpublished: 'no_aprobada',
  all: 'todas',
};

export interface ReportedJob {
  id: string;
  title: string;
  company: string;
  reportedAt: string;
  reason: string;
  status: ReportStatus;
  unpublishReason?: string;
  isInitialReview?: boolean;
  description?: string;
  salary?: string;
  experience?: string;
  modality?: string;
  hireLimit?: number;
  closeDate?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
  requirements?: string[];
  benefits?: string[];
}

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent, MarkdownPipe],
  templateUrl: './admin-moderation.component.html',
  styleUrl: './admin-moderation.component.css'
})
export class AdminModerationComponent implements OnInit, OnDestroy {
  private vacantesService = inject(VacantesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subs = new Subscription();
  private cargaActual?: Subscription;

  /** Página actual de GET /admin/vacantes para la pestaña elegida */
  reports: ReportedJob[] = [];
  filter: FiltroModeracion = "pending";
  pagina = 1;
  meta: MetaPaginacion | null = null;
  private pendingTotal = 0;

  /** Cada cuanto se reconsulta la cola mientras la pestana esta a la vista */
  private readonly intervaloRefresco = 45_000;
  private refrescoTimer: ReturnType<typeof setInterval> | null = null;

  loading = false;
  loadError = '';
  /** Errores por vacante de la aprobación masiva (422 BULK_APPROVAL_REJECTED) */
  bulkErrors: string[] = [];

  selectedReportIds = new Set<string>();

  reviewingJob: ReportedJob | null = null;

  toast: string | null = null;
  toastTimeout: any;

  unpublishing: ReportedJob | null = null;
  unpublishReason = '';
  unpublishError = '';

  massUnpublishOpen = false;
  massUnpublishReason = '';
  massUnpublishError = '';

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab && tab in REVISION_POR_FILTRO) {
      this.filter = tab as FiltroModeracion;
    }

    this.cargar();
    if (this.filter !== 'pending') this.cargarConteoPendientes();

    // Las empresas registran vacantes desde otra sesion del navegador: sin un
    // canal del servidor esta cola no se entera sola. Se reconsulta al volver
    // a la pestana y cada 45 s mientras esta a la vista.
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
    window.addEventListener('focus', this.alCambiarVisibilidad);
    this.programarRefresco();
  }

  private readonly alCambiarVisibilidad = (): void => {
    if (document.hidden) {
      this.detenerRefresco();
      return;
    }

    this.refrescarSiSePuede();
    this.programarRefresco();
  };

  private programarRefresco(): void {
    this.detenerRefresco();
    if (document.hidden) return;
    this.refrescoTimer = setInterval(
      () => this.refrescarSiSePuede(), this.intervaloRefresco
    );
  }

  private detenerRefresco(): void {
    if (this.refrescoTimer) {
      clearInterval(this.refrescoTimer);
      this.refrescoTimer = null;
    }
  }

  /**
   * No se recarga con un dialogo abierto ni con filas marcadas: le cambiaria
   * la seleccion al administrador en mitad de una aprobacion masiva.
   */
  private refrescarSiSePuede(): void {
    if (document.hidden) return;
    if (this.reviewingJob || this.unpublishing || this.massUnpublishOpen) return;
    if (this.selectedReportIds.size > 0) return;

    this.cargar(true);
    if (this.filter !== 'pending') this.cargarConteoPendientes();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.cargaActual?.unsubscribe();

    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
    window.removeEventListener('focus', this.alCambiarVisibilidad);
    this.detenerRefresco();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  get filteredReports(): ReportedJob[] {
    return this.reports.filter(r => this.filter === 'all' || r.status === this.filter);
  }

  get pendingCount(): number {
    return this.pendingTotal;
  }

  get totalPaginas(): number {
    return this.meta?.last_page ?? 1;
  }

  cambiarFiltro(filtro: FiltroModeracion): void {
    if (filtro === this.filter) return;

    this.filter = filtro;
    this.pagina = 1;
    this.selectedReportIds.clear();
    this.router.navigate([], { relativeTo: this.route, queryParams: { tab: filtro }, replaceUrl: true });
    this.cargar();
  }

  irAPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.pagina) return;

    this.pagina = pagina;
    this.selectedReportIds.clear();
    this.cargar();
  }

  get isAllSelected(): boolean {
    const selectable = this.filteredReports.filter(r => r.status === 'pending');
    return selectable.length > 0 && selectable.every(r => this.selectedReportIds.has(r.id));
  }

  toggleSelectAll(): void {
    const selectable = this.filteredReports.filter(r => r.status === 'pending');
    if (this.isAllSelected) {
      selectable.forEach(r => this.selectedReportIds.delete(r.id));
    } else {
      selectable.forEach(r => this.selectedReportIds.add(r.id));
    }
  }

  toggleSelect(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.selectedReportIds.has(id)) {
      this.selectedReportIds.delete(id);
    } else {
      this.selectedReportIds.add(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedReportIds.has(id);
  }

  clearSelection(): void {
    this.selectedReportIds.clear();
  }

  get selectedCount(): number {
    return this.selectedReportIds.size;
  }

  showToast(msg: string): void {
    this.toast = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toast = null, 4000);
  }

  getReasonStyle(reason: string): { bg: string; text: string } {
    const map: Record<string, { bg: string; text: string }> = {
      "Revisión previa obligatoria (Nueva vacante)": { bg: "#FEF9C3", text: "#A16207" },
      "Revisión previa obligatoria (Vacante editada)": { bg: "#FEF9C3", text: "#A16207" },
      "Revisión previa obligatoria":                 { bg: "#FEF9C3", text: "#A16207" },
      "Contenido engañoso":                          { bg: "#FEE2E2", text: "#DC2626" },
      "Salario no especificado correctamente":        { bg: "#FEF3C7", text: "#B45309" },
      "Requisitos discriminatorios":                 { bg: "#FEE2E2", text: "#DC2626" },
      "Modalidad laboral incorrecta":                { bg: "#F0F9FF", text: "#0369A1" },
      "Contacto externo sospechoso":                 { bg: "#FEF3C7", text: "#B45309" },
    };
    return map[reason] ?? { bg: "#F1F5F9", text: "#475569" };
  }

  getStatusStyle(status: ReportStatus): { bg: string; text: string; label: string } {
    const map: Record<ReportStatus, { bg: string; text: string; label: string }> = {
      pending:     { bg: "#FEF3C7", text: "#B45309", label: "Pendiente de revisión" },
      unpublished: { bg: "#FEE2E2", text: "#DC2626", label: "No aprobada / Despublicada" },
      approved:    { bg: "#DCFCE7", text: "#15803D", label: "Aprobada" },
    };
    return map[status];
  }

  // Review Detail Drawer (HU22-T10)
  openReviewDetail(job: ReportedJob, event?: Event): void {
    if (event) event.stopPropagation();
    this.reviewingJob = job;
  }

  closeReviewDetail(): void {
    this.reviewingJob = null;
  }

  /** Se cancela la carga anterior para que una respuesta vieja no pise la pestaña actual */
  cargar(silencioso = false): void {
    if (!silencioso) {
      this.loading = true;
      this.loadError = '';
    }
    this.cargaActual?.unsubscribe();

    const idsAnteriores = new Set(this.reports.map(r => r.id));

    this.cargaActual = this.vacantesService
      .listadoModeracion(REVISION_POR_FILTRO[this.filter], this.pagina)
      .subscribe({
        next: ({ vacantes, meta }) => {
          this.loading = false;
          this.reports = vacantes.map(vr => this.desdeRevision(vr));
          this.meta = meta;
          if (silencioso) this.avisarNuevas(idsAnteriores);

          // Al aprobar el ultimo de una pagina, esa pagina puede dejar de existir
          if (meta.last_page >= 1 && this.pagina > meta.last_page) {
            this.pagina = meta.last_page;
            this.cargar();
            return;
          }
          if (this.filter === 'pending') this.pendingTotal = meta.total;

          // Una vacante que ya no está en la página no puede seguir seleccionada
          const vigentes = new Set(this.reports.map(r => r.id));
          this.selectedReportIds.forEach(id => {
            if (!vigentes.has(id)) this.selectedReportIds.delete(id);
          });
        },
        error: (err: HttpErrorResponse) => {
          // Un fallo del refresco de fondo no debe vaciar la cola en pantalla
          if (silencioso) return;

          this.loading = false;
          this.reports = [];
          this.meta = null;
          this.loadError = err.error?.message || 'No fue posible cargar las vacantes.';
        }
      });
  }

  /**
   * Tras aprobar o no aprobar, la vacante deja de pertenecer a "Pendientes".
   * Retocar la fila la dejaba visible con su estado nuevo y descuadraba el
   * total, que es lo que obligaba a recargar con F5; se relee del servidor.
   */
  /** Avisa cuando una empresa registro una vacante mientras mirabas la cola */
  private avisarNuevas(idsAnteriores: Set<string>): void {
    if (idsAnteriores.size === 0) return;

    const nuevas = this.reports.filter(r => !idsAnteriores.has(r.id));
    if (nuevas.length === 0) return;

    this.showToast(
      nuevas.length === 1
        ? `Nueva vacante en revisión: "${nuevas[0].title}".`
        : `Llegaron ${nuevas.length} vacantes nuevas a revisión.`
    );
  }

  private recargarTrasDecision(): void {
    this.cargarConteoPendientes();
    this.cargar();
  }

  private cargarConteoPendientes(): void {
    this.subs.add(
      this.vacantesService.listadoModeracion('pendiente').subscribe({
        next: ({ meta }) => this.pendingTotal = meta.total,
        error: () => {}
      })
    );
  }

  private desdeRevision(vr: VacanteRevision): ReportedJob {
    // Las decididas muestran la fecha de la decisión, que es por la que se ordenan
    const fecha = vr.revision?.revisado_en ?? vr.creado_en;
    const createdAt = fecha ? new Date(fecha) : new Date();
    const formattedDate = createdAt.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });

    // Los dos salarios llegan con valor o los dos en null (vacante sin salario publicado)
    let salary = 'A convenir';
    if (vr.salario_min !== null && vr.salario_max !== null) {
      salary = `S/ ${vr.salario_min.toLocaleString()} – ${vr.salario_max.toLocaleString()}`;
    }

    let status: ReportStatus = 'pending';
    if (vr.revision?.estado === 'aprobada') status = 'approved';
    else if (vr.revision?.estado === 'no_aprobada') status = 'unpublished';

    return {
      id: String(vr.id),
      title: vr.titulo,
      company: vr.empresa?.razon_social || 'Empresa',
      reportedAt: formattedDate,
      reason: 'Revisión previa obligatoria',
      status,
      unpublishReason: vr.revision?.motivo || undefined,
      isInitialReview: true,
      description: vr.descripcion,
      salary,
      experience: vr.nivel_puesto?.nombre || 'General',
      modality: vr.tipo_empleo === 'remoto' ? 'Remoto' : (vr.tipo_empleo === 'hibrido' ? 'Híbrido' : 'Presencial'),
      hireLimit: vr.max_contrataciones,
      closeDate: vr.fecha_fin_vigencia,
      mustHaveSkills: vr.habilidades?.filter(h => h.requisito === 'must_have').map(h => h.nombre) || [],
      niceToHaveSkills: vr.habilidades?.filter(h => h.requisito === 'nice_to_have').map(h => h.nombre) || [],
      requirements: vr.requisitos ?? [],
      benefits: vr.beneficios ?? []
    };
  }

  /** Reemplaza la fila con lo que devolvió el backend tras la decisión */
  private actualizarFila(vr: VacanteRevision): ReportedJob {
    const actualizada = this.desdeRevision(vr);
    this.reports = this.reports.map(r => r.id === actualizada.id ? actualizada : r);
    this.selectedReportIds.delete(actualizada.id);
    if (this.reviewingJob?.id === actualizada.id) {
      this.reviewingJob = actualizada;
    }
    return actualizada;
  }

  /** 409 VACANCY_ALREADY_REVIEWED: otro admin decidió antes; se recarga la cola */
  private manejarYaRevisada(err: HttpErrorResponse): boolean {
    if (err.status === 409 && err.error?.error_code === 'VACANCY_ALREADY_REVIEWED') {
      this.cargar();
      this.cargarConteoPendientes();
      return true;
    }
    return false;
  }

  // Individual Actions
  approve(r: ReportedJob): void {
    this.vacantesService.aprobarVacante(Number(r.id)).subscribe({
      next: (vr) => {
        this.actualizarFila(vr);
        this.recargarTrasDecision();
        this.showToast(`Vacante "${r.title}" aprobada. La empresa debe completar el pago para publicarla.`);
      },
      error: (err: HttpErrorResponse) => {
        this.manejarYaRevisada(err);
        this.showToast(err.error?.message || 'Error al aprobar la vacante.');
      }
    });
  }

  beginUnpublish(r: ReportedJob): void {
    this.unpublishing = r;
    this.unpublishReason = '';
    this.unpublishError = '';
  }

  confirmUnpublish(): void {
    const motivo = this.unpublishReason.trim();
    if (!motivo) {
      this.unpublishError = "Debes ingresar un motivo para no aprobar la vacante";
      return;
    }
    if (motivo.length > 500) {
      this.unpublishError = 'El motivo no debe superar los 500 caracteres.';
      return;
    }
    if (!this.unpublishing) return;

    const target = this.unpublishing;
    this.vacantesService.noAprobarVacante(Number(target.id), motivo).subscribe({
      next: (vr) => {
        this.actualizarFila(vr);
        this.recargarTrasDecision();
        this.showToast(`Vacante "${target.title}" marcada como no aprobada.`);
        this.unpublishing = null;
      },
      error: (err: HttpErrorResponse) => {
        if (this.manejarYaRevisada(err)) {
          this.unpublishing = null;
          this.showToast(err.error?.message || 'La vacante ya fue revisada.');
          return;
        }
        this.unpublishError = err.error?.errors?.motivo?.[0] || err.error?.message || 'Error al no aprobar la vacante.';
      }
    });
  }

  // Mass Actions
  /** HU-22: aprobación masiva "todo o nada" (POST /admin/vacantes/aprobar-masivo) */
  approveSelected(): void {
    if (this.selectedReportIds.size === 0) return;
    const ids = Array.from(this.selectedReportIds).map(Number);
    this.bulkErrors = [];

    this.vacantesService.aprobarMasivo(ids).subscribe({
      next: (resp) => {
        const aprobadas = new Set(resp.aprobadas.map(String));
        this.reports = this.reports.map(r =>
          aprobadas.has(r.id) ? { ...r, status: 'approved' as ReportStatus } : r
        );
        aprobadas.forEach(id => this.selectedReportIds.delete(id));
        this.recargarTrasDecision();
        const n = resp.aprobadas.length;
        this.showToast(`Se ${n === 1 ? 'aprobó 1 vacante' : `aprobaron ${n} vacantes`}. Cada empresa debe completar el pago para publicarlas.`);
      },
      error: (err: HttpErrorResponse) => {
        // El índice de "vacantes.N" corresponde a la posición en la lista enviada
        const errores: Record<string, string[]> = err.error?.errors || {};
        this.bulkErrors = Object.entries(errores).flatMap(([clave, mensajes]) => {
          const idx = Number(clave.split('.')[1]);
          const r = this.reports.find(x => x.id === String(ids[idx]));
          return (mensajes || []).map(m => r ? `${r.title}: ${m}` : m);
        });
        this.showToast(err.error?.message || 'Error al aprobar las vacantes seleccionadas.');
      }
    });
  }

  openMassUnpublish(): void {
    if (this.selectedReportIds.size === 0) return;
    this.massUnpublishReason = '';
    this.massUnpublishError = '';
    this.massUnpublishOpen = true;
  }

  /**
   * El backend no tiene no-aprobación masiva: se envía una petición individual
   * por vacante y solo se marcan como no aprobadas las que el backend confirmó.
   */
  confirmMassUnpublish(): void {
    const reason = this.massUnpublishReason.trim();
    if (!reason) {
      this.massUnpublishError = 'Debes ingresar un motivo general para no aprobar las vacantes seleccionadas';
      return;
    }
    if (reason.length > 500) {
      this.massUnpublishError = 'El motivo no debe superar los 500 caracteres.';
      return;
    }

    const ids = Array.from(this.selectedReportIds);
    forkJoin(
      ids.map(id =>
        this.vacantesService.noAprobarVacante(Number(id), reason).pipe(
          map(vr => ({ id, vr, error: null as string | null })),
          catchError((err: HttpErrorResponse) =>
            of({ id, vr: null, error: err.error?.message || 'Error al no aprobar la vacante.' })
          )
        )
      )
    ).subscribe(resultados => {
      const fallidas = resultados.filter(res => !res.vr);
      resultados.forEach(res => { if (res.vr) this.actualizarFila(res.vr); });

      this.bulkErrors = fallidas.map(f => {
        const r = this.reports.find(x => x.id === f.id);
        return `${r?.title ?? 'Vacante ' + f.id}: ${f.error}`;
      });
      this.massUnpublishOpen = false;
      this.recargarTrasDecision();

      const ok = resultados.length - fallidas.length;
      this.showToast(fallidas.length === 0
        ? `Se marcaron ${ok} vacante${ok !== 1 ? 's' : ''} como no aprobada${ok !== 1 ? 's' : ''}.`
        : `${ok} vacante${ok !== 1 ? 's' : ''} no aprobada${ok !== 1 ? 's' : ''}; ${fallidas.length} no se pudieron procesar.`);
    });
  }

  trackById(index: number, report: ReportedJob): string {
    return report.id;
  }
}
