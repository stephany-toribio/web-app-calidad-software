import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreoFieldComponent } from '../../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoBtnComponent } from '../../../../components/creo-design-system/creo-btn/creo-btn.component';

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

const PAISES = ['Perú', 'Argentina', 'Chile', 'Colombia', 'México', 'Otro'];
const TIPOS_ESTUDIO = ['Universitario', 'Terciario', 'Posgrado', 'Master', 'Doctorado', 'Secundario', 'Otro'];
const AREAS_ESTUDIO = ['Ingeniería', 'Administración', 'Diseño', 'Salud', 'Educación', 'Tecnología', 'Otro'];
const ESTADOS = ['Finalizado', 'En curso', 'Incompleto'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const ANOS = Array.from({length: 50}, (_, i) => (new Date().getFullYear() - i).toString());

@Component({
  selector: 'app-study-list',
  standalone: true,
  imports: [CommonModule, FormsModule, CreoFieldComponent, CreoBtnComponent],
  templateUrl: './study-list.component.html',
})
export class StudyListComponent {
  @Input() title: string = '';
  @Input() studies: StudyEntry[] = [];
  @Input() maxStudies: number = 5;
  @Input() disabled: boolean = false;
  @Output() studiesChange = new EventEmitter<StudyEntry[]>();

  showModal = false;
  
  paises = PAISES;
  tiposEstudio = TIPOS_ESTUDIO;
  areasEstudio = AREAS_ESTUDIO;
  estados = ESTADOS;
  meses = MESES;
  anos = ANOS;

  editingIndex = -1;
  currentStudy: StudyEntry = this.getEmptyStudy();
  errors: Record<string, string> = {};

  getEmptyStudy(): StudyEntry {
    return {
      titulo: '', pais: 'Perú', tipoEstudio: '', areaEstudio: '',
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

  saveStudy() {
    this.errors = {};
    if (!this.currentStudy.titulo) this.errors['titulo'] = 'Requerido';
    if (!this.currentStudy.tipoEstudio) this.errors['tipoEstudio'] = 'Requerido';
    if (!this.currentStudy.areaEstudio) this.errors['areaEstudio'] = 'Requerido';
    if (!this.currentStudy.institucion) this.errors['institucion'] = 'Requerido';
    if (!this.currentStudy.estado) this.errors['estado'] = 'Requerido';
    if (!this.currentStudy.fechaInicioMes || !this.currentStudy.fechaInicioAno) this.errors['fechaInicio'] = 'Requerido';
    
    if (!this.currentStudy.alPresente) {
      if (!this.currentStudy.fechaFinMes || !this.currentStudy.fechaFinAno) {
        this.errors['fechaFin'] = 'Requerido';
      } else if (this.currentStudy.fechaInicioMes && this.currentStudy.fechaInicioAno) {
        const iAno = parseInt(this.currentStudy.fechaInicioAno);
        const fAno = parseInt(this.currentStudy.fechaFinAno);
        const iMes = this.meses.indexOf(this.currentStudy.fechaInicioMes);
        const fMes = this.meses.indexOf(this.currentStudy.fechaFinMes);
        
        if (fAno < iAno || (fAno === iAno && fMes < iMes)) {
          this.errors['fechaFin'] = 'La fecha de fin no puede ser anterior al inicio';
        }
      }
    }

    if (Object.keys(this.errors).length === 0) {
      if (this.currentStudy.alPresente) {
        this.currentStudy.fechaFinMes = '';
        this.currentStudy.fechaFinAno = '';
      }
      
      const updated = [...this.studies];
      if (this.editingIndex === -1) {
        updated.push(this.currentStudy);
      } else {
        updated[this.editingIndex] = this.currentStudy;
      }
      this.studiesChange.emit(updated);
      this.closeModal();
    }
  }
}
