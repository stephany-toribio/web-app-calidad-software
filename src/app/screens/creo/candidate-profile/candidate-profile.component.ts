import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { ExperienceListComponent, ExperienceEntry } from '../creo-register-candidate/experience-list/experience-list.component';
import { StudyListComponent, StudyEntry } from '../creo-register-candidate/study-list/study-list.component';
import { LanguageListComponent, LanguageEntry } from '../creo-register-candidate/language-list/language-list.component';
import { CreoSkillPickerComponent } from '../../../components/creo-design-system/creo-skill-picker/creo-skill-picker.component';
import { SkillsService } from '../../../services/skills.service';

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
  candidate = {
    initials: 'VR',
    name: 'Valeria Rojas',
    firstName: 'Valeria',
    lastName: 'Rojas',
    email: 'valeria.rojas@ejemplo.com',
    phone: '+51 999 555 123',
    dni: '76543210',
    birthDate: '1998-09-16',
    summary: 'Ingeniera de software apasionada por el desarrollo frontend y la creación de interfaces de usuario intuitivas.',
    hardSkills: ['React', 'TypeScript', 'Node.js', 'Angular'] as string[],
    softSkills: ['Comunicación efectiva', 'Trabajo en equipo'] as string[],
    experience: [
      {
        puesto: 'Desarrollador Frontend Semi Senior',
        empresa: 'Tech Solutions SAC',
        nivel: 'Semi Senior',
        pais: 'Perú',
        fechaInicioMes: '01',
        fechaInicioAno: '2022',
        fechaFinMes: '',
        fechaFinAno: '',
        alPresente: true,
        descripcion: 'Desarrollo de aplicaciones web usando Angular y TypeScript.'
      }
    ] as ExperienceEntry[],
    education: [
      {
        titulo: 'Ingeniería de Sistemas',
        pais: 'Perú',
        tipoEstudio: 'Universitario',
        areaEstudio: 'Ingeniería',
        institucion: 'Universidad Nacional de Ingeniería (UNI)',
        estado: 'Culminado',
        fechaInicioMes: '03',
        fechaInicioAno: '2015',
        fechaFinMes: '12',
        fechaFinAno: '2019'
      }
    ] as StudyEntry[],
    languages: [
      { idioma: 'Inglés', nivelEscrito: 'Avanzado', nivelOral: 'Avanzado' }
    ] as LanguageEntry[]
  };

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
    const saved = localStorage.getItem('creo_user_profile');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.firstName) {
          this.candidate.firstName = data.firstName;
          this.candidate.lastName = data.lastName;
          this.candidate.name = `${data.firstName} ${data.lastName}`;
          this.candidate.initials = (data.firstName.charAt(0) || '') + (data.lastName.charAt(0) || '');
          this.candidate.email = data.email;
          this.candidate.phone = data.phone || this.candidate.phone;
          this.candidate.dni = data.dni || this.candidate.dni;
          if (data.birthDate) this.candidate.birthDate = data.birthDate;
          this.candidate.hardSkills = data.hardSkills || [];
          this.candidate.softSkills = data.softSkills || [];
          this.candidate.experience = data.experience || [];
          this.candidate.education = data.education || [];
          this.candidate.languages = data.languages || [];
        }
      } catch (e) {
        console.error("Error parsing user profile", e);
      }
    }
    this.hardSkillsCatalog = this.skillsService.getHardSkills(true).map(s => s.name);
    this.softSkillsCatalog = this.skillsService.getSoftSkills(true).map(s => s.name);
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
