import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map } from 'rxjs';
import {
  JOBS,
  APPLICATIONS,
  COMPANY_JOBS,
  MANAGED_JOBS,
  KANBAN_CANDIDATES,
  Job,
  Application,
  CompanyJob,
  ManagedJob,
  KanbanCandidate,
  KanbanColumn,
  SkillTag,
  IdiomaCandidato,
  ManagedJobStatus
} from '../data/creo-data';

/**
 * Cómo ve el candidato la disponibilidad de una vacante.
 * Una vacante retirada conserva sus datos: quien ya postuló puede abrirla por su URL.
 */
export type DisponibilidadVacante = 'vigente' | 'finalizada' | 'eliminada';

/** Datos del candidato que acompañan a una postulación y arman su tarjeta en el Kanban */
export interface DatosPostulante {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  bio?: string;
  languages?: IdiomaCandidato[];
}

/**
 * Vacante recién creada por una empresa que queda esperando la revisión
 * del administrador (pantalla "Revisión de Vacantes").
 */
export interface ModerationJob {
  id: string;
  /** Resultado de la revisión del administrador */
  status?: 'pending' | 'approved' | 'unpublished';
  unpublishReason?: string;
  title: string;
  company: string;
  reportedAt: string;
  reason: string;
  description?: string;
  salary?: string;
  experience?: string;
  modality?: string;
  hireLimit?: number;
  closeDate?: string;
  mustHaveSkills?: string[];
  niceToHaveSkills?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CreoJobsService {
  private savedKey = 'creo_saved_jobs';
  private moderationKey = 'creo_moderation_queue';
  private jobsKey = 'creo_jobs';
  private managedKey = 'creo_managed_jobs';
  private companyJobsKey = 'creo_company_jobs';
  private kanbanKey = 'creo_kanban_candidates';
  private appsKey = 'creo_applications';
  private versionKey = 'creo_data_version';

  /**
   * Al cambiar los datos de ejemplo del código, sube este número.
   * Así el navegador descarta la copia guardada y vuelve a partir del semillero.
   */
  private readonly DATA_VERSION = '1';
  private appliedKey = 'creo_applied_jobs';

  private jobsSubject = new BehaviorSubject<Job[]>(this.cargar(this.jobsKey, JOBS));
  jobs$ = this.jobsSubject.asObservable();

  private savedSubject = new BehaviorSubject<string[]>(this.loadSaved());
  saved$ = this.savedSubject.asObservable();

  private appliedSubject = new BehaviorSubject<string[]>(this.loadApplied());
  applied$ = this.appliedSubject.asObservable();

  private appsSubject = new BehaviorSubject<Application[]>(this.cargar(this.appsKey, APPLICATIONS));
  applications$ = this.appsSubject.asObservable();

  private companyJobsSubject = new BehaviorSubject<CompanyJob[]>(this.cargar(this.companyJobsKey, COMPANY_JOBS));
  companyJobs$ = this.companyJobsSubject.asObservable();

  private managedSubject = new BehaviorSubject<ManagedJob[]>(this.cargar(this.managedKey, MANAGED_JOBS));
  managedJobs$ = this.managedSubject.asObservable();

  /**
   * Estados en los que la vacante NO se muestra a los candidatos:
   * porque todavía no se publicó, o porque la empresa ya la retiró del portal.
   */
  private readonly NO_PUBLICADAS: ManagedJobStatus[] = [
    'pending_review',
    'approved_pending_payment',
    'rejected_by_moderation',
    'closed',
    'inactive',
  ];

  /**
   * Catálogo que ven los candidatos: solo las vacantes vigentes.
   * No aparece una vacante en revisión, aprobada sin pagar, rechazada,
   * finalizada o eliminada. Una pausada sí: dejó de recibir postulaciones,
   * pero sigue publicada.
   */
  publicJobs$ = combineLatest([this.jobsSubject, this.managedSubject]).pipe(
    map(([jobs, managed]) => {
      const ocultas = new Set(
        managed.filter(m => this.NO_PUBLICADAS.includes(m.status)).map(m => m.id)
      );
      return jobs.filter(j => !ocultas.has(j.id));
    })
  );

  private kanbanSubject = new BehaviorSubject<KanbanCandidate[]>(this.cargar(this.kanbanKey, KANBAN_CANDIDATES));
  kanbanCandidates$ = this.kanbanSubject.asObservable();

  /** Vacantes nuevas que el administrador debe revisar (se guardan en el navegador) */
  private moderationSubject = new BehaviorSubject<ModerationJob[]>(this.loadModeration());
  moderationQueue$ = this.moderationSubject.asObservable();

  /**
   * Estados en los que editar una vacante le hace perder la aprobación:
   * vuelve a la cola del administrador y, si ya estaba publicada, se paga de nuevo.
   */
  private readonly PIERDEN_APROBACION: ManagedJobStatus[] = [
    'approved_pending_payment',
    'active',
    'paused',
  ];

  /** true si editar esta vacante la devuelve a revisión */
  editarPierdeAprobacion(jobId: string): boolean {
    const estado = this.managedSubject.value.find(j => j.id === jobId)?.status;
    return !!estado && this.PIERDEN_APROBACION.includes(estado);
  }

  /** true si además ya estaba pagada y publicada, así que habrá que pagar otra vez */
  editarExigeNuevoPago(jobId: string): boolean {
    const estado = this.managedSubject.value.find(j => j.id === jobId)?.status;
    return estado === 'active' || estado === 'paused';
  }

  /** Estado de la vacante visto desde el lado del candidato */
  disponibilidadVacante(jobId: string): DisponibilidadVacante {
    const estado = this.managedSubject.value.find(j => j.id === jobId)?.status;
    if (estado === 'inactive') return 'eliminada';
    if (estado === 'closed') return 'finalizada';
    return 'vigente';
  }

  /** true si la vacante ya no está publicada en el portal */
  private estaRetirada(jobId: string): boolean {
    const estado = this.managedSubject.value.find(j => j.id === jobId)?.status;
    return !!estado && this.NO_PUBLICADAS.includes(estado);
  }

  /** Lee una lista guardada en el navegador; si no hay o la versión cambió, usa los datos de ejemplo */
  private cargar<T>(clave: string, semilla: T[]): T[] {
    try {
      if (localStorage.getItem(this.versionKey) !== this.DATA_VERSION) {
        localStorage.removeItem(this.jobsKey);
        localStorage.removeItem(this.managedKey);
        localStorage.removeItem(this.companyJobsKey);
        localStorage.removeItem(this.kanbanKey);
        localStorage.removeItem(this.appsKey);
        localStorage.setItem(this.versionKey, this.DATA_VERSION);
        return semilla;
      }

      const guardado = localStorage.getItem(clave);
      if (guardado) return JSON.parse(guardado);
    } catch {}

    return semilla;
  }

  private guardar<T>(clave: string, lista: T[]): void {
    try {
      localStorage.setItem(clave, JSON.stringify(lista));
    } catch {}
  }

  /** Publican el cambio y lo dejan guardado, para que sobreviva al F5 */
  private setJobs(lista: Job[]): void {
    this.jobsSubject.next(lista);
    this.guardar(this.jobsKey, lista);
  }

  private setManaged(lista: ManagedJob[]): void {
    this.managedSubject.next(lista);
    this.guardar(this.managedKey, lista);
  }

  private setCompanyJobs(lista: CompanyJob[]): void {
    this.companyJobsSubject.next(lista);
    this.guardar(this.companyJobsKey, lista);
  }

  private setKanban(lista: KanbanCandidate[]): void {
    this.kanbanSubject.next(lista);
    this.guardar(this.kanbanKey, lista);
  }

  private setApplications(lista: Application[]): void {
    this.appsSubject.next(lista);
    this.guardar(this.appsKey, lista);
  }

  private loadModeration(): ModerationJob[] {
    try {
      const stored = localStorage.getItem(this.moderationKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }

  /** Guarda la cola y avisa a la pantalla de revisión del administrador */
  private saveModeration(lista: ModerationJob[]): void {
    this.moderationSubject.next(lista);
    try {
      localStorage.setItem(this.moderationKey, JSON.stringify(lista));
    } catch {}
  }

  /** El administrador aprobó o rechazó una vacante: el resultado queda guardado */
  setModerationStatus(jobId: string, status: 'approved' | 'unpublished', motivo?: string): void {
    const actualizada = this.moderationSubject.value.map(v =>
      v.id === jobId ? { ...v, status, ...(motivo ? { unpublishReason: motivo } : {}) } : v
    );
    this.saveModeration(actualizada);
  }

  private loadSaved(): string[] {
    try {
      const stored = localStorage.getItem(this.savedKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default saved jobs as shown in Figma / Screenshot 3: j1 and j5
    return ['j1', 'j5'];
  }

  private loadApplied(): string[] {
    try {
      const stored = localStorage.getItem(this.appliedKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    // Default applied jobs as shown in Screenshot 1: j1, j2, j4, j5
    return ['j1', 'j2', 'j4', 'j5'];
  }

  get savedJobIds(): string[] {
    return this.savedSubject.value;
  }

  get appliedJobIds(): string[] {
    return this.appliedSubject.value;
  }

  isSaved(jobId: string): boolean {
    return this.savedSubject.value.includes(jobId);
  }

  toggleSave(jobId: string): void {
    const current = this.savedSubject.value;
    const updated = current.includes(jobId)
      ? current.filter(id => id !== jobId)
      : [...current, jobId];
    this.savedSubject.next(updated);
    try {
      localStorage.setItem(this.savedKey, JSON.stringify(updated));
    } catch {}
  }

  isApplied(jobId: string): boolean {
    return this.appliedSubject.value.includes(jobId);
  }

  /**
   * Fórmula de coincidencia: etiquetas que coinciden / etiquetas de la oferta × 100.
   * Es el cálculo que luego hará el microservicio de Python.
   */
  private calcularMatch(habilidades: string[], job?: Job): number {
    const etiquetas = (job?.skillTags || []).map(s => s.skill);
    if (etiquetas.length === 0) return 0;

    const propias = new Set(habilidades.map(h => h.toLowerCase().trim()));
    const coincidencias = etiquetas.filter(e => propias.has(e.toLowerCase().trim())).length;

    return Math.round((coincidencias / etiquetas.length) * 100);
  }

  apply(jobId: string, postulante?: DatosPostulante): void {
    if (this.isApplied(jobId)) return;

    // Una vacante retirada del portal no admite nuevas postulaciones
    if (!this.jobsSubject.value.some(j => j.id === jobId)) return;
    if (this.estaRetirada(jobId)) return;
    const updated = [...this.appliedSubject.value, jobId];
    this.appliedSubject.next(updated);
    try {
      localStorage.setItem(this.appliedKey, JSON.stringify(updated));
    } catch {}

    const job = this.jobsSubject.value.find(j => j.id === jobId);
    if (job) {
      const newApp: Application = {
        id: 'a_' + Date.now(),
        jobId,
        jobTitle: job.title,
        company: job.company,
        status: 'received',
        appliedDate: 'Hoy',
        location: job.location + (job.remote ? ' · Remoto' : '')
      };
      this.setApplications([newApp, ...this.appsSubject.value]);

      // La postulación entra al Kanban de la empresa, en la columna "Recibido"
      const habilidades = postulante?.skills ?? [];
      const tarjeta: KanbanCandidate = {
        id: 'kc_' + Date.now(),
        jobId,
        name: postulante?.name?.trim() || 'Candidato',
        skills: habilidades,
        match: this.calcularMatch(habilidades, job),
        column: 'received',
        appliedDate: 'Hoy',
        email: postulante?.email || '',
        phone: postulante?.phone || '',
        experience: postulante?.experience || 'Sin experiencia registrada',
        education: postulante?.education || 'Sin estudios registrados',
        bio: postulante?.bio || '',
        languages: postulante?.languages ?? [],
      };
      this.setKanban([tarjeta, ...this.kanbanSubject.value]);

      // La vacante suma una postulación (el portal la muestra como rango, no exacta)
      this.setJobs(this.jobsSubject.value.map(j =>
        j.id === jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j));
      this.setManaged(this.managedSubject.value.map(j =>
        j.id === jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j));
      this.setCompanyJobs(this.companyJobsSubject.value.map(j =>
        j.id === jobId ? { ...j, applicants: (j.applicants || 0) + 1 } : j));
    }
  }

  withdrawApplication(appId: string): void {
    const app = this.appsSubject.value.find(a => a.id === appId);
    this.setApplications(this.appsSubject.value.filter(a => a.id !== appId));
    if (app) {
      const job = this.jobsSubject.value.find(j => j.company === app.company && j.title.toLowerCase().includes(app.jobTitle.toLowerCase()));
      if (job) {
        const updatedApplied = this.appliedSubject.value.filter(id => id !== job.id);
        this.appliedSubject.next(updatedApplied);
        try {
          localStorage.setItem(this.appliedKey, JSON.stringify(updatedApplied));
        } catch {}
      }
    }
  }

  togglePauseJob(jobId: string): void {
    const updated = this.managedSubject.value.map(j => {
      if (j.id === jobId && (j.status === 'active' || j.status === 'paused')) {
        return {
          ...j,
          status: j.status === 'paused' ? ('active' as const) : ('paused' as const)
        };
      }
      return j;
    });
    this.setManaged(updated);
  }

  togglePauseManagedJob(jobId: string): void {
    this.togglePauseJob(jobId);
  }

  depublishJob(jobId: string): void {
    const updated = this.managedSubject.value.map(j => {
      if (j.id === jobId) {
        return { ...j, status: 'closed' } as ManagedJob;
      }
      return j;
    });
    this.setManaged(updated);
  }

  depublishManagedJob(jobId: string): void {
    this.depublishJob(jobId);
  }

  moveKanbanCandidate(id: string, toColumn: KanbanColumn, rejectReason?: string): void {
    const movido = this.kanbanSubject.value.find(c => c.id === id);

    const updated = this.kanbanSubject.value.map(c => {
      if (c.id === id) {
        return {
          ...c,
          column: toColumn,
          ...(rejectReason ? { rejectReason } : {})
        };
      }
      return c;
    });
    this.setKanban(updated);

    // El candidato debe ver el avance reflejado en "Mis Postulaciones"
    if (movido?.jobId) {
      this.setApplications(
        this.appsSubject.value.map(a =>
          a.jobId === movido.jobId ? { ...a, status: toColumn } : a
        )
      );
    }
  }

  createJob(jobData: {
    id?: string;
    title: string;
    area?: string;
    location?: string;
    modality?: string;
    remote?: boolean;
    description?: string;
    level?: string;
    hireLimit?: number;
    closeDate?: string;
    requirements?: string[];
    benefits?: string[];
    salary?: string;
    salaryMin?: number;
    salaryMax?: number;
    tags?: string[];
    skillTags?: SkillTag[];
    company?: string;
    companyDescription?: string;
  }): void {
    const existingIds = new Set([
      ...this.jobsSubject.value.map(j => j.id),
      ...this.managedSubject.value.map(j => j.id)
    ]);
    let newId = jobData.id || '';
    if (!newId) {
      let counter = Math.max(this.managedSubject.value.length, this.jobsSubject.value.length) + 1;
      newId = 'j' + counter;
      while (existingIds.has(newId)) {
        counter++;
        newId = 'j' + counter;
      }
    }
    
    // Explicit remote check: respects boolean if provided, or checks modality 'Remoto'
    const isRemote = jobData.remote !== undefined
      ? jobData.remote
      : (jobData.modality?.toLowerCase() === 'remoto' || (jobData.location?.toLowerCase().includes('remoto') ?? false));

    const finalLocation = jobData.location?.trim() || (isRemote ? 'Remoto' : 'Lima, Perú');

    const newManaged: ManagedJob = {
      id: newId,
      title: jobData.title,
      status: 'pending_review',
      applicants: 0,
      publishedDate: 'Hoy',
      closeDate: 'En 14 días',
      daysLeft: 14,
      hireLimit: jobData.hireLimit || 1,
      description: jobData.description,
      level: jobData.level || 'Semi-Senior',
      requirements: jobData.requirements || [],
      benefits: jobData.benefits || [],
      location: finalLocation,
      salary: jobData.salary || 'S/ 3,500 – 6,000',
      salaryMin: jobData.salaryMin,
      salaryMax: jobData.salaryMax,
      tags: jobData.tags || [],
      skillTags: jobData.skillTags || [],
      remote: isRemote,
      area: jobData.area,
      modality: jobData.modality,
      closeDateISO: jobData.closeDate
    };
    this.setManaged([newManaged, ...this.managedSubject.value]);

    const newCompanyJob: CompanyJob = {
      id: newId,
      title: jobData.title,
      location: finalLocation,
      applicants: 0,
      status: 'active',
      daysLeft: 14,
      remote: isRemote,
    };
    this.setCompanyJobs([newCompanyJob, ...this.companyJobsSubject.value]);

    // Also register in public catalog so candidate job detail views render requirements and benefits
    const newJob: Job = {
      id: newId,
      title: jobData.title,
      company: jobData.company || 'TechCorp SA',
      location: finalLocation,
      salary: jobData.salary || 'S/ 3,500 – 6,000',
      salaryMin: jobData.salaryMin ?? 3500,
      salaryMax: jobData.salaryMax ?? 6000,
      tags: jobData.tags && jobData.tags.length > 0 ? jobData.tags : ['General'],
      postedAgo: 'Recién publicado',
      remote: isRemote,
      match: 95,
      experience: jobData.level || 'Semi Senior',
      area: jobData.area || 'Administración y Negocios',
      description: jobData.description || 'Descripción del puesto.',
      requirements: jobData.requirements || [],
      benefits: jobData.benefits || [],
      companyDescription: jobData.companyDescription || 'Empresa innovadora en constante crecimiento profesional y tecnológico.',
      applicants: 0,
      skillTags: jobData.skillTags || []
    };
    this.setJobs([newJob, ...this.jobsSubject.value]);

    // La vacante entra a la cola de "Revisión de Vacantes" del administrador
    const skillTags = jobData.skillTags || [];
    const nuevaRevision: ModerationJob = {
      id: newId,
      status: 'pending',
      title: jobData.title,
      company: jobData.company || 'TechCorp SA',
      reportedAt: 'Hoy',
      reason: 'Revisión previa obligatoria (Nueva vacante)',
      description: jobData.description,
      salary: jobData.salary || 'S/ 3,500 – 6,000',
      experience: jobData.level || 'Semi-Senior',
      modality: jobData.modality,
      hireLimit: jobData.hireLimit || 1,
      closeDate: jobData.closeDate || 'En 14 días',
      mustHaveSkills: skillTags.filter(s => s.weight === 'required').map(s => s.skill),
      niceToHaveSkills: skillTags.filter(s => s.weight === 'preferred').map(s => s.skill)
    };
    this.saveModeration([nuevaRevision, ...this.moderationSubject.value]);
  }

  /**
   * Edición de una vacante existente. Conserva su estado, postulantes e historial:
   * solo se reemplaza el contenido que la empresa puede modificar.
   */
  updateJob(jobId: string, jobData: {
    title: string;
    area?: string;
    location?: string;
    modality?: string;
    description?: string;
    level?: string;
    hireLimit?: number;
    closeDate?: string;
    requirements?: string[];
    benefits?: string[];
    salary?: string;
    salaryMin?: number;
    salaryMax?: number;
    tags?: string[];
    skillTags?: SkillTag[];
  }): boolean {
    const actual = this.managedSubject.value.find(j => j.id === jobId);
    if (!actual) return false;

    // Editar una vacante aprobada o publicada le quita la aprobación
    const vuelveARevision = this.PIERDEN_APROBACION.includes(actual.status);

    const isRemote = jobData.modality?.toLowerCase() === 'remoto'
      || (jobData.location?.toLowerCase().includes('remoto') ?? false);
    const finalLocation = jobData.location?.trim() || (isRemote ? 'Remoto' : 'Lima, Perú');

    this.setManaged(
      this.managedSubject.value.map(j => j.id === jobId ? {
        ...j,
        status: vuelveARevision ? ('pending_review' as const) : j.status,
        title: jobData.title,
        description: jobData.description,
        level: jobData.level || j.level,
        hireLimit: jobData.hireLimit || j.hireLimit,
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || [],
        location: finalLocation,
        salary: jobData.salary || j.salary,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        tags: jobData.tags || [],
        skillTags: jobData.skillTags || [],
        remote: isRemote,
        area: jobData.area,
        modality: jobData.modality,
        closeDateISO: jobData.closeDate
      } : j)
    );

    this.setCompanyJobs(
      this.companyJobsSubject.value.map(j => j.id === jobId
        ? { ...j, title: jobData.title, location: finalLocation, remote: isRemote }
        : j)
    );

    // El catálogo del candidato refleja los cambios de inmediato
    this.setJobs(
      this.jobsSubject.value.map(j => j.id === jobId ? {
        ...j,
        title: jobData.title,
        location: finalLocation,
        salary: jobData.salary || j.salary,
        salaryMin: jobData.salaryMin ?? j.salaryMin,
        salaryMax: jobData.salaryMax ?? j.salaryMax,
        tags: jobData.tags && jobData.tags.length > 0 ? jobData.tags : j.tags,
        remote: isRemote,
        experience: jobData.level || j.experience,
        area: jobData.area || j.area,
        description: jobData.description || j.description,
        requirements: jobData.requirements || [],
        benefits: jobData.benefits || [],
        skillTags: jobData.skillTags || []
      } : j)
    );

    if (vuelveARevision) {
      this.devolverARevision(jobId, jobData);
    }

    return true;
  }

  /** La vacante editada regresa a "Revisión de Vacantes" con su contenido actualizado */
  private devolverARevision(jobId: string, jobData: { title: string; description?: string; salary?: string; level?: string; modality?: string; hireLimit?: number; closeDate?: string; skillTags?: SkillTag[] }): void {
    const etiquetas = jobData.skillTags || [];
    const actualizada: Partial<ModerationJob> = {
      status: 'pending',
      reason: 'Revisión previa obligatoria (Vacante editada)',
      reportedAt: 'Hoy',
      title: jobData.title,
      description: jobData.description,
      salary: jobData.salary,
      experience: jobData.level,
      modality: jobData.modality,
      hireLimit: jobData.hireLimit,
      closeDate: jobData.closeDate,
      mustHaveSkills: etiquetas.filter(s => s.weight === 'required').map(s => s.skill),
      niceToHaveSkills: etiquetas.filter(s => s.weight !== 'required').map(s => s.skill),
      unpublishReason: undefined,
    };

    const enCola = this.moderationSubject.value.some(v => v.id === jobId);

    if (enCola) {
      this.saveModeration(
        this.moderationSubject.value.map(v => v.id === jobId ? { ...v, ...actualizada } : v)
      );
      return;
    }

    // Vacante que nunca pasó por la cola (datos de ejemplo): entra ahora
    const empresa = this.jobsSubject.value.find(j => j.id === jobId)?.company ?? 'Empresa';
    this.saveModeration([
      { id: jobId, company: empresa, ...actualizada } as ModerationJob,
      ...this.moderationSubject.value,
    ]);
  }

  /**
   * El administrador aprobó la vacante: queda a la espera de que la empresa pague.
   * No se publica todavía; eso ocurre en payAndPublishJob.
   */
  approveJob(jobId: string): void {
    this.setManaged(
      this.managedSubject.value.map(j =>
        j.id === jobId && j.status === 'pending_review'
          ? { ...j, status: 'approved_pending_payment' as const }
          : j
      )
    );
  }

  payAndPublishJob(jobId: string): void {
    const updated = this.managedSubject.value.map(j => {
      if (j.id === jobId) {
        return { ...j, status: 'active' as const };
      }
      return j;
    });
    this.setManaged(updated);
  }

  /**
   * Borrado lógico de una vacante.
   * Se conserva en la lista de la empresa con estado 'inactive' para consultarla como
   * historial, y deja de estar publicada: desaparece del portal de los candidatos.
   */
  deleteManagedJob(jobId: string): void {
    const updated = this.managedSubject.value.map(j => {
      if (j.id === jobId) {
        return { ...j, status: 'inactive' as const };
      }
      return j;
    });
    this.setManaged(updated);

    // No se borra del catálogo: deja de listarse por su estado, pero quien ya
    // postuló debe poder abrirla por su URL y ver que fue eliminada.

    // Sale del resumen de "Inicio" de la empresa
    this.setCompanyJobs(this.companyJobsSubject.value.filter(j => j.id !== jobId));
  }

  suspendCompanyOffers(companyName: string): void {
    // Al suspender una empresa, sus ofertas pasan a Inactivo/Oculto y se bloquean nuevas postulaciones
    const updatedJobs = this.jobsSubject.value.filter(
      j => j.company.toLowerCase() !== companyName.toLowerCase()
    );
    this.setJobs(updatedJobs);

    const updatedManaged = this.managedSubject.value.map(j => ({ ...j, status: 'closed' as const }));
    this.setManaged(updatedManaged);

    const updatedCompanyJobs = this.companyJobsSubject.value.map(j => ({ ...j, status: 'paused' as const }));
    this.setCompanyJobs(updatedCompanyJobs);
  }
}
