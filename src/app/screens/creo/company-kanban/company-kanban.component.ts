import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { CreoJobsService } from '../../../services/creo-jobs.service';
import { KanbanService } from '../../../core/api/kanban.service';
import { KanbanCandidate, KanbanColumn, ManagedJob, ManagedJobStatus } from '../../../data/creo-data';
import { AuthService } from '../../../core/api/auth.service';
import { MotivoRechazo, TableroKanban } from '../../../core/api/models/kanban.model';
import { PerfilPostulante } from '../../../core/api/models/perfil-postulante.model';

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
  userName = 'Carlos Mendoza';
  jobTitle = 'Senior React Developer';
  hireLimit = 2; // Límite de cupos de contratación definido para la vacante
  hiredCountState = 0;
  cuposDisponibles = 1;
  requiredSkillsForJob: string[] = ['React', 'TypeScript', 'Next.js', 'GraphQL'];

  jobs: ManagedJob[] = [];
  selectedJobId = 'j1';
  selectedJob: ManagedJob | null = null;
  tableroApi: TableroKanban | null = null;
  loadingTablero = false;

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

  readonly fallbackRejectReasons: string[] = [
    'Perfil no se ajusta',
    'Expectativa salarial alta',
    'Proceso cerrado'
  ];

  candidates: KanbanCandidate[] = [];
  draggingId: string | null = null;
  dragOverCol: KanbanColumn | null = null;

  selectedCandidate: KanbanCandidate | null = null;
  perfilPostulante: PerfilPostulante | null = null;
  loadingPerfil = false;

  rejectTarget: KanbanCandidate | null = null;
  rejectReason = '';
  rejectCustom = '';
  rejectError = '';

  showBreakdown = false;
  messageSent = false;
  autoNotificationToast: string | null = null;
  isReadOnly = false;

  private toastTimer: any;
  private subs = new Subscription();

  constructor(
    private creoJobsService: CreoJobsService,
    private kanbanService: KanbanService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.correo) {
      const prefix = user.correo.split('@')[0];
      this.userName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    // Cargar catálogo oficial de motivos de rechazo (HU-06)
    this.subs.add(
      this.kanbanService.motivosRechazo().subscribe({
        next: (motivos) => {
          this.motivosRechazo = motivos || [];
          if (this.motivosRechazo.length > 0) {
            this.selectedMotivoId = this.motivosRechazo[0].id;
            this.rejectReason = this.motivosRechazo[0].motivo;
          }
        },
        error: () => {
          // Mantiene catálogo fallback si la API no está disponible
        }
      })
    );

    this.subs.add(
      this.creoJobsService.managedJobs$.subscribe(jobs => {
        this.jobs = jobs;
        this.updateCurrentJob();
      })
    );

    this.subs.add(
      this.route.queryParamMap.subscribe(params => {
        const paramId = params.get('id');
        if (paramId) {
          this.selectedJobId = paramId;
        }
        this.updateCurrentJob();
      })
    );

    this.subs.add(
      this.creoJobsService.kanbanCandidates$.subscribe(cands => {
        if (!this.isNumericId(this.selectedJobId)) {
          this.candidates = cands;
          if (this.selectedCandidate) {
            this.selectedCandidate = cands.find(c => c.id === this.selectedCandidate!.id) || null;
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  private isNumericId(id: string | number | null | undefined): boolean {
    if (id === null || id === undefined) return false;
    const num = Number(id);
    return !isNaN(num) && num > 0;
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
        if (err.status === 409) {
          this.showToast(err.error?.message || 'La vacante fue eliminada o finalizada.');
        }
      }
    });
  }

  onSelectJob(jobId: string): void {
    this.selectedJobId = jobId;
    this.updateCurrentJob();

    if (this.selectedJob) {
      this.isReadOnly = this.esSoloConsulta(this.selectedJob);
    }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        id: jobId,
        readOnly: this.selectedJob && this.esSoloConsulta(this.selectedJob) ? 'true' : null
      },
      queryParamsHandling: 'merge'
    });
  }

  private esSoloConsulta(job: ManagedJob): boolean {
    return job.status === 'closed' || job.status === 'inactive' || job.daysLeft <= 0;
  }

  updateCurrentJob(): void {
    if (this.isNumericId(this.selectedJobId)) {
      this.cargarTablero(Number(this.selectedJobId));
      return;
    }

    if (!this.jobs.length) return;
    this.selectedJob = this.jobs.find(j => j.id === this.selectedJobId) || this.jobs[0];
    if (this.selectedJob) {
      this.selectedJobId = this.selectedJob.id;
      this.jobTitle = this.selectedJob.title;
      this.hireLimit = this.selectedJob.hireLimit || 1;
      const routeReadOnly = this.route.snapshot.queryParamMap.get('readOnly') === 'true';
      this.isReadOnly = this.esSoloConsulta(this.selectedJob) || routeReadOnly;
      this.updateSkillsForJob(this.selectedJob.title);
    }
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

  get niceToHaveSkills(): string[] {
    return (this.selectedJob?.skillTags || [])
      .filter(s => s.weight !== 'required')
      .map(s => s.skill);
  }

  candidatoPosee(skill: string): boolean {
    const registradas = (this.selectedCandidate?.skills || []).map(s => this.idHabilidad(s));
    return registradas.includes(this.idHabilidad(skill));
  }

  get mustHaveCubiertas(): string[] {
    return this.mustHaveSkills.filter(s => this.candidatoPosee(s));
  }

  get mustHaveFaltantes(): string[] {
    return this.mustHaveSkills.filter(s => !this.candidatoPosee(s));
  }

  updateSkillsForJob(title: string): void {
    this.requiredSkillsForJob = this.mustHaveSkills;
  }

  getStatusConfig(status?: ManagedJobStatus): StatusConfig {
    if (!status) return { label: 'Activa', bg: '#DCFCE7', text: '#15803D', dotColor: '#22C55E' };
    return this.statusConfig[status] || { label: status, bg: '#F1F5F9', text: '#64748B', dotColor: '#94A3B8' };
  }

  getCandidateCountForJob(jobId: string): number {
    return this.candidates.filter(c => (c.jobId || 'j1') === jobId).length;
  }

  get jobCandidates(): KanbanCandidate[] {
    return this.candidates.filter(c => (c.jobId || 'j1') === this.selectedJobId);
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

  puedeAvanzarA(cand: KanbanCandidate, destino: KanbanColumn): boolean {
    if (this.isCandidateLocked(cand)) return false;
    if (destino === 'rejected') return this.puedeRechazar(cand);
    return this.posicion(destino) === this.posicion(cand.column) + 1;
  }

  puedeRechazar(cand: KanbanCandidate): boolean {
    if (this.isCandidateLocked(cand)) return false;
    return cand.column === 'received' || cand.column === 'review' || cand.column === 'interview';
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

    if (this.isNumericId(numericVacanteId) && this.isNumericId(numericPostulacionId)) {
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
      return;
    }

    // Fallback simulado
    if (col === 'hired' && this.hiredCount >= this.hireLimit) {
      this.showToast(`Límite de contratación alcanzado (${this.hiredCount}/${this.hireLimit} cupos). No se pueden contratar más candidatos.`);
      this.draggingId = null;
      return;
    }

    this.creoJobsService.moveKanbanCandidate(this.draggingId, col);
    if (col === 'hired') {
      this.showToast(`Candidato contratado. Notificación enviada automáticamente a ${cand.email}`);
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
    this.showBreakdown = false;
    this.messageSent = false;

    const numericPostulacionId = Number(cand.id);
    if (this.isNumericId(numericPostulacionId)) {
      this.loadingPerfil = true;
      this.kanbanService.perfilPostulante(numericPostulacionId).subscribe({
        next: (perfil) => {
          this.perfilPostulante = perfil;
          this.loadingPerfil = false;
        },
        error: (err) => {
          this.loadingPerfil = false;
          if (err.status === 409) {
            this.showToast(err.error?.message || 'La postulación no está disponible para consulta.');
            this.closeProfile();
          }
        }
      });
    }
  }

  closeProfile(): void {
    this.selectedCandidate = null;
    this.perfilPostulante = null;
    this.loadingPerfil = false;
    this.showBreakdown = false;
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
    if (this.motivosRechazo.length > 0) {
      this.selectedMotivoId = this.motivosRechazo[0].id;
      this.rejectReason = this.motivosRechazo[0].motivo;
    } else {
      this.rejectReason = this.fallbackRejectReasons[0];
    }
    this.rejectCustom = '';
    this.rejectError = '';
  }

  closeRejectModal(): void {
    this.rejectTarget = null;
    this.rejectReason = '';
    this.rejectCustom = '';
    this.rejectError = '';
  }

  confirmReject(): void {
    if (!this.rejectTarget) return;

    const numericVacanteId = Number(this.selectedJobId);
    const numericPostulacionId = Number(this.rejectTarget.id);

    if (this.isNumericId(numericVacanteId) && this.isNumericId(numericPostulacionId)) {
      if (!this.selectedMotivoId) {
        this.rejectError = 'Seleccione un motivo de rechazo válido.';
        return;
      }

      this.kanbanService.rechazar(numericVacanteId, numericPostulacionId, this.selectedMotivoId).subscribe({
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
      return;
    }

    // Fallback simulado
    const finalReason = this.rejectReason === 'Otro' ? this.rejectCustom.trim() : this.rejectReason;
    if (!finalReason) {
      this.rejectError = 'El motivo del rechazo es obligatorio';
      return;
    }

    const email = this.rejectTarget.email;
    const name = this.rejectTarget.name;
    this.creoJobsService.moveKanbanCandidate(this.rejectTarget.id, 'rejected', finalReason);
    if (this.selectedCandidate?.id === this.rejectTarget.id) {
      this.closeProfile();
    }
    this.closeRejectModal();
    this.showToast(`Candidato ${name} rechazado. Notificación enviada automáticamente a ${email}`);
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

    if (this.isNumericId(numericVacanteId) && this.isNumericId(numericPostulacionId)) {
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
      return;
    }

    // Fallback simulado
    if (nextCol === 'hired' && this.hiredCount >= this.hireLimit) {
      this.showToast(`Límite de contratación alcanzado (${this.hiredCount}/${this.hireLimit} cupos).`);
      return;
    }

    this.creoJobsService.moveKanbanCandidate(cand.id, nextCol);
    if (nextCol === 'hired') {
      this.showToast(`Candidato contratado. Notificación enviada automáticamente a ${cand.email}`);
    }
    this.closeProfile();
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
