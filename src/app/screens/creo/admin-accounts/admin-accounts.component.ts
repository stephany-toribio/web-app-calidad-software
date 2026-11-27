import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';
import { CreoJobsService } from '../../../services/creo-jobs.service';
import { AdminService } from '../../../core/api/admin.service';
import { UsuarioAdmin } from '../../../core/api/models/admin.model';
import { erroresDesdeApi } from '../../../core/api/mappers/errores-api.mapper';

export type AccountType = 'candidate' | 'company' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface AccountViewModel {
  id: number;
  name: string;
  type: AccountType;
  email: string;
  status: AccountStatus;
  registeredAt: string;
  suspendReason?: string;
  original: UsuarioAdmin;
}

@Component({
  selector: 'app-admin-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './admin-accounts.component.html',
  styleUrl: './admin-accounts.component.css'
})
export class AdminAccountsComponent implements OnInit, OnDestroy {
  private adminService = inject(AdminService);
  private creoJobsService = inject(CreoJobsService);

  accounts: AccountViewModel[] = [];
  loading = false;
  query = '';
  typeFilter: 'all' | 'candidate' | 'company' | 'admin' = 'all';
  statusFilter: 'all' | AccountStatus = 'all';

  suspending: AccountViewModel | null = null;
  suspendReason = '';
  suspendError = '';

  resetting: AccountViewModel | null = null;
  submittingReset = false;

  toast: string | null = null;
  toastTimeout: any;

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.adminService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.loading = false;
        this.accounts = usuarios.map(u => this.mapearAUsuarioViewModel(u));
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudieron cargar los usuarios.');
      }
    });
  }

  private mapearAUsuarioViewModel(u: UsuarioAdmin): AccountViewModel {
    let name = u.correo;
    let type: AccountType = 'candidate';

    if (u.rol?.nombre === 'empresa' && u.empresa) {
      name = u.empresa.razon_social || u.empresa.encargado_empresa || u.correo;
      type = 'company';
    } else if (u.candidato) {
      name = `${u.candidato.nombre} ${u.candidato.apellidos}`.trim() || u.correo;
      type = 'candidate';
    } else if (u.rol?.nombre === 'admin') {
      type = 'admin';
    }

    const fecha = u.created_at ? new Date(u.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    return {
      id: u.id,
      name,
      type,
      email: u.correo,
      status: u.estado_cuenta === 'suspendido' ? 'suspended' : 'active',
      registeredAt: fecha,
      suspendReason: u.motivo_suspension || undefined,
      original: u
    };
  }

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

  beginSuspend(a: AccountViewModel) {
    if (a.type === 'admin') return;
    this.suspending = a;
    this.suspendReason = '';
    this.suspendError = '';
  }

  confirmSuspend() {
    if (!this.suspending || this.suspending.type === 'admin') return;

    if (!this.suspendReason.trim()) {
      this.suspendError = 'Debes ingresar un motivo obligatorio para suspender la cuenta';
      return;
    }

    this.adminService.suspenderUsuario(this.suspending.id, this.suspendReason.trim()).subscribe({
      next: (usuarioActualizado) => {
        const idx = this.accounts.findIndex(a => a.id === this.suspending!.id);
        if (idx !== -1) {
          this.accounts[idx] = this.mapearAUsuarioViewModel(usuarioActualizado);
        }
        if (this.suspending?.type === 'company') {
          this.creoJobsService.suspendCompanyOffers(this.suspending.name);
        }
        this.suspending = null;
        this.showToast('Cuenta suspendida correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        const errMap = erroresDesdeApi(err);
        this.suspendError = errMap['api'] || 'No se pudo suspender la cuenta.';
      }
    });
  }

  reactivate(a: AccountViewModel) {
    if (a.type === 'admin') return;
    this.adminService.reactivarUsuario(a.id).subscribe({
      next: (usuarioActualizado) => {
        const idx = this.accounts.findIndex(x => x.id === a.id);
        if (idx !== -1) {
          this.accounts[idx] = this.mapearAUsuarioViewModel(usuarioActualizado);
        }
        this.showToast('Cuenta reactivada correctamente.');
      },
      error: (err: HttpErrorResponse) => {
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudo reactivar la cuenta.');
      }
    });
  }

  beginReset(a: AccountViewModel) {
    if (a.type === 'admin') return;
    this.resetting = a;
  }

  confirmReset() {
    if (!this.resetting || this.submittingReset) return;

    this.submittingReset = true;
    const targetEmail = this.resetting.email;

    this.adminService.solicitarRecuperacionPassword(targetEmail).subscribe({
      next: (mensaje) => {
        this.submittingReset = false;
        this.resetting = null;
        this.showToast(mensaje || `Correo de restablecimiento enviado a ${targetEmail}`);
      },
      error: (err: HttpErrorResponse) => {
        this.submittingReset = false;
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudo enviar el correo de restablecimiento.');
      }
    });
  }

  trackById(index: number, account: AccountViewModel) {
    return account.id;
  }
}
