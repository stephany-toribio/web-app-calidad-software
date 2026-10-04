import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SkillsService } from '../../../../services/skills.service';

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
}

@Component({
  selector: 'app-experience-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './experience-list.component.html'
})
export class ExperienceListComponent {
  constructor(public skillsService: SkillsService) {}
  @Input() experiences: ExperienceEntry[] = [];
  @Input() maxExperiences: number = 5;
  @Output() experiencesChange = new EventEmitter<ExperienceEntry[]>();

  showModal = false;
  editingIndex = -1;
  errors: Record<string, boolean> = {};

  paises = ['Perú', 'Argentina', 'Chile', 'Colombia', 'México', 'España', 'Francia', 'Alemania', 'Italia', 'Reino Unido', 'Otro'];
  niveles = ['Trainee', 'Junior', 'Semi Senior', 'Senior', 'Jefe / Supervisor', 'Gerente / Director'];
  meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  anos = Array.from({length: 50}, (_, i) => (new Date().getFullYear() - i).toString());

  currentExp: ExperienceEntry = this.getEmptyExp();

  showEmpresas = false;
  showPuestos = false;

  get filteredEmpresas(): string[] {
    const val = (this.currentExp.empresa || '').toLowerCase();
    const empresasSugeridas = ['Banco BCP', 'BBVA', 'Interbank', 'Alicorp', 'Gloria', 'Pacífico Seguros'];
    return empresasSugeridas.filter(e => e.toLowerCase().includes(val));
  }

  get filteredPuestos(): string[] {
    const val = (this.currentExp.puesto || '').toLowerCase();
    const puestosSugeridos = this.skillsService.getPositions().filter(p => p.active).map(p => p.name);
    return puestosSugeridos.filter(p => p.toLowerCase().includes(val));
  }

  onEmpresaChange(val: string) {
    this.currentExp.empresa = val;
    this.showEmpresas = true;
  }

  selectEmpresa(emp: string) {
    this.currentExp.empresa = emp;
    this.showEmpresas = false;
  }

  onEmpresaBlur() {
    setTimeout(() => {
      this.showEmpresas = false;
    }, 200);
  }

  onPuestoChange(val: string) {
    this.currentExp.puesto = val;
    this.showPuestos = true;
  }

  selectPuesto(puesto: string) {
    this.currentExp.puesto = puesto;
    this.showPuestos = false;
  }

  onPuestoBlur() {
    setTimeout(() => {
      this.showPuestos = false;
    }, 200);
  }

  getEmptyExp(): ExperienceEntry {
    return {
      puesto: '', empresa: '', nivel: '', pais: '',
      fechaInicioMes: '', fechaInicioAno: '', fechaFinMes: '', fechaFinAno: '',
      alPresente: false, descripcion: ''
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

  validateDates() {
    delete this.errors['fechaFinError'];
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
    if (!this.currentExp.nivel) e['nivel'] = true;
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

    if (Object.keys(e).length > 0) return;

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
