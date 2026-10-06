import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoSelectComponent } from '../../../components/creo-design-system/creo-select/creo-select.component';
import { CreoCardComponent } from '../../../components/creo-design-system/creo-card/creo-card.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';
import { CreoStepIndicatorComponent } from '../../../components/creo-design-system/creo-step-indicator/creo-step-indicator.component';

import { CREO_SECTORS } from '../../../data/creo-skills.data';
import { EmpresasService } from '../../../core/api/empresas.service';
import { RegistroEmpresaPayload } from '../../../core/api/models/registro-empresa.model';

type RucStatus = 'idle' | 'checking' | 'taken' | 'ok';

@Component({
  selector: 'app-creo-register-company',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreoWordmarkComponent,
    CreoBtnComponent,
    CreoFieldComponent,
    CreoSelectComponent,
    CreoCardComponent,
    CreoAlertComponent,
    CreoStepIndicatorComponent
  ],
  templateUrl: './creo-register-company.component.html',
  styleUrl: './creo-register-company.component.css'
})
export class CreoRegisterCompanyComponent {

  sectors = CREO_SECTORS;
  steps = ['Datos de empresa', 'Acceso y contacto', 'Resumen'];
  currentStep = 0;

  razSocial = '';
  descripcion = '';
  ruc = '';
  sector = '';
  website = '';
  email = '';
  password = '';
  contactName = '';

  rucStatus: RucStatus = 'idle';

  errors: Record<string, string> = {};
  showPassword = false;

  isValidating = false;
  isSubmitting = false;

  private readonly MAX_DESCRIPCION_CARACTERES = 250;
  private readonly MAX_CAMPO_CARACTERES = 255;
  private readonly MAX_PASSWORD_CARACTERES = 120;

  constructor(
    private router: Router,
    private empresasService: EmpresasService
  ) {}

  /*
   * Descripción
   */

  get descripcionCharCount(): number {
    return this.descripcion.length;
  }

  setDescripcion(value: string): void {
    this.descripcion = value.slice(
      0,
      this.MAX_DESCRIPCION_CARACTERES
    );

    this.removeError('descripcion');
  }

  /*
   * Contraseña
   */

  get passLength(): boolean {
    return this.password.length >= 8;
  }

  get passUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get passNumber(): boolean {
    return /[0-9]/.test(this.password);
  }

  get passSymbol(): boolean {
    return /[@#$%&]/.test(this.password);
  }

  get passMaxLength(): boolean {
    return this.password.length <= this.MAX_PASSWORD_CARACTERES;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /*
   * RUC
   */

  onRucKeypress(event: KeyboardEvent): void {
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  handleRucChange(value: string): void {
    this.ruc = value.replace(/\D/g, '').slice(0, 11);
    this.rucStatus = 'idle';
    this.removeError('ruc');
  }

  onRucInput(event: Event): void {
    this.handleRucChange(
      (event.target as HTMLInputElement).value
    );
  }

  get rucDigitsRemaining(): number {
    return Math.max(0, 11 - this.ruc.length);
  }

  /*
   * Correo
   */

  setEmail(value: string): void {
    this.email = value.slice(0, this.MAX_CAMPO_CARACTERES);
    this.removeError('email');
    this.removeError('emailTaken');
  }

  /*
   * Payload que entiende Laravel
   */

  private buildPayload(): RegistroEmpresaPayload {
    return {
      correo: this.email.trim(),
      password: this.password,
      encargado_empresa: this.contactName.trim(),
      razon_social: this.razSocial.trim(),
      sector: this.sector,
      ruc: this.ruc,
      sitio_web: this.website.trim() || null,
      descripcion: this.descripcion.trim() || null
    };
  }

  /*
   * Validaciones locales - Paso 1
   */

  validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!this.razSocial.trim()) {
      e['razSocial'] = 'La razón social es obligatoria';
    } else if (this.razSocial.length > this.MAX_CAMPO_CARACTERES) {
      e['razSocial'] = 'La razón social no puede superar los 255 caracteres';
    }

    if (this.descripcion.length > this.MAX_DESCRIPCION_CARACTERES) {
      e['descripcion'] = 'La descripción no puede superar los 250 caracteres';
    }

    if (!this.ruc.trim()) {
      e['ruc'] = 'El RUC es obligatorio';
    } else if (this.ruc.length !== 11) {
      e['ruc'] = 'El RUC debe tener 11 dígitos';
    }

    if (!this.sector) {
      e['sector'] = 'Selecciona el sector de tu empresa';
    }

    if (this.website.length > this.MAX_CAMPO_CARACTERES) {
      e['website'] = 'El sitio web no puede superar los 255 caracteres';
    } else if (
      this.website.trim() &&
      !/^https?:\/\/[^\s]+$/i.test(this.website.trim())
    ) {
      e['website'] = 'Ingresa una URL válida (ej. https://empresa.com)';
    }

    return e;
  }

  /*
   * Validaciones locales - Paso 2
   */

  validateStep2(): Record<string, string> {
    const e: Record<string, string> = {};

    if (!this.email.trim()) {
      e['email'] = 'El correo corporativo es obligatorio';
    } else if (this.email.length > this.MAX_CAMPO_CARACTERES) {
      e['email'] = 'El correo no puede superar los 255 caracteres';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim())) {
      e['email'] = 'Correo inválido';
    }

    if (!this.contactName.trim()) {
      e['contactName'] = 'El nombre del contacto es obligatorio';
    } else if (this.contactName.length > this.MAX_CAMPO_CARACTERES) {
      e['contactName'] = 'El nombre del contacto no puede superar los 255 caracteres';
    }

    if (!this.password) {
      e['password'] = 'La contraseña es obligatoria';
    } else if (
      !this.passLength ||
      !this.passUppercase ||
      !this.passNumber ||
      !this.passSymbol ||
      !this.passMaxLength
    ) {
      e['password'] =
        'La contraseña debe tener entre 8 y 120 caracteres, una mayúscula, un número y uno de estos símbolos: @ # $ % &';
    }

    return e;
  }

  /*
   * Navegación + Precognition
   */

  nextStep(): void {
    if (this.isValidating) {
      return;
    }

    if (this.currentStep === 0) {
      this.errors = this.validateStep1();

      if (this.hasErrors()) {
        return;
      }

      this.validarPrimerPaso();
      return;
    }

    if (this.currentStep === 1) {
      this.errors = this.validateStep2();

      if (this.hasErrors()) {
        return;
      }

      this.validarSegundoPaso();
    }
  }

  private validarPrimerPaso(): void {
    const payload = this.buildPayload();

    this.isValidating = true;
    this.rucStatus = 'checking';
    this.errors = {};

    this.empresasService.validarPaso(
      {
        razon_social: payload.razon_social,
        descripcion: payload.descripcion,
        ruc: payload.ruc,
        sector: payload.sector,
        sitio_web: payload.sitio_web
      },
      [
        'razon_social',
        'descripcion',
        'ruc',
        'sector',
        'sitio_web'
      ]
    ).subscribe({
      next: () => {
        this.isValidating = false;
        this.rucStatus = 'ok';
        this.currentStep = 1;
        this.scrollTop();
      },

      error: (error: HttpErrorResponse) => {
        this.isValidating = false;
        this.rucStatus = 'idle';
        this.mapBackendErrors(error);
      }
    });
  }

  private validarSegundoPaso(): void {
    const payload = this.buildPayload();

    this.isValidating = true;
    this.errors = {};

    this.empresasService.validarPaso(
      {
        correo: payload.correo,
        password: payload.password,
        encargado_empresa: payload.encargado_empresa
      },
      [
        'correo',
        'password',
        'encargado_empresa'
      ]
    ).subscribe({
      next: () => {
        this.isValidating = false;
        this.currentStep = 2;
        this.scrollTop();
      },

      error: (error: HttpErrorResponse) => {
        this.isValidating = false;
        this.mapBackendErrors(error);
      }
    });
  }

  /*
   * Registro definitivo
   */

  handleSubmit(event: Event): void {
    event.preventDefault();

    if (this.currentStep !== 2 || this.isSubmitting) {
      return;
    }

    const erroresPaso1 = this.validateStep1();
    const erroresPaso2 = this.validateStep2();

    this.errors = {
      ...erroresPaso1,
      ...erroresPaso2
    };

    if (this.hasErrors()) {
      return;
    }

    const payload = this.buildPayload();

    this.isSubmitting = true;
    this.errors = {};

    this.empresasService.registrar(payload).subscribe({
      next: () => {
        /*
         * La empresa ya fue creada.
         * Ahora iniciamos sesión con las mismas credenciales.
         */
        this.iniciarSesionDespuesDelRegistro(payload);
      },

      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.mapBackendErrors(error);
      }
    });
  }

  private iniciarSesionDespuesDelRegistro(
    payload: RegistroEmpresaPayload
  ): void {
    this.empresasService.login({
      correo: payload.correo,
      password: payload.password
    }).subscribe({
      next: (sesion) => {
        this.isSubmitting = false;

        localStorage.setItem('token', sesion.token);

        localStorage.setItem(
          'creo_user',
          JSON.stringify({
            usuario_id: sesion.usuario_id,
            correo: sesion.correo,
            rol: sesion.rol
          })
        );

        this.router.navigate(
          ['/creo/success/company'],
          {
            state: {
              name: this.razSocial
            }
          }
        );
      },

      error: () => {
        /*
         * IMPORTANTE:
         * En este punto la empresa YA fue registrada.
         * No mostramos "registro fallido".
         */
        this.isSubmitting = false;

        this.errors = {
          api:
            'La empresa fue registrada correctamente, pero no se pudo iniciar sesión automáticamente. Inicia sesión con la cuenta creada.'
        };
      }
    });
  }

  /*
   * Errores Laravel -> formulario Angular
   */

  private mapBackendErrors(error: HttpErrorResponse): void {
    const mapped: Record<string, string> = {};

    if (error.status === 0) {
      mapped['api'] =
        'No se pudo conectar con el servidor. Verifica que la API esté disponible.';

      this.errors = mapped;
      return;
    }

    const backendErrors = error.error?.errors;

    if (backendErrors && typeof backendErrors === 'object') {
      for (const [campo, mensajes] of Object.entries(backendErrors)) {
        const mensaje = Array.isArray(mensajes)
          ? String(mensajes[0])
          : String(mensajes);

        switch (campo) {
          case 'correo':
            mapped['email'] = mensaje;
            break;

          case 'password':
            mapped['password'] = mensaje;
            break;

          case 'encargado_empresa':
            mapped['contactName'] = mensaje;
            break;

          case 'razon_social':
            mapped['razSocial'] = mensaje;
            break;

          case 'sector':
            mapped['sector'] = mensaje;
            break;

          case 'ruc':
            mapped['ruc'] = mensaje;

            if (
              mensaje.toLowerCase().includes('registr') ||
              mensaje.toLowerCase().includes('tomado') ||
              mensaje.toLowerCase().includes('unique')
            ) {
              this.rucStatus = 'taken';
            }

            break;

          case 'sitio_web':
            mapped['website'] = mensaje;
            break;

          case 'descripcion':
            mapped['descripcion'] = mensaje;
            break;

          default:
            mapped['api'] = mensaje;
        }
      }
    }

    if (Object.keys(mapped).length === 0) {
      mapped['api'] =
        error.error?.message ??
        'Ocurrió un error al procesar la solicitud.';
    }

    this.errors = mapped;
  }

  private removeError(campo: string): void {
    if (!this.errors[campo]) {
      return;
    }

    const { [campo]: _, ...rest } = this.errors;
    this.errors = rest;
  }

  private scrollTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  prevStep(): void {
    if (this.currentStep > 0) {
      this.currentStep -= 1;
      this.scrollTop();
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
    this.errors = {};
    this.scrollTop();
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  goToLanding(): void {
    this.router.navigate(['/creo/landing']);
  }
}
