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
import { CareerSelectorComponent, CareerEntry } from '../creo-register-candidate/career-selector/career-selector.component';
import { CREO_SKILLS, AREA_SKILLS, SkillSection } from '../../../data/creo-skills.data';

const STEPS = ['Datos personales', 'Formación y salario', 'Habilidades'];
const MAX_SKILLS = 15;
const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

// Datos demo — Valeria Rojas (candidata principal del prototipo)
const DEMO_PROFILE = {
  firstName: 'Valeria',
  lastName: 'Rojas',
  email: 'valeria.rojas@ejemplo.com',
  phone: '+51 999 555 123',
  birthdate: '14/03/1999',
  dni: '72845193',
  gender: 'Femenino',
  location: 'Lima, Perú',
  salary: '9000',
  careers: [{ area: 'Tecnología', specialty: 'Ingeniería de Software', estado: 'Finalizado' }] as CareerEntry[],
  skills: ['React', 'TypeScript', 'Node.js', 'Docker', 'AWS'],
};

@Component({
  selector: 'app-creo-edit-profile',
  standalone: true,
  imports: [
    CommonModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent,
    CreoCardComponent, CreoAlertComponent, CreoStepIndicatorComponent,
    CreoSkillPickerComponent, CareerSelectorComponent
  ],
  templateUrl: './creo-edit-profile.component.html',
  styleUrl: './creo-edit-profile.component.css'
})
export class CreoEditProfileComponent {
  steps = STEPS;
  catalog = CREO_SKILLS;
  genderOptions = GENDER_OPTIONS;
  maxSkills = MAX_SKILLS;

  step = 0;

  firstName = DEMO_PROFILE.firstName;
  lastName = DEMO_PROFILE.lastName;
  email = DEMO_PROFILE.email;
  phone = DEMO_PROFILE.phone;
  birthdate = DEMO_PROFILE.birthdate;
  dni = DEMO_PROFILE.dni;
  gender = DEMO_PROFILE.gender;
  location = DEMO_PROFILE.location;
  salary = DEMO_PROFILE.salary;
  careers: CareerEntry[] = [...DEMO_PROFILE.careers];
  skills: string[] = [...DEMO_PROFILE.skills];

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
    return this.careers[0]?.specialty || 'Especialidad';
  }

  get selectedAreas(): string[] {
    return [...new Set(this.careers.map(c => c.area))];
  }

  get suggestedSections(): SkillSection[] {
    return this.selectedAreas
      .filter(a => AREA_SKILLS[a])
      .map(a => ({ label: `Sugeridas para ${a}`, skills: AREA_SKILLS[a] }));
  }

  setDni(v: string) {
    this.dni = v.replace(/\D/g, '').slice(0, 8);
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
      this.errors = {};
      this.step = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
