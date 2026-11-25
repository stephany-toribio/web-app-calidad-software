import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/api/auth.service';
import { CreoWordmarkComponent } from '../creo-wordmark/creo-wordmark.component';

export type AdminScreen = "admin-dashboard" | "admin-accounts" | "admin-skills" | "admin-moderation" | "admin-audit";

interface NavItem {
  id: AdminScreen;
  label: string;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.css'
})
export class AdminShellComponent {
  @Input() activeScreen!: AdminScreen;
  
  nav: NavItem[] = [
    { id: "admin-dashboard",  label: "Dashboard" },
    { id: "admin-accounts",   label: "Cuentas" },
    { id: "admin-skills",     label: "Habilitar / Deshabilitar" },
    { id: "admin-moderation", label: "Revisión" },
    { id: "admin-audit",      label: "Auditoría" },
  ];

  constructor(private router: Router, private authService: AuthService) {}

    showProximamente = false;

  navigate(s: AdminScreen) {
    this.router.navigate(['/creo', s]);
  }

  logout() {
    // Cierra sesión en el back y borra token + usuario de localStorage (AuthService.logout)
    const token = this.authService.getToken();

    const navegarAlInicio = () => {
      const actual = this.authService.getToken();

      if (actual === null || actual === token) {
        void this.router.navigate(['/creo/landing']);
      }
    };

    this.authService.logout().subscribe({
      complete: navegarAlInicio,
      error: navegarAlInicio,
    });
  }
}
