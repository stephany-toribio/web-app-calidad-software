import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoSelectComponent } from '../../../components/creo-design-system/creo-select/creo-select.component';
import { CreoCardComponent } from '../../../components/creo-design-system/creo-card/creo-card.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';
import { CreoStepIndicatorComponent } from '../../../components/creo-design-system/creo-step-indicator/creo-step-indicator.component';
import { CREO_SECTORS } from '../../../data/creo-skills.data';

const TAKEN_RUCS = ['20100000001', '20234567890'];
const TAKEN_EMAILS = ['admin@creo.pe', 'valeria.rojas@ejemplo.com', 'carlos@techcorp.pe'];
type RucStatus = 'idle' | 'checking' | 'taken' | 'ok';

@Component({
  selector: 'app-creo-register-company',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent,
    CreoSelectComponent, CreoCardComponent, CreoAlertComponent, CreoStepIndicatorComponent
  ],
  templateUrl: './creo-register-company.component.html',
  styleUrl: './creo-register-company.component.css'
})
export class CreoRegisterCompanyComponent implements OnDestroy {
  sectors = CREO_SECTORS;
  steps = ['Datos de empresa', 'Acceso y contacto', 'Resumen'];
  currentStep = 0;

  razSocial = '';
  descripcion = '';

  private readonly MAX_DESCRIPCION_PALABRAS = 250;

  get descripcionWordCount(): number {
    const text = this.descripcion.trim();
    return text.length ? text.split(/\s+/).length : 0;
  }

  setDescripcion(v: string) {
    const words = v.trim().length ? v.trim().split(/\s+/) : [];
    this.descripcion = words.length > this.MAX_DESCRIPCION_PALABRAS
      ? words.slice(0, this.MAX_DESCRIPCION_PALABRAS).join(' ')
      : v;
  }
  ruc = '';
  rucStatus: RucStatus = 'idle';
  rucTimer: ReturnType<typeof setTimeout> | null = null;
  sector = '';
  website = '';
  email = '';
  password = '';
  contactName = '';
  errors: Record<string, string> = {};
  showPassword = false;

  constructor(private router: Router) { }

  get passLength() { return this.password.length >= 8; }
  get passLetter() { return /[a-zA-Z]/.test(this.password); }
  get passNumber() { return /\d/.test(this.password); }
  get passSymbol() { return /[^a-zA-Z0-9]/.test(this.password); }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onRucKeypress(event: KeyboardEvent) {
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  ngOnDestroy() {
    if (this.rucTimer) clearTimeout(this.rucTimer);
  }

  handleRucChange(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 11);
    this.ruc = clean;
    this.rucStatus = 'idle';
    const { ruc, ...rest } = this.errors;
    this.errors = rest;

    if (this.rucTimer) clearTimeout(this.rucTimer);
    if (clean.length === 11) {
      this.rucStatus = 'checking';
      this.rucTimer = setTimeout(() => {
        if (TAKEN_RUCS.includes(clean)) {
          this.rucStatus = 'taken';
          this.errors = { ...this.errors, ruc: 'Este RUC ya está registrado' };
        } else {
          this.rucStatus = 'ok';
        }
      }, 700);
    }
  }

  onRucInput(e: Event) {
    this.handleRucChange((e.target as HTMLInputElement).value);
  }

  setEmail(v: string) {
    this.email = v;
    if (this.errors['emailTaken']) {
      const { emailTaken, ...rest } = this.errors;
      this.errors = rest;
    }
  }

  get rucDigitsRemaining(): number {
    return 11 - this.ruc.length;
  }

  validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.razSocial.trim()) e['razSocial'] = 'La razón social es obligatoria';
    if (!this.ruc.trim()) e['ruc'] = 'El RUC es obligatorio';
    else if (this.ruc.length !== 11) e['ruc'] = 'El RUC debe tener 11 dígitos';
    else if (this.rucStatus === 'taken') e['ruc'] = 'Este RUC ya está registrado';
    if (!this.sector) e['sector'] = 'Selecciona el sector de tu empresa';
    if (this.website.trim() && !/^https?:\/\/[^\s$.?#].[^\s]*$/.test(this.website)) {
      e['website'] = 'Ingresa una URL válida (ej. https://empresa.com)';
    }
    return e;
  }

  nextStep() {
    if (this.currentStep === 0) {
      this.errors = this.validateStep1();
      if (Object.keys(this.errors).length === 0) {
        this.currentStep = 1;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (this.currentStep === 1) {
      this.errors = this.validate();
      if (Object.keys(this.errors).length === 0) {
        this.currentStep = 2;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number) {
    this.currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  validate(): Record<string, string> {
    const e = this.validateStep1();
    if (!this.email.trim()) e['email'] = 'El correo corporativo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) e['email'] = 'Correo inválido';
    else if (TAKEN_EMAILS.includes(this.email.trim().toLowerCase())) e['emailTaken'] = 'duplicate';
    if (!this.password.trim()) e['password'] = 'La contraseña es obligatoria';
    else if (!this.passLength || !this.passLetter || !this.passNumber || !this.passSymbol) {
      e['password'] = 'La contraseña no cumple los requisitos';
    }
    if (!this.contactName.trim()) e['contactName'] = 'El nombre del contacto es obligatorio';
    return e;
  }

  handleSubmit(e: Event) {
    e.preventDefault();
    if (this.currentStep === 2) {
      const companyData = {
        razSocial: this.razSocial,
        descripcion: this.descripcion,
        ruc: this.ruc,
        sector: this.sector,
        website: this.website,
        email: this.email,
        contactName: this.contactName
      };
      localStorage.setItem('creo_company_profile', JSON.stringify(companyData));
      this.router.navigate(['/creo/success/company'], { state: { name: this.razSocial } });
    }
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  goToLanding() {
    this.router.navigate(['/creo/landing']);
  }
}