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

@Component({
  selector: 'app-candidate-shell',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent],
  templateUrl: './candidate-shell.component.html',
  styleUrl: './candidate-shell.component.css'
})
export class CandidateShellComponent {
  @Input() activeScreen!: CandidateScreen;

  // We map an SVG path string or an icon name here
  nav: NavItem[] = [
    { id: "candidate-dashboard", label: "Dashboard", icon: "home" },
    { id: "candidate-jobs", label: "Empleos", icon: "search" },
    { id: "candidate-applications", label: "Mis Postulaciones", icon: "briefcase" },
    { id: "candidate-saved", label: "Guardados", icon: "bookmark" },
    { id: "candidate-profile", label: "Mi Perfil", icon: "user" },
  ];

  constructor(private router: Router, private authService: AuthService) {}

  logout() {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/creo/landing']),
      error: () => this.router.navigate(['/creo/landing']),
    });
  }
  
  navigate(s: CandidateScreen) {
    this.router.navigate(['/creo', s]);
  }
}
