import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../creo-wordmark/creo-wordmark.component';
import { AuthService } from '../../../core/api/auth.service';
import { CandidatosService } from '../../../core/api/candidatos.service';

export type CandidateScreen = "candidate-dashboard" | "candidate-jobs" | "candidate-applications" | "candidate-saved" | "candidate-profile";

interface NavItem {
  id: CandidateScreen;
  label: string;
  icon: string;
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  target: CandidateScreen;
}

@Component({
  selector: 'app-candidate-shell',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent],
  templateUrl: './candidate-shell.component.html',
  styleUrl: './candidate-shell.component.css'
})
export class CandidateShellComponent implements OnInit {
  @Input() activeScreen!: CandidateScreen;

  displayName = '';

  avatarOpen = false;
  notifOpen = false;
  mobileOpen = false;

  nav: NavItem[] = [
    { id: "candidate-dashboard", label: "Dashboard", icon: "home" },
    { id: "candidate-jobs", label: "Empleos", icon: "search" },
    { id: "candidate-applications", label: "Mis Postulaciones", icon: "briefcase" },
    { id: "candidate-saved", label: "Guardados", icon: "bookmark" },
    { id: "candidate-profile", label: "Mi Perfil", icon: "user" },
  ];

  /** Aún no existe un endpoint de notificaciones para el candidato */
  notifications: NotificationItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private candidatosService: CandidatosService
  ) { }

  /** Nombre real del candidato del token */
  ngOnInit(): void {
    this.candidatosService.obtenerMiPerfil().subscribe({
      next: (perfil) => this.displayName = `${perfil.nombre} ${perfil.apellidos}`.trim()
    });
  }

  get correo(): string {
    return this.authService.getUser()?.correo ?? '';
  }

  get initials(): string {
    const name = this.displayName;
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  get hasUnread(): boolean {
    return this.notifications.some(n => n.unread);
  }

  markAllRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, unread: false }));
  }

  toggleNotif(): void {
    this.notifOpen = !this.notifOpen;
    if (this.notifOpen) this.avatarOpen = false;
  }

  toggleAvatar(): void {
    this.avatarOpen = !this.avatarOpen;
    if (this.avatarOpen) this.notifOpen = false;
  }

  navigate(s: CandidateScreen) {
    this.mobileOpen = false;
    this.notifOpen = false;
    this.avatarOpen = false;
    this.router.navigate(['/creo', s]);
  }

  logout() {
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
