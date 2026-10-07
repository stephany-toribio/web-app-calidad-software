import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { ExperienceListComponent, ExperienceEntry } from '../creo-register-candidate/experience-list/experience-list.component';
import { StudyListComponent, StudyEntry } from '../creo-register-candidate/study-list/study-list.component';
import { LanguageListComponent, LanguageEntry } from '../creo-register-candidate/language-list/language-list.component';
import { CreoSkillPickerComponent } from '../../../components/creo-design-system/creo-skill-picker/creo-skill-picker.component';
import { SkillsService } from '../../../services/skills.service';
import { CandidatosService } from '../../../core/api/candidatos.service';
import { perfilDesdeApi } from '../../../core/api/mappers/candidato-perfil.mapper';

@Component({
  selector: 'app-candidate-profile',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CandidateShellComponent,
    ExperienceListComponent, StudyListComponent, LanguageListComponent, CreoSkillPickerComponent
  ],
  templateUrl: './candidate-profile.component.html',
})
export class CandidateProfileComponent implements OnInit {
  private candidatosService = inject(CandidatosService);

  // Se llena con GET /candidatos/me. summary no existe en el backend: queda vacío (se revisa en la fase de edición)
  candidate = {
    initials: '',
    name: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dni: '',
    birthDate: '',
    summary: '',
    hardSkills: [] as string[],
    softSkills: [] as string[],
    experience: [] as ExperienceEntry[],
    education: [] as StudyEntry[],
    languages: [] as LanguageEntry[]
  };

  cargando = true;
  errorCarga = '';

  showEditModal = false;
  showExpModal = false;
  showEduModal = false;
  showSkillsModal = false;

  editForm = { firstName: '', lastName: '', email: '', phone: '', dni: '', birthDate: '', summary: '' };
  
  hardSkillsCatalog: string[] = [];
  softSkillsCatalog: string[] = [];

  constructor(private router: Router, private skillsService: SkillsService) {}


  private saveToLocalStorage() {
    localStorage.setItem('creo_user_profile', JSON.stringify({
      firstName: this.candidate.firstName,
      lastName: this.candidate.lastName,
      email: this.candidate.email,
      phone: this.candidate.phone,
      dni: this.candidate.dni,
      birthDate: this.candidate.birthDate,
      hardSkills: this.candidate.hardSkills,
      softSkills: this.candidate.softSkills,
      experience: this.candidate.experience,
      education: this.candidate.education,
      languages: this.candidate.languages,
      summary: this.candidate.summary
    }));
  }

  ngOnInit() {
    this.cargarPerfil();
    this.hardSkillsCatalog = this.skillsService.getHardSkills(true).map(s => s.name);
    this.softSkillsCatalog = this.skillsService.getSoftSkills(true).map(s => s.name);
  }

  /** GET /candidatos/me → datos de la pantalla. Un 401 lo resuelve el interceptor (vuelve al landing) */
  cargarPerfil() {
    this.cargando = true;
    this.errorCarga = '';

    this.candidatosService.obtenerMiPerfil().subscribe({
      next: perfil => {
        this.candidate = { ...perfilDesdeApi(perfil), summary: '' };
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = 'No se pudo cargar tu perfil. Inténtalo nuevamente.';
        this.cargando = false;
      },
    });
  }

  // Edit Intro
  openEditModal() {
    this.editForm = { ...this.candidate, firstName: this.candidate.name.split(' ')[0], lastName: this.candidate.name.split(' ').slice(1).join(' ') };
    this.showEditModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeEditModal() { this.showEditModal = false; document.body.style.overflow = 'auto'; }
  saveProfile() {
    this.candidate.name = `${this.editForm.firstName} ${this.editForm.lastName}`.trim();
    this.candidate.initials = (this.editForm.firstName.charAt(0) + this.editForm.lastName.charAt(0)).toUpperCase();
    this.candidate.email = this.editForm.email;
    this.candidate.phone = this.editForm.phone;
    this.candidate.dni = this.editForm.dni;
    this.candidate.birthDate = this.editForm.birthDate;
    this.candidate.summary = this.editForm.summary;
    this.saveToLocalStorage();
    this.closeEditModal();
  }

  // Modals for lists just control visibility, since the components mutate the array directly!
  openExpModal() { this.showExpModal = true; document.body.style.overflow = 'hidden'; }
  closeExpModal() { this.showExpModal = false; document.body.style.overflow = 'auto'; }
  saveExp() { this.saveToLocalStorage(); this.closeExpModal(); }

  openEduModal() { this.showEduModal = true; document.body.style.overflow = 'hidden'; }
  closeEduModal() { this.showEduModal = false; document.body.style.overflow = 'auto'; }
  saveEdu() { this.saveToLocalStorage(); this.closeEduModal(); }

  openSkillsModal() { this.showSkillsModal = true; document.body.style.overflow = 'hidden'; }
  closeSkillsModal() { this.showSkillsModal = false; document.body.style.overflow = 'auto'; }
  saveSkills() { this.saveToLocalStorage(); this.closeSkillsModal(); }

  toggleHardSkill(skill: string) {
    const idx = this.candidate.hardSkills.indexOf(skill);
    if (idx >= 0) this.candidate.hardSkills.splice(idx, 1);
    else this.candidate.hardSkills.push(skill);
    this.saveToLocalStorage();
  }

  toggleSoftSkill(skill: string) {
    const idx = this.candidate.softSkills.indexOf(skill);
    if (idx >= 0) this.candidate.softSkills.splice(idx, 1);
    else this.candidate.softSkills.push(skill);
    this.saveToLocalStorage();
  }
}
