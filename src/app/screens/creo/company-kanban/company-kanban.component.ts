import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { KanbanService } from '../../../core/api/kanban.service';
import { VacantesService } from '../../../core/api/vacantes.service';
import { KanbanCandidate, KanbanColumn, ManagedJob, ManagedJobStatus } from '../../../data/creo-data';
import { MotivoRechazo, TableroKanban,
  HistorialKanban
} from '../../../core/api/models/kanban.model';
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

  autoNotificationToast: string | null = null;
  isReadOnly = false;

  private toastTimer: any;
  private subs = new Subscription();
  private refrescoSub?: Subscription;
  private perfilSub?: Subscription;
  private historialSub?: Subscription;

  mostrarHistorial = false;
  cargandoHistorial = false;
  historialError = '';
  historial: HistorialKanban | null = null;
  private historialVersion = 0;

  procesandoMovimiento = false;
  private tableroVersion = 0;
  private perfilVersion = 0;
  private routeReadOnly = false;
  private readonly intervaloRefresco = 45_000;
  private refrescoTimer: ReturnType<typeof setInterval> | null = null;

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
          this.selectedMotivoId = null;
        },
        error: (err) => {
          this.motivosError = err.error?.message || 'No fue posible cargar los motivos de rechazo.';
        }
      })
    );

    this.cargarVacantes();

    // El candidato postula en OTRA sesión del navegador; sin un canal del
    // servidor (WebSocket) el tablero no se entera solo. Se vuelve a consultar
    // al regresar a la pestaña y cada 45 s mientras está a la vista.
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
    window.addEventListener('focus', this.alCambiarVisibilidad);
    this.programarRefresco();
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
    this.cerrarHistorial();
    this.tableroVersion++;
    this.refrescoSub?.unsubscribe();

    this.perfilVersion++;
    this.perfilSub?.unsubscribe();

    this.selectedCandidate = null;
    this.perfilPostulante = null;
    this.loadingPerfil = false;
    this.perfilError = '';
    this.rejectTarget = null;
    this.rejectError = '';
    this.draggingId = null;
    this.dragOverCol = null;
    this.selectedMotivoId = null;

    this.candidates = [];
    this.tableroApi = null;
    this.hiredCountState = 0;
    this.cuposDisponibles = 0;

    this.routeReadOnly = routeReadOnly;

    this.selectedJob = job;
    this.selectedJobId = job.id;
    this.jobTitle = job.title;
    this.hireLimit = job.hireLimit || 1;
    this.isReadOnly = this.esSoloConsulta(job) || routeReadOnly;
    this.cargarTablero(Number(job.id));
  }

  ngOnDestroy(): void {
    this.cerrarHistorial();
    this.tableroVersion++;
    this.perfilVersion++;

    this.subs.unsubscribe();
    this.refrescoSub?.unsubscribe();
    this.perfilSub?.unsubscribe();
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

  /**
   * No se recarga mientras la empresa mueve una tarjeta ni con un diálogo
   * abierto: el tablero cambiaría bajo sus manos.
   */
  private refrescarSiSePuede(): void {
    if (document.hidden) return;
    if (!this.selectedJobId) return;
    if (
      this.procesandoMovimiento ||
      this.mostrarHistorial ||
      this.draggingId ||
      this.selectedCandidate ||
      this.rejectTarget
    ) return;
    if (this.loadingJobs || this.loadingTablero) return;

    this.cargarTablero(Number(this.selectedJobId), true);
  }

  /** Avisa de las postulaciones que llegaron con el tablero abierto */
  private avisarNuevas(idsAnteriores: Set<string>): void {
    const nuevas = this.candidates.filter(c => !idsAnteriores.has(c.id));
    if (nuevas.length === 0) return;

    this.showToast(
      nuevas.length === 1
        ? `Nueva postulación de ${nuevas[0].name}.`
        : `Llegaron ${nuevas.length} postulaciones nuevas.`
    );
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

  /**
   * GET del tablero de una vacante. En modo silencioso no muestra el esqueleto
   * de carga ni borra lo que ya hay en pantalla: lo usa el refresco de fondo.
   */
  cargarTablero(vacanteId: number, silencioso = false): void {
    if (
      this.procesandoMovimiento ||
      String(vacanteId) !== this.selectedJobId
    ) return;

    const version = ++this.tableroVersion;

    this.refrescoSub?.unsubscribe();

    if (!silencioso) {
      this.loadingTablero = true;
      this.tableroError = '';
    }

    // Solo se comparan tarjetas de ESTA vacante y con un tablero ya cargado:
    // si no, al recuperarse de un error todo parecería recien llegado.
    const comparable = silencioso
      && this.tableroApi !== null
      && this.tableroApi.vacante.id === vacanteId;
    const idsAnteriores = new Set(this.candidates.map(c => c.id));

    const peticion = this.kanbanService.tablero(vacanteId).subscribe({
      next: (tablero) => {
        if (
          version !== this.tableroVersion ||
          String(vacanteId) !== this.selectedJobId ||
          this.procesandoMovimiento
        ) return;

        this.loadingTablero = false;
        this.tableroApi = tablero;
        this.jobTitle = tablero.vacante.titulo;
        this.hireLimit = tablero.vacante.max_contrataciones;
        this.hiredCountState = tablero.vacante.contratados;
        this.cuposDisponibles = tablero.vacante.cupos_disponibles;
        this.isReadOnly =
          this.routeReadOnly || tablero.vacante.solo_lectura;

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
        if (comparable) this.avisarNuevas(idsAnteriores);
      },
      error: (err) => {
        if (
          version !== this.tableroVersion ||
          String(vacanteId) !== this.selectedJobId
        ) return;

        this.loadingTablero = false;

        // Conservar el tablero ante fallos del refresco.
        if (silencioso) return;

        this.loadingTablero = false;
        this.tableroApi = null;
        this.candidates = [];
        this.tableroError = err.error?.message || 'No fue posible cargar el tablero de postulantes.';
      }
    });

    this.refrescoSub = peticion;
  }

  reintentarTablero(): void {
    if (this.selectedJobId) this.cargarTablero(Number(this.selectedJobId));
  }

  /** Solo cambia la URL: cargarVacantes reacciona al nuevo ?id */
  onSelectJob(jobId: string): void {
    if (this.procesandoMovimiento) return;

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
    if (
      this.isReadOnly ||
      this.loadingTablero ||
      this.loadingJobs ||
      this.procesandoMovimiento ||
      cand.jobId !== this.selectedJobId
    ) return true;

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

    const id = this.draggingId;

    this.draggingId = null;
    this.dragOverCol = null;

    if (!id || this.procesandoMovimiento || this.rejectTarget) return;

    const candidato = this.candidates.find(
      cand => cand.id === id &&
              cand.jobId === this.selectedJobId
    );

    if (!candidato || col === candidato.column) return;

    if (!this.puedeAvanzarA(candidato, col)) {
      this.showToast(
        'El movimiento no está permitido desde la etapa actual.'
      );
      return;
    }

    if (col === 'rejected') {
      this.openRejectModal(candidato);
      return;
    }

    this.ejecutarMovimiento(candidato, col);
  }

  onDragEnd(): void {
    this.draggingId = null;
    this.dragOverCol = null;
  }

  // ── HU-17: Perfil del postulante para la empresa ──

  openProfile(cand: KanbanCandidate, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.procesandoMovimiento) return;

    const actual = this.candidates.find(
      item => item.id === cand.id &&
              item.jobId === this.selectedJobId
    );

    if (!actual) return;

    const version = ++this.perfilVersion;
    const vacanteId = this.selectedJobId;
    const candidatoId = actual.id;

    this.perfilSub?.unsubscribe();

    this.selectedCandidate = actual;
    this.perfilPostulante = null;
    this.perfilError = '';
    this.loadingPerfil = true;

    this.perfilSub =
      this.kanbanService.perfilPostulante(Number(actual.id)).subscribe({
        next: (perfil) => {
          if (
            version !== this.perfilVersion ||
            vacanteId !== this.selectedJobId ||
            candidatoId !== this.selectedCandidate?.id
          ) return;

          this.perfilPostulante = perfil;
          this.loadingPerfil = false;
        },

        error: (err) => {
          if (
            version !== this.perfilVersion ||
            vacanteId !== this.selectedJobId ||
            candidatoId !== this.selectedCandidate?.id
          ) return;

          this.loadingPerfil = false;

          if ([403, 404, 409].includes(err.status)) {
            this.closeProfile();

            this.showToast(
              err.error?.message ||
              'La postulación no está disponible para consulta.'
            );

            this.cargarTablero(Number(vacanteId));
            return;
          }

          this.perfilError = err.error?.message ||
            'No fue posible cargar el perfil del postulante.';
        }
      });
  }

  closeProfile(): void {
    if (this.procesandoMovimiento) return;

    this.perfilVersion++;
    this.perfilSub?.unsubscribe();

    this.selectedCandidate = null;
    this.perfilPostulante = null;
    this.loadingPerfil = false;
    this.perfilError = '';
  }

  // ── HU-06: Modal y acción de rechazo ──

  openRejectModal(cand: KanbanCandidate, event?: Event): void {
    if (event) event.stopPropagation();

    if (this.procesandoMovimiento || this.rejectTarget) return;

    const actual = this.candidates.find(
      item => item.id === cand.id &&
              item.jobId === this.selectedJobId
    );

    if (!actual || !this.puedeRechazar(actual)) {
      this.showToast(
        'Este candidato no puede ser rechazado en su estado actual.'
      );
      return;
    }

    this.rejectTarget = actual;
    this.selectedMotivoId = null;
    this.rejectError = this.motivosError;
  }

  closeRejectModal(): void {
    if (this.procesandoMovimiento) return;

    this.rejectTarget = null;
    this.selectedMotivoId = null;
    this.rejectError = '';
  }

  confirmReject(): void {
    if (
      !this.rejectTarget ||
      this.procesandoMovimiento
    ) return;

    if (
      !this.selectedMotivoId ||
      !this.motivosRechazo.some(
        motivo => motivo.id === this.selectedMotivoId
      )
    ) {
      this.rejectError = this.motivosError ||
        'Seleccione un motivo de rechazo válido.';
      return;
    }

    this.ejecutarMovimiento(
      this.rejectTarget,
      'rejected',
      this.selectedMotivoId
    );
  }

  private ejecutarMovimiento(
    candidato: KanbanCandidate,
    destino: KanbanColumn,
    motivoId?: number
  ): void {
    if (this.procesandoMovimiento) return;

    if (this.rejectTarget && destino !== 'rejected') return;

    const actual = this.candidates.find(
      item => item.id === candidato.id &&
              item.jobId === this.selectedJobId
    );

    if (!actual || !this.puedeAvanzarA(actual, destino)) {
      return;
    }

    if (
      destino === 'hired' &&
      this.cuposDisponibles <= 0
    ) {
      this.showToast(
        'Límite de contratación alcanzado.'
      );
      return;
    }

    if (
      destino === 'rejected' &&
      (
        !motivoId ||
        this.rejectTarget?.id !== actual.id ||
        !this.motivosRechazo.some(m => m.id === motivoId)
      )
    ) {
      this.rejectError = 'Seleccione un motivo de rechazo válido.';
      return;
    }

    const vacanteId = Number(this.selectedJobId);
    const postulacionId = Number(actual.id);

    if (
      !Number.isSafeInteger(vacanteId) ||
      !Number.isSafeInteger(postulacionId) ||
      vacanteId <= 0 ||
      postulacionId <= 0
    ) return;

    this.procesandoMovimiento = true;
    this.rejectError = '';

    this.tableroVersion++;
    this.refrescoSub?.unsubscribe();

    const peticion = destino === 'hired'
      ? this.kanbanService.contratar(vacanteId, postulacionId)
      : destino === 'rejected'
        ? this.kanbanService.rechazar(
            vacanteId, postulacionId, motivoId!
          )
        : this.kanbanService.avanzar(vacanteId, postulacionId);

    this.subs.add(peticion.subscribe({
      next: () => {
        this.procesandoMovimiento = false;

        if (String(vacanteId) !== this.selectedJobId) {
          if (this.selectedJobId) {
            this.cargarTablero(Number(this.selectedJobId));
          }
          return;
        }

        this.closeProfile();
        this.closeRejectModal();
        this.cargarTablero(vacanteId);

        const mensaje = destino === 'hired'
          ? 'Contratación registrada correctamente.'
          : destino === 'rejected'
            ? 'Rechazo registrado correctamente.'
            : 'Cambio de etapa registrado correctamente.';

        this.showToast(mensaje);
      },

      error: (err) => {
        this.procesandoMovimiento = false;

        if (String(vacanteId) !== this.selectedJobId) {
          if (this.selectedJobId) {
            this.cargarTablero(Number(this.selectedJobId));
          }
          return;
        }

        const mensaje = err.status === 0
          ? 'No se pudo confirmar el resultado. Consulta el estado actualizado.'
          : err.error?.message ||
            'No fue posible registrar el movimiento.';

        if (destino === 'rejected') {
          this.rejectError = mensaje;
        } else {
          this.showToast(mensaje);
        }

        if ([0, 403, 404, 409].includes(err.status)) {
          this.closeProfile();
          this.closeRejectModal();
          this.cargarTablero(vacanteId);
          this.showToast(mensaje);
        }
      }
    }));
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
    if (this.procesandoMovimiento || this.rejectTarget) return;

    const actual = this.candidates.find(
      item => item.id === cand.id &&
              item.jobId === this.selectedJobId
    );

    if (!actual) return;

    const destino = this.getNextCol(actual.column);

    if (!destino) return;

    this.ejecutarMovimiento(actual, destino);
  }

  abrirHistorial(): void {
    if (
      this.procesandoMovimiento ||
      !this.selectedJobId
    ) return;

    const vacanteId = Number(this.selectedJobId);

    if (
      !Number.isSafeInteger(vacanteId) ||
      vacanteId <= 0
    ) return;

    const version = ++this.historialVersion;

    this.historialSub?.unsubscribe();

    this.mostrarHistorial = true;
    this.cargandoHistorial = true;
    this.historial = null;
    this.historialError = '';

    this.historialSub =
      this.kanbanService.historial(vacanteId).subscribe({
        next: (historial) => {
          if (
            version !== this.historialVersion ||
            String(vacanteId) !== this.selectedJobId ||
            !this.mostrarHistorial
          ) return;

          this.cargandoHistorial = false;
          this.historial = historial;
        },

        error: (err) => {
          if (
            version !== this.historialVersion ||
            String(vacanteId) !== this.selectedJobId ||
            !this.mostrarHistorial
          ) return;

          this.cargandoHistorial = false;
          this.historial = null;
          this.historialError = err.error?.message ||
            'No fue posible consultar el historial.';
        }
      });
  }

  cerrarHistorial(): void {
    this.historialVersion++;
    this.historialSub?.unsubscribe();

    this.mostrarHistorial = false;
    this.cargandoHistorial = false;
    this.historial = null;
    this.historialError = '';
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
