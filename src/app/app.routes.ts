import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { companyGuard } from './core/guards/company.guard';
import { candidatoGuard } from './core/guards/candidato.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'creo/landing', pathMatch: 'full' },
  {
    path: 'creo',
    children: [
      { path: '', redirectTo: 'landing', pathMatch: 'full' },
      {
        path: 'landing',
        loadComponent: () => import('./screens/creo/creo-landing/creo-landing.component').then(m => m.CreoLandingComponent)
      },
      {
        path: 'admin-accounts',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./screens/creo/admin-accounts/admin-accounts.component')
            .then(m => m.AdminAccountsComponent)
      },
      {
        path: 'admin-audit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./screens/creo/admin-audit/admin-audit.component')
            .then(m => m.AdminAuditComponent)
      },
      {
        path: 'admin-dashboard',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./screens/creo/admin-dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent)
      },
      {
        path: 'admin-moderation',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./screens/creo/admin-moderation/admin-moderation.component')
            .then(m => m.AdminModerationComponent)
      },
      {
        path: 'candidate-applications',
        canActivate: [candidatoGuard],
        loadComponent: () => import('./screens/creo/candidate-applications/candidate-applications.component').then(m => m.CandidateApplicationsComponent)
      },
      {
        path: 'candidate-dashboard',
        canActivate: [candidatoGuard],
        loadComponent: () => import('./screens/creo/candidate-dashboard/candidate-dashboard.component').then(m => m.CandidateDashboardComponent)
      },
      {
        path: 'candidate-job-detail',
        canActivate: [candidatoGuard],
        loadComponent: () => import('./screens/creo/candidate-job-detail/candidate-job-detail.component').then(m => m.CandidateJobDetailComponent)
      },
      {
        path: 'candidate-jobs',
        canActivate: [candidatoGuard],
        loadComponent: () => import('./screens/creo/candidate-jobs/candidate-jobs.component').then(m => m.CandidateJobsComponent)
      },
      {
        path: 'candidate-profile',
        canActivate: [candidatoGuard],
        loadComponent: () => import('./screens/creo/candidate-profile/candidate-profile.component').then(m => m.CandidateProfileComponent)
      },
      {
        path: 'candidate-saved',
        canActivate: [candidatoGuard],
        loadComponent: () => import('./screens/creo/candidate-saved/candidate-saved.component').then(m => m.CandidateSavedComponent)
      },
      {
        path: 'company-analytics',
        canActivate: [companyGuard],
        loadComponent: () => import('./screens/creo/company-analytics/company-analytics.component').then(m => m.CompanyAnalyticsComponent)
      },
      {
        path: 'company-create-job',
        canActivate: [companyGuard],
        loadComponent: () => import('./screens/creo/company-create-job/company-create-job.component').then(m => m.CompanyCreateJobComponent)
      },
      {
        path: 'company-home',
        canActivate: [companyGuard],
        loadComponent: () => import('./screens/creo/company-home/company-home.component').then(m => m.CompanyHomeComponent)
      },
      {
        path: 'company-profile',
        canActivate: [companyGuard],
        loadComponent: () =>
          import('./screens/creo/company-profile/company-profile.component')
            .then(m => m.CompanyProfileComponent)
      },
      {
        path: 'company-jobs',
        canActivate: [companyGuard],
        loadComponent: () => import('./screens/creo/company-jobs/company-jobs.component').then(m => m.CompanyJobsComponent)
      },
      {
        path: 'company-kanban',
        canActivate: [companyGuard],
        loadComponent: () => import('./screens/creo/company-kanban/company-kanban.component').then(m => m.CompanyKanbanComponent)
      },
      {
        path: 'choose-role',
        loadComponent: () => import('./screens/creo/creo-choose-role/creo-choose-role.component').then(m => m.CreoChooseRoleComponent)
      },
      {
        path: 'admin-login',
        redirectTo: 'landing',
        pathMatch: 'full'
      },
      {
        path: 'admin-skills',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./screens/creo/creo-admin-skills/creo-admin-skills.component')
            .then(m => m.CreoAdminSkillsComponent)
      },
      {
        path: 'edit-profile',
        redirectTo: 'candidate-profile',
        pathMatch: 'full'
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./screens/creo/creo-forgot-password/creo-forgot-password.component').then(m => m.CreoForgotPasswordComponent)
      },
      {
        path: 'placeholder',
        loadComponent: () => import('./screens/creo/creo-placeholder/creo-placeholder.component').then(m => m.CreoPlaceholderComponent)
      },
      {
        path: 'register-candidate',
        loadComponent: () => import('./screens/creo/creo-register-candidate/creo-register-candidate.component').then(m => m.CreoRegisterCandidateComponent)
      },
      {
        path: 'register-company',
        loadComponent: () => import('./screens/creo/creo-register-company/creo-register-company.component').then(m => m.CreoRegisterCompanyComponent)
      },
      {
        path: 'success/:role',
        loadComponent: () => import('./screens/creo/creo-success/creo-success.component').then(m => m.CreoSuccessComponent)
      },
    ]
  },
  { path: '**', redirectTo: 'creo/landing' }
];
