import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { MarkdownPipe } from '../../../core/pipes/markdown.pipe';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { HttpErrorResponse } from '@angular/common/http';
import { CREO_SKILLS } from '../../../data/creo-skills.data';
import { SkillWeight } from '../../../data/creo-data';
import { CatalogosService } from '../../../core/api/catalogos.service';
import { Habilidad } from '../../../core/api/models/catalogos.model';
import { VacantesService } from '../../../core/api/vacantes.service';
import { EmpresasService } from '../../../core/api/empresas.service';
import { CrearVacantePayload, NivelPuestoResumen, TipoEmpleo } from '../../../core/api/models/vacante-empresa.model';

/** Campo de la API → campo del formulario donde se muestra su error (422) */
const CAMPOS_API: Record<string, string> = {
  titulo: 'title',
  descripcion: 'description',
  requisitos: 'requirements',
  beneficios: 'benefits',
  nivel_puesto_id: 'level',
  area_estudio_id: 'area',
  tipo_empleo: 'modality',
  ubicacion: 'location',
  salario_min: 'salary',
  salario_max: 'salary',
  fecha_inicio_vigencia: 'startDate',
  fecha_fin_vigencia: 'closeDate',
  max_contrataciones: 'hireLimit',
  habilidades: 'skills',
};

export interface SelectedSkill {
  skill: string;
  weight: SkillWeight;
  type?: 'technical' | 'soft';
}

@Component({
  selector: 'app-company-create-job',
  standalone: true,
  imports: [CommonModule, FormsModule, CompanyShellComponent, MarkdownPipe],
  templateUrl: './company-create-job.component.html',
  styleUrl: './company-create-job.component.css'
})
export class CompanyCreateJobComponent implements OnInit, OnDestroy {
  companyName = '';

  private subs = new Subscription();
  private techBlurTimer: any;
  private softBlurTimer: any;

  title = '';
  description = '';

  // ── Barra de formato de la descripcion (genera Markdown) ──────────────────
  @ViewChild('descripcionRef') descripcionRef?: ElementRef<HTMLTextAreaElement>;

  /** Valor del desplegable de estilo; vuelve a vacio despues de aplicarse */
  estiloTexto = '';

  /** Pila de estados anteriores de la descripcion */
  private historialDescripcion: string[] = [];
  private valorAnterior = '';
  private ultimoRegistro = 0;
  /** ID del catálogo global de niveles (GET /niveles-experiencia) */
  nivelPuestoId: number | null = null;
  /** ID del área profesional (GET /areas-estudio): es el area_estudio_id que se envía */
  areaProfesionalId: number | null = null;
  modality = '';
  location = 'Lima, Perú';
  salMin = '';
  salMax = '';
  hireLimit = 2; // Límite máximo de contrataciones
  fechaInicio = ''; // Inicio de vigencia (YYYY-MM-DD, hoy en Lima o posterior)
  closeDate = ''; // Fin de vigencia (posterior al inicio)
  minDate = ''; // Hoy en hora de Lima
  skills: SelectedSkill[] = [];
  submitted = false;
  saving = false;
  errors: Record<string, string> = {};

  /** Modo edición: se activa cuando la URL trae el id de una vacante existente */
  modoEdicion = false;
  private vacanteEditadaId: string | null = null;

  /** Tope de requisitos y de beneficios por vacante */
  readonly maxItemsLista = 10;

  /** Id que devolvio el backend al registrar, para abrir SU kanban */
  vacanteCreadaId: number | null = null;

  /** Tope de habilidades por vacante, sumando tecnicas y blandas.
   *  El backend acepta hasta 10 (EP-02 4.2); aqui se usa un limite mas estricto. */
  readonly minHabilidades = 5;
  readonly maxHabilidades = 10;

  // Requisitos del puesto (editables directamente por fila)
  requirements: string[] = [];
  newReqInput = '';

  // Beneficios y compensaciones (editables directamente por fila)
  benefits: string[] = [];
  newBenInput = '';

  // Catálogos administrados dinámicamente por el Administrador (solo los del backend)
  studyAreas: { id: number; nombre: string; activo?: boolean }[] = [];
  /** Solo filtra las sugerencias de habilidades técnicas; no es el área que se envía */
  selectedTechAreaId = 0;
  catalogSkills: Habilidad[] = [];

  // Módulo 1: Habilidades Técnicas
  techSkillInput = '';
  showTechSuggestions = false;

  // Módulo 2: Habilidades Blandas
  softSkillInput = '';
  showSoftSuggestions = false;

  // Compatibilidad con buscador previo
  skillInput = '';
  showSuggestions = false;
  skillsTab: 'technical' | 'soft' = 'technical';

  cardNumber = '4532 8921 4455 1209';
  cardExpiry = '08/28';
  cardCvv = '842';

  readonly modalities: string[] = ['Remoto', 'Presencial', 'Híbrido'];
  readonly weightCycle: SkillWeight[] = ['required', 'preferred'];

  readonly weightConfig: Record<SkillWeight, { label: string; bg: string; text: string; border: string }> = {
    required: { label: 'Obligatorio', bg: '#FFF1F2', text: '#BE123C', border: '#FECDD3' },
    preferred: { label: 'Deseable', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
    bonus: { label: 'Deseable', bg: '#FFFBEB', text: '#B45309', border: '#FDE68A' },
  };

  private catalogosService = inject(CatalogosService);
  private route = inject(ActivatedRoute);
  private vacantesService = inject(VacantesService);
  private empresasService = inject(EmpresasService);
  nivelesPuestoList: NivelPuestoResumen[] = [];

  constructor(
    private router: Router
  ) { }

  ngOnInit(): void {
    // Vigencia por defecto: desde hoy (Lima) por 14 días. En edición se reemplaza con la guardada
    this.minDate = this.hoyLima();
    this.fechaInicio = this.minDate;
    this.closeDate = this.sumarDias(this.fechaInicio, 14);

    const idVacante = this.route.snapshot.queryParamMap.get('id');
    if (idVacante) {
      this.cargarVacante(idVacante);
    }

    this.empresasService.miEmpresa().subscribe({
      next: (empresa) => this.companyName = empresa.razon_social
    });

    // Niveles globales y activos: sus IDs son los que acepta nivel_puesto_id
    this.subs.add(
      this.vacantesService.nivelesExperiencia().subscribe({
        next: (niveles) => this.nivelesPuestoList = niveles || [],
        error: () => this.errors['general'] = 'No fue posible cargar los niveles del puesto.'
      })
    );

    // Cargar áreas de estudio controladas por el admin
    this.subs.add(
      this.catalogosService.areasEstudio().subscribe({
        next: (areas) => {
          this.studyAreas = (areas || []).filter(a => a.activo !== false);
          if (!this.selectedTechAreaId && this.studyAreas.length > 0) {
            this.selectedTechAreaId = this.areaProfesionalId ?? this.studyAreas[0].id;
          }
        },
        error: () => this.errors['general'] = 'No fue posible cargar las áreas profesionales.'
      })
    );

    // Cargar habilidades técnicas y blandas controladas por el admin
    this.subs.add(
      this.catalogosService.habilidades().subscribe({
        next: (habs) => this.catalogSkills = (habs || []).filter(h => h.activo !== false),
        error: () => this.errors['general'] = 'No fue posible cargar el catálogo de habilidades.'
      })
    );
  }

  /** Fecha de hoy en Lima como YYYY-MM-DD (toISOString daría la fecha UTC: después de las 19:00 ya es "mañana") */
  private hoyLima(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
  }

  /** Suma días a una fecha YYYY-MM-DD sin pasar por la zona horaria del navegador */
  sumarDias(fecha: string, dias: number): string {
    const [a, m, d] = fecha.split('-').map(Number);
    const r = new Date(Date.UTC(a, m - 1, d + dias));
    return r.toISOString().slice(0, 10);
  }

  /** Nombre del nivel elegido (para la vista previa) */
  get level(): string {
    return this.nivelesPuestoList.find(n => n.id === this.nivelPuestoId)?.nombre ?? '';
  }

  /** Nombre del área profesional elegida (para la vista previa) */
  get area(): string {
    return this.studyAreas.find(a => a.id === this.areaProfesionalId)?.nombre ?? '';
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.techBlurTimer) clearTimeout(this.techBlurTimer);
    if (this.softBlurTimer) clearTimeout(this.softBlurTimer);
  }

  private normalizeText(str: string): string {
    return str
      ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      : '';
  }

  get isRemote(): boolean {
    return this.modality === 'Remoto';
  }

  get previewLocation(): string {
    if (this.location && this.location.trim()) {
      return this.location.trim();
    }
    return this.isRemote ? 'Remoto' : 'Lima, Perú';
  }

  onModalityChange(): void {
    delete this.errors['modality'];
    if (this.modality === 'Remoto') {
      if (!this.location || this.location === 'San Isidro, Lima' || this.location === 'Miraflores, Lima') {
        this.location = 'Remoto';
      }
    } else if (this.modality === 'Presencial' || this.modality === 'Híbrido') {
      if (!this.location || this.location === 'Remoto') {
        this.location = 'San Isidro, Lima';
      }
    }
  }

  setLocation(loc: string): void {
    this.location = loc;
    delete this.errors['location'];
  }

  get isValid(): boolean {
    const min = Number(this.salMin);
    const max = Number(this.salMax);
    // Si se informa un salario, el otro también es obligatorio
    const isSalaryValid = !(this.salMin && this.salMax && min > max) && !this.salMin === !this.salMax;
    const isDateValid = !this.errorFechas();
    // La ubicación solo es obligatoria en presencial e híbrido
    const isLocationValid = this.isRemote || !!(this.location && this.location.trim().length > 0);
    const areSkillsValid = this.skills.length >= this.minHabilidades && this.skills.length <= this.maxHabilidades;
    const isTitleValid = !!(this.title.trim() && this.title.trim().length <= 100);
    return !!(
      isTitleValid &&
      this.description.trim() &&
      this.description.trim().length >= 50 &&
      this.nivelPuestoId &&
      this.areaProfesionalId &&
      this.modality &&
      isLocationValid &&
      this.hireLimit > 0 &&
      isDateValid &&
      isSalaryValid &&
      areSkillsValid &&
      !this.saving
    );
  }

  /** Reglas de vigencia del contrato: inicio hoy (Lima) o después, fin posterior al inicio */
  private errorFechas(): { campo: 'startDate' | 'closeDate'; mensaje: string } | null {
    if (!this.fechaInicio) return { campo: 'startDate', mensaje: 'Selecciona la fecha de inicio' };
    if (this.fechaInicio < this.minDate) {
      return { campo: 'startDate', mensaje: `La fecha de inicio no puede ser anterior a hoy (${this.minDate})` };
    }
    if (!this.closeDate) return { campo: 'closeDate', mensaje: 'Selecciona la fecha de fin de vigencia' };
    if (this.closeDate <= this.fechaInicio) {
      return { campo: 'closeDate', mensaje: 'La fecha de fin debe ser posterior a la fecha de inicio' };
    }
    return null;
  }

  onHireLimitChange(): void {
    if (!this.hireLimit || this.hireLimit < 1) {
      this.errors['hireLimit'] = 'Ingresa al menos 1 cupo de contratación';
    } else {
      delete this.errors['hireLimit'];
    }
  }

  onDateChange(): void {
    delete this.errors['startDate'];
    delete this.errors['closeDate'];
    const error = this.errorFechas();
    if (error) this.errors[error.campo] = error.mensaje;
  }

  /** Teclas que no escriben un carácter y deben seguir funcionando */
  private readonly teclasPermitidas = [
    'Backspace', 'Delete', 'Tab', 'Enter', 'Escape',
    'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
  ];

  /**
   * En los salarios solo se aceptan dígitos: nada de letras, signos (-, +),
   * notación exponencial (e) ni separadores decimales.
   */
  soloNumerosSalario(event: KeyboardEvent): void {
    // No interfiere con copiar, pegar o seleccionar todo
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (this.teclasPermitidas.includes(event.key)) return;

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  /** Quita cualquier valor negativo que llegue por teclado, pegado o con las flechas */
  private soloPositivo(valor: string): string {
    if (!valor) return '';
    const n = Number(valor);
    if (!isFinite(n) || n < 0) return '';
    return valor;
  }

  onSalaryChange(): void {
    this.salMin = this.soloPositivo(this.salMin);
    this.salMax = this.soloPositivo(this.salMax);

    const min = Number(this.salMin);
    const max = Number(this.salMax);
    if (this.salMin && this.salMax && min > max) {
      this.errors['salary'] = `El salario máximo (S/ ${max.toLocaleString()}) no puede ser menor que el salario mínimo (S/ ${min.toLocaleString()})`;
    } else {
      delete this.errors['salary'];
    }
  }

  addRequirementFromInput(): void {
    const text = this.newReqInput.trim();
    if (!text) return;
    if (this.requirements.length >= this.maxItemsLista) {
      this.errors['requirements'] = `Se permite un máximo de ${this.maxItemsLista} requisitos por vacante.`;
      return;
    }
    if (this.requirements.some(r => this.normalizeText(r) === this.normalizeText(text))) {
      this.errors['requirements'] = 'Este requisito ya se encuentra en la lista.';
      return;
    }
    this.requirements.push(text);
    this.newReqInput = '';
    delete this.errors['requirements'];
  }

  addBenefitFromInput(): void {
    const text = this.newBenInput.trim();
    if (!text) return;
    if (this.benefits.length >= this.maxItemsLista) {
      this.errors['benefits'] = `Se permite un máximo de ${this.maxItemsLista} beneficios por vacante.`;
      return;
    }
    if (this.benefits.some(b => this.normalizeText(b) === this.normalizeText(text))) {
      this.errors['benefits'] = 'Este beneficio ya se encuentra en la lista.';
      return;
    }
    this.benefits.push(text);
    this.newBenInput = '';
    delete this.errors['benefits'];
  }

  get technicalSkills(): SelectedSkill[] {
    return this.skills.filter(s => s.type === 'technical');
  }

  get softSkills(): SelectedSkill[] {
    return this.skills.filter(s => s.type === 'soft');
  }

  get currentAreaNombre(): string {
    const found = this.studyAreas.find(a => a.id === Number(this.selectedTechAreaId));
    return found ? found.nombre : '';
  }

  onTechAreaChange(): void {
    this.techSkillInput = '';
    this.showTechSuggestions = false;
  }

  /**
   * Solo habilidades del catálogo del backend: cada una tiene el ID que exige la API.
   * (Las listas locales de ejemplo no tienen ID y se enviaban como habilidad_id = 1.)
   */
  get techSkillsForCurrentArea(): string[] {
    const areaId = Number(this.selectedTechAreaId);
    return this.catalogSkills
      .filter(h => h.tipo_habilidad === 'tecnica' && h.area_estudio?.id === areaId)
      .map(h => h.nombre);
  }

  get softSkillsList(): string[] {
    return this.catalogSkills
      .filter(h => h.tipo_habilidad === 'blanda')
      .map(h => h.nombre);
  }

  get techSuggestions(): string[] {
    const pool = this.techSkillsForCurrentArea;
    const q = this.normalizeText(this.techSkillInput);
    const selected = new Set(this.skills.map(s => this.normalizeText(s.skill)));
    if (!q) {
      return pool.filter(s => !selected.has(this.normalizeText(s))).slice(0, 25);
    }
    return pool
      .filter(s => this.normalizeText(s).includes(q) && !selected.has(this.normalizeText(s)))
      .slice(0, 25);
  }

  get softSuggestions(): string[] {
    const pool = this.softSkillsList;
    const q = this.normalizeText(this.softSkillInput);
    const selected = new Set(this.skills.map(s => this.normalizeText(s.skill)));
    if (!q) {
      return pool.filter(s => !selected.has(this.normalizeText(s))).slice(0, 25);
    }
    return pool
      .filter(s => this.normalizeText(s).includes(q) && !selected.has(this.normalizeText(s)))
      .slice(0, 25);
  }

  selectFirstTechSuggestion(): void {
    if (this.techSuggestions.length > 0) {
      this.addTechSkill(this.techSuggestions[0]);
    }
  }

  selectFirstSoftSuggestion(): void {
    if (this.softSuggestions.length > 0) {
      this.addSoftSkill(this.softSuggestions[0]);
    }
  }

  addTechSkill(skill: string): void {
    if (!skill) return;
    const trimmed = skill.trim();
    const trimmedNorm = this.normalizeText(trimmed);
    // Validación estricta: Solo habilidades definidas por el Administrador
    const matched = this.techSkillsForCurrentArea.find(s => this.normalizeText(s) === trimmedNorm);
    if (!matched) return; // Nadie puede crear habilidades que no provengan del catálogo del admin

    if (this.skills.some(s => this.normalizeText(s.skill) === trimmedNorm)) return;
    if (this.skills.length >= this.maxHabilidades) {
      this.errors['skills'] =
        `Se permite un máximo de ${this.maxHabilidades} habilidades por vacante en total.`;
      return;
    }
    delete this.errors['skills'];
    this.skills.push({
      skill: matched,
      weight: 'required',
      type: 'technical'
    });
    this.techSkillInput = '';
    this.showTechSuggestions = false;
  }

  addSoftSkill(skill: string): void {
    if (!skill) return;
    const trimmed = skill.trim();
    const trimmedNorm = this.normalizeText(trimmed);
    // Validación estricta: Solo habilidades definidas por el Administrador
    const matched = this.softSkillsList.find(s => this.normalizeText(s) === trimmedNorm);
    if (!matched) return; // Nadie puede crear habilidades que no provengan del catálogo del admin

    if (this.skills.some(s => this.normalizeText(s.skill) === trimmedNorm)) return;
    if (this.skills.length >= this.maxHabilidades) {
      this.errors['skills'] =
        `Se permite un máximo de ${this.maxHabilidades} habilidades por vacante en total.`;
      return;
    }
    delete this.errors['skills'];
    this.skills.push({
      skill: matched,
      weight: 'required',
      type: 'soft'
    });
    this.softSkillInput = '';
    this.showSoftSuggestions = false;
  }

  cycleSkillWeight(s: SelectedSkill): void {
    const nextIdx = (this.weightCycle.indexOf(s.weight) + 1) % this.weightCycle.length;
    s.weight = this.weightCycle[nextIdx];
  }

  removeSkillObject(s: SelectedSkill): void {
    const idx = this.skills.indexOf(s);
    if (idx !== -1) {
      this.skills.splice(idx, 1);
      if (this.skills.length < this.maxHabilidades) {
        delete this.errors['skills'];
      }
    }
  }

  onTechSkillInputBlur(): void {
    if (this.techBlurTimer) clearTimeout(this.techBlurTimer);
    this.techBlurTimer = setTimeout(() => {
      this.showTechSuggestions = false;
    }, 250);
  }

  onSoftSkillInputBlur(): void {
    if (this.softBlurTimer) clearTimeout(this.softBlurTimer);
    this.softBlurTimer = setTimeout(() => {
      this.showSoftSuggestions = false;
    }, 250);
  }

  get suggestions(): string[] {
    const source = this.skillsTab === 'technical' ? CREO_SKILLS : this.softSkillsList;
    if (!this.skillInput.trim()) return source.slice(0, 8);
    const q = this.skillInput.toLowerCase().trim();
    return source
      .filter(s => s.toLowerCase().includes(q) && !this.skills.some(sk => sk.skill.toLowerCase() === s.toLowerCase()))
      .slice(0, 8);
  }

  get previewSalary(): string {
    const min = Number(this.salMin);
    const max = Number(this.salMax);
    if (this.salMin && this.salMax) {
      if (min > max) {
        return 'Rango inválido (mín > máx)';
      }
      return `S/ ${min.toLocaleString()} – ${max.toLocaleString()}`;
    }
    if (this.salMin) {
      return `S/ ${min.toLocaleString()}+`;
    }
    return 'Por definir';
  }

  addSkill(skill: string): void {
    if (!skill || this.skills.some(s => s.skill.toLowerCase() === skill.toLowerCase())) return;
    if (this.skills.length >= this.maxHabilidades) {
      this.errors['skills'] =
        `Se permite un máximo de ${this.maxHabilidades} habilidades por vacante.`;
      return;
    }
    delete this.errors['skills'];
    this.skills.push({
      skill,
      weight: 'required',
      type: this.skillsTab
    });
    this.skillInput = '';
    this.showSuggestions = false;
  }

  cycleWeight(idx: number): void {
    const current = this.skills[idx];
    if (current) this.cycleSkillWeight(current);
  }

  removeSkill(idx: number): void {
    const current = this.skills[idx];
    if (current) this.removeSkillObject(current);
  }

  get activeRequirements(): string[] {
    return this.requirements.map(r => r.trim()).filter(r => r.length > 0);
  }

  get activeBenefits(): string[] {
    return this.benefits.map(b => b.trim()).filter(b => b.length > 0);
  }

  trackByIndex(index: number): number {
    return index;
  }

  addRequirement(): void {
    if (this.requirements.length >= this.maxItemsLista) {
      this.errors['requirements'] = `Se permite un máximo de ${this.maxItemsLista} requisitos por vacante.`;
      return;
    }
    this.requirements.push('');
    delete this.errors['requirements'];
  }

  removeRequirement(idx: number): void {
    this.requirements.splice(idx, 1);
    if (this.requirements.length < this.maxItemsLista) {
      delete this.errors['requirements'];
    }
  }

  addBenefit(): void {
    if (this.benefits.length >= this.maxItemsLista) {
      this.errors['benefits'] = `Se permite un máximo de ${this.maxItemsLista} beneficios por vacante.`;
      return;
    }
    this.benefits.push('');
    delete this.errors['benefits'];
  }

  removeBenefit(idx: number): void {
    this.benefits.splice(idx, 1);
    if (this.benefits.length < this.maxItemsLista) {
      delete this.errors['benefits'];
    }
  }

  onSkillInputBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 250);
  }

  /** Validación del formulario, compartida por publicar y por guardar cambios */
  get puedeDeshacerDescripcion(): boolean {
    return this.historialDescripcion.length > 0;
  }

  /** Guarda el estado actual antes de modificarlo */
  private recordarDescripcion(): void {
    this.historialDescripcion.push(this.description);
    if (this.historialDescripcion.length > 50) this.historialDescripcion.shift();
    this.valorAnterior = this.description;
    this.ultimoRegistro = Date.now();
  }

  /**
   * Al escribir a mano guarda un punto de retorno cada 700 ms, para que
   * Deshacer retroceda por rafagas de escritura y no letra por letra.
   */
  onDescripcionCambio(): void {
    this.errors['description'] = '';

    const ahora = Date.now();
    if (ahora - this.ultimoRegistro > 700) {
      this.historialDescripcion.push(this.valorAnterior);
      if (this.historialDescripcion.length > 50) this.historialDescripcion.shift();
      this.ultimoRegistro = ahora;
    }

    this.valorAnterior = this.description;
  }

  deshacerDescripcion(): void {
    const previo = this.historialDescripcion.pop();
    if (previo === undefined) return;
    this.escribirDescripcion(previo, previo.length, previo.length, false);
  }

  /** Escribe el texto y repone el cursor donde corresponde */
  private escribirDescripcion(texto: string, ini: number, fin: number, registrar = true): void {
    if (registrar) this.recordarDescripcion();

    this.description = texto;
    this.valorAnterior = texto;
    this.errors['description'] = '';

    const el = this.descripcionRef?.nativeElement;
    if (!el) return;

    // Angular escribe el valor en el textarea despues de esta vuelta
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(ini, fin);
    });
  }

  private seleccionDescripcion(): { ini: number; fin: number } {
    const el = this.descripcionRef?.nativeElement;
    if (!el) {
      const n = this.description.length;
      return { ini: n, fin: n };
    }
    return { ini: el.selectionStart ?? 0, fin: el.selectionEnd ?? 0 };
  }

  /** Negrita (**) y cursiva (*). Si ya esta aplicada, la quita */
  alternarMarca(marca: '**' | '*'): void {
    const { ini, fin } = this.seleccionDescripcion();
    const texto = this.description;
    const sel = texto.slice(ini, fin);
    const n = marca.length;

    // La seleccion incluye las marcas: **hola**
    if (sel.length > n * 2 && sel.startsWith(marca) && sel.endsWith(marca)) {
      const limpio = sel.slice(n, -n);
      this.escribirDescripcion(
        texto.slice(0, ini) + limpio + texto.slice(fin), ini, ini + limpio.length
      );
      return;
    }

    // Las marcas rodean la seleccion: **[hola]**
    const antes = texto.slice(Math.max(0, ini - n), ini);
    const despues = texto.slice(fin, fin + n);
    const esCursivaDentroDeNegrita =
      marca === '*' && texto.slice(Math.max(0, ini - 2), ini) === '**';

    if (antes === marca && despues === marca && !esCursivaDentroDeNegrita) {
      this.escribirDescripcion(
        texto.slice(0, ini - n) + sel + texto.slice(fin + n), ini - n, ini - n + sel.length
      );
      return;
    }

    if (sel) {
      this.escribirDescripcion(
        texto.slice(0, ini) + marca + sel + marca + texto.slice(fin),
        ini + n, ini + n + sel.length
      );
    } else {
      const cursor = ini + n;
      this.escribirDescripcion(
        texto.slice(0, ini) + marca + marca + texto.slice(fin), cursor, cursor
      );
    }
  }

  /** Limites de las lineas que toca la seleccion */
  private lineasSeleccionadas(): { desde: number; hasta: number } {
    const { ini, fin } = this.seleccionDescripcion();
    const texto = this.description;
    const desde = texto.lastIndexOf('\n', ini - 1) + 1;
    let hasta = texto.indexOf('\n', fin);
    if (hasta === -1) hasta = texto.length;
    return { desde, hasta };
  }

  private reemplazarLineas(transformar: (lineas: string[]) => string[]): void {
    const { desde, hasta } = this.lineasSeleccionadas();
    const texto = this.description;
    const nuevo = transformar(texto.slice(desde, hasta).split('\n')).join('\n');

    this.escribirDescripcion(
      texto.slice(0, desde) + nuevo + texto.slice(hasta), desde, desde + nuevo.length
    );
  }

  /** Titulo (##), subtitulo (###) o texto normal */
  aplicarEstiloTexto(): void {
    const elegido = this.estiloTexto;
    this.estiloTexto = '';
    if (!elegido) return;

    const prefijo = elegido === 'normal' ? '' : elegido;

    this.reemplazarLineas(lineas =>
      lineas.map(l => {
        const limpia = l.replace(/^\s{0,3}#{1,6}\s+/, '');
        return limpia.trim() ? prefijo + limpia : limpia;
      })
    );
  }

  /** Lista con vinetas o numerada. Si ya lo es, la quita */
  alternarLista(tipo: 'vineta' | 'numerada'): void {
    const patron = tipo === 'vineta' ? /^\s*-\s+/ : /^\s*\d+\.\s+/;

    this.reemplazarLineas(lineas => {
      const conTexto = lineas.filter(l => l.trim());
      const yaEsLista = conTexto.length > 0 && conTexto.every(l => patron.test(l));
      let numero = 0;

      return lineas.map(l => {
        const limpia = l.replace(/^\s*(?:-|\d+\.)\s+/, '');
        if (yaEsLista || !limpia.trim()) return limpia;
        numero++;
        return tipo === 'vineta' ? `- ${limpia}` : `${numero}. ${limpia}`;
      });
    });
  }

  /** Quita el Markdown de la seleccion, o de todo si no hay seleccion */
  limpiarFormatoDescripcion(): void {
    const { ini, fin } = this.seleccionDescripcion();
    const texto = this.description;
    const haySeleccion = fin > ini;
    const objetivo = haySeleccion ? texto.slice(ini, fin) : texto;

    const limpio = objetivo
      .split('\n')
      .map(l => l
        .replace(/^\s{0,3}#{1,6}\s+/, '')
        .replace(/^\s*(?:[-*+]|\d+\.)\s+/, ''))
      .join('\n')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/`(.+?)`/g, '$1');

    if (haySeleccion) {
      this.escribirDescripcion(
        texto.slice(0, ini) + limpio + texto.slice(fin), ini, ini + limpio.length
      );
    } else {
      this.escribirDescripcion(limpio, limpio.length, limpio.length);
    }
  }

  private erroresDelFormulario(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!this.title.trim()) {
      errs['title'] = 'El título es obligatorio';
    } else if (this.title.length > 100) {
      errs['title'] = 'El título no puede superar 100 caracteres';
    }

    if (!this.description.trim()) {
      errs['description'] = 'La descripción es obligatoria';
    } else if (this.description.trim().length < 50) {
      errs['description'] = `La descripción debe tener al menos 50 caracteres (actual: ${this.description.trim().length})`;
    }

    if (!this.nivelPuestoId) errs['level'] = 'Selecciona el nivel del puesto';
    if (!this.areaProfesionalId) errs['area'] = 'Selecciona el área profesional';
    if (!this.modality) errs['modality'] = 'Selecciona la modalidad de trabajo';
    if (!this.isRemote && (!this.location || !this.location.trim())) {
      errs['location'] = 'La ubicación es obligatoria para presencial e híbrido';
    }
    if (!this.hireLimit || this.hireLimit < 1) errs['hireLimit'] = 'Ingresa un límite válido de vacantes a contratar';

    const errorFechas = this.errorFechas();
    if (errorFechas) errs[errorFechas.campo] = errorFechas.mensaje;

    if (!this.salMin !== !this.salMax) {
      errs['salary'] = 'Si informas un salario, completa el mínimo y el máximo (o deja ambos vacíos para "A convenir")';
    } else if (this.salMin && (Number(this.salMin) <= 0 || Number(this.salMax) <= 0)) {
      errs['salary'] = 'Los salarios deben ser mayores que cero';
    } else if (this.salMin && this.salMax && Number(this.salMin) > Number(this.salMax)) {
      errs['salary'] = `El salario máximo (S/ ${Number(this.salMax).toLocaleString()}) no puede ser menor que el salario mínimo (S/ ${Number(this.salMin).toLocaleString()})`;
    }

    if (this.skills.length < this.minHabilidades) {
      errs['skills'] =
        `Debes agregar entre ${this.minHabilidades} y ${this.maxHabilidades} habilidades, sumando técnicas y blandas (llevas ${this.skills.length}).`;
    }

    return errs;
  }

  /**
   * Publicar vacante: la envía a la cola de revisión del administrador.
   * El cobro ya no ocurre aquí; se realiza desde "Mis Ofertas" una vez aprobada.
   */
  enviarARevision(): void {
    this.errors = this.erroresDelFormulario();
    if (Object.keys(this.errors).length > 0) return;

    const payload = this.construirPayload();
    if (!payload) return;

    this.saving = true;
    this.vacantesService.crearVacante(payload).subscribe({
      next: (vacanteCreada) => {
        this.saving = false;
        this.submitted = true;
        // Sin este id, "Ver Kanban" abriria la vacante que el panel tenga por defecto
        this.vacanteCreadaId = vacanteCreada?.id ?? null;
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.mostrarErroresApi(err, 'No fue posible registrar la vacante.');
      }
    });
  }

  /**
   * Arma el body de POST/PUT /empresas/me/vacantes con los IDs reales de los catálogos.
   * Devuelve null (con el error en el formulario) si alguna habilidad no tiene ID.
   */
  private construirPayload(): CrearVacantePayload | null {
    const tipoEmpleo: TipoEmpleo = this.modality === 'Remoto'
      ? 'remoto'
      : (this.modality === 'Híbrido' ? 'hibrido' : 'presencial');

    const habilidades = [];
    for (const s of this.skills) {
      const match = this.catalogSkills.find(
        cs => this.normalizeText(cs.nombre) === this.normalizeText(s.skill)
      );
      if (!match) {
        this.errors['skills'] = `La habilidad "${s.skill}" ya no está disponible en el catálogo. Quítala para continuar.`;
        return null;
      }
      habilidades.push({
        habilidad_id: match.id,
        requisito: (s.weight === 'required' ? 'must_have' : 'nice_to_have') as 'must_have' | 'nice_to_have'
      });
    }

    // En remoto la ubicación es opcional: "Remoto" o vacío se envía como null
    const ubicacion = this.location.trim();
    const sinUbicacion = !ubicacion || (tipoEmpleo === 'remoto' && this.normalizeText(ubicacion) === 'remoto');

    // Sin salario se envían los dos en null (la vacante se muestra "A convenir")
    const conSalario = !!(this.salMin && this.salMax);

    return {
      titulo: this.title.trim(),
      descripcion: this.description.trim(),
      nivel_puesto_id: this.nivelPuestoId!,
      area_estudio_id: this.areaProfesionalId!,
      tipo_empleo: tipoEmpleo,
      ubicacion: sinUbicacion ? null : ubicacion,
      salario_min: conSalario ? Number(this.salMin) : null,
      salario_max: conSalario ? Number(this.salMax) : null,
      fecha_inicio_vigencia: this.fechaInicio,
      fecha_fin_vigencia: this.closeDate,
      max_contrataciones: Number(this.hireLimit),
      habilidades,
      requisitos: this.activeRequirements,
      beneficios: this.activeBenefits
    };
  }

  /** Lleva los errores del backend a los campos del formulario (422) o al mensaje general */
  private mostrarErroresApi(err: HttpErrorResponse, porDefecto: string): void {
    const errs: Record<string, string[]> | undefined = err.error?.errors;
    if (errs) {
      Object.keys(errs).forEach(clave => {
        const raiz = clave.split('.')[0];
        const campo = CAMPOS_API[raiz] ?? 'general';
        if (!this.errors[campo]) this.errors[campo] = errs[clave][0];
      });
      return;
    }
    // 409 (ya pagada, eliminada, no editable), 403 o error de red
    this.errors['general'] = err.status === 0
      ? 'No hay conexión con el servidor. Intenta nuevamente.'
      : err.error?.message || porDefecto;
  }

  /** Trae la vacante y deja el formulario con su contenido */
  private cargarVacante(id: string): void {
    const numericId = Number(id);
    if (!(numericId > 0)) {
      this.errors['general'] = 'La vacante que intentas editar no existe.';
      return;
    }

    this.subs.add(
      this.vacantesService.obtenerVacante(numericId).subscribe({
        next: (vacante) => {
          this.modoEdicion = true;
          this.vacanteEditadaId = String(vacante.id);

          this.title = vacante.titulo;
          this.description = vacante.descripcion || '';
          this.requirements = [...(vacante.requisitos ?? [])];
          this.benefits = [...(vacante.beneficios ?? [])];
          this.nivelPuestoId = vacante.nivel_puesto?.id ?? null;
          this.areaProfesionalId = vacante.area_profesional?.id ?? null;
          if (vacante.area_profesional?.id) {
            this.selectedTechAreaId = vacante.area_profesional.id;
          }
          this.modality = vacante.tipo_empleo === 'remoto' ? 'Remoto' : (vacante.tipo_empleo === 'hibrido' ? 'Híbrido' : 'Presencial');
          this.location = vacante.ubicacion || '';
          this.salMin = vacante.salario_min != null ? String(vacante.salario_min) : '';
          this.salMax = vacante.salario_max != null ? String(vacante.salario_max) : '';
          this.hireLimit = vacante.max_contrataciones || 1;
          this.fechaInicio = vacante.fecha_inicio_vigencia || this.minDate;
          this.closeDate = vacante.fecha_fin_vigencia || '';
          // Al editar se aplican las mismas reglas que al registrar (inicio no anterior a hoy)
          this.onDateChange();

          this.skills = (vacante.habilidades || []).map(h => ({
            skill: h.nombre,
            weight: h.requisito === 'must_have' ? 'required' : 'preferred',
            type: h.tipo_habilidad === 'blanda' ? 'soft' : 'technical'
          }));
        },
        error: (err: HttpErrorResponse) => {
          this.errors['general'] = err.status === 404 || err.status === 403
            ? 'La vacante que intentas editar no existe o no pertenece a tu empresa.'
            : err.error?.message || 'No fue posible cargar la vacante.';
        }
      })
    );
  }

  /** PUT /empresas/me/vacantes/{id}: reemplaza el contenido y la vacante vuelve a revisión */
  guardarCambios(): void {
    this.errors = this.erroresDelFormulario();
    if (Object.keys(this.errors).length > 0 || !this.vacanteEditadaId) return;

    const payload = this.construirPayload();
    if (!payload) return;

    this.saving = true;
    this.vacantesService.editarVacante(Number(this.vacanteEditadaId), payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/creo/company-jobs']);
      },
      error: (err: HttpErrorResponse) => {
        this.saving = false;
        this.mostrarErroresApi(err, 'No fue posible actualizar la vacante.');
      }
    });
  }

  navigate(screen: string): void {
    this.router.navigate(['/creo', screen]);
  }

  /**
   * Abre el kanban de la vacante que se acaba de registrar.
   * Si el id no llego, va a Mis Ofertas en vez de abrir el kanban de otra.
   */
  verKanbanDeLaVacante(): void {
    if (this.vacanteCreadaId === null) {
      this.router.navigate(['/creo', 'company-jobs']);
      return;
    }

    this.router.navigate(['/creo', 'company-kanban'], {
      queryParams: { id: this.vacanteCreadaId, readOnly: 'false' }
    });
  }
}
