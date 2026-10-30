import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CompanyShellComponent } from '../../../components/creo-design-system/company-shell/company-shell.component';
import { CreoJobsService } from '../../../services/creo-jobs.service';
import { CompanyJob, rangoPostulaciones } from '../../../data/creo-data';
import { AuthService } from '../../../core/api/auth.service';

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

  userName = 'Carlos Mendoza';
  companyName = 'TechCorp SA';

  companyJobs: CompanyJob[] = [];
  metrics: MetricItem[] = [
    { value: '4', label: 'Vacantes activas' },
    { value: '23', label: 'Postulantes esta semana' },
    { value: '18d', label: 'Tiempo promedio contratación' },
  ];

  private subs = new Subscription();

  constructor(
    private creoJobsService: CreoJobsService,
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

    this.subs.add(
      this.creoJobsService.companyJobs$.subscribe((jobs: CompanyJob[]) => {
        this.companyJobs = jobs;
        const active = jobs.filter((j: CompanyJob) => j.status === 'active').length;
        this.metrics[0].value = active.toString();
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
      .toUpperCase() || 'CM';
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
