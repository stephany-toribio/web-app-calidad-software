import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { AuthService } from '../../../core/api/auth.service';
import { RecuperacionPasswordService } from '../../../core/api/recuperacion-password.service';
import { erroresDesdeApi } from '../../../core/api/mappers/errores-api.mapper';

type Paso = 'correo' | 'codigo' | 'nueva' | 'listo';

/** Igual que el backend: no se reenvía un código antes de 60 s */
const ESPERA_REENVIO = 60;

const MENSAJE_GENERICO = 'Ocurrió un error inesperado. Inténtalo más tarde.';

@Component({
  selector: 'app-creo-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent],
  templateUrl: './creo-forgot-password.component.html',
  styleUrl: './creo-forgot-password.component.css'
})
export class CreoForgotPasswordComponent implements OnDestroy {
  private router = inject(Router);
  private recuperacion = inject(RecuperacionPasswordService);
  private authService = inject(AuthService);

  paso: Paso = 'correo';

  email = '';
  codigo = '';
  password = '';
  passwordConfirm = '';
  showPassword = false;
  showPasswordConfirm = false;

  errores: Record<string, string> = {};
  loading = false;
  segundosReenvio = 0;

  /** Solo en memoria: nunca en localStorage, URL ni consola */
  private resetToken = '';
  /** Correo al que ya se pidió un código (para no repetir la petición dentro de los 60 s) */
  private correoSolicitado = '';
  private temporizador?: ReturnType<typeof setInterval>;

  // ---------------------------------------------------------------- Política de contraseña (igual que el registro)

  get passLength() { return this.password.length >= 8; }
  get passUppercase() { return /[A-Z]/.test(this.password); }
  get passNumber() { return /[0-9]/.test(this.password); }
  get passSymbol() { return /[@#$%&]/.test(this.password); }

  get numeroPaso(): number {
    return { correo: 1, codigo: 2, nueva: 3, listo: 3 }[this.paso];
  }

  // ---------------------------------------------------------------- Paso 1: correo

  handleSubmit(e: Event) {
    e.preventDefault();
    this.solicitar();
  }

  onEmailChange(value: string) {
    this.email = value;
    delete this.errores['email'];
    delete this.errores['api'];
  }

  /** Paso 1 (también sirve para "Reenviar código") */
  solicitar() {
    const correo = this.email.trim();

    if (!correo) { this.errores = { email: 'El correo es obligatorio' }; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { this.errores = { email: 'Ingresa un correo válido' }; return; }

    // Volvió al paso 1 con el mismo correo dentro de los 60 s: el backend no enviaría otro código, así que se sigue con el anterior
    if (this.segundosReenvio > 0 && correo === this.correoSolicitado) {
      this.errores = {};
      this.paso = 'codigo';
      return;
    }

    this.llamar(this.recuperacion.solicitarCodigo(correo), () => {
      this.correoSolicitado = correo;
      this.codigo = '';
      this.paso = 'codigo';
      this.iniciarEspera();
    });
  }

  // ---------------------------------------------------------------- Paso 2: código

  setCodigo(value: string) {
    this.codigo = value.replace(/\D/g, '').slice(0, 6);
    delete this.errores['codigo'];
    delete this.errores['api'];
  }

  verificar(e?: Event) {
    e?.preventDefault();
    if (!/^\d{6}$/.test(this.codigo)) { this.errores = { codigo: 'Ingresa los 6 dígitos del código' }; return; }

    this.llamar(this.recuperacion.verificarCodigo(this.email.trim(), this.codigo), respuesta => {
      this.resetToken = respuesta.reset_token;
      this.codigo = '';
      this.paso = 'nueva';
    });
  }

  /** Volver al paso 1 para cambiar el correo */
  cambiarCorreo() {
    this.errores = {};
    this.codigo = '';
    this.paso = 'correo';
  }

  // ---------------------------------------------------------------- Paso 3: nueva contraseña

  restablecer(e?: Event) {
    e?.preventDefault();

    const errores: Record<string, string> = {};
    if (!this.password) {
      errores['password'] = 'La contraseña es obligatoria';
    } else if (!(this.passLength && this.passUppercase && this.passNumber && this.passSymbol)) {
      errores['password'] = 'La contraseña no cumple con los requisitos';
    }
    if (!this.passwordConfirm) {
      errores['passwordConfirm'] = 'Confirma tu contraseña';
    } else if (this.password !== this.passwordConfirm) {
      errores['passwordConfirm'] = 'Las contraseñas no coinciden';
    }
    if (Object.keys(errores).length) { this.errores = errores; return; }

    this.llamar(this.recuperacion.restablecer({
      correo: this.email.trim(),
      reset_token: this.resetToken,
      password: this.password,
      password_confirmation: this.passwordConfirm,
    }), () => {
      this.resetToken = '';
      this.password = '';
      this.passwordConfirm = '';
      this.authService.clearSession();   // el backend revocó todos los tokens
      this.detenerEspera();
      this.paso = 'listo';
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  togglePasswordConfirm() { this.showPasswordConfirm = !this.showPasswordConfirm; }

  onPasswordChange() {
    delete this.errores['password'];
    delete this.errores['api'];
  }

  onPasswordConfirmChange() {
    delete this.errores['passwordConfirm'];
  }

  // ---------------------------------------------------------------- Comunes

  goToLanding() {
    this.router.navigate(['/creo/landing']);
  }

  private llamar<T>(peticion: Observable<T>, alTerminar: (respuesta: T) => void) {
    this.loading = true;
    this.errores = {};
    peticion.subscribe({
      next: respuesta => { this.loading = false; alTerminar(respuesta); },
      error: (err: HttpErrorResponse) => {
        this.loading = false;

        // Proceso vencido o ya usado: empezar de nuevo desde el correo
        if (err.error?.error_code === 'TOKEN_INVALIDO') {
          this.resetToken = '';
          this.password = '';
          this.passwordConfirm = '';
          this.segundosReenvio = 0;
          this.paso = 'correo';
        }

        const errores = erroresDesdeApi(err);

        // Solo se muestran tal cual los mensajes conocidos (422 y sin conexión); el resto, uno genérico
        if (errores['api'] && err.status !== 422 && err.status !== 0) {
          errores['api'] = MENSAJE_GENERICO;
        }
        // Un 422 de la contraseña puede traer errores de campos que esta pantalla no tiene
        if (this.paso === 'nueva' && errores['password'] === undefined && errores['passwordConfirm'] === undefined && !errores['api']) {
          errores['api'] = MENSAJE_GENERICO;
        }

        this.errores = errores;
      },
    });
  }

  private iniciarEspera() {
    this.detenerEspera();
    this.segundosReenvio = ESPERA_REENVIO;
    this.temporizador = setInterval(() => {
      if (--this.segundosReenvio <= 0) this.detenerEspera();
    }, 1000);
  }

  private detenerEspera() {
    clearInterval(this.temporizador);
    this.temporizador = undefined;
    if (this.segundosReenvio < 0) this.segundosReenvio = 0;
  }

  ngOnDestroy() {
    this.detenerEspera();
    this.resetToken = '';
  }
}
