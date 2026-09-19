import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';

export const STATS = [
  { value: '2,400+', label: 'Egresados empleados' },
  { value: '380', label: 'Empresas aliadas' },
  { value: '96%', label: 'Satisfacción' },
];

export const MAX_ATTEMPTS = 5;

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

  @Input() onNavigate?: (s: string, data?: Record<string, string>) => void;
  @Output() navigate = new EventEmitter<{ s: string; data?: Record<string, string> }>();

  email = signal<string>('');
  password = signal<string>('');
  errors = signal<Record<string, string>>({});
  attempted = signal<boolean>(false);
  failedAttempts = signal<number>(0);

  stats = STATS;

  isLocked = computed(() => this.failedAttempts() >= MAX_ATTEMPTS);
  hasFieldErrors = computed(() => {
    const errs = this.errors();
    return this.attempted() && !errs['auth'] && Object.keys(errs).length > 0;
  });

  setEmail(val: string) {
    this.email.set(val);
  }

  setPassword(val: string) {
    this.password.set(val);
  }

  validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const emailVal = this.email();
    const passVal = this.password();

    if (!emailVal.trim()) {
      e['email'] = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      e['email'] = 'Ingresa un correo válido';
    }

    if (!passVal.trim()) {
      e['password'] = 'La contraseña es obligatoria';
    } else if (passVal.length < 6) {
      e['password'] = 'Mínimo 6 caracteres';
    }

    return e;
  }

  handleSubmit(e: Event) {
    e.preventDefault();
    if (this.isLocked()) return;

    const errs = this.validate();
    this.errors.set(errs);
    this.attempted.set(true);

    if (Object.keys(errs).length === 0) {
      const emailVal = this.email();

      // Admin override: admin@creo.pe → panel de administrador
      if (emailVal.trim().toLowerCase() === 'admin@creo.pe') {
        this.doNavigate('admin-dashboard', { name: 'Administrador' });
        return;
      }

      const name = emailVal.split('@')[0].replace(/[._]/g, ' ').trim() || 'usuario';
      // Resolución simulada del rol a partir del correo (demo)
      const target = emailVal.toLowerCase().includes('empresa') ? 'company-home' : 'candidate-dashboard';
      this.doNavigate(target, { name });
    } else {
      this.failedAttempts.update((n) => n + 1);
    }
  }

  doNavigate(s: string, data?: Record<string, string>) {
    if (this.onNavigate) {
      this.onNavigate(s, data);
    }
    this.navigate.emit({ s, data });
    this.router.navigate(['/creo', s]);
  }
}