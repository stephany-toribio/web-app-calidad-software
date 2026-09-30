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
import { StudyListComponent, StudyEntry } from './study-list/study-list.component';
import { LanguageListComponent, LanguageEntry } from './language-list/language-list.component';
import { ExperienceListComponent, ExperienceEntry } from './experience-list/experience-list.component';
import { AREA_SKILLS, SkillSection } from '../../../data/creo-skills.data';
import { SkillsService } from '../../../services/skills.service';
import { FormsModule } from '@angular/forms';

const STEPS = ['Cuenta y datos', 'Educación', 'Experiencia', 'Habilidades', 'Resumen'];
const MAX_SKILLS = 15;
const KNOWN_EMAILS = ['admin@creo.pe', 'valeria.rojas@ejemplo.com'];
const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

@Component({
  selector: 'app-creo-register-candidate',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent,
    CreoCardComponent, CreoAlertComponent, CreoStepIndicatorComponent,
    CreoSkillPickerComponent, StudyListComponent, LanguageListComponent, ExperienceListComponent
  ],
  templateUrl: './creo-register-candidate.component.html',
  styleUrl: './creo-register-candidate.component.css'
})
export class CreoRegisterCandidateComponent {
  steps = STEPS;
  genderOptions = GENDER_OPTIONS;
  maxSkills = MAX_SKILLS;

  constructor(private router: Router, private skillsService: SkillsService) {}

  private _cachedSkillsVersion = -1;
  private _cachedHard: string[] = [];
  private _cachedSoft: string[] = [];

  get catalog() {
    const version = this.skillsService.getVersion();
    if (this._cachedSkillsVersion !== version) {
      this._cachedSkillsVersion = version;
      this._cachedHard = this.skillsService.getHardSkills(true).map(s => s.name);
      this._cachedSoft = this.skillsService.getSoftSkills(true).map(s => s.name);
    }
    return this._cachedHard;
  }

  get softCatalog() {
    // Trigger update if needed via catalog getter
    this.catalog;
    return this._cachedSoft;
  }

  step = 0;

  // Paso 0 — Cuenta y datos personales
  firstName = '';
  lastName = '';
  birthDay = '';
  birthMonth = '';
  birthYear = '';
  dni = '';
  gender = '';
  email = '';
  password = '';
  phone = '';
  showPassword = false;

  dias = Array.from({length: 31}, (_, i) => (i + 1).toString());
  mesesNac = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  anosNac = Array.from({length: 100}, (_, i) => (new Date().getFullYear() - i).toString());

  // Paso 1 — Educación
  carreras: StudyEntry[] = [];
  educacionSuperior: StudyEntry[] = [];
  idiomas: LanguageEntry[] = [];
  salary = '';

  // Paso 2 — Experiencia
  hasExperience: boolean | null = null;
  experiencias: ExperienceEntry[] = [];

  // Paso 3 — Habilidades
  skills: string[] = [];
  softSkills: string[] = [];

  errors: Record<string, string> = {};


  private _cachedAreasStr = '';
  private _cachedSections: SkillSection[] = [];

  get selectedAreas(): string[] {
    const allStudies = [...this.carreras, ...this.educacionSuperior];
    return [...new Set(allStudies.map(c => c.areaEstudio).filter(a => !!a))];
  }

  get suggestedSections(): SkillSection[] {
    const areas = this.selectedAreas;
    const areasStr = areas.join(',');
    if (this._cachedAreasStr !== areasStr) {
      this._cachedAreasStr = areasStr;
      this._cachedSections = areas
        .filter(a => AREA_SKILLS[a])
        .map(a => ({ label: `Sugeridas para ${a}`, skills: AREA_SKILLS[a] }));
    }
    return this._cachedSections;
  }

  get passLength() { return this.password.length >= 8; }
  get passLetter() { return /[a-zA-Z]/.test(this.password); }
  get passNumber() { return /\d/.test(this.password); }
  get passSymbol() { return /[^a-zA-Z0-9]/.test(this.password); }

  setDni(v: string) {
    this.dni = v.replace(/\D/g, '').slice(0, 8);
  }

  setPhone(v: string) {
    this.phone = v.replace(/\D/g, '').slice(0, 9);
  }

  setEmail(v: string) {
    this.email = v;
    if (this.errors['emailTaken']) {
      const { emailTaken, ...rest } = this.errors;
      this.errors = rest;
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleSkill(s: string) {
    if (this.skills.includes(s)) {
      this.skills = this.skills.filter(x => x !== s);
      return;
    }
    if (this.skills.length >= MAX_SKILLS) return;
    this.skills = [...this.skills, s];
  }

  toggleSoftSkill(s: string) {
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
    else if (KNOWN_EMAILS.includes(this.email.trim().toLowerCase())) e['emailTaken'] = 'duplicate';

    if (!this.password.trim()) e['password'] = 'La contraseña es obligatoria';
    else if (!this.passLength || !this.passLetter || !this.passNumber || !this.passSymbol) {
      e['password'] = 'La contraseña no cumple los requisitos';
    }

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

    if (this.step === 2) {
      if (this.hasExperience === null) {
        this.errors = { experiencia: 'Selecciona una opción sobre tu experiencia' };
        return;
      }
      if (this.hasExperience === true && this.experiencias.length === 0) {
        this.errors = { experiencia: 'Agrega al menos una experiencia laboral' };
        return;
      }
      this.errors = {};
      this.step = 3;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (this.step === 3) {
      const errs: Record<string, string> = {};
      if (this.skills.length === 0 && this.softSkills.length === 0) errs['skills'] = 'Selecciona al menos una habilidad (técnica o blanda)';
      this.errors = errs;
      if (Object.keys(errs).length === 0) {
        this.step = 4;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (this.step === 4) {
      this.router.navigate(['/creo/success/candidate'], { state: { name: this.firstName } });
    }
  }

  goToLogin() {
    this.router.navigate(['/creo/landing']);
  }

  goBack() {
    if (this.step === 0) {
      this.router.navigate(['/creo/landing']);
    } else {
      this.goToStep(this.step - 1);
    }
  }

  goToStep(step: number) {
    this.step = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
