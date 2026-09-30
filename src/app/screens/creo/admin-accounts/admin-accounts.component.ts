import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';

type AccountType = "candidate" | "company";
type AccountStatus = "active" | "suspended";

interface Account {
  id: string;
  name: string;
  type: AccountType;
  email: string;
  status: AccountStatus;
  registeredAt: string;
  suspendReason?: string;
}

const INITIAL_ACCOUNTS: Account[] = [
  { id: "a1", name: "Valeria Rojas", type: "candidate", email: "valeria.rojas@gmail.com", status: "active", registeredAt: "12 Oct 2026" },
  { id: "a2", name: "Carlos Mendoza", type: "company", email: "carlos@techcorp.pe", status: "active", registeredAt: "08 Oct 2026" },
  { id: "a3", name: "Lucía Ramírez", type: "candidate", email: "lucia.ramirez@outlook.com", status: "active", registeredAt: "05 Oct 2026" },
  { id: "a4", name: "Fintech Innova", type: "company", email: "rrhh@fintechinnova.pe", status: "active", registeredAt: "01 Oct 2026" },
  { id: "a5", name: "Jorge Mendivil", type: "candidate", email: "jorge.m@empresa.com", status: "suspended", registeredAt: "28 Sep 2026", suspendReason: "Datos de perfil falsos detectados por moderación automática." },
  { id: "a6", name: "Sofía Quispe", type: "candidate", email: "sofia.q@correo.com", status: "active", registeredAt: "24 Sep 2026" },
  { id: "a7", name: "DataLab Perú", type: "company", email: "contacto@datalab.pe", status: "active", registeredAt: "20 Sep 2026" },
  { id: "a8", name: "Miguel Torres", type: "candidate", email: "miguel.t@pucp.edu.pe", status: "active", registeredAt: "15 Sep 2026" },
  { id: "a9", name: "Nexus Digital SRL", type: "company", email: "hr@nexusdigital.pe", status: "suspended", registeredAt: "10 Sep 2026", suspendReason: "Vacantes con contenido engañoso repetido. Pendiente de revisión legal." },
];

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './admin-accounts.component.html',
  styleUrl: './admin-accounts.component.css'
})
export class AdminAccountsComponent implements OnDestroy {
  accounts = [...INITIAL_ACCOUNTS];
  query = '';
  typeFilter: 'all' | AccountType = 'all';
  statusFilter: 'all' | AccountStatus = 'all';

  suspending: Account | null = null;
  suspendReason = '';
  suspendError = '';

  resetting: Account | null = null;

  toast: string | null = null;
  toastTimeout: any;

  get filteredAccounts() {
    const q = this.query.toLowerCase();
    return this.accounts.filter(a => {
      const matchQ = a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const matchType = this.typeFilter === 'all' || a.type === this.typeFilter;
      const matchStatus = this.statusFilter === 'all' || a.status === this.statusFilter;
      return matchQ && matchType && matchStatus;
    });
  }

  get activeCount() { return this.accounts.filter(a => a.status === 'active').length; }
  get suspendedCount() { return this.accounts.filter(a => a.status === 'suspended').length; }

  ngOnDestroy() {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
  }

  showToast(msg: string) {
    this.toast = msg;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => this.toast = null, 3500);
  }

  beginSuspend(a: Account) {
    this.suspending = a;
    this.suspendReason = '';
    this.suspendError = '';
  }

  confirmSuspend() {
    if (!this.suspendReason.trim()) {
      this.suspendError = 'Debes ingresar un motivo de suspensión';
      return;
    }
    if (this.suspending) {
      const idx = this.accounts.findIndex(a => a.id === this.suspending!.id);
      if (idx !== -1) {
        this.accounts[idx].status = 'suspended';
        this.accounts[idx].suspendReason = this.suspendReason;
      }
      this.suspending = null;
      this.showToast('Cuenta suspendida correctamente.');
    }
  }

  reactivate(a: Account) {
    const idx = this.accounts.findIndex(x => x.id === a.id);
    if (idx !== -1) {
      this.accounts[idx].status = 'active';
      this.accounts[idx].suspendReason = undefined;
      this.showToast('Cuenta reactivada correctamente.');
    }
  }

  beginReset(a: Account) {
    this.resetting = a;
  }

  confirmReset() {
    if (this.resetting) {
      this.showToast(`Enlace de un solo uso enviado a ${this.resetting.email}`);
      this.resetting = null;
    }
  }

  trackById(index: number, account: Account) {
    return account.id;
  }
}
