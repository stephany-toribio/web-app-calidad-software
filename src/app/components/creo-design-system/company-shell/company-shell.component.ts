import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../creo-wordmark/creo-wordmark.component';
import { AuthService } from '../../../core/api/auth.service';

export type CompanyScreen = "company-home" | "company-jobs" | "company-kanban" | "company-analytics";

interface NavItem {
  id: CompanyScreen;
  label: string;
  icon: string;
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  target: CompanyScreen;
  iconType: "applicant" | "closing";
}

@Component({
  selector: 'app-company-shell',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent],
  templateUrl: './company-shell.component.html',
  styleUrl: './company-shell.component.css'
})
export class CompanyShellComponent {
  @Input() activeScreen!: CompanyScreen;
  @Input() userName = 'Valeria';

  avatarOpen = false;
  notifOpen = false;
  mobileOpen = false;

  nav: NavItem[] = [
    { id: "company-home", label: "Inicio", icon: "home" },
    { id: "company-jobs", label: "Mis Ofertas", icon: "briefcase" },
    { id: "company-kanban", label: "Candidatos", icon: "kanban" },
    { id: "company-analytics", label: "Analítica", icon: "chart" },
  ];

  notifications: NotificationItem[] = [
    {
      id: "cn1",
      text: "Andrés Cárdenas (92% match) postuló a Senior React Developer",
      time: "Hace 10 min",
      unread: true,
      target: "company-kanban",
      iconType: "applicant",
    },
    {
      id: "cn2",
      text: "Nueva postulación de María Torres a Senior React Developer",
      time: "Hace 1 hora",
      unread: true,
      target: "company-kanban",
      iconType: "applicant",
    },
    {
      id: "cn3",
      text: "La vacante QA Engineer cierra en 6 días",
      time: "Ayer",
      unread: false,
      target: "company-jobs",
      iconType: "closing",
    },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  get hasUnread(): boolean {
    return this.notifications.some(n => n.unread);
  }

  get initials(): string {
    return this.userName.trim().slice(0, 2).toUpperCase() || 'VR';
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

  navigate(screen: CompanyScreen): void {
    this.mobileOpen = false;
    this.notifOpen = false;
    this.avatarOpen = false;
    this.router.navigate(['/creo', screen]);
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/creo/landing']),
      error: () => this.router.navigate(['/creo/landing']),
    });
  }
}
