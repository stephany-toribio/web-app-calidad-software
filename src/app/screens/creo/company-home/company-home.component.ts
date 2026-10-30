import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { CompanyJob, rangoPostulaciones } from '../../../data/creo-data';
import { AuthService } from '../../../core/api/auth.service';
import { EmpresasService } from '../../../core/api/empresas.service';
import { VacantesService } from '../../../core/api/vacantes.service';
import { VacanteEmpresa } from '../../../core/api/models/vacante-empresa.model';

interface MetricItem {
  value: string;
  label: string;
}

@Component({
  selector: 'app-company-home',
  standalone: true,
  imports: [CommonModule, CompanyShellComponent],
  templateUrl: './company-home.component.html',
  styleUrl: './company-home.component.css'
})
export class CompanyHomeComponent implements OnInit, OnDestroy {
  /** Se muestra un rango aproximado, nunca el número exacto de postulaciones */
  rangoPostulaciones = rangoPostulaciones;

  userName = '';
  companyName = '';

  companyJobs: CompanyJob[] = [];
  metrics: MetricItem[] = [
    { value: '0', label: 'Vacantes activas' },
    { value: '0', label: 'Postulantes esta semana' },
  ];

  loading = false;
  loadError = '';

  private subs = new Subscription();
  private vacantesService = inject(VacantesService);
  private empresasService = inject(EmpresasService);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.correo) {
      const prefix = user.correo.split('@')[0];
      this.userName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      this.companyName = this.userName;
    }

    this.cargarEmpresa();
    this.cargarMisVacantes();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  /** GET /empresas/me: nombre del encargado y razón social */
  private cargarEmpresa(): void {
    this.subs.add(
      this.empresasService.miEmpresa().subscribe({
        next: (empresa) => {
          this.userName = empresa.encargado_empresa || this.userName;
          this.companyName = empresa.razon_social || this.companyName;
        }
      })
    );
  }

  /** GET /empresas/me/vacantes: en el inicio solo se listan las publicadas y las pausadas */
  cargarMisVacantes(): void {
    this.loading = true;
    this.loadError = '';
    this.subs.add(
      this.vacantesService.misVacantes().subscribe({
        next: (vacantes) => {
          this.loading = false;
          const enCurso = (vacantes || []).filter(v =>
            ['publicada', 'por_iniciar', 'pausada'].includes(v.estado.general));

          this.companyJobs = enCurso.map(v => this.mapVacanteToCompanyJob(v));
          this.metrics[0].value = this.activeCount.toString();
          this.metrics[1].value = enCurso
            .reduce((total, v) => total + (v.postulaciones_semana_count ?? 0), 0)
            .toString();
        },
        error: (err) => {
          this.loading = false;
          this.companyJobs = [];
          this.loadError = err.error?.message || 'No fue posible cargar tus vacantes.';
        }
      })
    );
  }

  private mapVacanteToCompanyJob(v: VacanteEmpresa): CompanyJob {
    const close = new Date(v.fecha_fin_vigencia);
    const daysLeft = Math.max(0, Math.ceil((close.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return {
      id: String(v.id),
      title: v.titulo,
      location: v.ubicacion || (v.tipo_empleo === 'remoto' ? 'Remoto' : 'Lima, Perú'),
      applicants: v.postulaciones_count ?? 0,
      status: v.estado.general === 'pausada' ? 'paused' : 'active',
      daysLeft,
      remote: v.tipo_empleo === 'remoto',
    };
  }

  get firstName(): string {
    return this.userName.split(' ')[0];
  }

  get initials(): string {
    return this.userName
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  get greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  get activeCount(): number {
    return this.companyJobs.filter(j => j.status === 'active').length;
  }

  openKanban(job: CompanyJob): void {
    this.router.navigate(['/creo/company-kanban'], {
      queryParams: {
        id: job.id,
        readOnly: job.status === 'paused' || job.daysLeft <= 0 ? 'true' : null
      }
    });
  }

  navigate(screen: string): void {
    this.router.navigate(['/creo', screen]);
  }
}
