import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

const MAX_DESCRIPCION_PALABRAS = 15;

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
}

@Component({
  selector: 'app-experience-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './experience-list.component.html'
})
export class ExperienceListComponent {
  @Input() experiences: ExperienceEntry[] = [];
  @Input() maxExperiences: number = 5;
  @Output() experiencesChange = new EventEmitter<ExperienceEntry[]>();

  showModal = false;
  editingIndex = -1;
  errors: Record<string, boolean> = {};

  paises = ['Perú', 'Argentina', 'Chile', 'Colombia', 'México', 'Otro'];
  niveles = ['Trainee', 'Junior', 'Semi Senior', 'Senior', 'Jefe / Supervisor', 'Gerente / Director'];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anos = Array.from({length: 50}, (_, i) => (new Date().getFullYear() - i).toString());

  currentExp: ExperienceEntry = this.getEmptyExp();

  getEmptyExp(): ExperienceEntry {
    return {
      puesto: '', empresa: '', nivel: '', pais: '',
      fechaInicioMes: '', fechaInicioAno: '', fechaFinMes: '', fechaFinAno: '',
      alPresente: false, descripcion: ''
    };
  }

  get maxDescripcionPalabras(): number {
    return MAX_DESCRIPCION_PALABRAS;
  }

  get descripcionWordCount(): number {
    const text = this.currentExp.descripcion.trim();
    return text.length ? text.split(/\s+/).length : 0;
  }

  onDescripcionChange(value: string) {
    const words = value.trim().length ? value.trim().split(/\s+/) : [];
    this.currentExp.descripcion = words.length > MAX_DESCRIPCION_PALABRAS
      ? words.slice(0, MAX_DESCRIPCION_PALABRAS).join(' ')
      : value;
  }

  openModal(index = -1) {
    this.errors = {};
    this.editingIndex = index;
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

  save() {
    const e: Record<string, boolean> = {};
    if (!this.currentExp.puesto.trim()) e['puesto'] = true;
    if (!this.currentExp.empresa.trim()) e['empresa'] = true;
    if (!this.currentExp.nivel) e['nivel'] = true;
    if (!this.currentExp.pais) e['pais'] = true;
    if (!this.currentExp.fechaInicioMes || !this.currentExp.fechaInicioAno) e['fechaInicio'] = true;
    
    if (!this.currentExp.alPresente) {
      if (!this.currentExp.fechaFinMes || !this.currentExp.fechaFinAno) {
        e['fechaFin'] = true;
      } else if (this.currentExp.fechaInicioMes && this.currentExp.fechaInicioAno) {
        const iAno = parseInt(this.currentExp.fechaInicioAno);
        const fAno = parseInt(this.currentExp.fechaFinAno);
        const iMes = this.meses.indexOf(this.currentExp.fechaInicioMes);
        const fMes = this.meses.indexOf(this.currentExp.fechaFinMes);
        
        if (fAno < iAno || (fAno === iAno && fMes < iMes)) {
          e['fechaFin'] = true;
        }
      }
    }

    this.errors = e;
    if (Object.keys(e).length > 0) return;

    if (this.currentExp.alPresente) {
      this.currentExp.fechaFinMes = '';
      this.currentExp.fechaFinAno = '';
    }

    if (this.editingIndex === -1) {
      this.experiences = [...this.experiences, this.currentExp];
    } else {
      const updated = [...this.experiences];
      updated[this.editingIndex] = this.currentExp;
      this.experiences = updated;
    }
    this.experiencesChange.emit(this.experiences);
    this.closeModal();
  }

  remove(index: number, event: Event) {
    event.stopPropagation();
    this.experiences = this.experiences.filter((_, i) => i !== index);
    this.experiencesChange.emit(this.experiences);
  }
}
