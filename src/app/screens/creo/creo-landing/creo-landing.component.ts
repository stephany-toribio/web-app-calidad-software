import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';

import { AuthService } from '../../../core/api/auth.service';

export const STATS = [
  { value: '2,400+', label: 'Egresados empleados' },
  { value: '380', label: 'Empresas aliadas' },
  { value: '96%', label: 'Satisfacción' },
];

@Component({
  selector: 'app-creo-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CreoWordmarkComponent,
    CreoBtnComponent,
    CreoFieldComponent,
    CreoAlertComponent,
  ],
  templateUrl: './creo-landing.component.html',
  styleUrls: ['./creo-landing.component.css'],
})
export class CreoLandingComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  @Input() onNavigate?: (
    s: string,
    data?: Record<string, string>
  ) => void;

  @Output() navigate =
    new EventEmitter<{ s: string; data?: Record<string, string> }>();

  email = signal<string>('');
  password = signal<string>('');
  errors = signal<Record<string, string>>({});
  attempted = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  sessionMessage = signal<string>('');

  stats = STATS;

  constructor() {
    if (this.route.snapshot.queryParamMap.get('sessionExpired') === 'true') {
      this.sessionMessage.set(
        'Tu sesión expiró. Inicia sesión nuevamente.'
      );
    }
  }

  hasFieldErrors = computed(() => {
    const errs = this.errors();

    return (
      this.attempted() &&
      !errs['auth'] &&
      Object.keys(errs).length > 0
    );
  });

  setEmail(value: string): void {
    this.email.set(value);
    this.errors.set({});
  }

  setPassword(value: string): void {
    this.password.set(value);
    this.errors.set({});
  }

  validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    const email = this.email().trim();
    const password = this.password();

    if (!email) {
      errors['email'] = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors['email'] = 'Ingresa un correo válido';
    }

    if (!password.trim()) {
      errors['password'] = 'La contraseña es obligatoria';
    }

    return errors;
  }

  handleSubmit(event: Event): void {
    event.preventDefault();

    if (this.isSubmitting()) {
      return;
    }

    this.attempted.set(true);

    const validationErrors = this.validate();
    this.errors.set(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    this.isSubmitting.set(true);
    this.errors.set({});

    this.authService.login({
      correo: this.email().trim(),
      password: this.password()
    }).subscribe({
      next: (sesion) => {
        this.isSubmitting.set(false);

        this.saveSession(
          sesion.token,
          sesion.usuario_id,
          sesion.correo,
          sesion.rol
        );

        const name =
          sesion.correo
            .split('@')[0]
            .replace(/[._]/g, ' ')
            .trim() || 'usuario';

        switch (sesion.rol) {
          case 'admin':
            this.doNavigate(
              'admin-dashboard',
              { name: 'Administrador' }
            );
            break;

          case 'empresa':
            this.doNavigate(
              'company-home',
              { name }
            );
            break;

          case 'candidato':
            this.doNavigate(
              'candidate-dashboard',
              { name }
            );
            break;

          default:
            this.clearSession();

            this.errors.set({
              auth: 'El rol de esta cuenta no tiene acceso al sistema.'
            });
            break;
        }
      },

      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);

        if (error.status === 401) {
          this.errors.set({
            auth: 'Correo o contraseña incorrectos.'
          });
          return;
        }

        if (error.status === 403) {
          this.errors.set({
            auth: 'Esta cuenta no tiene permiso para acceder.'
          });
          return;
        }

        if (error.status === 422) {
          this.errors.set({
            auth: 'Verifica los datos ingresados.'
          });
          return;
        }

        if (error.status === 429) {
          this.errors.set({
            auth: 'Demasiados intentos. Inténtalo nuevamente más tarde.'
          });
          return;
        }

        if (error.status === 0) {
          this.errors.set({
            auth: 'No se pudo conectar con el servidor.'
          });
          return;
        }

        this.errors.set({
          auth: 'No se pudo iniciar sesión. Inténtalo nuevamente.'
        });
      }
    });
  }

  doNavigate(
    screen: string,
    data?: Record<string, string>
  ): void {
    if (this.onNavigate) {
      this.onNavigate(screen, data);
    }

    this.navigate.emit({
      s: screen,
      data
    });

    this.router.navigate(['/creo', screen]);
  }

  private saveSession(
    token: string,
    usuarioId: number,
    correo: string,
    rol: string
  ): void {
    localStorage.setItem('token', token);

    localStorage.setItem(
      'creo_user',
      JSON.stringify({
        usuario_id: usuarioId,
        correo,
        rol
      })
    );
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('creo_user');
  }
}
