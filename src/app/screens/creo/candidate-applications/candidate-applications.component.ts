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

  constructor(
    private postulacionesService: PostulacionesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarPostulaciones();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  cargarPostulaciones(): void {
    this.loading = true;
    this.errorMessage = '';
    this.subs.add(
      this.postulacionesService.misPostulaciones().subscribe({
        next: (apps) => {
          this.applications = apps || [];
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 401) {
            this.errorMessage = 'Inicia sesión como candidato para ver tus postulaciones.';
          } else {
            this.errorMessage = err.error?.message || 'No fue posible cargar tus postulaciones.';
          }
        }
      })
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
    this.withdrawTargetApp = app;
  }

  closeWithdraw(): void {
    this.withdrawTargetApp = null;
    this.submittingWithdraw = false;
  }

  confirmWithdraw(): void {
    if (!this.withdrawTargetApp || this.submittingWithdraw) return;

    this.submittingWithdraw = true;
    const targetId = this.withdrawTargetApp.id;

    this.postulacionesService.retirar(targetId).subscribe({
      next: (resultado) => {
        this.submittingWithdraw = false;
        this.closeWithdraw();
        this.showToast('Te retiraste de la postulación exitosamente.');
        // Actualizar el estado local inmediatamente
        this.applications = this.applications.map(app =>
          app.id === targetId
            ? {
                ...app,
                retirada: true,
                retirada_en: resultado.retirada_en,
                puede_retirar: false
              }
            : app
        );
      },
      error: (err) => {
        this.submittingWithdraw = false;
        const msg = err.error?.message || 'No fue posible retirar la postulación.';
        this.showToast(msg);
      }
    });
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
