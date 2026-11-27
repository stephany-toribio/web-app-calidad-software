import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';

import { AuthService } from '../../../core/api/auth.service';

@Component({
  selector: 'app-creo-admin-login',
  standalone: true,
  imports: [
    CommonModule,
    CreoWordmarkComponent,
    CreoBtnComponent,
    CreoFieldComponent,
    CreoAlertComponent
  ],
  templateUrl: './creo-admin-login.component.html',
  styleUrl: './creo-admin-login.component.css'
})
export class CreoAdminLoginComponent {
  email = '';
  password = '';

  errors: Record<string, string> = {};
  attempted = false;
  isSubmitting = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Valida únicamente el formato de los campos.
   *
   * La autenticación real, los intentos fallidos y cualquier bloqueo
   * de seguridad son responsabilidad del backend.
   */
  private validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!this.email.trim()) {
      errors['email'] = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      errors['email'] = 'Ingresa un correo válido';
    }

    if (!this.password.trim()) {
      errors['password'] = 'La contraseña es obligatoria';
    }

    return errors;
  }

  handleSubmit(event: Event): void {
    event.preventDefault();

    if (this.isSubmitting) {
      return;
    }

    this.attempted = true;
    this.errors = this.validate();

    if (Object.keys(this.errors).length > 0) {
      return;
    }

    this.isSubmitting = true;
    this.errors = {};

    this.authService.login({
      correo: this.email.trim(),
      password: this.password
    }).subscribe({
      next: (sesion) => {
        this.isSubmitting = false;

        if (sesion.rol !== 'admin') {
          this.authService.clearSession();

          this.errors = {
            auth: 'Esta cuenta no tiene permisos de administrador.'
          };

          return;
        }

        this.authService.saveSession(sesion);

        this.router.navigate(['/creo/admin-skills']);
      },

      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;

        if (error.status === 401) {
          this.errors = {
            auth: 'Credenciales de administrador incorrectas.' + this.textoIntentosRestantes(error)
          };
          return;
        }

        if (error.status === 403) {
          this.errors = {
            auth: typeof error.error?.message === 'string' && error.error.message.trim()
              ? error.error.message.trim()
              : 'No tienes permisos para acceder como administrador.'
          };
          return;
        }

        if (error.status === 422) {
          this.errors = {
            auth: 'Verifica los datos ingresados.'
          };
          return;
        }

        if (error.status === 429) {
          this.errors = {
            auth: 'Cuenta bloqueada temporalmente. Intente más tarde.'
          };
          return;
        }

        if (error.status === 0) {
          this.errors = {
            auth: 'No se pudo conectar con el servidor.'
          };
          return;
        }

        this.errors = {
          auth: 'No se pudo iniciar sesión. Inténtalo nuevamente.'
        };
      }
    });
  }

  /** Texto con los intentos que quedan antes del bloqueo (el back lo envía en errors.intentos_restantes del 401) */
  private textoIntentosRestantes(error: HttpErrorResponse): string {
    const restantes = error.error?.errors?.intentos_restantes;
    if (typeof restantes !== 'number') return '';
    return restantes === 1
      ? ' Te queda 1 intento antes de que se bloquee tu cuenta.'
      : ` Te quedan ${restantes} intentos antes de que se bloquee tu cuenta.`;
  }

  onEmailChange(value: string): void {
    this.email = value;
    this.errors = {};
  }

  onPasswordChange(value: string): void {
    this.password = value;
    this.errors = {};
  }

  goToLanding(): void {
    this.router.navigate(['/creo/landing']);
  }
}
