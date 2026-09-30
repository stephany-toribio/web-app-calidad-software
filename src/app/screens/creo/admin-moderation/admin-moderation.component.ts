import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';

type ReportStatus = "pending" | "unpublished" | "approved";

interface ReportedJob {
  id: string;
  title: string;
  company: string;
  reportedAt: string;
  reason: string;
  status: ReportStatus;
  unpublishReason?: string;
}

const INITIAL_REPORTS: ReportedJob[] = [
  { id: "r1", title: "Analista de Marketing Digital", company: "Growth Partners SAC", reportedAt: "12 Oct 2026", reason: "Contenido engañoso", status: "pending" },
  { id: "r2", title: "Desarrollador PHP Senior", company: "Nexus Digital SRL", reportedAt: "11 Oct 2026", reason: "Salario no especificado correctamente", status: "pending" },
  { id: "r3", title: "Ejecutivo de Ventas", company: "Distribuidora Lima SA", reportedAt: "10 Oct 2026", reason: "Requisitos discriminatorios", status: "pending" },
  { id: "r4", title: "Practicante de Contabilidad", company: "Auditores & Asociados", reportedAt: "09 Oct 2026", reason: "Modalidad laboral incorrecta", status: "approved" },
  { id: "r5", title: "Community Manager", company: "Agencia Creativa 360", reportedAt: "08 Oct 2026", reason: "Contacto externo sospechoso", status: "unpublished", unpublishReason: "La oferta solicitaba pagos al candidato para acceder al proceso." },
];

@Component({
  selector: 'app-admin-moderation',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './admin-moderation.component.html',
  styleUrl: './admin-moderation.component.css'
})
export class AdminModerationComponent implements OnDestroy {
  reports = [...INITIAL_REPORTS];
  filter: "all" | ReportStatus = "pending";
  
  toast: string | null = null;
  toastTimeout: any;

  unpublishing: ReportedJob | null = null;
  unpublishReason = '';
  unpublishError = '';

  ngOnDestroy() {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  get filteredReports() {
    return this.reports.filter(r => this.filter === 'all' || r.status === this.filter);
  }

  get pendingCount() {
    return this.reports.filter(r => r.status === 'pending').length;
  }

  showToast(msg: string) {
    this.toast = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toast = null, 3500);
  }

  getReasonStyle(reason: string) {
    const map: Record<string, { bg: string; text: string }> = {
      "Contenido engañoso":               { bg: "#FEE2E2", text: "#DC2626" },
      "Salario no especificado correctamente": { bg: "#FEF3C7", text: "#B45309" },
      "Requisitos discriminatorios":      { bg: "#FEE2E2", text: "#DC2626" },
      "Modalidad laboral incorrecta":     { bg: "#F0F9FF", text: "#0369A1" },
      "Contacto externo sospechoso":      { bg: "#FEF3C7", text: "#B45309" },
    };
    return map[reason] ?? { bg: "#F1F5F9", text: "#475569" };
  }

  getStatusStyle(status: ReportStatus) {
    const map: Record<ReportStatus, { bg: string; text: string; label: string }> = {
      pending:     { bg: "#FEF3C7", text: "#B45309", label: "Pendiente" },
      unpublished: { bg: "#FEE2E2", text: "#DC2626", label: "Despublicada" },
      approved:    { bg: "#DCFCE7", text: "#15803D", label: "Aprobada" },
    };
    return map[status];
  }

  beginUnpublish(r: ReportedJob) {
    this.unpublishing = r;
    this.unpublishReason = '';
    this.unpublishError = '';
  }

  confirmUnpublish() {
    if (!this.unpublishReason.trim()) {
      this.unpublishError = "Debes ingresar un motivo para despublicar";
      return;
    }
    if (this.unpublishing) {
      const idx = this.reports.findIndex(r => r.id === this.unpublishing!.id);
      if (idx !== -1) {
        this.reports[idx].status = 'unpublished';
        this.reports[idx].unpublishReason = this.unpublishReason;
      }
      this.showToast('Vacante despublicada. Se notificó a la empresa.');
      this.unpublishing = null;
    }
  }

  approve(r: ReportedJob) {
    const idx = this.reports.findIndex(x => x.id === r.id);
    if (idx !== -1) {
      this.reports[idx].status = 'approved';
      this.showToast('Reporte descartado. La vacante permanece publicada.');
    }
  }

  trackById(index: number, report: ReportedJob) {
    return report.id;
  }
}
