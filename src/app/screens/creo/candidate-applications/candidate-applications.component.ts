import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { PostulacionesService } from '../../../core/api/postulaciones.service';
import {
  MiPostulacion,
  EtapaPostulacionCodigo,
  EstadoVacante
} from '../../../core/api/models/postulacion.model';

type FilterType = 'all' | 'active' | 'finished';

interface StatusStyle {
  label: string;
  bg: string;
  text: string;
  dot: string;
}

@Component({
  selector: 'app-candidate-applications',
  standalone: true,
  imports: [CommonModule, CandidateShellComponent],
  templateUrl: './candidate-applications.component.html',
  styleUrl: './candidate-applications.component.css'
})
export class CandidateApplicationsComponent implements OnInit, OnDestroy {
  filter: FilterType = 'all';
  expandedIds = new Set<number>();
  withdrawTargetApp: MiPostulacion | null = null;
  submittingWithdraw = false;

  applications: MiPostulacion[] = [];
  loading = true;
  errorMessage = '';
  toastMessage: string | null = null;
  private toastTimer: any;

  readonly activeStatuses: EtapaPostulacionCodigo[] = ['recibido', 'en_revision', 'entrevista'];
  readonly timelineSteps: { codigo: EtapaPostulacionCodigo; label: string }[] = [
    { codigo: 'recibido', label: 'Recibido' },
    { codigo: 'en_revision', label: 'En Revisión' },
    { codigo: 'entrevista', label: 'Entrevista' },
    { codigo: 'contratado', label: 'Contratado' },
  ];

  readonly statusConfig: Record<EtapaPostulacionCodigo, StatusStyle> = {
    recibido:    { label: 'Recibido',    bg: '#F3F4F6', text: '#4B5563', dot: '#9CA3AF' },
    en_revision: { label: 'En Revisión', bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
    entrevista:  { label: 'Entrevista',  bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B' },
    contratado:  { label: 'Contratado',  bg: '#DCFCE7', text: '#15803D', dot: '#22C55E' },
    rechazado:   { label: 'Rechazado',   bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' },
  };

  private subs = new Subscription();
  private refrescoSub?: Subscription;
  private consultaVersion = 0;
  private readonly intervaloRefresco = 45_000;
  private refrescoTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private postulacionesService: PostulacionesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPostulaciones();

    // La empresa mueve el Kanban en OTRA sesión del navegador; sin un canal del
    // servidor (WebSocket) esta pantalla no se entera sola. Se vuelve a
    // consultar al regresar a la pestaña y cada 45 s mientras está a la vista.
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
    window.addEventListener('focus', this.alCambiarVisibilidad);
    this.programarRefresco();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.refrescoSub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);

    document.removeEventListener('visibilitychange', this.alCambiarVisibilidad);
    window.removeEventListener('focus', this.alCambiarVisibilidad);
    this.detenerRefresco();
  }

  // ── Refresco automático ────────────────────────────────────────

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

  /** Con el diálogo de retiro abierto no se recarga: cambiaría los datos bajo el usuario */
  private refrescarSiSePuede(): void {
    if (document.hidden) return;
    if (this.withdrawTargetApp || this.submittingWithdraw) return;

    this.cargarPostulaciones(true);
  }

  /**
   * GET /candidatos/me/postulaciones. En modo silencioso no muestra el esqueleto de
   * carga ni borra lo que ya hay en pantalla: lo usa el refresco de fondo.
   */
  cargarPostulaciones(silencioso = false): void {
    if (this.submittingWithdraw || this.withdrawTargetApp) return;

    const version = ++this.consultaVersion;

    this.refrescoSub?.unsubscribe();

    if (!silencioso) {
      this.loading = true;
      this.errorMessage = '';
    }

    const anteriores = new Map(this.applications.map(a => [a.id, a.estado.codigo]));

    const peticion = this.postulacionesService.misPostulaciones().subscribe({
      next: (apps) => {
        if (
          version !== this.consultaVersion ||
          this.submittingWithdraw
        ) return;

        this.applications = apps || [];
        this.loading = false;
        if (silencioso) this.avisarCambios(anteriores);
      },
      error: (err) => {
        if (version !== this.consultaVersion) return;

        this.loading = false;

        // Un fallo del refresco de fondo no debe vaciar la pantalla
        if (silencioso) return;

        this.loading = false;
        if (err.status === 401) {
          this.errorMessage = 'Inicia sesión como candidato para ver tus postulaciones.';
        } else {
          this.errorMessage = err.error?.message || 'No fue posible cargar tus postulaciones.';
        }
      }
    });

    this.refrescoSub = peticion;
  }

  /** Avisa si la empresa movió el Kanban con la pantalla abierta */
  private avisarCambios(anteriores: Map<number, EtapaPostulacionCodigo>): void {
    const cambiadas = this.applications.filter(
      a => anteriores.has(a.id) && anteriores.get(a.id) !== a.estado.codigo
    );

    if (cambiadas.length === 0) return;

    this.showToast(
      cambiadas.length === 1
        ? `Tu postulación cambió a ${this.statusConfig[cambiadas[0].estado.codigo]?.label ?? cambiadas[0].estado.codigo}.`
        : `${cambiadas.length} de tus postulaciones cambiaron de estado.`
    );
  }

  get activeCount(): number {
    return this.applications.filter(a => !a.retirada && this.activeStatuses.includes(a.estado.codigo)).length;
  }

  get finishedCount(): number {
    return this.applications.filter(a => a.retirada || a.estado.codigo === 'contratado' || a.estado.codigo === 'rechazado').length;
  }

  get displayedApplications(): MiPostulacion[] {
    return this.applications.filter(a => {
      const isFinished = a.retirada || a.estado.codigo === 'contratado' || a.estado.codigo === 'rechazado';
      if (this.filter === 'active') return !isFinished;
      if (this.filter === 'finished') return isFinished;
      return true;
    });
  }

  setFilter(f: FilterType): void {
    this.filter = f;
  }

  toggleExpand(id: number): void {
    if (this.expandedIds.has(id)) {
      this.expandedIds.delete(id);
    } else {
      this.expandedIds.add(id);
    }
  }

  isExpanded(id: number): boolean {
    return this.expandedIds.has(id);
  }

  getStatusConfig(codigo: EtapaPostulacionCodigo): StatusStyle {
    return this.statusConfig[codigo] || this.statusConfig.recibido;
  }

  getVacanteBadgeConfig(estado: EstadoVacante): { bg: string; text: string; dot: string } {
    switch (estado) {
      case 'activa':
        return { bg: '#DCFCE7', text: '#15803D', dot: '#15803D' };
      case 'pausada':
        return { bg: '#FEF3C7', text: '#B45309', dot: '#B45309' };
      case 'finalizada':
        return { bg: '#F3F4F6', text: '#4B5563', dot: '#4B5563' };
      case 'eliminada':
        return { bg: '#FEE2E2', text: '#DC2626', dot: '#DC2626' };
      default:
        return { bg: '#F3F4F6', text: '#6B6560', dot: '#9A948C' };
    }
  }

  vacanteEstadoLabel(estado: EstadoVacante): string {
    switch (estado) {
      case 'activa': return 'Activa';
      case 'pausada': return 'Pausada';
      case 'finalizada': return 'Finalizada';
      case 'eliminada': return 'Eliminada';
      default: return estado;
    }
  }

  openWithdraw(app: MiPostulacion, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.submittingWithdraw || this.withdrawTargetApp) return;

    const actual = this.applications.find(
      item => item.id === app.id
    );

    if (
      !actual ||
      actual.retirada ||
      !actual.puede_retirar
    ) return;

    this.consultaVersion++;
    this.refrescoSub?.unsubscribe();
    this.loading = false;

    this.withdrawTargetApp = actual;
  }

  closeWithdraw(): void {
    if (this.submittingWithdraw) return;

    this.withdrawTargetApp = null;
  }

  confirmWithdraw(): void {
    if (
      !this.withdrawTargetApp ||
      this.submittingWithdraw
    ) return;

    const actual = this.applications.find(
      app => app.id === this.withdrawTargetApp?.id
    );

    if (
      !actual ||
      actual.retirada ||
      !actual.puede_retirar
    ) return;

    this.consultaVersion++;
    this.refrescoSub?.unsubscribe();

    this.submittingWithdraw = true;

    const targetId = actual.id;

    this.subs.add(
      this.postulacionesService.retirar(targetId).subscribe({
        next: (resultado) => {
          this.submittingWithdraw = false;
          this.closeWithdraw();

          this.applications = this.applications.map(app =>
            app.id === targetId
              ? {
                  ...app,
                  estado: resultado.estado,
                  retirada: resultado.retirada,
                  retirada_en: resultado.retirada_en,
                  puede_retirar: false
                }
              : app
          );

          this.showToast(
            'Te retiraste de la postulación exitosamente.'
          );
        },

        error: (err) => {
          this.submittingWithdraw = false;

          const msg = err.status === 0
            ? 'No se pudo confirmar el retiro. Consulta el estado actualizado.'
            : err.error?.message ||
              'No fue posible retirar la postulación.';

          this.showToast(msg);

          if (
            err.status === 409 ||
            err.status === 404 ||
            err.status === 403 ||
            err.status === 0
          ) {
            this.closeWithdraw();

            this.cargarPostulaciones();
          }
        }
      })
    );
  }

  viewJobDetail(app: MiPostulacion, event?: Event): void {
    if (event) event.stopPropagation();
    if (!app.ver_vacante) return;

    if (app.ver_vacante === 'disponible') {
      this.router.navigate(['/creo/candidate-job-detail'], {
        queryParams: { id: app.vacante.id }
      });
    } else if (app.ver_vacante === 'historico') {
      this.router.navigate(['/creo/candidate-job-detail'], {
        queryParams: { postulacionId: app.id }
      });
    }
  }

  exploreJobs(): void {
    this.router.navigate(['/creo/candidate-jobs']);
  }

  isStepPast(app: MiPostulacion, stepIndex: number): boolean {
    if (app.estado.codigo === 'rechazado') return false;
    const currentIdx = this.timelineSteps.findIndex(s => s.codigo === app.estado.codigo);
    return currentIdx > stepIndex;
  }

  isStepCurrent(app: MiPostulacion, stepCodigo: EtapaPostulacionCodigo): boolean {
    return app.estado.codigo === stepCodigo;
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }
}
