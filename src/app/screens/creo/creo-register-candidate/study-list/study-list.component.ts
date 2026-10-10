import { Component, Input, Output, EventEmitter, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CreoFieldComponent } from '../../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoBtnComponent } from '../../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CatalogosService } from '../../../../core/api/catalogos.service';
import { Carrera, Institucion, ItemCatalogo, TipoEstudio } from '../../../../core/api/models/catalogos.model';
import { aId, esFechaAnteriorANacimiento } from '../../../../core/api/mappers/registro-candidato.mapper';

export interface StudyEntry {
  titulo: string;          // nombre de la carrera elegida
  pais: string;
  tipoEstudio: string;
  areaEstudio: string;
  institucion: string;
  estado: string;
  fechaInicioMes: string;
  fechaInicioAno: string;
  fechaFinMes: string;
  fechaFinAno: string;
  alPresente: boolean;
  // ids del catálogo: se llenan al elegir de la lista
  institucionId?: number | null;
  carreraId?: number | null;
}

const ESTADOS = ['Finalizado', 'En curso', 'Incompleto'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ANOS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());
// Igual que el backend (TipoEstudio::MAXIMOS_POR_GRUPO). No hay máximo total.
const LIMITES_POR_GRUPO = [
  { tipos: ['Universitario'], maximo: 3, descripcion: 'carreras universitarias' },
  { tipos: ['Posgrado', 'Master', 'Doctorado'], maximo: 5, descripcion: 'posgrados (posgrado, maestría y doctorado)' },
  { tipos: ['Terciario'], maximo: 1, descripcion: 'estudio terciario' },
  { tipos: ['Secundario'], maximo: 1, descripcion: 'estudio secundario' },
  { tipos: ['Sin estudios formales'], maximo: 3, descripcion: 'áreas sin estudios formales' },
];

@Component({
  selector: 'app-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreoFieldComponent, CreoBtnComponent],
  templateUrl: './study-list.component.html',
})
export class StudyListComponent implements OnInit {
  private catalogos = inject(CatalogosService);

  @Input() title: string = '';
  @Input() studies: StudyEntry[] = [];
  @Input() disabled: boolean = false;
  @Input() birthYear?: string | number;
  @Input() birthMonth?: string;
  @Output() studiesChange = new EventEmitter<StudyEntry[]>();

  showModal = false;

  // Nombres para los selects (los usa el HTML)
  paises: string[] = [];
  tiposEstudio: string[] = [];
  areasEstudio: string[] = [];
  estados = ESTADOS;
  meses = MESES;
  anos = ANOS;

  // Catálogos completos, para obtener ids y requiere_carrera
  private catalogoPaises: ItemCatalogo[] = [];
  private catalogoTipos: TipoEstudio[] = [];
  private catalogoInstituciones: Institucion[] = [];
  private carreras: Carrera[] = [];              // globales: dependen solo del tipo de estudio
  private carrerasSub?: Subscription;

  editingIndex = -1;
  currentStudy: StudyEntry = this.getEmptyStudy();
  errors: Record<string, string> = {};

  ngOnInit() {
    this.recargarCatalogos();
  }

  /** Pide las listas actuales. El registro la vuelve a llamar si la API rechaza algo que el admin desactivó */
  recargarCatalogos() {
    this.catalogos.paises().subscribe(lista => {
      this.catalogoPaises = lista;
      this.paises = lista.map(p => p.nombre);
    });
    this.catalogos.tiposEstudio().subscribe(lista => {
      this.catalogoTipos = lista;
      this.tiposEstudio = lista.map(t => t.nombre);
      if (this.currentStudy.tipoEstudio) {
        this.cargarCarreras();
      }
    });
    this.catalogos.areasEstudio().subscribe(lista => this.areasEstudio = lista.map(a => a.nombre));
    this.catalogos.instituciones().subscribe(lista => this.catalogoInstituciones = lista);
  }

  /** Institución y carrera solo aplican a los tipos con requiere_carrera (lo decide el backend) */
  get tituloEnabled(): boolean {
    if (!this.currentStudy.tipoEstudio) return false;
    if (this.catalogoTipos.length === 0) {
      return ['Universitario', 'Posgrado', 'Master', 'Doctorado', 'Terciario'].includes(this.currentStudy.tipoEstudio);
    }
    const t = this.catalogoTipos.find(tipo => tipo.nombre === this.currentStudy.tipoEstudio);
    return t ? t.requiere_carrera : true;
  }

  /** "Sin estudios formales" (lo decide el backend con solo_area): el estudio solo lleva el área */
  get soloArea(): boolean {
    return this.esTipoSoloArea(this.currentStudy.tipoEstudio);
  }

  esTipoSoloArea(tipo: string): boolean {
    return this.catalogoTipos.find(t => t.nombre === tipo)?.solo_area ?? false;
  }

  /** Estudios ya cargados, sin contar el que se está editando (-1 al agregar uno nuevo) */
  private otrosEstudios(excluir = this.editingIndex): StudyEntry[] {
    return this.studies.filter((_, i) => i !== excluir);
  }

  /** "Sin estudios formales" es exclusivo: no se combina con los tipos formales (y al revés) */
  tipoIncompatible(tipo: string, excluir = this.editingIndex): boolean {
    const soloArea = this.esTipoSoloArea(tipo);
    return this.otrosEstudios(excluir).some(s => this.esTipoSoloArea(s.tipoEstudio) !== soloArea);
  }

  tipoDeshabilitado(tipo: string): boolean {
    return this.tipoLleno(tipo) || this.tipoIncompatible(tipo);
  }

  motivoTipoDeshabilitado(tipo: string): string {
    if (this.tipoIncompatible(tipo)) return ' (no se combina con otros estudios)';
    return this.tipoLleno(tipo) ? ' (máximo alcanzado)' : '';
  }

  /** En "Sin estudios formales" cada estudio debe tener un área distinta */
  areaUsada(area: string): boolean {
    return this.soloArea && this.otrosEstudios().some(s => this.esTipoSoloArea(s.tipoEstudio) && s.areaEstudio === area);
  }

  onAlPresenteChange() {
    if (this.currentStudy.alPresente) {
      this.currentStudy.fechaFinMes = '';
      this.currentStudy.fechaFinAno = '';
      delete this.errors['fechaFin'];
    }
    this.validateDates();
  }

  onEstadoChange() {
    if (this.currentStudy.estado === 'Finalizado') {
      this.currentStudy.alPresente = false;
      delete this.errors['fechaFin'];
      this.validateDates();
    } else if (this.currentStudy.estado === 'En curso') {
      this.currentStudy.alPresente = true;
      this.currentStudy.fechaFinMes = '';
      this.currentStudy.fechaFinAno = '';
      delete this.errors['fechaFin'];
      this.validateDates();
    } else if (this.currentStudy.estado === 'Incompleto') {
      this.currentStudy.alPresente = false;
      this.currentStudy.fechaFinMes = '';
      this.currentStudy.fechaFinAno = '';
      delete this.errors['fechaFin'];
    }
  }

  onTipoEstudioChange() {
    if (!this.tituloEnabled) {
      this.limpiarInstitucion();
      delete this.errors['institucion'];
      delete this.errors['titulo'];
    }

    // Solo área: se limpian los campos que se ocultan para que no se envíen
    if (this.soloArea) {
      Object.assign(this.currentStudy, {
        pais: '', estado: '', fechaInicioMes: '', fechaInicioAno: '', fechaFinMes: '', fechaFinAno: '', alPresente: false,
      });
      if (this.areaUsada(this.currentStudy.areaEstudio)) this.currentStudy.areaEstudio = '';
      ['pais', 'estado', 'fechaInicio', 'fechaFin'].forEach(campo => delete this.errors[campo]);
    }

    this.onFiltrosCarreraChange();
  }

  /** País: cambia solo las instituciones disponibles (las carreras son globales) */
  onPaisChange() {
    this.limpiarInstitucion();
  }

  /** Tipo de estudio cambió: la carrera elegida deja de valer y se recarga la lista */
  onFiltrosCarreraChange() {
    this.currentStudy.titulo = '';
    this.currentStudy.carreraId = null;
    this.cargarCarreras();
  }

  private cargarCarreras() {
    if (!this.currentStudy.tipoEstudio) {
      this.carreras = [];
      return;
    }

    const ejecutarCarga = () => {
      const tipoId = aId(this.catalogoTipos, this.currentStudy.tipoEstudio);
      if (!tipoId) return;

      this.carrerasSub?.unsubscribe();           // descarta la petición anterior si el usuario cambió rápido
      this.carrerasSub = this.catalogos.carreras(tipoId).subscribe(lista => this.carreras = lista);
    };

    if (this.catalogoTipos.length === 0) {
      this.catalogos.tiposEstudio().subscribe(lista => {
        this.catalogoTipos = lista;
        this.tiposEstudio = lista.map(t => t.nombre);
        ejecutarCarga();
      });
    } else {
      ejecutarCarga();
    }
  }

  private limpiarInstitucion() {
    this.currentStudy.institucion = '';
    this.currentStudy.institucionId = null;
  }

  private grupoDe(tipo: string) {
    return LIMITES_POR_GRUPO.find(g => g.tipos.includes(tipo));
  }

  /** Estudios del mismo grupo ya cargados, sin contar el que se está editando */
  private cantidadEnGrupo(tipo: string): number {
    const grupo = this.grupoDe(tipo);
    if (!grupo) return 0;
    return this.studies.filter((s, i) => i !== this.editingIndex && grupo.tipos.includes(s.tipoEstudio)).length;
  }

  /** true si ya no se puede agregar otro estudio de este tipo */
  tipoLleno(tipo: string): boolean {
    const grupo = this.grupoDe(tipo);
    return !!grupo && this.cantidadEnGrupo(tipo) >= grupo.maximo;
  }

  /** Queda algún tipo que se pueda agregar (cupo y exclusividad): controla el botón "Agregar" */
  get hayCupo(): boolean {
    return LIMITES_POR_GRUPO.some(g =>
      this.studies.filter(s => g.tipos.includes(s.tipoEstudio)).length < g.maximo
      && g.tipos.some(tipo => !this.tipoIncompatible(tipo, -1))
    );
  }

  showInstituciones = false;
  showCarreras = false;

  get filteredInstituciones(): string[] {
    const val = (this.currentStudy.institucion || '').toLowerCase();
    const paisId = aId(this.catalogoPaises, this.currentStudy.pais);
    return this.catalogoInstituciones
      .filter(i => !paisId || i.pais_id === paisId)
      .map(i => i.nombre)
      .filter(i => i.toLowerCase().includes(val));
  }

  get filteredCarreras(): string[] {
    const val = (this.currentStudy.titulo || '').toLowerCase();
    return this.carreras.map(c => c.nombre).filter(c => c.toLowerCase().includes(val));
  }

  onInstitucionChange(val: string) {
    this.currentStudy.institucion = val;
    this.currentStudy.institucionId = null;      // escrita a mano: hay que elegirla de la lista
    this.showInstituciones = true;
  }

  onInstitucionFocus() {
    this.showInstituciones = true;
    this.recargarCatalogos();
  }

  selectInstitucion(inst: string) {
    const paisId = aId(this.catalogoPaises, this.currentStudy.pais);
    const institucion = this.catalogoInstituciones.find(i => i.nombre === inst && (!paisId || i.pais_id === paisId));
    this.currentStudy.institucion = inst;
    this.currentStudy.institucionId = institucion?.id ?? null;
    this.showInstituciones = false;
  }

  onInstitucionBlur() {
    setTimeout(() => {
      this.showInstituciones = false;
    }, 250);
  }

  onCarreraChange(val: string) {
    this.currentStudy.titulo = val;
    this.currentStudy.carreraId = null;          // escrita a mano: hay que elegirla de la lista
    this.showCarreras = true;
  }

  onCarreraFocus() {
    this.showCarreras = true;
    this.cargarCarreras();
  }

  selectCarrera(carrera: string) {
    this.currentStudy.titulo = carrera;
    this.currentStudy.carreraId = aId(this.carreras, carrera);
    this.showCarreras = false;
  }

  onCarreraBlur() {
    setTimeout(() => {
      this.showCarreras = false;
    }, 250);
  }

  @HostListener('window:focus')
  onWindowFocus() {
    if (this.showModal) {
      this.recargarCatalogos();
      if (this.currentStudy.tipoEstudio) {
        this.cargarCarreras();
      }
    }
  }

  getEmptyStudy(): StudyEntry {
    return {
      titulo: '', pais: '', tipoEstudio: '', areaEstudio: '',
      institucion: '', estado: '', fechaInicioMes: '', fechaInicioAno: '',
      fechaFinMes: '', fechaFinAno: '', alPresente: false,
      institucionId: null, carreraId: null
    };
  }

  openModal(index = -1) {
    this.errors = {};
    this.editingIndex = index;
    this.recargarCatalogos();
    if (index === -1) {
      this.currentStudy = this.getEmptyStudy();
    } else {
      this.currentStudy = { ...this.studies[index] };
    }
    this.cargarCarreras();                       // al editar, la lista de carreras del estudio elegido
    this.showModal = true;
  }

  @HostListener('window:keydown.escape')
  handleEsc() {
    if (this.showModal) {
      this.closeModal();
    }
  }

  closeModal() {
    this.showModal = false;
  }

  removeStudy(index: number, event: Event) {
    event.stopPropagation();
    const newList = [...this.studies];
    newList.splice(index, 1);
    this.studiesChange.emit(newList);
  }

  validateDates() {
    if (this.errors['fechaFin'] === 'La fecha de fin no puede ser anterior al inicio') {
      delete this.errors['fechaFin'];
    }
    if (this.errors['fechaInicio'] === 'La fecha de inicio no puede ser anterior a tu fecha de nacimiento') {
      delete this.errors['fechaInicio'];
    }
    if (this.errors['fechaFin'] === 'La fecha de fin no puede ser anterior a tu fecha de nacimiento') {
      delete this.errors['fechaFin'];
    }

    if (!this.soloArea && this.currentStudy.fechaInicioAno && esFechaAnteriorANacimiento(this.currentStudy.fechaInicioAno, this.currentStudy.fechaInicioMes, this.birthYear, this.birthMonth)) {
      this.errors['fechaInicio'] = 'La fecha de inicio no puede ser anterior a tu fecha de nacimiento';
    }

    if (!this.soloArea && !this.currentStudy.alPresente && this.currentStudy.estado !== 'Incompleto' && this.currentStudy.fechaFinAno && esFechaAnteriorANacimiento(this.currentStudy.fechaFinAno, this.currentStudy.fechaFinMes, this.birthYear, this.birthMonth)) {
      this.errors['fechaFin'] = 'La fecha de fin no puede ser anterior a tu fecha de nacimiento';
    }

    if (!this.currentStudy.alPresente && this.currentStudy.estado !== 'Incompleto' && this.currentStudy.fechaInicioMes && this.currentStudy.fechaInicioAno && this.currentStudy.fechaFinMes && this.currentStudy.fechaFinAno) {
      const iAno = parseInt(this.currentStudy.fechaInicioAno);
      const fAno = parseInt(this.currentStudy.fechaFinAno);
      const iMes = this.meses.indexOf(this.currentStudy.fechaInicioMes);
      const fMes = this.meses.indexOf(this.currentStudy.fechaFinMes);

      if (fAno < iAno || (fAno === iAno && fMes < iMes)) {
        this.errors['fechaFin'] = 'La fecha de fin no puede ser anterior al inicio';
      }
    }
  }

  saveStudy() {
    if (this.soloArea) {
      this.guardarSoloArea();
      return;
    }

    this.errors = {};
    if (!this.currentStudy.tipoEstudio) this.errors['tipoEstudio'] = 'Requerido';
    if (!this.currentStudy.pais) this.errors['pais'] = 'Requerido';
    if (!this.currentStudy.areaEstudio) this.errors['areaEstudio'] = 'Requerido';

    // Institución y carrera: solo en los tipos que las requieren y siempre elegidas del catálogo
    if (this.tituloEnabled) {
      if (!this.currentStudy.titulo) this.errors['titulo'] = 'Requerido';
      else if (!this.currentStudy.carreraId) this.errors['titulo'] = 'Elige una carrera de la lista';
      if (!this.currentStudy.institucion) this.errors['institucion'] = 'Requerido';
      else if (!this.currentStudy.institucionId) this.errors['institucion'] = 'Elige una institución de la lista';
    } else {
      this.currentStudy.titulo = '';
      this.currentStudy.carreraId = null;
      this.limpiarInstitucion();
    }

    if (!this.currentStudy.estado) this.errors['estado'] = 'Requerido';
    if (!this.currentStudy.fechaInicioMes || !this.currentStudy.fechaInicioAno) this.errors['fechaInicio'] = 'Requerido';

    if (this.currentStudy.estado === 'Finalizado') {
      this.currentStudy.alPresente = false;
    } else if (this.currentStudy.estado === 'Incompleto') {
      this.currentStudy.alPresente = false;
      this.currentStudy.fechaFinMes = '';
      this.currentStudy.fechaFinAno = '';
    }

    if (!this.currentStudy.alPresente && this.currentStudy.estado !== 'Incompleto') {
      if (!this.currentStudy.fechaFinMes || !this.currentStudy.fechaFinAno) {
        this.errors['fechaFin'] = 'Requerido';
      }
    }
    this.validateDates();

    if (Object.keys(this.errors).length === 0) {
      // Límite por grupo de tipos (igual que el backend); el error se muestra bajo el select de tipo
      if (this.tipoIncompatible(this.currentStudy.tipoEstudio)) {
        this.errors['tipoEstudio'] = 'No se combina con "Sin estudios formales".';
        return;
      }

      if (this.tipoLleno(this.currentStudy.tipoEstudio)) {
        const grupo = this.grupoDe(this.currentStudy.tipoEstudio)!;
        this.errors['tipoEstudio'] = `Puedes registrar como máximo ${grupo.maximo} ${grupo.descripcion}.`;
        return;
      }

      if (this.currentStudy.alPresente) {
        this.currentStudy.fechaFinMes = '';
        this.currentStudy.fechaFinAno = '';
      }

      let updated = [...this.studies];
      if (this.editingIndex === -1) {
        updated.push(this.currentStudy);
      } else {
        updated[this.editingIndex] = this.currentStudy;
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

      this.studiesChange.emit(updated);
      this.closeModal();
    }
  }

  /** "Sin estudios formales": solo tipo y área (área distinta a la de los otros de este tipo, máximo 3) */
  private guardarSoloArea() {
    this.errors = {};
    if (!this.currentStudy.areaEstudio) this.errors['areaEstudio'] = 'Requerido';
    else if (this.areaUsada(this.currentStudy.areaEstudio)) this.errors['areaEstudio'] = 'Ya registraste esta área de estudio.';

    if (this.tipoDeshabilitado(this.currentStudy.tipoEstudio)) {
      const grupo = this.grupoDe(this.currentStudy.tipoEstudio)!;
      this.errors['tipoEstudio'] = this.tipoIncompatible(this.currentStudy.tipoEstudio)
        ? 'No se combina con otros tipos de estudio.'
        : `Puedes registrar como máximo ${grupo.maximo} ${grupo.descripcion}.`;
    }

    if (Object.keys(this.errors).length > 0) return;

    const estudio: StudyEntry = {
      ...this.getEmptyStudy(),
      tipoEstudio: this.currentStudy.tipoEstudio,
      areaEstudio: this.currentStudy.areaEstudio,
    };

    const updated = [...this.studies];
    if (this.editingIndex === -1) {
      updated.push(estudio);
    } else {
      updated[this.editingIndex] = estudio;
    }

    this.studiesChange.emit(updated);
    this.closeModal();
  }
}
