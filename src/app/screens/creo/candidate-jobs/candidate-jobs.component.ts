import { AccessibleDialogDirective } from '../../../core/accessibility/accessible-dialog.directive';
import { NativeSkillsService } from '../../../core/native/native-skills.service';
import { validateSkillSelection } from '../../../core/native/skill-selection';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription, merge, of } from 'rxjs';
import { catchError, debounceTime, map, switchMap, tap } from 'rxjs/operators';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { JobCardComponent } from '../../../components/creo-design-system/job-card/job-card.component';
import { CreoJobsService } from '../../../services/creo-jobs.service';
import { CatalogosService } from '../../../core/api/catalogos.service';
import { VacantesService } from '../../../core/api/vacantes.service';
import { AreaEstudio } from '../../../core/api/models/catalogos.model';
import { NivelPuestoResumen } from '../../../core/api/models/vacante-empresa.model';
import { MetaPaginacion } from '../../../core/api/models/api-response.model';
import {
  FiltrosBusquedaVacantes,
  PaginaVacantes,
  SalarioMinimoFiltro
} from '../../../core/api/models/vacante-busqueda.model';
import { mapVacanteBusquedaToJob } from '../../../core/api/mappers/vacante-busqueda.mapper';
import { Job } from '../../../data/creo-data';

interface SalaryRange {
  label: string;
  min: SalarioMinimoFiltro | 0;
}

/** Una habilidad del catálogo que el candidato puede elegir en los filtros */
interface SkillOption {
  id: number;
  label: string;
  /** Nombre normalizado para el buscador de habilidades */
  key: string;
  soft: boolean;
}

/** GET /vacantes acepta como máximo 3 habilidades */
const MAX_HABILIDADES = 3;

@Component({
  selector: 'app-candidate-jobs',
  standalone: true,
  imports: [AccessibleDialogDirective, CommonModule, FormsModule, CandidateShellComponent, JobCardComponent],
  templateUrl: './candidate-jobs.component.html',
  styleUrl: './candidate-jobs.component.css'
})
export class CandidateJobsComponent implements OnInit, OnDestroy {
  readonly nativeSkills = inject(NativeSkillsService);
  nativeSkillsBusy = false;
  nativeSkillsError = '';
  private destroyed = false;
  async chooseNativeSkills(): Promise<void> {
    if (this.nativeSkillsBusy || !this.nativeSkills.available || !navigator.onLine) return;
    this.nativeSkillsBusy = true;
    this.nativeSkillsError = '';
    try {
      const result = await this.nativeSkills.choose(this.skillOptions, [...this.selectedSkills]);
      if (this.destroyed) return;
      const ids = validateSkillSelection(result, this.skillOptions);
      if (ids === null) return;
      this.selectedSkills = new Set(ids);
      this.skillLimitMessage = '';
      this.aplicarFiltros();
    } catch {
      if (!this.destroyed) this.nativeSkillsError = 'No se pudo abrir o aplicar la selección Android. Tus filtros se conservaron.';
    } finally { this.nativeSkillsBusy = false; }
  }

  private catalogosService = inject(CatalogosService);
  private vacantesService = inject(VacantesService);

  readonly maxHabilidades = MAX_HABILIDADES;

  // Catálogos del backend (los filtros envían sus IDs)
  levels: NivelPuestoResumen[] = [];
  areas: AreaEstudio[] = [];
  skillOptions: SkillOption[] = [];

  /** Únicos valores que acepta salario_minimo */
  salaryRanges: SalaryRange[] = [
    { label: 'Cualquier salario', min: 0 },
    { label: 'S/ 1,500+', min: 1500 },
    { label: 'S/ 3,000+', min: 3000 },
    { label: 'S/ 5,000+', min: 5000 },
    { label: 'S/ 7,000+', min: 7000 },
    { label: 'S/ 9,000+', min: 9000 },
  ];

  search = '';
  selectedAreaId: number | null = null;
  selectedLevels = new Set<number>();
  selectedSkills = new Set<number>();
  salaryMin: SalarioMinimoFiltro | 0 = 0;
  remoteOnly = false;

  skillTab: 'tecnicas' | 'blandas' = 'tecnicas';
  skillSearch = '';
  skillLimitMessage = '';

  loading = true;
  errorMessage = '';
  sidebarOpen = false;

  // ── Resultados y paginación (los da el servidor) ──────────────────────────
  jobsPagina: Job[] = [];
  meta: MetaPaginacion = { current_page: 1, per_page: 10, total: 0, last_page: 1 };
  paginaActual = 1;

  savedJobIds: string[] = [];

  private subs = new Subscription();
  /** Cambios de filtro que consultan de inmediato */
  private buscar$ = new Subject<void>();
  /** Texto del buscador: espera a que el candidato deje de escribir */
  private buscarTexto$ = new Subject<void>();
  /** Refresco de fondo: la misma consulta, sin esqueleto de carga */
  private refrescar$ = new Subject<void>();

  /** Aviso de las ofertas que se publicaron con la pantalla abierta */
  actionToast: string | null = null;
  private toastTimer: any;

  private readonly intervaloRefresco = 45_000;
  private refrescoTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private creoJobsService: CreoJobsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCatalogos();

    this.subs.add(
      merge(
        this.buscar$.pipe(map(() => false)),
        this.buscarTexto$.pipe(debounceTime(400), map(() => false)),
        this.refrescar$.pipe(map(() => true))
      )
        .pipe(
          tap(silencioso => {
            if (silencioso) return;
            this.loading = true;
            this.errorMessage = '';
          }),
          // switchMap descarta la respuesta de una búsqueda que ya quedó vieja
          switchMap(silencioso => this.vacantesService.buscarVacantes(this.filtrosActuales()).pipe(
            map(pagina => ({ pagina, error: null as HttpErrorResponse | null, silencioso })),
            catchError((error: HttpErrorResponse) => of({ pagina: null as PaginaVacantes | null, error, silencioso }))
          ))
        )
        .subscribe(({ pagina, error, silencioso }) => {
          if (pagina) {
            this.loading = false;
            const idsAnteriores = new Set(this.jobsPagina.map(j => j.id));
            this.meta = pagina.meta;
            this.jobsPagina = pagina.vacantes.map(mapVacanteBusquedaToJob);
            if (silencioso) this.avisarNuevas(idsAnteriores);
            return;
          }
          // Un fallo del refresco de fondo no debe vaciar lo que ya se ve
          if (silencioso) return;

          this.loading = false;
          this.jobsPagina = [];
          this.meta = { ...this.meta, total: 0, last_page: 1 };
          this.errorMessage = this.mensajeError(error);
        })
    );

    this.subs.add(
      this.creoJobsService.saved$.subscribe(ids => {
        this.savedJobIds = ids;
      })
    );
    this.creoJobsService.cargarGuardadas();

    this.buscar$.next();

    // La empresa paga y publica en OTRA sesión del navegador; sin un canal del
    // servidor (WebSocket) esta pantalla no se entera sola. Se vuelve a
    // consultar al regresar a la pestaña y cada 45 s mientras está a la vista.
    document.addEventListener('visibilitychange', this.alCambiarVisibilidad);
    window.addEventListener('focus', this.alCambiarVisibilidad);
    this.programarRefresco();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.subs.unsubscribe();
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
   * No se refresca mientras el candidato está eligiendo filtros ni con una
   * búsqueda suya en curso: cambiaría los resultados bajo sus manos.
   */
  private refrescarSiSePuede(): void {
    if (document.hidden) return;
    if (this.loading) return;
    if (this.sidebarOpen || this.nativeSkillsBusy) return;

    this.refrescar$.next();
  }

  /** Avisa de lo que se publicó (la empresa pagó) con la pantalla abierta */
  private avisarNuevas(idsAnteriores: Set<string>): void {
    if (idsAnteriores.size === 0) return;

    const nuevas = this.jobsPagina.filter(j => !idsAnteriores.has(j.id));
    if (nuevas.length === 0) return;

    this.showToast(
      nuevas.length === 1
        ? `Nueva oferta publicada: "${nuevas[0].title}".`
        : `${nuevas.length} ofertas nuevas se publicaron.`
    );
  }

  showToast(msg: string): void {
    this.actionToast = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.actionToast = null;
      this.toastTimer = null;
    }, 4000);
  }

  private cargarCatalogos(): void {
    this.subs.add(
      this.vacantesService.nivelesExperiencia().subscribe({
        next: niveles => this.levels = niveles || [],
        error: () => this.levels = []
      })
    );

    this.subs.add(
      this.catalogosService.areasEstudio().subscribe({
        next: areas => this.areas = (areas || []).filter(a => a.activo !== false),
        error: () => this.areas = []
      })
    );

    this.subs.add(
      this.catalogosService.habilidades().subscribe({
        next: habs => {
          this.skillOptions = (habs || [])
            .filter(h => h.activo !== false)
            .map(h => ({
              id: h.id,
              label: h.nombre,
              key: this.normalizeText(h.nombre),
              soft: h.tipo_habilidad === 'blanda'
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es'));
        },
        error: () => this.skillOptions = []
      })
    );
  }

  private filtrosActuales(): FiltrosBusquedaVacantes {
    return {
      titulo: this.search.trim().slice(0, 100),
      habilidades: [...this.selectedSkills],
      niveles_puesto: [...this.selectedLevels],
      area_estudio_id: this.selectedAreaId,
      solo_remoto: this.remoteOnly,
      salario_minimo: this.salaryMin || null,
      page: this.paginaActual
    };
  }

  private mensajeError(error: HttpErrorResponse | null): string {
    if (error?.status === 422) {
      const primero = Object.values(error.error?.errors ?? {})[0] as string[] | undefined;
      return primero?.[0] || error.error?.message || 'Revisa los filtros seleccionados.';
    }
    if (error?.status === 401 || error?.status === 403) {
      return 'Inicia sesión como candidato para buscar vacantes.';
    }
    return error?.error?.message || 'No fue posible cargar las vacantes. Inténtalo nuevamente.';
  }

  private normalizeText(str: string): string {
    return str
      ? str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
      : '';
  }

  // ── Disparadores de búsqueda ──────────────────────────────────────────────

  /** Cualquier cambio de filtro vuelve a la primera página y consulta al servidor */
  private aplicarFiltros(): void {
    this.paginaActual = 1;
    this.buscar$.next();
  }

  onSearchChange(): void {
    this.paginaActual = 1;
    this.buscarTexto$.next();
  }

  onAreaChange(): void {
    this.aplicarFiltros();
  }

  reintentar(): void {
    this.buscar$.next();
  }

  // ── Paginación ────────────────────────────────────────────────────────────

  get totalResultados(): number {
    return this.meta.total;
  }

  get totalPaginas(): number {
    return Math.max(1, this.meta.last_page);
  }

  get paginaSegura(): number {
    return this.meta.current_page;
  }

  /** Números de página a mostrar: siempre la primera, la última y las vecinas */
  get paginasVisibles(): (number | '…')[] {
    const total = this.totalPaginas;
    const actual = this.paginaSegura;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const paginas = new Set<number>([1, total, actual, actual - 1, actual + 1]);
    const ordenadas = [...paginas].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

    const resultado: (number | '…')[] = [];
    let previa = 0;
    for (const p of ordenadas) {
      if (previa && p - previa > 1) resultado.push('…');
      resultado.push(p);
      previa = p;
    }
    return resultado;
  }

  /** Rango que se está viendo, para el texto "1 - 10 de 18" */
  get desdeActual(): number {
    return this.jobsPagina.length === 0 ? 0 : (this.meta.current_page - 1) * this.meta.per_page + 1;
  }

  get hastaActual(): number {
    return this.desdeActual === 0 ? 0 : this.desdeActual + this.jobsPagina.length - 1;
  }

  irAPagina(pagina: number | '…'): void {
    if (pagina === '…' || pagina === this.paginaSegura) return;
    this.paginaActual = Math.min(Math.max(1, pagina), this.totalPaginas);
    this.buscar$.next();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  paginaAnterior(): void {
    if (this.paginaSegura > 1) this.irAPagina(this.paginaSegura - 1);
  }

  paginaSiguiente(): void {
    if (this.paginaSegura < this.totalPaginas) this.irAPagina(this.paginaSegura + 1);
  }

  // ── Filtro por habilidades ────────────────────────────────────────────────

  /** Habilidades de la pestaña activa que coinciden con la búsqueda */
  get skillsVisibles(): SkillOption[] {
    const q = this.normalizeText(this.skillSearch);
    const blandas = this.skillTab === 'blandas';
    return this.skillOptions.filter(o => o.soft === blandas && (!q || o.key.includes(q)));
  }

  get skillsElegidas(): SkillOption[] {
    return this.skillOptions.filter(o => this.selectedSkills.has(o.id));
  }

  get limiteHabilidadesAlcanzado(): boolean {
    return this.selectedSkills.size >= MAX_HABILIDADES;
  }

  isSkillSelected(id: number): boolean {
    return this.selectedSkills.has(id);
  }

  toggleSkill(id: number): void {
    if (this.selectedSkills.has(id)) {
      this.selectedSkills.delete(id);
      this.skillLimitMessage = '';
    } else {
      if (this.limiteHabilidadesAlcanzado) {
        this.skillLimitMessage =
          `Solo puedes filtrar por ${MAX_HABILIDADES} habilidades en total, entre técnicas y blandas. Quita una para elegir otra.`;
        return;
      }
      this.selectedSkills.add(id);
    }
    this.aplicarFiltros();
  }

  clearSkills(): void {
    const habiaSeleccion = this.selectedSkills.size > 0;
    this.selectedSkills.clear();
    this.skillSearch = '';
    this.skillLimitMessage = '';
    if (habiaSeleccion) this.aplicarFiltros();
  }

  // ── Resto de filtros ──────────────────────────────────────────────────────

  get hasFilters(): boolean {
    return (
      this.selectedAreaId !== null ||
      this.selectedLevels.size > 0 ||
      this.selectedSkills.size > 0 ||
      this.salaryMin > 0 ||
      this.remoteOnly ||
      this.search.trim().length > 0
    );
  }

  get activeFiltersCount(): number {
    return (
      (this.selectedAreaId !== null ? 1 : 0) +
      this.selectedLevels.size +
      this.selectedSkills.size +
      (this.salaryMin > 0 ? 1 : 0) +
      (this.remoteOnly ? 1 : 0) +
      (this.search.trim().length > 0 ? 1 : 0)
    );
  }

  toggleLevel(id: number): void {
    if (this.selectedLevels.has(id)) {
      this.selectedLevels.delete(id);
    } else {
      this.selectedLevels.add(id);
    }
    this.aplicarFiltros();
  }

  setSalary(min: SalarioMinimoFiltro | 0): void {
    this.salaryMin = min;
    this.aplicarFiltros();
  }

  toggleRemote(): void {
    this.remoteOnly = !this.remoteOnly;
    this.aplicarFiltros();
  }

  clearFilters(): void {
    this.search = '';
    this.selectedAreaId = null;
    this.selectedLevels.clear();
    this.selectedSkills.clear();
    this.skillSearch = '';
    this.skillLimitMessage = '';
    this.skillTab = 'tecnicas';
    this.salaryMin = 0;
    this.remoteOnly = false;
    this.aplicarFiltros();
  }

  onToggleSave(jobId: string): void {
    this.creoJobsService.toggleSave(jobId);
  }

  onViewDetail(jobId: string): void {
    this.router.navigate(['/creo/candidate-job-detail'], { queryParams: { id: jobId } });
  }

  isSaved(jobId: string): boolean {
    return this.savedJobIds.includes(jobId);
  }
}
