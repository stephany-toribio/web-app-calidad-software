import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';

@Component({
  selector: 'app-creo-forgot-password',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent],
  templateUrl: './creo-forgot-password.component.html',
  styleUrl: './creo-forgot-password.component.css'
})
export class CreoForgotPasswordComponent {
  email = '';
  error = '';
  sent = false;
  loading = false;

  constructor(private router: Router) { }

  handleSubmit(e: Event) {
    e.preventDefault();
    if (!this.email.trim()) { this.error = 'El correo es obligatorio'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) { this.error = 'Ingresa un correo válido'; return; }
    this.error = '';
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
      this.sent = true;
    }, 1200);
  }

  onEmailChange(value: string) {
    this.email = value;
    this.error = '';
  }

  resetForm() {
    this.sent = false;
    this.email = '';
  }

  goToLanding() {
    this.router.navigate(['/creo/landing']);
  }
}