import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../creo-wordmark/creo-wordmark.component';
import { AuthService } from '../../../core/api/auth.service';

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
export class CandidateShellComponent {
  @Input() activeScreen!: CandidateScreen;
  @Input() userName: string = 'Valeria Rojas';

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

  notifications: NotificationItem[] = [
    {
      id: "n1",
      text: "Tu postulación a Senior React Developer cambió a Entrevista",
      time: "Hace 2 horas",
      unread: true,
      target: "candidate-applications",
    },
    {
      id: "n2",
      text: "TechCorp SA vio tu perfil",
      time: "Hace 5 horas",
      unread: true,
      target: "candidate-profile",
    },
    {
      id: "n3",
      text: "Nueva vacante recomendada: DevOps Engineer, 65% match",
      time: "Hace 1 día",
      unread: false,
      target: "candidate-jobs",
    },
    {
      id: "n4",
      text: "Tu vacante guardada 'Full Stack PHP Developer' cierra en 2 días",
      time: "Hace 2 días",
      unread: false,
      target: "candidate-saved",
    },
  ];

  constructor(private router: Router, private authService: AuthService) { }

  get correo(): string {
    return this.authService.getUser()?.correo ?? '';
  }

  get displayName(): string {
    if (this.userName && this.userName !== 'Valeria Rojas') {
      return this.userName;
    }
    const user = this.authService.getUser();
    if (user?.correo) {
      const prefix = user.correo.split('@')[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    return this.userName;
  }

  get initials(): string {
    const name = this.displayName;
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || 'VR';
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
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/creo/landing']),
      error: () => this.router.navigate(['/creo/landing']),
    });
  }
}
