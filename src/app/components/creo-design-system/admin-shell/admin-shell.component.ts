import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    { id: "admin-skills",     label: "Catálogo de Habilidades" },
    { id: "admin-moderation", label: "Moderación" },
    { id: "admin-audit",      label: "Auditoría" },
  ];

  constructor(private router: Router) {}

  navigate(s: AdminScreen) {
    this.router.navigate(['/creo', s]);
  }

  logout() {
    this.router.navigate(['/creo/landing']);
  }
}
