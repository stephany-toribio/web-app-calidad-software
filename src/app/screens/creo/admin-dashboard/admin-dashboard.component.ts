import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminShellComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  weeks = ["S1 Oct", "S2 Oct", "S3 Oct", "S4 Oct"];
  weekCandidates = [48, 72, 61, 85];
  weekCompanies = [4, 9, 6, 11];

  maxVal = Math.max(...this.weekCandidates, ...this.weekCompanies);

  getBarHeight(val: number): string {
    return `${(val / this.maxVal) * 100}%`;
  }

  activity = [
    { time: "Hace 8 min", icon: "user", text: "Nueva cuenta candidato: lucia.ramos@gmail.com" },
    { time: "Hace 22 min", icon: "alert", text: "Vacante reportada: 'Desarrollador PHP' — Contenido engañoso" },
    { time: "Hace 1h", icon: "user", text: "Nueva cuenta empresa: Fintech Innova" },
    { time: "Hace 2h", icon: "skill", text: "Habilidad 'Rust' agregada al catálogo por admin@creo.pe" },
    { time: "Hace 3h", icon: "lock", text: "Cuenta suspendida: jorge.m@empresa.com — Datos falsos" },
  ];

  iconMap: Record<string, { bg: string }> = {
    user: { bg: "#EFF6FF" },
    alert: { bg: "#FEF2F2" },
    skill: { bg: "#F0FDF4" },
    lock: { bg: "#FEF3C7" },
  };

  sparklines = [
    { label: "Candidatos / semana", values: [28, 41, 35, 52, 48, 61, 55, 72, 63, 80, 74, 85], color: "#F2B705" },
    { label: "Vacantes publicadas / semana", values: [6, 9, 7, 12, 10, 14, 11, 16, 13, 18, 15, 20], color: "#3B82F6" },
    { label: "Postulaciones / semana", values: [88, 120, 105, 148, 132, 158, 145, 175, 160, 192, 178, 210], color: "#22C55E" },
  ];

  getSparklineD(values: number[]): string {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const W = 280;
    const H = 56;
    const step = W / (values.length - 1);
    const pts = values.map((v, i) => [i * step, H - ((v - min) / range) * (H - 8) - 4]);
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  }

  getSparklineArea(values: number[]): string {
    const W = 280;
    const H = 56;
    return `${this.getSparklineD(values)} L${W},${H} L0,${H} Z`;
  }

  getSparklineEndPt(values: number[]): [number, number] {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const W = 280;
    const H = 56;
    const v = values[values.length - 1];
    return [W, H - ((v - min) / range) * (H - 8) - 4];
  }
}
