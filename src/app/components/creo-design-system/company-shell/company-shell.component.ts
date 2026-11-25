import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreoWordmarkComponent } from '../creo-wordmark/creo-wordmark.component';
import { AuthService } from '../../../core/api/auth.service';
import { EmpresasService } from '../../../core/api/empresas.service';

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
export class CompanyShellComponent implements OnInit {
  @Input() activeScreen!: CompanyScreen;

  companyName = '';
  encargado = '';

  avatarOpen = false;
  notifOpen = false;
  mobileOpen = false;

  nav: NavItem[] = [
    { id: "company-home", label: "Inicio", icon: "home" },
    { id: "company-jobs", label: "Mis Ofertas", icon: "briefcase" },
    { id: "company-kanban", label: "Candidatos", icon: "kanban" },
    { id: "company-analytics", label: "Analítica", icon: "chart" },
  ];

  /** Aún no existe un endpoint de notificaciones para la empresa */
  notifications: NotificationItem[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private empresasService: EmpresasService
  ) {}

  /** GET /empresas/me: razón social y encargado de la empresa del token */
  ngOnInit(): void {
    this.empresasService.miEmpresa().subscribe({
      next: (empresa) => {
        this.companyName = empresa.razon_social;
        this.encargado = empresa.encargado_empresa;
      }
    });
  }

  get hasUnread(): boolean {
    return this.notifications.some(n => n.unread);
  }

  get initials(): string {
    return this.companyName
      .split(' ')
      .filter(w => w)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
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
