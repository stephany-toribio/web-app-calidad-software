import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { KanbanService } from '../../../core/api/kanban.service';
import { VacantesService } from '../../../core/api/vacantes.service';
import { KanbanCandidate, KanbanColumn, ManagedJob, ManagedJobStatus } from '../../../data/creo-data';
import { MotivoRechazo, TableroKanban } from '../../../core/api/models/kanban.model';
import { PerfilPostulante } from '../../../core/api/models/perfil-postulante.model';
import { EstadoGeneralVacante } from '../../../core/api/models/vacante-empresa.model';
import { mapVacanteToManagedJob } from '../../../core/api/mappers/vacante-empresa.mapper';

interface KanbanColumnConfig {
  id: KanbanColumn;
  label: string;
  color: string;
  dot: string;
}

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dotColor: string;
}

@Component({
  selector: 'app-company-kanban',
  standalone: true,
  imports: [CommonModule, FormsModule, CompanyShellComponent],
  templateUrl: './company-kanban.component.html',
  styleUrl: './company-kanban.component.css'
})
export class CompanyKanbanComponent implements OnInit, OnDestroy {
  jobTitle = '';
  hireLimit = 0;
  hiredCountState = 0;
  cuposDisponibles = 0;

  jobs: ManagedJob[] = [];
  selectedJobId = '';
  selectedJob: ManagedJob | null = null;
  tableroApi: TableroKanban | null = null;
  loadingJobs = false;
  jobsError = '';
  loadingTablero = false;
  tableroError = '';

  /** Vacantes que pueden tener postulantes: las demás nunca se publicaron */
  private readonly ESTADOS_CON_POSTULANTES: EstadoGeneralVacante[] = [
    'publicada', 'por_iniciar', 'pausada', 'finalizada', 'vencida',
  ];

  statusConfig: Record<ManagedJobStatus, StatusConfig> = {
    active:                   { label: 'Activa',                   bg: '#DCFCE7', text: '#15803D', dotColor: '#22C55E' },
    paused:                   { label: 'Pausada',                  bg: '#FEF3C7', text: '#B45309', dotColor: '#F59E0B' },
    closed:                   { label: 'Finalizada',               bg: '#FEE2E2', text: '#DC2626', dotColor: '#EF4444' },
    inactive:                 { label: 'Eliminada',                bg: '#F1F5F9', text: '#64748B', dotColor: '#94A3B8' },
    pending_review:           { label: 'Pendiente de Revisión',    bg: '#FEF9C3', text: '#A16207', dotColor: '#EAB308' },
    approved_pending_payment: { label: 'Aprobada (Pago pendiente)', bg: '#E0E7FF', text: '#4338CA', dotColor: '#6366F1' },
    rejected_by_moderation:   { label: 'No Aprobada',              bg: '#FEE2E2', text: '#DC2626', dotColor: '#EF4444' },
  };

  readonly columns: KanbanColumnConfig[] = [
    { id: 'received',  label: 'Recibido',    color: '#6B7280', dot: '#9CA3AF' },
    { id: 'review',    label: 'En Revisión', color: '#1D4ED8', dot: '#3B82F6' },
    { id: 'interview', label: 'Entrevista',  color: '#D97706', dot: '#F59E0B' },
    { id: 'hired',     label: 'Contratado',  color: '#15803D', dot: '#22C55E' },
    { id: 'rejected',  label: 'Rechazado',   color: '#DC2626', dot: '#EF4444' },
  ];

  // Catálogo dinámico de motivos de rechazo desde la API
  motivosRechazo: MotivoRechazo[] = [];
  selectedMotivoId: number | null = null;
  motivosError = '';

  candidates: KanbanCandidate[] = [];
  draggingId: string | null = null;
  dragOverCol: KanbanColumn | null = null;

  selectedCandidate: KanbanCandidate | null = null;
  perfilPostulante: PerfilPostulante | null = null;
  loadingPerfil = false;
  perfilError = '';

  rejectTarget: KanbanCandidate | null = null;
  rejectError = '';

  messageSent = false;
  autoNotificationToast: string | null = null;
  isReadOnly = false;

  private toastTimer: any;
  private subs = new Subscription();

  constructor(
    private vacantesService: VacantesService,
    private kanbanService: KanbanService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Cargar catálogo oficial de motivos de rechazo (HU-06)
    this.subs.add(
      this.kanbanService.motivosRechazo().subscribe({
        next: (motivos) => {
          this.motivosRechazo = motivos || [];
          if (this.motivosRechazo.length > 0) {
            this.selectedMotivoId = this.motivosRechazo[0].id;
          }
        },
        error: (err) => {
          this.motivosError = err.error?.message || 'No fue posible cargar los motivos de rechazo.';
        }
      })
    );

    this.cargarVacantes();
  }

  /**
   * GET /empresas/me/vacantes + ?id de la URL: cada cambio de vacante en el selector
   * actualiza la URL y vuelve a pasar por aquí, así la carga sale de un solo lugar.
   */
  cargarVacantes(): void {
    this.loadingJobs = true;
    this.jobsError = '';
    this.subs.add(
      combineLatest([this.vacantesService.misVacantes(), this.route.queryParamMap]).subscribe({
        next: ([vacantes, params]) => {
          this.loadingJobs = false;
          const todas = (vacantes || []).map(v => ({ general: v.estado.general, job: mapVacanteToManagedJob(v) }));
          const paramId = params.get('id');

          // La vacante pedida por URL se muestra aunque aún no esté publicada (p. ej. recién creada)
          this.jobs = todas
            .filter(t => this.ESTADOS_CON_POSTULANTES.includes(t.general) || t.job.id === paramId)
            .map(t => t.job);

          const elegida = this.jobs.find(j => j.id === paramId) || this.jobs[0];
          if (paramId && elegida?.id !== paramId) {
            this.showToast('La vacante solicitada no está disponible. Se muestra otra de tus vacantes.');
          }

          if (!elegida) {
            this.selectedJob = null;
            this.selectedJobId = '';
            this.candidates = [];
            return;
          }

          const routeReadOnly = params.get('readOnly') === 'true';
          this.seleccionarVacante(elegida, routeReadOnly);
        },
        error: (err) => {
          this.loadingJobs = false;
          this.jobs = [];
          this.jobsError = err.error?.message || 'No fue posible cargar tus vacantes.';
        }
      })
    );
  }

  private seleccionarVacante(job: ManagedJob, routeReadOnly: boolean): void {
    this.selectedJob = job;
    this.selectedJobId = job.id;
    this.jobTitle = job.title;
    this.hireLimit = job.hireLimit || 1;
    this.isReadOnly = this.esSoloConsulta(job) || routeReadOnly;
    this.cargarTablero(Number(job.id));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  backendToFrontColumn(codigo: string): KanbanColumn {
    switch (codigo) {
      case 'recibido': return 'received';
      case 'en_revision': return 'review';
      case 'entrevista': return 'interview';
      case 'contratado': return 'hired';
      case 'rechazado': return 'rejected';
      default: return 'received';
    }
  }

  frontToBackendColumn(col: KanbanColumn): string {
    switch (col) {
      case 'received': return 'recibido';
      case 'review': return 'en_revision';
      case 'interview': return 'entrevista';
      case 'hired': return 'contratado';
      case 'rejected': return 'rechazado';
      default: return 'recibido';
    }
  }

  cargarTablero(vacanteId: number): void {
    this.loadingTablero = true;
    this.tableroError = '';
    this.kanbanService.tablero(vacanteId).subscribe({
      next: (tablero) => {
        this.loadingTablero = false;
        this.tableroApi = tablero;
        this.jobTitle = tablero.vacante.titulo;
        this.hireLimit = tablero.vacante.max_contrataciones;
        this.hiredCountState = tablero.vacante.contratados;
        this.cuposDisponibles = tablero.vacante.cupos_disponibles;
        this.isReadOnly = tablero.vacante.solo_lectura;

        const apiCandidates: KanbanCandidate[] = [];
        for (const col of tablero.columnas) {
          const colFrontId = this.backendToFrontColumn(col.estado.codigo);
          for (const post of col.postulaciones) {
            apiCandidates.push({
              id: String(post.id),
              name: `${post.candidato.nombre} ${post.candidato.apellidos}`.trim(),
              column: colFrontId,
              match: 0,
              appliedDate: new Date(post.fecha_postulacion).toLocaleDateString(),
              jobId: String(tablero.vacante.id),
              skills: [],
              email: '',
              phone: '',
              experience: '',
              education: '',
              bio: '',
            });
          }
        }
        this.candidates = apiCandidates;
      },
      error: (err) => {
        this.loadingTablero = false;
        this.tableroApi = null;
        this.candidates = [];
        this.tableroError = err.error?.message || 'No fue posible cargar el tablero de postulantes.';
      }
    });
  }

  reintentarTablero(): void {
    if (this.selectedJobId) this.cargarTablero(Number(this.selectedJobId));
  }

  /** Solo cambia la URL: cargarVacantes reacciona al nuevo ?id */
  onSelectJob(jobId: string): void {
    const job = this.jobs.find(j => j.id === jobId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        id: jobId,
        readOnly: job && this.esSoloConsulta(job) ? 'true' : null
      },
      queryParamsHandling: 'merge'
    });
  }

  private esSoloConsulta(job: ManagedJob): boolean {
    return job.status === 'closed' || job.status === 'inactive' || job.daysLeft <= 0;
  }

  private idHabilidad(nombre: string): string {
    return (nombre || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  get mustHaveSkills(): string[] {
    return (this.selectedJob?.skillTags || [])
      .filter(s => s.weight === 'required')
      .map(s => s.skill);
  }

  getStatusConfig(status?: ManagedJobStatus): StatusConfig {
    if (!status) return { label: 'Activa', bg: '#DCFCE7', text: '#15803D', dotColor: '#22C55E' };
    return this.statusConfig[status] || { label: status, bg: '#F1F5F9', text: '#64748B', dotColor: '#94A3B8' };
  }

  getCandidateCountForJob(jobId: string): number {
    if (jobId === this.selectedJobId && this.tableroApi) return this.jobCandidates.length;
    return this.jobs.find(j => j.id === jobId)?.applicants ?? 0;
  }

  get jobCandidates(): KanbanCandidate[] {
    return this.candidates.filter(c => c.jobId === this.selectedJobId);
  }

  get totalCandidates(): number {
    return this.jobCandidates.length;
  }

  get hiredCount(): number {
    if (this.tableroApi) return this.hiredCountState;
    return this.getCandidates('hired').length;
  }

  getCandidates(col: KanbanColumn): KanbanCandidate[] {
    return this.jobCandidates.filter(c => c.column === col);
  }

  private readonly ordenColumnas: KanbanColumn[] = ['received', 'review', 'interview', 'hired', 'rejected'];

  private posicion(col: KanbanColumn): number {
    return this.ordenColumnas.indexOf(col);
  }

  etiquetaColumna(col: KanbanColumn): string {
    return this.columns.find(c => c.id === col)?.label ?? '';
  }

  /**
   * Movimientos permitidos (una etapa a la vez, nunca hacia atras):
   *   Recibido    -> En Revision
   *   En Revision -> Entrevista | Rechazado
   *   Entrevista  -> Contratado | Rechazado
   * Contratado y Rechazado son finales. No se contrata desde Recibido ni
   * desde En Revision: Contratado solo se alcanza desde Entrevista.
   */
  puedeAvanzarA(cand: KanbanCandidate, destino: KanbanColumn): boolean {
    if (this.isCandidateLocked(cand)) return false;
    if (destino === 'rejected') return this.puedeRechazar(cand);
    return this.posicion(destino) === this.posicion(cand.column) + 1;
  }

  /**
   * Solo se rechaza a quien ya fue evaluado: desde En Revision o Entrevista.
   * Desde Recibido no, porque todavia nadie revisó su postulación; primero
   * tiene que pasar a En Revisión.
   */
  puedeRechazar(cand: KanbanCandidate): boolean {
    if (this.isCandidateLocked(cand)) return false;
    return cand.column === 'review' || cand.column === 'interview';
  }

  isCandidateLocked(cand: KanbanCandidate): boolean {
    if (this.isReadOnly) return true;
    return cand.column === 'hired' || cand.column === 'rejected';
  }

  isSkillMatched(skill: string): boolean {
    const obligatorias = this.mustHaveSkills.map(s => this.idHabilidad(s));
    return obligatorias.includes(this.idHabilidad(skill));
  }

  matchColor(pct: number): { bg: string; text: string } {
    if (pct >= 80) return { bg: '#DCFCE7', text: '#15803D' };
    if (pct >= 50) return { bg: '#FEF9C3', text: '#A16207' };
    return { bg: '#FEE2E2', text: '#DC2626' };
  }

  initials(name: string): string {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  avatarBg(name: string): string {
    const colors = ['#F2B705', '#FDE68A', '#A7F3D0', '#BFDBFE', '#DDD6FE', '#FBCFE8', '#FED7AA'];
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffff;
    return colors[h % colors.length];
  }

  // ── Drag & Drop ──

  onDragStart(candidate: KanbanCandidate, event: DragEvent): void {
    if (this.isCandidateLocked(candidate)) {
      event.preventDefault();
      return;
    }
    this.draggingId = candidate.id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', candidate.id);
    }
  }

  onDragOver(col: KanbanColumn, event: DragEvent): void {
    const cand = this.draggingId ? this.candidates.find(c => c.id === this.draggingId) : null;

    if (cand && !this.puedeAvanzarA(cand, col)) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      if (this.dragOverCol === col) {
        this.dragOverCol = null;
      }
      return;
    }

    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverCol = col;
  }

  onDragLeave(col: KanbanColumn, event: DragEvent): void {
    const related = event.relatedTarget as HTMLElement | null;
    const current = event.currentTarget as HTMLElement | null;
    if (current && (!related || !current.contains(related))) {
      if (this.dragOverCol === col) {
        this.dragOverCol = null;
      }
    }
  }

  onDrop(col: KanbanColumn, event: DragEvent): void {
    event.preventDefault();
    this.dragOverCol = null;
    if (!this.draggingId) return;

    const cand = this.candidates.find(c => c.id === this.draggingId);
    if (!cand) return;

    if (this.isCandidateLocked(cand)) {
      this.showToast(`El candidato ${cand.name} ya está en estado final (${cand.column === 'hired' ? 'Contratado' : 'Rechazado'}) y está bloqueado.`);
      this.draggingId = null;
      return;
    }

    if (col === cand.column) {
      this.draggingId = null;
      return;
    }

    if (!this.puedeAvanzarA(cand, col)) {
      const siguiente = this.getNextCol(cand.column);
      if (this.posicion(col) < this.posicion(cand.column)) {
        this.showToast(`El proceso de selección solo avanza. ${cand.name} no puede volver a "${this.etiquetaColumna(col)}".`);
      } else if (siguiente) {
        this.showToast(`${cand.name} debe pasar primero por "${this.etiquetaColumna(siguiente)}".`);
      }
      this.draggingId = null;
      return;
    }

    // Modal de rechazo
    if (col === 'rejected') {
      this.openRejectModal(cand);
      this.draggingId = null;
      return;
    }

    const numericVacanteId = Number(this.selectedJobId);
    const numericPostulacionId = Number(cand.id);

    if (col === 'hired') {
      if (this.cuposDisponibles <= 0) {
        this.showToast(`Límite de contratación alcanzado (${this.hiredCount}/${this.hireLimit} cupos). No se pueden contratar más candidatos.`);
        this.draggingId = null;
        return;
      }
      this.kanbanService.contratar(numericVacanteId, numericPostulacionId).subscribe({
        next: () => {
          this.cargarTablero(numericVacanteId);
          this.showToast(`Candidato contratado. Se notificó al postulante automáticamente.`);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Error al contratar al postulante.');
        }
      });
    } else {
      this.kanbanService.avanzar(numericVacanteId, numericPostulacionId).subscribe({
        next: () => {
          this.cargarTablero(numericVacanteId);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Error al avanzar al postulante.');
        }
      });
    }
    this.draggingId = null;
  }

  onDragEnd(): void {
    this.draggingId = null;
    this.dragOverCol = null;
  }

  // ── HU-17: Perfil del postulante para la empresa ──

  openProfile(cand: KanbanCandidate, event?: Event): void {
    if (event) event.stopPropagation();
    this.selectedCandidate = cand;
    this.perfilPostulante = null;
    this.perfilError = '';
    this.messageSent = false;

    this.loadingPerfil = true;
    this.kanbanService.perfilPostulante(Number(cand.id)).subscribe({
      next: (perfil) => {
        this.perfilPostulante = perfil;
        this.loadingPerfil = false;
      },
      error: (err) => {
        this.loadingPerfil = false;
        if (err.status === 409) {
          this.showToast(err.error?.message || 'La postulación no está disponible para consulta.');
          this.closeProfile();
          return;
        }
        this.perfilError = err.error?.message || 'No fue posible cargar el perfil del postulante.';
      }
    });
  }

  closeProfile(): void {
    this.selectedCandidate = null;
    this.perfilPostulante = null;
    this.loadingPerfil = false;
    this.perfilError = '';
    this.messageSent = false;
  }

  // ── HU-06: Modal y acción de rechazo ──

  openRejectModal(cand: KanbanCandidate, event?: Event): void {
    if (event) event.stopPropagation();

    if (!this.puedeRechazar(cand)) {
      this.showToast(`Este candidato no puede ser rechazado en su estado actual.`);
      return;
    }

    this.rejectTarget = cand;
    this.selectedMotivoId = this.motivosRechazo[0]?.id ?? null;
    this.rejectError = this.motivosError;
  }

  closeRejectModal(): void {
    this.rejectTarget = null;
    this.rejectError = '';
  }

  confirmReject(): void {
    if (!this.rejectTarget) return;

    if (!this.selectedMotivoId) {
      this.rejectError = this.motivosError || 'Seleccione un motivo de rechazo válido.';
      return;
    }

    const numericVacanteId = Number(this.selectedJobId);
    this.kanbanService.rechazar(numericVacanteId, Number(this.rejectTarget.id), this.selectedMotivoId).subscribe({
      next: () => {
        const name = this.rejectTarget?.name;
        if (this.selectedCandidate?.id === this.rejectTarget?.id) {
          this.closeProfile();
        }
        this.closeRejectModal();
        this.cargarTablero(numericVacanteId);
        this.showToast(`Candidato ${name} rechazado. Notificación enviada automáticamente.`);
      },
      error: (err) => {
        this.rejectError = err.error?.message || 'No fue posible registrar el rechazo.';
      }
    });
  }

  getNextCol(currentCol: KanbanColumn): KanbanColumn | null {
    const map: Partial<Record<KanbanColumn, KanbanColumn>> = {
      received: 'review',
      review: 'interview',
      interview: 'hired'
    };
    return map[currentCol] || null;
  }

  getNextColLabel(currentCol: KanbanColumn): string {
    const map: Partial<Record<KanbanColumn, string>> = {
      received: 'Mover a Revisión',
      review: 'Avanzar a Entrevista',
      interview: 'Marcar como Contratado'
    };
    return map[currentCol] || 'Avanzar';
  }

  advanceCandidate(cand: KanbanCandidate): void {
    const nextCol = this.getNextCol(cand.column);
    if (!nextCol) return;

    const numericVacanteId = Number(this.selectedJobId);
    const numericPostulacionId = Number(cand.id);

    if (nextCol === 'hired') {
      if (this.cuposDisponibles <= 0) {
        this.showToast(`Límite de contratación alcanzado (${this.hiredCount}/${this.hireLimit} cupos).`);
        return;
      }
      this.kanbanService.contratar(numericVacanteId, numericPostulacionId).subscribe({
        next: () => {
          this.closeProfile();
          this.cargarTablero(numericVacanteId);
          this.showToast(`Candidato contratado. Notificación enviada automáticamente.`);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Error al contratar al postulante.');
        }
      });
    } else {
      this.kanbanService.avanzar(numericVacanteId, numericPostulacionId).subscribe({
        next: () => {
          this.closeProfile();
          this.cargarTablero(numericVacanteId);
          this.showToast(`Candidato avanzado a ${this.etiquetaColumna(nextCol)}.`);
        },
        error: (err) => {
          this.showToast(err.error?.message || 'Error al avanzar al postulante.');
        }
      });
    }
  }

  sendMessage(): void {
    this.messageSent = true;
    setTimeout(() => {
      this.messageSent = false;
    }, 4000);
  }

  showToast(msg: string): void {
    this.autoNotificationToast = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.autoNotificationToast = null;
    }, 4500);
  }

  navigate(screen: string): void {
    this.router.navigate(['/creo', screen]);
  }
}
