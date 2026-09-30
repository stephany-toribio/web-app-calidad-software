import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';

const MAX_ATTEMPTS = 5;

@Component({
  selector: 'app-creo-admin-login',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent, CreoAlertComponent],
  templateUrl: './creo-admin-login.component.html',
  styleUrl: './creo-admin-login.component.css'
})
export class CreoAdminLoginComponent {
  email = '';
  password = '';
  errors: Record<string, string> = {};
  attempted = false;
  failedAttempts = 0;

  constructor(private router: Router) { }

  get isLocked(): boolean {
    return this.failedAttempts >= MAX_ATTEMPTS;
  }

  private validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.email.trim()) e['email'] = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) e['email'] = 'Ingresa un correo válido';
    if (!this.password.trim()) e['password'] = 'La contraseña es obligatoria';
    else if (this.password.length < 6) e['password'] = 'Mínimo 6 caracteres';
    return e;
  }

  handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLocked) return;

    const errs = this.validate();
    this.errors = errs;
    this.attempted = true;

    if (Object.keys(errs).length === 0) {
      const isValid = this.email === 'admin@creo.pe' && this.password === 'admin123';
      if (!isValid) {
        const next = this.failedAttempts + 1;
        this.failedAttempts = next;
        const remaining = MAX_ATTEMPTS - next;
        if (next >= MAX_ATTEMPTS) {
          this.errors = { auth: 'Acceso bloqueado. Contacta al soporte técnico de CREO+.' };
        } else {
          this.errors = {
            auth: `Credenciales de administrador incorrectas. ${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`
          };
        }
        return;
      }
      this.router.navigate(['/creo/admin-dashboard']);
    }
  }

  onEmailChange(value: string) {
    this.email = value;
    this.errors = {};
  }

  onPasswordChange(value: string) {
    this.password = value;
    this.errors = {};
  }

  goToLanding() {
    this.router.navigate(['/creo/landing']);
  }
}