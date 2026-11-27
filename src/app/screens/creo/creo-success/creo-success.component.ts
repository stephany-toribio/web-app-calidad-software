import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';

type Role = 'candidate' | 'company';

interface SuccessContent {
  badge: string;
  headline: (name: string) => string;
  body: string;
  primaryCta: string;
  primaryRoute: string;
  secondaryCta: string;
  secondaryRoute: string;
  items: string[];
}

const CONTENT: Record<Role, SuccessContent> = {
  candidate: {
    badge: 'Cuenta creada',
    headline: (name) => `¡Bienvenido, ${name}!`,
    body: 'Tu perfil está listo. Ahora puedes explorar ofertas de empleo y conectar con las mejores empresas del Perú.',
    primaryCta: 'Explorar empleos',
    primaryRoute: '/creo/candidate-dashboard',
    secondaryCta: 'Ver mi perfil',
    secondaryRoute: '/creo/candidate-profile',
    items: [
      'Perfil de habilidades registrado',
      'Acceso a ofertas verificadas por CREO+',
      'Alertas de empleos según tu carrera',
    ],
  },
  company: {
    badge: 'Empresa registrada',
    headline: (name) => `¡Bienvenida, ${name}!`,
    body: 'Tu cuenta corporativa fue creada. Ya puedes publicar vacantes y acceder al panel de reclutamiento.',
    primaryCta: 'Ir al panel',
    primaryRoute: '/creo/company-home',
    secondaryCta: 'Crear primera vacante',
    secondaryRoute: '/creo/company-create-job',
    items: [
      'Datos de empresa recibidos',
      'Verificación en proceso (24–48 h)',
      'Acceso a base de candidatos verificados',
    ],
  },
};

@Component({
  selector: 'app-creo-success',
  standalone: true,
  imports: [CommonModule, CreoWordmarkComponent, CreoBtnComponent],
  templateUrl: './creo-success.component.html',
  styleUrl: './creo-success.component.css'
})
export class CreoSuccessComponent implements OnInit {
  role: Role = 'candidate';
  name = '';

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    // El :role viene de la ruta; el name viaja en el state de router.navigate del paso anterior
    const roleParam = this.route.snapshot.paramMap.get('role');
    this.role = roleParam === 'company' ? 'company' : 'candidate';

    const state = this.router.getCurrentNavigation()?.extras?.state
      ?? (history.state as { name?: string } | undefined);
    this.name = state?.name ?? '';
  }

  get content(): SuccessContent {
    return CONTENT[this.role];
  }

  get displayName(): string {
    return this.name || (this.role === 'candidate' ? 'candidato' : 'empresa');
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}