import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';

type ActionType = "suspend" | "reactivate" | "skill" | "job" | "password" | "config";

interface AuditEntry {
  id: string;
  actor: string;
  datetime: string;
  actionType: ActionType;
  action: string;
  before: string;
  after: string;
}

const ALL_ENTRIES: AuditEntry[] = [
  { id: "au1", actor: "admin@creo.pe", datetime: "12 Oct 2026 · 14:32", actionType: "suspend", action: "Suspendió cuenta", before: "Activo", after: "Suspendido — Datos de perfil falsos" },
  { id: "au2", actor: "admin@creo.pe", datetime: "12 Oct 2026 · 11:05", actionType: "job", action: "Despublicó vacante", before: "Publicada — Desarrollador PHP Senior", after: "Rechazada por Moderación — Contenido engañoso" },
  { id: "au3", actor: "supervisor@creo.pe", datetime: "11 Oct 2026 · 17:48", actionType: "skill", action: "Agregó habilidad al catálogo", before: "—", after: '"Rust" · Tecnología · Activa' },
  { id: "au4", actor: "admin@creo.pe", datetime: "11 Oct 2026 · 09:20", actionType: "password", action: "Restablecimiento de contraseña", before: "Contraseña existente", after: "Enlace temporal enviado a sofia.q@correo.com" },
  { id: "au5", actor: "supervisor@creo.pe", datetime: "10 Oct 2026 · 16:11", actionType: "skill", action: "Desactivó habilidad", before: '"MATLAB" · Activa', after: '"MATLAB" · Inactiva' },
  { id: "au6", actor: "admin@creo.pe", datetime: "10 Oct 2026 · 13:04", actionType: "suspend", action: "Suspendió cuenta empresa", before: "Activo — Nexus Digital SRL", after: "Suspendido — Vacantes con contenido engañoso repetido" },
  { id: "au7", actor: "supervisor@creo.pe", datetime: "09 Oct 2026 · 10:33", actionType: "reactivate", action: "Reactivó cuenta candidato", before: "Suspendido — miguel.t@pucp.edu.pe", after: "Activo" },
  { id: "au8", actor: "admin@creo.pe", datetime: "08 Oct 2026 · 15:57", actionType: "job", action: "Aprobó vacante reportada", before: "Pendiente moderación — Practicante Contabilidad", after: "Publicada — Reporte descartado" },
  { id: "au9", actor: "admin@creo.pe", datetime: "07 Oct 2026 · 08:14", actionType: "config", action: "Modificó configuración del sistema", before: "Verificación de email: desactivada", after: "Verificación de email: activada" },
];

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './admin-audit.component.html',
  styleUrl: './admin-audit.component.css'
})
export class AdminAuditComponent {
  entries = [...ALL_ENTRIES];
  filter: "all" | ActionType = "all";

  dateFrom = '';
  dateTo = '';

  get filteredEntries() {
    return this.entries.filter(e => this.filter === 'all' || e.actionType === this.filter);
  }

  getActionLabel(type: ActionType) {
    const map: Record<ActionType, string> = {
      suspend:    "Suspensión",
      reactivate: "Reactivación",
      skill:      "Catálogo",
      job:        "Vacantes",
      password:   "Contraseñas",
      config:     "Configuración",
    };
    return map[type];
  }

  getActionStyle(type: ActionType) {
    const map: Record<ActionType, { bg: string; text: string }> = {
      suspend:    { bg: "#FEE2E2", text: "#DC2626" },
      reactivate: { bg: "#DCFCE7", text: "#15803D" },
      skill:      { bg: "#EDE9FE", text: "#6D28D9" },
      job:        { bg: "#FEF3C7", text: "#B45309" },
      password:   { bg: "#EFF6FF", text: "#1D4ED8" },
      config:     { bg: "#F1F5F9", text: "#475569" },
    };
    return map[type];
  }

  trackById(index: number, entry: AuditEntry) {
    return entry.id;
  }
}
