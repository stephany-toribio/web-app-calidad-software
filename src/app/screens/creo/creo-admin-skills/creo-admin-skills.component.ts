import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';
import { SkillsService, Skill } from '../../../services/skills.service';

type SkillStatus = "active" | "inactive";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

@Component({
  selector: 'app-creo-admin-skills',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './creo-admin-skills.component.html',
  styleUrl: './creo-admin-skills.component.css'
})
export class CreoAdminSkillsComponent implements OnInit {
  query = '';
  categoryFilter = 'Todas';
  statusFilter: 'all' | SkillStatus = 'all';
  activeTab: 'habilidades' | 'estudios' | 'paises' | 'instituciones' | 'puestos' = 'estudios';

  get studyAreas() { return this.skillsService.getStudyAreas(); }

  get countries() { return this.skillsService.getCountries(); }

  get institutions() { return this.skillsService.getInstitutions(); }

  get positions() { return this.skillsService.getPositions(); }

  get activeCategories() {
    return this.studyAreas.map(s => s.name);
  }

  // Paleta que se asigna en orden a las categorías creadas por el admin
  private customCategoryPalette: { bg: string; text: string }[] = [
    { bg: "#E0E7FF", text: "#3730A3" },
    { bg: "#FFE4E6", text: "#9F1239" },
    { bg: "#D1FAE5", text: "#065F46" },
    { bg: "#FEF9C3", text: "#854D0E" },
    { bg: "#E0F2FE", text: "#0369A1" },
    { bg: "#F3E8FF", text: "#6B21A8" },
  ];
  private customCategoryCount = 0;

  Math = Math;

  toasts: Toast[] = [];
  toastId = 0;

  pageSize = 15;
  currentPage = 1;

  // New skill modal
  showNewModal = false;
  newName = '';
  newCategory = 'General';
  newError = '';
  newIsSoft = false;

  showStudyModal = false;
  editingStudy = { id: 0, name: '', active: true };
  
  showCountryModal = false;
  editingCountry = { id: 0, name: '', active: true };
  
  showInstitutionModal = false;
  editingInstitution = { id: 0, name: '', country: '', active: true };
  
  showPositionModal = false;
  editingPosition = { id: 0, name: '', active: true };


  // Edit skill modal
  editingSkill: Skill | null = null;
  editName = '';
  editCategory = 'General';
  editError = '';
  editIsSoft = false;

  categoryBg: Record<string, string> = {
    "Ciencias de la Salud": "#E0F2FE",
    "Investigación": "#EDE9FE",
    "Tecnología": "#DCFCE7",
    "Negocios": "#FEF3C7",
    "Comunicación y Diseño": "#FCE7F3",
    "Idiomas": "#F0FDF4",
    "Educación": "#FFF7ED",
    "Transversales": "#F1F5F9",
    "General": "#F8FAFC",
  };
  
  categoryText: Record<string, string> = {
    "Ciencias de la Salud": "#0369A1",
    "Investigación": "#6D28D9",
    "Tecnología": "#15803D",
    "Negocios": "#B45309",
    "Comunicación y Diseño": "#9D174D",
    "Idiomas": "#166534",
    "Educación": "#C2410C",
    "Transversales": "#475569",
    "General": "#64748B",
  };

  constructor(private skillsService: SkillsService) {}

  ngOnInit() {
  }

  get skills() {
    return this.skillsService.getSkills();
  }

  trackById(index: number, skill: Skill) {
    return skill.id;
  }

  get filteredSkills() {
    const q = this.query.toLowerCase();
    return this.skills.filter(s => {
      const matchQ = s.name.toLowerCase().includes(q);
      const matchCat = this.categoryFilter === 'Todas' || s.category === this.categoryFilter;
      const matchStat = this.statusFilter === 'all' || s.status === this.statusFilter;
      return matchQ && matchCat && matchStat;
    });
  }

  get totalPages() {
    return Math.ceil(this.filteredSkills.length / this.pageSize);
  }

  get pagedSkills() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSkills.slice(start, start + this.pageSize);
  }

  get activeCount() {
    return this.skills.filter(s => s.status === 'active').length;
  }
  get inactiveCount() {
    return this.skills.filter(s => s.status === 'inactive').length;
  }

  showToast(msg: string, type: "success" | "error" = "success") {
    const id = ++this.toastId;
    this.toasts.push({ id, message: msg, type });
    setTimeout(() => {
      this.dismissToast(id);
    }, 3500);
  }

  dismissToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  toggleStatus(skill: Skill) {
    this.skillsService.toggleStatus(skill.id);
    const newStatus = skill.status === 'active' ? 'inactiva' : 'activa';
    this.showToast(`Habilidad '${skill.name}' ahora está ${newStatus}.`);
  }

  openNewModal() {
    this.showNewModal = true;
    this.newName = '';
    this.newCategory = 'General';
    this.newIsSoft = false;
    this.newError = '';
  }



  saveNewSkill() {
    if (!this.newName.trim()) {
      this.newError = 'El nombre de la habilidad es requerido';
      return;
    }
    
    try {
      this.skillsService.addSkill(this.newName.trim(), this.newIsSoft ? 'Transversales' : this.newCategory, this.newIsSoft);
      this.showNewModal = false;
      this.showToast(`Habilidad '${this.newName.trim()}' agregada correctamente.`);
    } catch (e: any) {
      this.newError = e.message;
    }
  }

  openEditModal(skill: Skill) {
    this.editingSkill = skill;
    this.editName = skill.name;
    this.editCategory = skill.category;
    this.editIsSoft = skill.isSoft;
    this.editError = '';
  }

  saveEditSkill() {
    if (!this.editName.trim()) {
      this.editError = 'El nombre no puede estar vacío';
      return;
    }
    if (this.editingSkill) {
      try {
        this.skillsService.updateSkill(this.editingSkill.id, this.editName.trim(), this.editIsSoft ? 'Transversales' : this.editCategory, this.editIsSoft);
        this.showToast(`Habilidad modificada correctamente.`);
        this.editingSkill = null;
      } catch (e: any) {
        this.editError = e.message;
      }
    }
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
    }
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  openStudyModal(s?: any) {
    if (s) this.editingStudy = { ...s };
    else this.editingStudy = { id: 0, name: '', active: true };
    this.showStudyModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeStudyModal() { this.showStudyModal = false; document.body.style.overflow = 'auto'; }
  saveStudy() {
    if (this.editingStudy.id) {
      const idx = this.studyAreas.findIndex(x => x.id === this.editingStudy.id);
      if (idx >= 0) this.studyAreas[idx] = { ...this.editingStudy };
    } else {
      this.studyAreas.push({ ...this.editingStudy, id: Date.now() });
    }
    this.showToast('Área de estudio guardada', 'success');
    this.closeStudyModal();
  }
  toggleStudyStatus(s: any) {
    s.active = !s.active;
    this.showToast(`Área ${s.active ? 'activada' : 'desactivada'}`, 'success');
  }

  openCountryModal(c?: any) {
    if (c) this.editingCountry = { ...c };
    else this.editingCountry = { id: 0, name: '', active: true };
    this.showCountryModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeCountryModal() { this.showCountryModal = false; document.body.style.overflow = 'auto'; }
  saveCountry() {
    if (this.editingCountry.id) {
      const idx = this.countries.findIndex(x => x.id === this.editingCountry.id);
      if (idx >= 0) this.countries[idx] = { ...this.editingCountry };
    } else {
      this.countries.push({ ...this.editingCountry, id: Date.now() });
    }
    this.showToast('País guardado', 'success');
    this.closeCountryModal();
  }
  toggleCountryStatus(c: any) {
    c.active = !c.active;
    this.showToast(`País ${c.active ? 'activado' : 'desactivado'}`, 'success');
  }

  openInstitutionModal(i?: any) {
    if (i) this.editingInstitution = { ...i };
    else this.editingInstitution = { id: 0, name: '', country: '', active: true };
    this.showInstitutionModal = true;
    document.body.style.overflow = 'hidden';
  }
  closeInstitutionModal() { this.showInstitutionModal = false; document.body.style.overflow = 'auto'; }
  saveInstitution() {
    if (this.editingInstitution.id) {
      const idx = this.institutions.findIndex(x => x.id === this.editingInstitution.id);
      if (idx >= 0) this.institutions[idx] = { ...this.editingInstitution };
    } else {
      this.institutions.push({ ...this.editingInstitution, id: Date.now() });
    }
    this.showToast('Institución guardada', 'success');
    this.closeInstitutionModal();
  }
  toggleInstitutionStatus(i: any) {
    i.active = !i.active;
    this.showToast(`Institución ${i.active ? 'activada' : 'desactivada'}`, 'success');
  }

  openPositionModal(p?: any) {
    if (p) this.editingPosition = { ...p };
    else this.editingPosition = { id: 0, name: '', active: true };
    this.showPositionModal = true;
    document.body.style.overflow = 'hidden';
  }
  closePositionModal() { this.showPositionModal = false; document.body.style.overflow = 'auto'; }
  savePosition() {
    if (this.editingPosition.id) {
      const idx = this.positions.findIndex(x => x.id === this.editingPosition.id);
      if (idx >= 0) this.positions[idx] = { ...this.editingPosition };
    } else {
      this.positions.push({ ...this.editingPosition, id: Date.now() });
    }
    this.showToast('Puesto guardado', 'success');
    this.closePositionModal();
  }
  togglePositionStatus(p: any) {
    p.active = !p.active;
    this.showToast(`Puesto ${p.active ? 'activado' : 'desactivado'}`, 'success');
  }

}
