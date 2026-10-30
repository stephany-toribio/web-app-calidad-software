import { Component, OnInit, OnDestroy } from '@angular/core';
import { MarkdownPipe } from '../../../core/pipes/markdown.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { CreoJobsService } from '../../../services/creo-jobs.service';
import { PostulacionesService } from '../../../core/api/postulaciones.service';
import { VacanteDetalle } from '../../../core/api/models/vacante-detalle.model';
import { Job, avatarColor, companyInitial } from '../../../data/creo-data';

@Component({
  selector: 'app-candidate-job-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, CandidateShellComponent, MarkdownPipe],
  templateUrl: './candidate-job-detail.component.html',
  styleUrl: './candidate-job-detail.component.css'
})
export class CandidateJobDetailComponent implements OnInit, OnDestroy {
  job: Job | null = null;
  vacanteDetalle: VacanteDetalle | null = null;
  numericVacanteId: number | null = null;

  loading = false;
  /** Mensaje cuando la vacante no existe, no está disponible o falla la carga */
  loadError = '';

  saved = false;
  applied = false;
  /** El candidato postuló y luego se retiró (no puede volver a postular) */
  retirada = false;
  puedePostular = false;
  motivoNoPostulable: string | null = null;
  modoConsulta: 'disponible' | 'historico' = 'disponible';
  estadoVacanteApi: string | null = null;

  showApplyModal = false;
  submittingApply = false;
  applyError = '';
  toastMessage: string | null = null;

  private toastTimeout: any;
  private subs = new Subscription();
  private detalleSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private creoJobsService: CreoJobsService,
    private postulacionesService: PostulacionesService
  ) {}

  ngOnInit(): void {
    this.subs.add(
      this.route.queryParams.subscribe(params => {
        const postulacionId = Number(params['postulacionId']);
        const id = Number(params['id']);

        if (postulacionId > 0) {
          // HU-13: consulta histórica desde "Mis postulaciones" (ID de la postulación)
          this.cargarDetalle(this.postulacionesService.obtenerVacanteHistorica(postulacionId));
        } else if (id > 0) {
          // HU-13: detalle por ID de vacante
          this.cargarDetalle(this.postulacionesService.obtenerVacanteDisponible(id));
        } else {
          this.job = null;
          this.loadError = 'La vacante solicitada no existe.';
        }
      })
    );

    // "Guardados" sigue siendo local: el backend aún no tiene favoritos
    this.subs.add(
      this.creoJobsService.saved$.subscribe(savedIds => {
        if (this.job) {
          this.saved = savedIds.includes(this.job.id);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    this.detalleSub?.unsubscribe();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  private cargarDetalle(peticion: Observable<VacanteDetalle>): void {
    this.detalleSub?.unsubscribe();
    this.loading = true;
    this.loadError = '';
    this.job = null;
    this.vacanteDetalle = null;

    this.detalleSub = peticion.subscribe({
      next: (detalle) => {
        this.loading = false;
        this.setDetalleFromApi(detalle);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        // Inexistente y no disponible responden igual (404) para no filtrar información
        this.loadError = err.status === 404
          ? 'Esta vacante no existe o ya no está disponible.'
          : err.error?.message || 'No fue posible cargar la vacante.';
      }
    });
  }

  private setDetalleFromApi(detalle: VacanteDetalle): void {
    this.vacanteDetalle = detalle;
    this.numericVacanteId = detalle.id;
    this.modoConsulta = detalle.modo_consulta;
    this.estadoVacanteApi = detalle.estado;
    this.puedePostular = detalle.puede_postular;
    this.motivoNoPostulable = detalle.motivo_no_postulable;
    this.applied = detalle.postulacion !== null;
    this.retirada = detalle.postulacion?.retirada === true;

    const isRemote = detalle.tipo_empleo === 'remoto';

    // Los dos salarios llegan con valor o los dos en null; null no significa 0
    const salaryFormatted = detalle.salario_min !== null && detalle.salario_max !== null
      ? `S/ ${detalle.salario_min.toLocaleString('es-PE')} – ${detalle.salario_max.toLocaleString('es-PE')}`
      : 'A convenir';

    this.job = {
      id: String(detalle.id),
      title: detalle.titulo,
      company: detalle.empresa.razon_social,
      companyDescription: detalle.empresa.descripcion || `${detalle.empresa.razon_social} · Sector ${detalle.empresa.sector}`,
      location: detalle.ubicacion || (isRemote ? 'Remoto' : ''),
      remote: isRemote,
      experience: detalle.nivel_puesto.nombre,
      area: detalle.area_profesional.nombre,
      salary: salaryFormatted,
      salaryMin: detalle.salario_min ?? 0,
      salaryMax: detalle.salario_max ?? 0,
      tags: detalle.habilidades.map(h => h.nombre),
      match: 0,
      description: detalle.descripcion,
      // Sección "Habilidades y Requisitos": primero los requisitos escritos por la empresa
      requirements: [...(detalle.requisitos ?? []), ...detalle.habilidades.map(h => h.nombre)],
      benefits: detalle.beneficios ?? [],
      postedAgo: detalle.publicada_en
        ? new Date(detalle.publicada_en).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
        : '',
      applicants: 0,
      postulantesAprox: detalle.postulantes_aprox,
      skillTags: detalle.habilidades.map(h => ({ skill: h.nombre, weight: 'required' as const }))
    };

    this.saved = this.creoJobsService.isSaved(String(detalle.id));
  }

  /** Estado de la vacante: vigente, finalizada (o pausada) o eliminada */
  get disponibilidad(): 'vigente' | 'finalizada' | 'eliminada' {
    if (this.estadoVacanteApi === 'eliminada') return 'eliminada';
    if (this.estadoVacanteApi === 'finalizada' || this.estadoVacanteApi === 'pausada') return 'finalizada';
    return 'vigente';
  }

  /** En modo histórico (pausada, finalizada o eliminada) no se puede postular */
  get vacanteRetirada(): boolean {
    return this.modoConsulta === 'historico' || (!!this.estadoVacanteApi && this.estadoVacanteApi !== 'activa');
  }

  get etiquetaVacante(): string {
    if (this.estadoVacanteApi === 'eliminada') return 'Eliminada';
    if (this.estadoVacanteApi === 'pausada') return 'Pausada';
    return 'Finalizada';
  }

  get avatarBg(): string {
    return avatarColor(this.job?.company ?? '');
  }

  get initial(): string {
    return companyInitial(this.job?.company ?? '');
  }

  get applicantRange(): string {
    return this.vacanteDetalle?.postulantes_aprox ?? '';
  }

  toggleSave(): void {
    if (this.job) {
      this.creoJobsService.toggleSave(this.job.id);
    }
  }

  openApplyModal(): void {
    if (this.applied || !this.puedePostular) return;
    this.applyError = '';
    this.showApplyModal = true;
  }

  closeApplyModal(): void {
    this.showApplyModal = false;
    this.applyError = '';
    this.submittingApply = false;
  }

  /**
   * HU-05: Confirmar postulación.
   * POST /api/v1/candidatos/me/postulaciones con payload estricto { vacante_id: id }.
   */
  confirmApply(): void {
    if (!this.numericVacanteId || this.submittingApply) return;

    this.submittingApply = true;
    this.applyError = '';

    this.postulacionesService.postular(this.numericVacanteId).subscribe({
      next: () => {
        this.submittingApply = false;
        this.applied = true;
        this.puedePostular = false;
        this.closeApplyModal();
        this.showToast('¡Postulación registrada con éxito! La empresa evaluará tu perfil.');
      },
      error: (err: HttpErrorResponse) => {
        this.submittingApply = false;
        if (err.status === 409) {
          this.applyError = err.error?.message || 'Ya te has postulado previamente a esta vacante laboral.';
          this.applied = true;
          this.puedePostular = false;
        } else if (err.status === 404) {
          this.applyError = 'La vacante no existe o ya no está disponible para postulaciones.';
          this.puedePostular = false;
        } else if (err.status === 403) {
          this.applyError = 'No tienes permisos para postular. Completa tu perfil de candidato para continuar.';
        } else {
          this.applyError = err.error?.message || 'No fue posible registrar la postulación.';
        }
      }
    });
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = null;
    }, 4500);
  }

  navigateBack(): void {
    this.router.navigate(['/creo/candidate-jobs']);
  }
}
