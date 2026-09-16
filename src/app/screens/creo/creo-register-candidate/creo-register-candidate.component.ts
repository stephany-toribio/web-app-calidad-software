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
import { CareerSelectorComponent } from './career-selector/career-selector.component';
import { CREO_SKILLS, AREA_SKILLS, SkillSection } from '../../../data/creo-skills.data';

const STEPS = ['Datos personales', 'Perfil de habilidades'];

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

  step = 0;
  name = '';
  email = '';
  password = '';
  phone = '';
  careers: string[] = [];
  skills: string[] = [];
  errors: Record<string, string> = {};

  constructor(private router: Router) { }

  get selectedAreas(): string[] {
    return [...new Set(this.careers.map(c => c.split(' · ')[0]))];
  }

  get suggestedSections(): SkillSection[] {
    return this.selectedAreas
      .filter(a => AREA_SKILLS[a])
      .map(a => ({ label: `Sugeridas para ${a}`, skills: AREA_SKILLS[a] }));
  }

  toggleSkill(s: string) {
    this.skills = this.skills.includes(s) ? this.skills.filter(x => x !== s) : [...this.skills, s];
  }

  addCareer(c: string) {
    this.careers = [...this.careers, c];
  }

  removeCareer(c: string) {
    this.careers = this.careers.filter(x => x !== c);
  }

  validateStep0(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.name.trim()) e['name'] = 'El nombre completo es obligatorio';
    if (!this.email.trim()) e['email'] = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) e['email'] = 'Correo inválido';
    if (!this.password.trim()) e['password'] = 'La contraseña es obligatoria';
    else if (this.password.length < 8) e['password'] = 'Mínimo 8 caracteres';
    if (!this.phone.trim()) e['phone'] = 'El teléfono es obligatorio';
    if (this.careers.length === 0) e['careers'] = 'Agrega al menos una carrera';
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
    } else {
      const errs: Record<string, string> = {};
      if (this.skills.length === 0) errs['skills'] = 'Selecciona al menos una habilidad';
      this.errors = errs;
      if (Object.keys(errs).length === 0) {
        // Equivalente a onNavigate("candidate-home", { name: ... })
        this.router.navigate(['/creo/success/candidate'], { state: { name: this.name.split(' ')[0] } });
      }
    }
  }

  goToLogin() {
    this.router.navigate(['/creo/landing']);
  }

  goBack() {
    if (this.step === 0) {
      this.router.navigate(['/creo/landing']);
    } else {
      this.step = 0;
    }
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }
}