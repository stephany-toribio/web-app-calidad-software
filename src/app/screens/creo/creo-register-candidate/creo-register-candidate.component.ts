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
import { CareerSelectorComponent, CareerEntry, SECUNDARIA_VALUE } from './career-selector/career-selector.component';
import { CREO_SKILLS, AREA_SKILLS, SkillSection } from '../../../data/creo-skills.data';

const STEPS = ['Cuenta y datos', 'Formación', 'Habilidades'];
const MAX_SKILLS = 15;
const KNOWN_EMAILS = ['admin@creo.pe', 'valeria.rojas@ejemplo.com'];
const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

@Component({
  selector: 'app-creo-register-candidate',
  standalone: true,
  imports: [
    CommonModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent,
    CreoCardComponent, CreoAlertComponent, CreoStepIndicatorComponent,
    CreoSkillPickerComponent, CareerSelectorComponent
  ],
  templateUrl: './creo-register-candidate.component.html',
  styleUrl: './creo-register-candidate.component.css'
})
export class CreoRegisterCandidateComponent {
  steps = STEPS;
  catalog = CREO_SKILLS;
  genderOptions = GENDER_OPTIONS;
  maxSkills = MAX_SKILLS;

  step = 0;

  // Paso 0 — Cuenta y datos personales
  firstName = '';
  lastName = '';
  birthdate = '';
  dni = '';
  gender = '';
  email = '';
  password = '';
  phone = '';

  // Paso 1 — Formación
  careers: CareerEntry[] = [];

  // Paso 2 — Habilidades
  skills: string[] = [];

  errors: Record<string, string> = {};

  constructor(private router: Router) { }

  get selectedAreas(): string[] {
    return [...new Set(this.careers.map(c => c.area).filter(a => a !== SECUNDARIA_VALUE))];
  }

  get suggestedSections(): SkillSection[] {
    return this.selectedAreas
      .filter(a => AREA_SKILLS[a])
      .map(a => ({ label: `Sugeridas para ${a}`, skills: AREA_SKILLS[a] }));
  }

  setDni(v: string) {
    this.dni = v.replace(/\D/g, '').slice(0, 8);
  }

  setEmail(v: string) {
    this.email = v;
    if (this.errors['emailTaken']) {
      const { emailTaken, ...rest } = this.errors;
      this.errors = rest;
    }
  }

  toggleSkill(s: string) {
    if (this.skills.includes(s)) {
      this.skills = this.skills.filter(x => x !== s);
      return;
    }
    if (this.skills.length >= MAX_SKILLS) return;
    this.skills = [...this.skills, s];
  }

  addCareer(c: CareerEntry) {
    this.careers = [...this.careers, c];
  }

  removeCareer(c: CareerEntry) {
    this.careers = this.careers.filter(x => x.area !== c.area || x.specialty !== c.specialty);
  }

  validateStep0(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.firstName.trim()) e['firstName'] = 'El nombre es obligatorio';
    if (!this.lastName.trim()) e['lastName'] = 'El apellido es obligatorio';
    if (!this.birthdate.trim()) e['birthdate'] = 'La fecha de nacimiento es obligatoria';

    if (!this.dni.trim()) e['dni'] = 'El DNI es obligatorio';
    else if (!/^\d{8}$/.test(this.dni)) e['dni'] = 'El DNI debe tener exactamente 8 dígitos numéricos';

    if (!this.email.trim()) e['email'] = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) e['email'] = 'Correo inválido';
    else if (KNOWN_EMAILS.includes(this.email.trim().toLowerCase())) e['emailTaken'] = 'duplicate';

    if (!this.password.trim()) e['password'] = 'La contraseña es obligatoria';
    else if (this.password.length < 8) e['password'] = 'Mínimo 8 caracteres';

    if (!this.phone.trim()) e['phone'] = 'El teléfono es obligatorio';

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
      if (this.careers.length === 0) errs['careers'] = 'Agrega al menos una opción de formación';
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
      this.step -= 1;
    }
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}
