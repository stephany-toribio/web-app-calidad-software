import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreoFieldComponent } from '../../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoBtnComponent } from '../../../../components/creo-design-system/creo-btn/creo-btn.component';
import { SkillsService } from '../../../../services/skills.service';

export interface StudyEntry {
  titulo: string;
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
}

const PAISES = ['Perú', 'Argentina', 'Chile', 'Colombia', 'México', 'España', 'Francia', 'Alemania', 'Italia', 'Reino Unido', 'Otro'];
const TIPOS_ESTUDIO = ['Secundaria incompleta', 'Secundaria', 'Técnico', 'Universitario', 'Maestría / Master', 'Doctorado / PhD', 'Otro'];
const AREAS_ESTUDIO = ['Ingeniería', 'Administración', 'Diseño', 'Salud', 'Educación', 'Tecnología', 'Otro'];
const ESTADOS = ['Finalizado', 'En curso', 'Incompleto'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ANOS = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - i).toString());

// Tipos de estudio para los que el campo Título/Carrera debe habilitarse
const TIPOS_CON_TITULO = ['Técnico', 'Universitario', 'Maestría / Master', 'Doctorado / PhD'];

@Component({
  selector: 'app-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreoFieldComponent, CreoBtnComponent],
  templateUrl: './study-list.component.html',
})
export class StudyListComponent {
  constructor(public skillsService: SkillsService) {}
  @Input() title: string = '';
  @Input() studies: StudyEntry[] = [];
  @Input() maxStudies: number = 5;
  @Input() disabled: boolean = false;
  @Output() studiesChange = new EventEmitter<StudyEntry[]>();

  showModal = false;

  get paises() { return this.skillsService.getCountries().filter(c => c.active).map(c => c.name); }
  tiposEstudio = TIPOS_ESTUDIO;
  get areasEstudio() { return this.skillsService.getStudyAreas().filter(a => a.active).map(a => a.name); }
  estados = ESTADOS;
  meses = MESES;
  anos = ANOS;

  editingIndex = -1;
  currentStudy: StudyEntry = this.getEmptyStudy();
  errors: Record<string, string> = {};

  get tituloEnabled(): boolean {
    return TIPOS_CON_TITULO.includes(this.currentStudy.tipoEstudio);
  }


  onEstadoChange() {
    if (this.currentStudy.estado === 'En curso') {
      this.currentStudy.fechaFinMes = '';
      this.currentStudy.fechaFinAno = '';
      this.currentStudy.alPresente = true;
      delete this.errors['fechaFin'];
      this.validateDates();
    }
  }

  onTipoEstudioChange() {
    if (!this.tituloEnabled) {
      this.currentStudy.titulo = '';
      delete this.errors['titulo'];
    }
  }


  get normalCount(): number {
    return this.studies.filter(s => !['Posgrado', 'Master', 'Doctorado'].includes(s.tipoEstudio)).length;
  }
  
  get postgradCount(): number {
    return this.studies.filter(s => ['Posgrado', 'Master', 'Doctorado'].includes(s.tipoEstudio)).length;
  }

  showInstituciones = false;
  showCarreras = false;

  get filteredInstituciones(): string[] {
    const val = (this.currentStudy.institucion || '').toLowerCase();
    const instSugeridas = this.skillsService.getInstitutions().filter(i => i.active && (!this.currentStudy.pais || i.country === this.currentStudy.pais)).map(i => i.name);
    return instSugeridas.filter(i => i.toLowerCase().includes(val));
  }

  get filteredCarreras(): string[] {
    const val = (this.currentStudy.titulo || '').toLowerCase();
    const carrerasSugeridas = ['Ingeniera de Sistemas', 'Ingeniera Industrial', 'Administracin de Empresas', 'Diseo Grfico', 'Marketing', 'Contabilidad', 'Derecho', 'Medicina'];
    return carrerasSugeridas.filter(c => c.toLowerCase().includes(val));
  }

  onInstitucionChange(val: string) {
    this.currentStudy.institucion = val;
    this.showInstituciones = true;
  }

  selectInstitucion(inst: string) {
    this.currentStudy.institucion = inst;
    this.showInstituciones = false;
  }

  onInstitucionBlur() {
    setTimeout(() => {
      this.showInstituciones = false;
    }, 200);
  }

  onCarreraChange(val: string) {
    this.currentStudy.titulo = val;
    this.showCarreras = true;
  }

  selectCarrera(carrera: string) {
    this.currentStudy.titulo = carrera;
    this.showCarreras = false;
  }

  onCarreraBlur() {
    setTimeout(() => {
      this.showCarreras = false;
    }, 200);
  }

  getEmptyStudy(): StudyEntry {
    return {
      titulo: '', pais: '', tipoEstudio: '', areaEstudio: '',
      institucion: '', estado: '', fechaInicioMes: '', fechaInicioAno: '',
      fechaFinMes: '', fechaFinAno: '', alPresente: false
    };
  }

  openModal(index = -1) {
    this.errors = {};
    this.editingIndex = index;
    if (index === -1) {
      this.currentStudy = this.getEmptyStudy();
    } else {
      this.currentStudy = { ...this.studies[index] };
    }
    this.showModal = true;
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
    if (!this.currentStudy.alPresente && this.currentStudy.fechaInicioMes && this.currentStudy.fechaInicioAno && this.currentStudy.fechaFinMes && this.currentStudy.fechaFinAno) {
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
    this.errors = {};
    if (!this.currentStudy.tipoEstudio) this.errors['tipoEstudio'] = 'Requerido';
    if (this.tituloEnabled && !this.currentStudy.titulo) this.errors['titulo'] = 'Requerido';
    if (!this.currentStudy.areaEstudio) this.errors['areaEstudio'] = 'Requerido';
    if (!this.currentStudy.institucion) this.errors['institucion'] = 'Requerido';
    if (!this.currentStudy.estado) this.errors['estado'] = 'Requerido';
    if (!this.currentStudy.fechaInicioMes || !this.currentStudy.fechaInicioAno) this.errors['fechaInicio'] = 'Requerido';
    
    if (!this.currentStudy.alPresente) {
      if (!this.currentStudy.fechaFinMes || !this.currentStudy.fechaFinAno) {
        this.errors['fechaFin'] = 'Requerido';
      }
    }
    this.validateDates();

    if (!this.tituloEnabled) {
      this.currentStudy.titulo = '';
    }

    if (Object.keys(this.errors).length === 0) {
      const isPostgrad = ['Posgrado', 'Master', 'Doctorado'].includes(this.currentStudy.tipoEstudio);
      const isNew = this.editingIndex === -1;
      
      if (isNew) {
        if (isPostgrad && this.postgradCount >= 3) {
          this.errors['limite'] = 'Puedes agregar máximo 3 estudios de posgrado';
          return;
        }
        if (!isPostgrad && this.normalCount >= 5) {
          this.errors['limite'] = 'Puedes agregar máximo 5 estudios normales/carreras';
          return;
        }
      } else {
        const oldStudy = this.studies[this.editingIndex];
        const oldIsPostgrad = ['Posgrado', 'Master', 'Doctorado'].includes(oldStudy.tipoEstudio);
        
        if (isPostgrad && !oldIsPostgrad && this.postgradCount >= 3) {
          this.errors['limite'] = 'Puedes agregar máximo 3 estudios de posgrado';
          return;
        }
        if (!isPostgrad && oldIsPostgrad && this.normalCount >= 5) {
          this.errors['limite'] = 'Puedes agregar máximo 5 estudios normales/carreras';
          return;
        }
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
}
