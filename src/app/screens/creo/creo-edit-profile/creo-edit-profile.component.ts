import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoCardComponent } from '../../../components/creo-design-system/creo-card/creo-card.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';
import { CreoStepIndicatorComponent } from '../../../components/creo-design-system/creo-step-indicator/creo-step-indicator.component';
import { CreoSkillPickerComponent } from '../../../components/creo-design-system/creo-skill-picker/creo-skill-picker.component';
import { StudyListComponent, StudyEntry } from '../creo-register-candidate/study-list/study-list.component';
import { LanguageListComponent, LanguageEntry } from '../creo-register-candidate/language-list/language-list.component';
import { CREO_SKILLS, SOFT_SKILLS, AREA_SKILLS, AREA_ESTUDIO_TO_CATEGORIA } from '../../../data/creo-skills.data';
import { FormsModule } from '@angular/forms';

const STEPS = ['Datos personales', 'Educación y salario', 'Habilidades'];
const MAX_SKILLS = 15;
const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

// Datos demo — Valeria Rojas (candidata principal del prototipo)
const DEMO_PROFILE = {
  firstName: 'Valeria',
  lastName: 'Rojas',
  email: 'valeria.rojas@ejemplo.com',
  phone: '999555123',
  birthdate: '14/03/1999',
  dni: '72845193',
  gender: 'Femenino',
  location: 'Lima, Perú',
  salary: '9000',
  carreras: [{ 
    titulo: 'Ingeniería de Software', pais: 'Perú', tipoEstudio: 'Universitario', areaEstudio: 'Tecnología',
    institucion: 'Universidad Ejemplo', estado: 'Finalizado', fechaInicioMes: 'Marzo', fechaInicioAno: '2017',
    fechaFinMes: 'Diciembre', fechaFinAno: '2021', alPresente: false
  }] as StudyEntry[],
  educacionSuperior: [] as StudyEntry[],
  idiomas: [] as LanguageEntry[],
  skills: ['React', 'TypeScript', 'Node.js', 'Docker', 'AWS'],
  softSkills: ['Liderazgo', 'Comunicación efectiva'],
};

@Component({
  selector: 'app-creo-edit-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent,
    CreoCardComponent, CreoAlertComponent, CreoStepIndicatorComponent,
    CreoSkillPickerComponent, StudyListComponent, LanguageListComponent
  ],
  templateUrl: './creo-edit-profile.component.html',
  styleUrl: './creo-edit-profile.component.css'
})
export class CreoEditProfileComponent {
  steps = STEPS;
  softCatalog = SOFT_SKILLS;
  genderOptions = GENDER_OPTIONS;
  maxSkills = MAX_SKILLS;

  get catalog(): string[] {
    const areaSet = this.areaFilteredSkillSet;
    return areaSet ? CREO_SKILLS.filter(s => areaSet.has(s)) : CREO_SKILLS;
  }

  step = 0;

  firstName = DEMO_PROFILE.firstName;
  lastName = DEMO_PROFILE.lastName;
  email = DEMO_PROFILE.email;
  phone = DEMO_PROFILE.phone;
  birthDay = '14';
  birthMonth = 'Mar';
  birthYear = '1999';
  dni = DEMO_PROFILE.dni;
  gender = DEMO_PROFILE.gender;
  location = DEMO_PROFILE.location;
  salary = DEMO_PROFILE.salary;
  private _carreras: StudyEntry[] = [...DEMO_PROFILE.carreras];
  private _educacionSuperior: StudyEntry[] = [...DEMO_PROFILE.educacionSuperior];
  idiomas: LanguageEntry[] = [...DEMO_PROFILE.idiomas];

  get carreras(): StudyEntry[] { return this._carreras; }
  set carreras(v: StudyEntry[]) {
    this._carreras = v;
    this.pruneSkillsToArea();
  }

  get educacionSuperior(): StudyEntry[] { return this._educacionSuperior; }
  set educacionSuperior(v: StudyEntry[]) {
    this._educacionSuperior = v;
    this.pruneSkillsToArea();
  }
  skills: string[] = [...DEMO_PROFILE.skills];
  softSkills: string[] = [...DEMO_PROFILE.softSkills];

  dias = Array.from({length: 31}, (_, i) => (i + 1).toString());
  mesesNac = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  anosNac = Array.from({length: 100}, (_, i) => (new Date().getFullYear() - i).toString());

  errors: Record<string, string> = {};
  saved = false;
  saving = false;

  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private router: Router) { }

  get avatarInitials(): string {
    return `${this.firstName[0] ?? ''}${this.lastName[0] ?? ''}`.toUpperCase();
  }

  get displayName(): string {
    return `${this.firstName} ${this.lastName}`.trim() || 'Tu nombre';
  }

  get primarySpecialty(): string {
    return this.carreras[0]?.titulo || 'Especialidad';
  }

  private _cachedAreasStr = '';
  private _cachedCategorias: string[] = [];
  private _cachedAreaSkillSet: Set<string> | null = null;

  get selectedAreas(): string[] {
    const allStudies = [...this.carreras, ...this.educacionSuperior];
    return [...new Set(allStudies.map(c => c.areaEstudio).filter(a => !!a))];
  }

  /** Categorías de AREA_SKILLS derivadas de las áreas de estudio elegidas ("Otro" no mapea a ninguna). */
  get selectedSkillCategories(): string[] {
    const areas = this.selectedAreas;
    const areasStr = areas.join(',');
    if (this._cachedAreasStr !== areasStr) {
      this._cachedAreasStr = areasStr;
      this._cachedCategorias = [...new Set(areas.map(a => AREA_ESTUDIO_TO_CATEGORIA[a]).filter((c): c is string => !!c))];
      this._cachedAreaSkillSet = this._cachedCategorias.length > 0
        ? new Set(this._cachedCategorias.flatMap(c => AREA_SKILLS[c] ?? []))
        : null;
    }
    return this._cachedCategorias;
  }

  /** Conjunto de habilidades técnicas válidas según el área de estudio, o null si no hay un área reconocida. */
  get areaFilteredSkillSet(): Set<string> | null {
    this.selectedSkillCategories; // asegura que el cache esté actualizado
    return this._cachedAreaSkillSet;
  }

  get hasAreaFilter(): boolean {
    return this.areaFilteredSkillSet !== null;
  }

  private pruneSkillsToArea() {
    const areaSet = this.areaFilteredSkillSet;
    if (areaSet) {
      this.skills = this.skills.filter(s => areaSet.has(s));
    }
  }

  setDni(v: string) {
    this.dni = v.replace(/\D/g, '').slice(0, 8);
  }

  setPhone(v: string) {
    this.phone = v.replace(/\D/g, '').slice(0, 9);
  }

  toggleSkill(s: string) {
    if (!CREO_SKILLS.includes(s)) return;
    if (this.skills.includes(s)) {
      this.skills = this.skills.filter(x => x !== s);
      return;
    }
    if (this.skills.length >= MAX_SKILLS) return;
    this.skills = [...this.skills, s];
  }

  toggleSoftSkill(s: string) {
    if (!SOFT_SKILLS.includes(s)) return;
    if (this.softSkills.includes(s)) {
      this.softSkills = this.softSkills.filter(x => x !== s);
      return;
    }
    if (this.softSkills.length >= MAX_SKILLS) return;
    this.softSkills = [...this.softSkills, s];
  }

  validateStep0(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.firstName.trim()) e['firstName'] = 'El nombre es obligatorio';
    if (!this.lastName.trim()) e['lastName'] = 'El apellido es obligatorio';
    if (!this.birthDay || !this.birthMonth || !this.birthYear) e['birthdate'] = 'La fecha de nacimiento es obligatoria';

    if (!this.dni.trim()) e['dni'] = 'El DNI es obligatorio';
    else if (this.dni.length !== 8) e['dni'] = 'El DNI debe tener exactamente 8 dígitos numéricos';

    if (!this.email.trim()) e['email'] = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) e['email'] = 'Correo inválido';

    if (!this.phone.trim()) e['phone'] = 'El teléfono es obligatorio';
    else if (this.phone.length !== 9) e['phone'] = 'El teléfono debe tener exactamente 9 dígitos';

    return e;
  }

  handleNext(e: Event) {
    e.preventDefault();

    if (this.step === 0) {
      this.errors = this.validateStep0();
      if (Object.keys(this.errors).length === 0) {
        this.errors = {};
        this.step = 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (this.step === 1) {
      const errs: Record<string, string> = {};
      if (this.carreras.length === 0) errs['carreras'] = 'Agrega al menos una carrera';
      if (this.idiomas.length === 0) errs['idiomas'] = 'Agrega al menos un idioma';
      
      this.errors = errs;
      if (Object.keys(errs).length === 0) {
        this.errors = {};
        this.step = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    // step === 2
    const errs: Record<string, string> = {};
    if (this.skills.length === 0) errs['skills'] = 'Selecciona al menos una habilidad';
    this.errors = errs;
    if (Object.keys(errs).length === 0) {
      this.saving = true;
      this.saveTimer = setTimeout(() => {
        this.saving = false;
        this.saved = true;
      }, 1000);
    }
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  keepEditing() {
    this.saved = false;
    this.step = 0;
  }

  goToDashboard() {
    this.router.navigate(['/creo/candidate-dashboard']);
  }

  goBack() {
    if (this.step === 0) {
      this.router.navigate(['/creo/landing']);
    } else {
      this.step -= 1;
    }
  }

  ngOnDestroy() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
  }
}
