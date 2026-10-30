import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { ManagedJob, ManagedJobStatus, rangoPostulaciones } from '../../../data/creo-data';
import { VacantesService } from '../../../core/api/vacantes.service';
import { PagarVacantePayload, VacanteEmpresa } from '../../../core/api/models/vacante-empresa.model';
import { mapVacanteToManagedJob } from '../../../core/api/mappers/vacante-empresa.mapper';

interface StatusConfig {
  label: string;
  bg: string;
  text: string;
  dotColor: string;
}

@Component({
  selector: 'app-company-jobs',
  standalone: true,
  imports: [CommonModule, FormsModule, CompanyShellComponent],
  templateUrl: './company-jobs.component.html',
  styleUrl: './company-jobs.component.css'
})
export class CompanyJobsComponent implements OnInit, OnDestroy {
  /** Se muestra un rango aproximado, nunca el número exacto de postulaciones */
  rangoPostulaciones = rangoPostulaciones;

  jobs: ManagedJob[] = [];
  loading = false;
  loadError = '';
  search = '';
  private _statusFilter: ManagedJobStatus | 'all' = 'all';

  get statusFilter(): ManagedJobStatus | 'all' {
    return this._statusFilter;
  }

  set statusFilter(value: ManagedJobStatus | 'all') {
    this._statusFilter = value;
    if (value === 'inactive') {
      this.cargarEliminadas();
    }
  }

  menuOpenId: string | null = null;
  deleteConfirmTarget: ManagedJob | null = null;

  /** Vacante que la empresa quiere editar y que perdería su aprobación */
  editConfirmTarget: ManagedJob | null = null;
  actionToast: string | null = null;
  private toastTimer: any;

  statusConfig: Record<ManagedJobStatus, StatusConfig> = {
    active:                   { label: 'Activa',                   bg: '#DCFCE7', text: '#15803D', dotColor: '#22C55E' },
    paused:                   { label: 'Pausada',                  bg: '#FEF3C7', text: '#B45309', dotColor: '#F59E0B' },
    closed:                   { label: 'Finalizada',               bg: '#FEE2E2', text: '#DC2626', dotColor: '#EF4444' },
    inactive:                 { label: 'Eliminada',                bg: '#F1F5F9', text: '#64748B', dotColor: '#94A3B8' },
    pending_review:           { label: 'Pendiente de Revisión',    bg: '#FEF9C3', text: '#A16207', dotColor: '#EAB308' },
    approved_pending_payment: { label: 'Aprobada (Pago pendiente)', bg: '#E0E7FF', text: '#4338CA', dotColor: '#6366F1' },
    rejected_by_moderation:   { label: 'No Aprobada',              bg: '#FEE2E2', text: '#DC2626', dotColor: '#EF4444' },
  };

  // Modal de Pago para vacantes aprobadas
  payingJob: ManagedJob | null = null;
  paymentProcessing = false;
  paymentAmount = 100;
  /** 9.5: solo el backend decide si esta vacante admite pago */
  puedePagar = false;
  pagoAviso = '';

  // ── Datos de la tarjeta (pago simulado) ──────────────────────────────────
  cardName = '';
  cardNumber = '';
  cardExpiry = '';
  cardCvv = '';
  cardErrors: Record<string, string> = {};

  private subs = new Subscription();
  private vacantesService = inject(VacantesService);

  constructor(
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarMisVacantes();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  /** GET /empresas/me/vacantes: vacantes no eliminadas de la empresa del token */
  cargarMisVacantes(): void {
    this.loading = true;
    this.loadError = '';
    this.subs.add(
      this.vacantesService.misVacantes().subscribe({
        next: (apiVacantes) => {
          this.loading = false;
          this.jobs = (apiVacantes || []).map(v => mapVacanteToManagedJob(v));
          if (this.statusFilter === 'inactive') this.cargarEliminadas();
        },
        error: (err) => {
          this.loading = false;
          this.jobs = [];
          this.loadError = err.error?.message || 'No fue posible cargar tus vacantes.';
        }
      })
    );
  }

  /** GET /empresas/me/vacantes/eliminadas: se suman al listado para el filtro "Eliminadas" */
  cargarEliminadas(): void {
    this.subs.add(
      this.vacantesService.vacantesEliminadas().subscribe({
        next: (eliminadas) => {
          const vigentes = this.jobs.filter(j => j.status !== 'inactive');
          this.jobs = [...vigentes, ...(eliminadas || []).map(v => mapVacanteToManagedJob(v))];
        },
        error: (err) => {
          this.showToast(err.error?.message || 'No fue posible cargar el historial de vacantes eliminadas.');
        }
      })
    );
  }

  /** Reemplaza la fila con la vacante que devolvió el backend después de una acción */
  private reemplazarVacante(v: VacanteEmpresa): void {
    const actualizada = mapVacanteToManagedJob(v);
    this.jobs = this.jobs.map(j => j.id === actualizada.id
      ? { ...actualizada, applicants: v.postulaciones_count ?? j.applicants }
      : j);
  }

  private normalizeText(str: string): string {
    return str
      ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
      : '';
  }

  get filteredJobs(): ManagedJob[] {
    const q = this.normalizeText(this.search);
    return this.jobs.filter(j => {
      const matchSearch = !q || this.normalizeText(j.title).includes(q);

      // Las eliminadas quedan fuera del listado y solo salen con el filtro "Eliminadas"
      if (j.status === 'inactive') {
        return matchSearch && this.statusFilter === 'inactive';
      }

      const matchStatus = this.statusFilter === 'all' || j.status === this.statusFilter;
      return matchSearch && matchStatus;
    });
  }

  /** Vacantes vigentes: el contador del encabezado no cuenta las eliminadas */
  get activeJobsCount(): number {
    return this.jobs.filter(j => j.status !== 'inactive').length;
  }

  /**
   * Las últimas filas abren el menú hacia arriba para no quedar fuera de la pantalla.
   * Solo se hace si hay filas suficientes arriba, para que no se salga por el otro lado.
   */
  abrirMenuHaciaArriba(indice: number): boolean {
    const total = this.filteredJobs.length;
    return total > 4 && indice >= total - 2;
  }

  toggleMenu(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.menuOpenId = this.menuOpenId === id ? null : id;
  }

  closeMenu(): void {
    this.menuOpenId = null;
  }

  togglePause(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    const j = this.jobs.find(x => x.id === id);
    if (!j || (j.status !== 'active' && j.status !== 'paused')) {
      this.showToast('Solo puedes pausar o reactivar ofertas que se encuentren activas.');
      this.closeMenu();
      return;
    }

    const numericId = Number(id);
    if (j.status === 'paused') {
      this.vacantesService.reanudarVacante(numericId).subscribe({
        next: (v) => {
          this.reemplazarVacante(v);
          this.showToast('Vacante reanudada. Se reactivó la recepción de candidatos.');
        },
        error: (err) => {
          this.showToast(err.error?.message || 'No se pudo reanudar la vacante.');
        }
      });
    } else {
      this.vacantesService.pausarVacante(numericId).subscribe({
        next: (v) => {
          this.reemplazarVacante(v);
          this.showToast('Vacante pausada. Ya no recibe postulaciones.');
        },
        error: (err) => {
          this.showToast(err.error?.message || 'No se pudo pausar la vacante.');
        }
      });
    }
    this.closeMenu();
  }

  finalizeJob(id: string, event?: Event): void {
    if (event) event.stopPropagation();
    const j = this.jobs.find(x => x.id === id);
    if (!j || (j.status !== 'active' && j.status !== 'paused')) {
      this.showToast('Solo puedes finalizar ofertas que estén activas o pausadas.');
      this.closeMenu();
      return;
    }

    this.vacantesService.finalizarVacante(Number(id)).subscribe({
      next: (v) => {
        this.reemplazarVacante(v);
        this.showToast('Vacante finalizada. Esta acción es definitiva.');
      },
      error: (err) => {
        this.showToast(err.error?.message || 'No se pudo finalizar la vacante.');
      }
    });
    this.closeMenu();
  }

  /** Solo se elimina desde un estado distinto de Eliminada */
  puedeEliminar(job: ManagedJob): boolean {
    return job.status !== 'inactive';
  }

  /** Una vacante eliminada queda en solo lectura: no se gestiona, solo se consulta */
  esSoloLectura(job: ManagedJob): boolean {
    return job.status === 'inactive';
  }

  openDeleteConfirm(job: ManagedJob, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenu();

    if (!this.puedeEliminar(job)) {
      this.showToast('Esta vacante ya se encuentra eliminada.');
      return;
    }

    this.deleteConfirmTarget = job;
  }

  confirmDelete(): void {
    if (!this.deleteConfirmTarget) return;
    const target = this.deleteConfirmTarget;

    this.vacantesService.eliminarVacante(Number(target.id)).subscribe({
      next: (v) => {
        this.reemplazarVacante(v);
        this.showToast(`Oferta "${target.title}" eliminada. Puedes consultarla en el filtro "Eliminadas".`);
        this.deleteConfirmTarget = null;
      },
      error: (err) => {
        this.showToast(err.error?.message || 'No se pudo eliminar la vacante.');
        this.deleteConfirmTarget = null;
      }
    });
  }

  cancelDelete(): void {
    this.deleteConfirmTarget = null;
  }

  showToast(msg: string): void {
    this.actionToast = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.actionToast = null;
    }, 4000);
  }

  openPayment(job: ManagedJob, event?: Event): void {
    if (event) event.stopPropagation();
    this.payingJob = job;
    this.paymentProcessing = false;
    this.cardName = '';
    this.cardNumber = '';
    this.cardExpiry = '';
    this.cardCvv = '';
    this.cardErrors = {};
    // El monto lo calcula siempre el servidor (EP-02 5): aqui no se adivina
    this.paymentAmount = 0;
    this.puedePagar = false;
    this.pagoAviso = '';

    const numericId = Number(job.id);
    if (!isNaN(numericId) && numericId > 0) {
      this.vacantesService.resumenPago(numericId).subscribe({
        next: (resumen) => {
          this.paymentAmount = resumen.monto;
          // 9.5: el formulario se habilita con puede_pagar, no con el estado local
          this.puedePagar = resumen.puede_pagar;

          if (!resumen.puede_pagar) {
            this.pagoAviso = resumen.estado_pago === 'pagado'
              ? 'Esta vacante ya tiene un pago registrado.'
              : 'Esta vacante todavia no esta aprobada para el pago.';
          }
        },
        error: (err) => {
          this.puedePagar = false;
          this.pagoAviso = err?.error?.message
            || 'No se pudo obtener el resumen de pago. Intentalo nuevamente.';
        }
      });
      return;
    }

    this.pagoAviso = 'Esta vacante no existe en el servidor.';
  }

  /**
   * Los campos se limpian escribiendo de vuelta en el input.
   * Con [(ngModel)] no basta: si al limpiar el valor queda igual al del modelo,
   * Angular no detecta cambio y el carácter inválido se queda en pantalla.
   */
  private aplicar(el: HTMLInputElement, valor: string): void {
    el.value = valor;
  }

  /** Titular: solo letras, números y espacios */
  onCardNameInput(el: HTMLInputElement): void {
    this.cardName = el.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9 ]/g, '').replace(/\s{2,}/g, ' ');
    this.aplicar(el, this.cardName);
    delete this.cardErrors['name'];
  }

  /** Número: solo dígitos, máximo 16, mostrados en grupos de cuatro */
  onCardNumberInput(el: HTMLInputElement): void {
    const digitos = el.value.replace(/\D/g, '').slice(0, 16);
    this.cardNumber = digitos.replace(/(.{4})/g, '$1 ').trim();
    this.aplicar(el, this.cardNumber);
    delete this.cardErrors['number'];
  }

  /** Vencimiento: 4 dígitos que se muestran como MM/AA (la barra la pone el campo) */
  onCardExpiryInput(el: HTMLInputElement): void {
    const digitos = el.value.replace(/\D/g, '').slice(0, 4);
    this.cardExpiry = digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
    this.aplicar(el, this.cardExpiry);
    delete this.cardErrors['expiry'];
  }

  /** CVV: solo dígitos, máximo 3 */
  onCardCvvInput(el: HTMLInputElement): void {
    this.cardCvv = el.value.replace(/\D/g, '').slice(0, 3);
    this.aplicar(el, this.cardCvv);
    delete this.cardErrors['cvv'];
  }

  /** Comprueba los datos de la tarjeta antes de cobrar */
  private validarTarjeta(): boolean {
    const errs: Record<string, string> = {};

    if (!this.cardName.trim()) {
      errs['name'] = 'Ingresa el nombre tal como figura en la tarjeta';
    }

    if (this.cardNumber.replace(/\s/g, '').length !== 16) {
      errs['number'] = 'El número debe tener exactamente 16 dígitos';
    }

    const vencimiento = this.cardExpiry.replace(/\D/g, '');
    if (vencimiento.length !== 4) {
      errs['expiry'] = 'Ingresa 4 dígitos con el formato MM/AA';
    } else {
      const mes = Number(vencimiento.slice(0, 2));
      const anio = 2000 + Number(vencimiento.slice(2));

      if (mes < 1 || mes > 12) {
        errs['expiry'] = 'El mes debe estar entre 01 y 12';
      } else if (new Date(anio, mes, 0) < new Date()) {
        errs['expiry'] = 'La tarjeta está vencida';
      }
    }

    if (this.cardCvv.length !== 3) {
      errs['cvv'] = 'El CVV debe tener exactamente 3 dígitos';
    }

    this.cardErrors = errs;
    return Object.keys(errs).length === 0;
  }

  cancelPayment(): void {
    if (!this.paymentProcessing) {
      this.payingJob = null;
      this.showToast('Pago postergado. La oferta permanece aprobada y el pago es reintentable.');
    }
  }

  confirmJobPayment(): void {
    if (!this.payingJob || this.paymentProcessing) return;
    if (!this.validarTarjeta()) return;

    this.paymentProcessing = true;
    const title = this.payingJob.title;
    const payload: PagarVacantePayload = {
      titular: this.cardName.trim(),
      numero_tarjeta: this.cardNumber.replace(/\s/g, ''),
      vencimiento: this.cardExpiry,
      cvv: this.cardCvv
    };

    this.vacantesService.pagarVacante(Number(this.payingJob.id), payload).subscribe({
      next: (resp) => {
        this.paymentProcessing = false;
        this.payingJob = null;
        this.reemplazarVacante(resp.vacante);
        const porIniciar = resp.vacante.estado.general === 'por_iniciar';
        this.showToast(porIniciar
          ? `Pago de S/ ${resp.pago.monto.toFixed(2)} confirmado. "${title}" se publicará cuando inicie su vigencia.`
          : `Pago de S/ ${resp.pago.monto.toFixed(2)} confirmado. ¡La vacante "${title}" ya se encuentra publicada!`);
      },
      error: (err) => {
        this.paymentProcessing = false;
        // 422: errores por campo del formulario de tarjeta
        const errs = err.error?.errors;
        if (errs) {
          const campos: Record<string, string> = { titular: 'name', numero_tarjeta: 'number', vencimiento: 'expiry', cvv: 'cvv' };
          Object.keys(errs).forEach(k => this.cardErrors[campos[k] ?? k] = errs[k][0]);
        }
        this.showToast(err.error?.message || 'Error al procesar el pago de la vacante.');
      }
    });
  }

  /** Abre el formulario con el contenido de la vacante cargado */
  editarVacante(job: ManagedJob, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenu();

    // Contrato EP-02 §2: solo se edita pendiente de revisión o aprobada sin pago
    if (job.status !== 'pending_review' && job.status !== 'approved_pending_payment') {
      this.showToast('Solo puedes editar vacantes pendientes de revisión o aprobadas sin pago.');
      return;
    }

    // Aprobada sin pago: se avisa antes, porque editar le quita la aprobación
    if (job.status === 'approved_pending_payment') {
      this.editConfirmTarget = job;
      return;
    }

    this.abrirEdicion(job);
  }

  private abrirEdicion(job: ManagedJob): void {
    this.router.navigate(['/creo/company-create-job'], { queryParams: { id: job.id } });
  }

  confirmarEdicion(): void {
    if (!this.editConfirmTarget) return;
    const job = this.editConfirmTarget;
    this.editConfirmTarget = null;
    this.abrirEdicion(job);
  }

  cancelarEdicion(): void {
    this.editConfirmTarget = null;
  }

  navigateKanban(job: ManagedJob, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenu();
    this.router.navigate(['/creo/company-kanban'], {
      queryParams: {
        id: job.id,
        readOnly: job.status === 'closed' || job.status === 'inactive' || job.daysLeft <= 0
      }
    });
  }

  navigate(screen: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.closeMenu();
    this.router.navigate(['/creo', screen]);
  }

  getStatusConfig(status: ManagedJobStatus): StatusConfig {
    return this.statusConfig[status] || this.statusConfig['active'];
  }
}
