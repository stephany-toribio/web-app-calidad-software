import { Component, Input, Output, EventEmitter, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogosService } from '../../../../core/api/catalogos.service';
import { CandidatosService } from '../../../../core/api/candidatos.service';
import { ItemCatalogo, NivelPuestoSeleccionable, Organizacion, PuestoSeleccionable } from '../../../../core/api/models/catalogos.model';
import { aId, esFechaAnteriorANacimiento } from '../../../../core/api/mappers/registro-candidato.mapper';

const MAX_DESCRIPCION_CARACTERES = 300;

export interface ExperienceEntry {
  puesto: string;
  empresa: string;
  nivel: string;
  pais: string;
  fechaInicioMes: string;
  fechaInicioAno: string;
  fechaFinMes: string;
  fechaFinAno: string;
  alPresente: boolean;
  descripcion: string;
  // id del catálogo si se eligió de la lista; null si se escribió uno nuevo (se envía como valor personalizado)
  puestoId?: number | null;
  organizacionId?: number | null;
  nivelId?: number | null;
}

@Component({
  selector: 'app-experience-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './experience-list.component.html'
})
export class ExperienceListComponent implements OnInit {
  private catalogos = inject(CatalogosService);
  private candidatos = inject(CandidatosService);

  /**
   * De dónde salen las sugerencias de puesto y organización:
   * 'catalogo' (registro, aún sin cuenta) = GET /puestos y GET /organizaciones;
   * 'candidato' (perfil) = GET /candidatos/me/puestos y /me/organizaciones, que suman sus valores personalizados.
   */
  @Input() fuenteCatalogos: 'catalogo' | 'candidato' = 'catalogo';
  @Input() experiences: ExperienceEntry[] = [];
  @Input() maxExperiences: number = 5;
  @Input() birthYear?: string | number;
  @Input() birthMonth?: string;
  @Output() experiencesChange = new EventEmitter<ExperienceEntry[]>();

  showModal = false;
  editingIndex = -1;
  errors: Record<string, boolean> = {};

  paises: string[] = [];                         // nombres de GET /paises (los usa el HTML)
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anos = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());

  private catalogoPaises: ItemCatalogo[] = [];
  private catalogoPuestos: PuestoSeleccionable[] = [];
  private catalogoOrganizaciones: Organizacion[] = [];
  private catalogoNiveles: NivelPuestoSeleccionable[] = [];   // ya viene en orden jerárquico

  currentExp: ExperienceEntry = this.getEmptyExp();

  showEmpresas = false;
  showPuestos = false;
  showNiveles = false;

  ngOnInit() {
    this.recargarCatalogos();
  }

  /** Pide las listas actuales. El registro la vuelve a llamar si la API rechaza algo que el admin desactivó */
  recargarCatalogos() {
    this.catalogos.paises().subscribe(lista => {
      this.catalogoPaises = lista;
      this.paises = lista.map(p => p.nombre);
    });
    const delCandidato = this.fuenteCatalogos === 'candidato';
    const puestos$ = delCandidato ? this.candidatos.misPuestos() : this.catalogos.puestos();
    const organizaciones$ = delCandidato ? this.candidatos.misOrganizaciones() : this.catalogos.organizaciones();
    const niveles$ = delCandidato ? this.candidatos.misNivelesPuesto() : this.catalogos.nivelesPuesto();
    puestos$.subscribe(lista => this.catalogoPuestos = lista);
    organizaciones$.subscribe(lista => this.catalogoOrganizaciones = lista);
    niveles$.subscribe(lista => this.catalogoNiveles = lista);
  }

  /** Respeta el orden jerárquico del backend (no se ordena alfabéticamente) */
  get filteredNiveles(): string[] {
    const val = (this.currentExp.nivel || '').toLowerCase();
    return this.catalogoNiveles.map(n => n.nombre).filter(n => n.toLowerCase().includes(val));
  }

  /** Nivel escrito antes por el mismo candidato (se marca como "Tuyo") */
  esNivelPropio(nombre: string): boolean {
    return this.catalogoNiveles.some(n => n.nombre === nombre && n.personalizado);
  }

  onNivelChange(val: string) {
    this.currentExp.nivel = val;
    this.currentExp.nivelId = null;              // escrito a mano: se enviará como valor personalizado
    this.showNiveles = true;
  }

  selectNivel(nivel: string) {
    this.currentExp.nivel = nivel;
    this.currentExp.nivelId = aId(this.catalogoNiveles, nivel);
    this.showNiveles = false;
  }

  onNivelBlur() {
    setTimeout(() => {
      this.showNiveles = false;
    }, 200);
  }

  private get paisId(): number | null {
    return aId(this.catalogoPaises, this.currentExp.pais);
  }

  /** Solo las organizaciones del país elegido (si aún no hay país, todas) */
  private get organizacionesDelPais(): Organizacion[] {
    const paisId = this.paisId;
    return this.catalogoOrganizaciones.filter(o => !paisId || o.pais_id === paisId);
  }

  get filteredEmpresas(): string[] {
    const val = (this.currentExp.empresa || '').toLowerCase();
    return this.organizacionesDelPais.map(o => o.nombre).filter(e => e.toLowerCase().includes(val));
  }

  get filteredPuestos(): string[] {
    const val = (this.currentExp.puesto || '').toLowerCase();
    return this.catalogoPuestos.map(p => p.nombre).filter(p => p.toLowerCase().includes(val));
  }

  onEmpresaChange(val: string) {
    this.currentExp.empresa = val;
    this.currentExp.organizacionId = null;       // escrita a mano: se enviará como propuesta
    this.showEmpresas = true;
  }

  selectEmpresa(emp: string) {
    this.currentExp.empresa = emp;
    this.currentExp.organizacionId = aId(this.organizacionesDelPais, emp);
    this.showEmpresas = false;
  }

  onEmpresaBlur() {
    setTimeout(() => {
      this.showEmpresas = false;
    }, 200);
  }

  /** Puesto escrito antes por el mismo candidato (se marca como "Tuyo" en las sugerencias) */
  esPuestoPropio(nombre: string): boolean {
    return this.catalogoPuestos.some(p => p.nombre === nombre && p.personalizado);
  }

  /** Organización escrita antes por el mismo candidato en el país elegido (se marca como "Tuya") */
  esOrganizacionPropia(nombre: string): boolean {
    return this.organizacionesDelPais.some(o => o.nombre === nombre && o.personalizado);
  }

  onPuestoChange(val: string) {
    this.currentExp.puesto = val;
    this.currentExp.puestoId = null;             // escrito a mano: se enviará como propuesta
    this.showPuestos = true;
  }

  selectPuesto(puesto: string) {
    this.currentExp.puesto = puesto;
    this.currentExp.puestoId = aId(this.catalogoPuestos, puesto);
    this.showPuestos = false;
  }

  onPuestoBlur() {
    setTimeout(() => {
      this.showPuestos = false;
    }, 200);
  }

  @HostListener('window:focus')
  onWindowFocus() {
    if (this.showModal) {
      this.recargarCatalogos();
    }
  }

  getEmptyExp(): ExperienceEntry {
    return {
      puesto: '', empresa: '', nivel: '', pais: '',
      fechaInicioMes: '', fechaInicioAno: '', fechaFinMes: '', fechaFinAno: '',
      alPresente: false, descripcion: '', puestoId: null, organizacionId: null, nivelId: null
    };
  }

  get maxDescripcionCaracteres(): number {
    return MAX_DESCRIPCION_CARACTERES;
  }

  get descripcionCharCount(): number {
    const text = this.currentExp.descripcion.trim();
    return text.length ? text.length : 0;
  }

  onDescripcionChange(value: string) {
    this.currentExp.descripcion = value.length > MAX_DESCRIPCION_CARACTERES
      ? value.slice(0, MAX_DESCRIPCION_CARACTERES)
      : value;
  }

  openModal(index = -1) {
    this.errors = {};
    this.editingIndex = index;
    this.recargarCatalogos();
    if (index === -1) {
      this.currentExp = this.getEmptyExp();
    } else {
      this.currentExp = { ...this.experiences[index] };
    }
    this.showModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.showModal = false;
    document.body.style.overflow = '';
  }

  onAlPresenteChange() {
    if (this.currentExp.alPresente) {
      this.currentExp.fechaFinMes = '';
      this.currentExp.fechaFinAno = '';
      delete this.errors['fechaFin'];
      delete this.errors['fechaFinError'];
      delete this.errors['fechaFinNacimiento'];
    }
    this.validateDates();
  }

  validateDates() {
    delete this.errors['fechaFinError'];
    delete this.errors['fechaInicioNacimiento'];
    delete this.errors['fechaFinNacimiento'];

    if (this.currentExp.fechaInicioAno && esFechaAnteriorANacimiento(this.currentExp.fechaInicioAno, this.currentExp.fechaInicioMes, this.birthYear, this.birthMonth)) {
      this.errors['fechaInicioNacimiento'] = true;
    }

    if (!this.currentExp.alPresente && this.currentExp.fechaFinAno && esFechaAnteriorANacimiento(this.currentExp.fechaFinAno, this.currentExp.fechaFinMes, this.birthYear, this.birthMonth)) {
      this.errors['fechaFinNacimiento'] = true;
    }

    if (!this.currentExp.alPresente && this.currentExp.fechaInicioMes && this.currentExp.fechaInicioAno && this.currentExp.fechaFinMes && this.currentExp.fechaFinAno) {
      const iAno = parseInt(this.currentExp.fechaInicioAno);
      const fAno = parseInt(this.currentExp.fechaFinAno);
      const iMes = this.meses.indexOf(this.currentExp.fechaInicioMes);
      const fMes = this.meses.indexOf(this.currentExp.fechaFinMes);

      if (fAno < iAno || (fAno === iAno && fMes < iMes)) {
        this.errors['fechaFinError'] = true;
      }
    }
  }

  save() {
    const e: Record<string, boolean> = {};
    if (!this.currentExp.puesto.trim()) e['puesto'] = true;
    if (!this.currentExp.empresa.trim()) e['empresa'] = true;
    if (!this.currentExp.nivel.trim()) e['nivel'] = true;
    if (!this.currentExp.pais) e['pais'] = true;
    if (!this.currentExp.fechaInicioMes || !this.currentExp.fechaInicioAno) e['fechaInicio'] = true;

    if (!this.currentExp.alPresente) {
      if (!this.currentExp.fechaFinMes || !this.currentExp.fechaFinAno) {
        e['fechaFin'] = true;
      }
    }

    this.errors = e;
    this.validateDates();
    if (this.errors['fechaFinError']) e['fechaFinError'] = true;
    if (this.errors['fechaInicioNacimiento']) e['fechaInicioNacimiento'] = true;
    if (this.errors['fechaFinNacimiento']) e['fechaFinNacimiento'] = true;

    if (Object.keys(e).length > 0) return;

    // Si cambió el país después de elegir la empresa, esa empresa ya no corresponde: se envía como propuesta
    const organizacion = this.catalogoOrganizaciones.find(o => o.id === this.currentExp.organizacionId);
    if (organizacion && organizacion.pais_id !== this.paisId) {
      this.currentExp.organizacionId = null;
    }

    if (this.currentExp.alPresente) {
      this.currentExp.fechaFinMes = '';
      this.currentExp.fechaFinAno = '';
    }

    let updated = [...this.experiences];
    if (this.editingIndex === -1) {
      updated.push(this.currentExp);
    } else {
      updated[this.editingIndex] = this.currentExp;
    }

    updated.sort((a, b) => {
      if (a.alPresente && !b.alPresente) return -1;
      if (!a.alPresente && b.alPresente) return 1;

      const aYear = a.alPresente ? 9999 : parseInt(a.fechaFinAno || a.fechaInicioAno || '0');
      const bYear = b.alPresente ? 9999 : parseInt(b.fechaFinAno || b.fechaInicioAno || '0');

      if (aYear !== bYear) return bYear - aYear;

      const aMonth = a.alPresente ? 99 : this.meses.indexOf(a.fechaFinMes || a.fechaInicioMes);
      const bMonth = b.alPresente ? 99 : this.meses.indexOf(b.fechaFinMes || b.fechaInicioMes);

      return bMonth - aMonth;
    });

    this.experiences = updated;
    this.experiencesChange.emit(this.experiences);
    this.closeModal();
  }

  remove(index: number, event: Event) {
    event.stopPropagation();
    this.experiences = this.experiences.filter((_, i) => i !== index);
    this.experiencesChange.emit(this.experiences);
  }
}
