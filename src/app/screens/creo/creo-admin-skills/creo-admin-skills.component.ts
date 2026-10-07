import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';
import { SkillsService } from '../../../services/skills.service';
import { AdminService } from '../../../core/api/admin.service';
import { AreaEstudio, Habilidad } from '../../../core/api/models/admin.model';
import { erroresDesdeApi } from '../../../core/api/mappers/errores-api.mapper';

export type SkillStatus = 'active' | 'inactive';

export interface SkillItemViewModel {
  id: number;
  name: string;
  category: string;
  status: SkillStatus;
  isSoft: boolean;
  areaId?: number | null;
  original: Habilidad;
}

export interface StudyAreaViewModel {
  id: number;
  name: string;
  active: boolean;
  original?: AreaEstudio;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Component({
  selector: 'app-creo-admin-skills',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShellComponent],
  templateUrl: './creo-admin-skills.component.html',
  styleUrl: './creo-admin-skills.component.css'
})
export class CreoAdminSkillsComponent implements OnInit {
  private adminService = inject(AdminService);
  private skillsService = inject(SkillsService);

  query = '';
  categoryFilter = 'Todas';
  statusFilter: 'all' | SkillStatus = 'all';
  activeTab: 'habilidades' | 'estudios' | 'paises' | 'instituciones' | 'puestos' = 'estudios';

  loadingHabilidades = false;
  loadingAreas = false;

  skills: SkillItemViewModel[] = [];
  studyAreas: StudyAreaViewModel[] = [];

  // Mocks para pestañas secundarias sin endpoint admin aún (Países, Instituciones, Puestos)
  get countries() { return this.skillsService.getCountries(); }
  get institutions() { return this.skillsService.getInstitutions(); }
  get positions() { return this.skillsService.getPositions(); }

  get activeCategories() {
    return ['Todas', ...this.studyAreas.map(s => s.name)];
  }

  get activeStudyAreas() {
    return this.studyAreas.filter(area => area.active);
  }

  Math = Math;

  toasts: Toast[] = [];
  toastId = 0;

  pageSize = 15;
  currentPage = 1;

  // New skill modal
  showNewModal = false;
  newName = '';
  newCategoryAreaId: number | null = null;
  newCategoryName = '';
  newError = '';
  newIsSoft = false;

  // Edit skill modal
  editingSkill: SkillItemViewModel | null = null;
  editName = '';
  editCategoryAreaId: number | null = null;
  editError = '';
  editIsSoft = false;

  // Modales de administración
  showStudyModal = false;
  editingStudy: StudyAreaViewModel = { id: 0, name: '', active: true };
  studyError = '';
  
  showCountryModal = false;
  editingCountry = { id: 0, name: '', active: true };
  
  showInstitutionModal = false;
  editingInstitution = { id: 0, name: '', country: '', active: true };
  
  showPositionModal = false;
  editingPosition = { id: 0, name: '', active: true };

  ngOnInit() {
    this.cargarAreas();
    this.cargarHabilidades();
  }

  cargarAreas() {
    this.loadingAreas = true;
    this.adminService.listarAreas().subscribe({
      next: (areas) => {
        this.loadingAreas = false;
        this.studyAreas = areas.map(a => ({
          id: a.id,
          name: a.nombre,
          active: a.activo,
          original: a
        }));
      },
      error: (err: HttpErrorResponse) => {
        this.loadingAreas = false;
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudieron cargar las áreas de estudio.', 'error');
      }
    });
  }

  cargarHabilidades() {
    this.loadingHabilidades = true;
    this.adminService.listarHabilidades().subscribe({
      next: (habs) => {
        this.loadingHabilidades = false;
        this.skills = habs.map(h => this.mapearAHabilidadViewModel(h));
      },
      error: (err: HttpErrorResponse) => {
        this.loadingHabilidades = false;
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudieron cargar las habilidades.', 'error');
      }
    });
  }

  private mapearAHabilidadViewModel(h: Habilidad): SkillItemViewModel {
    return {
      id: h.id,
      name: h.nombre,
      category: h.area_estudio?.nombre ?? (h.tipo_habilidad === 'blanda' ? 'Blanda' : 'General'),
      status: h.activo ? 'active' : 'inactive',
      isSoft: h.tipo_habilidad === 'blanda',
      areaId: h.area_estudio?.id ?? null,
      original: h
    };
  }

  trackById(index: number, item: any) {
    return item.id;
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
    return Math.ceil(this.filteredSkills.length / this.pageSize) || 1;
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

  showToast(msg: string, type: 'success' | 'error' = 'success') {
    const id = ++this.toastId;
    this.toasts.push({ id, message: msg, type });
    setTimeout(() => {
      this.dismissToast(id);
    }, 3500);
  }

  dismissToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  toggleStatus(skill: SkillItemViewModel) {
    const accion$ = skill.status === 'active' 
      ? this.adminService.desactivarHabilidad(skill.id)
      : this.adminService.reactivarHabilidad(skill.id);

    accion$.subscribe({
      next: (habilidadActualizada) => {
        const idx = this.skills.findIndex(s => s.id === skill.id);
        if (idx !== -1) {
          this.skills[idx] = this.mapearAHabilidadViewModel(habilidadActualizada);
        }
        const nuevoEstadoStr = habilidadActualizada.activo ? 'activa' : 'inactiva';
        this.showToast(`Habilidad '${habilidadActualizada.nombre}' ahora está ${nuevoEstadoStr}.`);
      },
      error: (err: HttpErrorResponse) => {
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudo cambiar el estado de la habilidad.', 'error');
      }
    });
  }

  openNewModal() {
    this.showNewModal = true;
    this.newName = '';
    this.newCategoryAreaId = null;
    this.newCategoryName = '';
    this.newIsSoft = false;
    this.newError = '';
  }

  saveNewSkill() {
    if (!this.newName.trim()) {
      this.newError = 'El nombre de la habilidad es requerido';
      return;
    }

    if (this.newName.trim().length > 100) {
      this.newError = 'El nombre no puede superar los 100 caracteres';
      return;
    }

    if (!this.newIsSoft && !this.newCategoryAreaId) {
      this.newError = 'Debes seleccionar un área de estudio para la habilidad técnica';
      return;
    }

    const payload = {
      nombre: this.newName.trim(),
      tipo_habilidad: (this.newIsSoft ? 'blanda' : 'tecnica') as 'tecnica' | 'blanda',
      area_estudio_id: this.newIsSoft ? null : Number(this.newCategoryAreaId)
    };

    this.adminService.crearHabilidad(payload).subscribe({
      next: (nuevaHabilidad) => {
        this.skills.unshift(this.mapearAHabilidadViewModel(nuevaHabilidad));
        this.showNewModal = false;
        this.showToast(`Habilidad '${nuevaHabilidad.nombre}' agregada correctamente.`);
      },
      error: (err: HttpErrorResponse) => {
        const errMap = erroresDesdeApi(err);

        this.newError =
          errMap['api'] ||
          errMap['nombre'] ||
          errMap['firstName'] ||
          'No se pudo crear la habilidad.';
      }
    });
  }

  openEditModal(skill: SkillItemViewModel) {
    this.editingSkill = skill;
    this.editName = skill.name;
    this.editIsSoft = skill.isSoft;
    this.editCategoryAreaId = skill.areaId ?? null;
    this.editError = '';
  }

  saveEditSkill() {
    if (!this.editName.trim()) {
      this.editError = 'El nombre no puede estar vacío';
      return;
    }

    if (this.editName.trim().length > 100) {
      this.editError = 'El nombre no puede superar los 100 caracteres';
      return;
    }

    if (!this.editingSkill) {
      return;
    }

    if (!this.editingSkill.isSoft && !this.editCategoryAreaId) {
      this.editError = 'Debes seleccionar un área de estudio';
      return;
    }

    const payload = {
      nombre: this.editName.trim(),
      ...(this.editingSkill.isSoft
        ? {}
        : { area_estudio_id: Number(this.editCategoryAreaId) })
    };

    this.adminService.editarHabilidad(
      this.editingSkill.id,
      payload
    ).subscribe({
      next: (habilidadEditada) => {
        const idx = this.skills.findIndex(
          s => s.id === this.editingSkill!.id
        );

        if (idx !== -1) {
          this.skills[idx] =
            this.mapearAHabilidadViewModel(habilidadEditada);
        }

        this.showToast('Habilidad modificada correctamente.');
        this.editingSkill = null;
      },

      error: (err: HttpErrorResponse) => {
        const errMap = erroresDesdeApi(err);

        this.editError =
          errMap['api'] ||
          errMap['nombre'] ||
          errMap['firstName'] ||
          errMap['area_estudio_id'] ||
          'No se pudo editar la habilidad.';
      }
    });
  }

  goToPage(p: number) {
    if (p >= 1 && p <= this.totalPages) {
      this.currentPage = p;
    }
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  // --- Áreas de estudio ---

  openStudyModal(s?: StudyAreaViewModel) {
    if (s) {
      this.editingStudy = { ...s };
    } else {
      this.editingStudy = {
        id: 0,
        name: '',
        active: true
      };
    }

    this.studyError = '';
    this.showStudyModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeStudyModal() {
    this.showStudyModal = false;
    document.body.style.overflow = 'auto';
  }

  saveStudy() {
    this.studyError = '';

    const nombre = this.editingStudy.name.trim();

    if (!nombre) {
      this.studyError =
        'El nombre del área de estudio es requerido.';
      return;
    }

    if (nombre.length > 100) {
      this.studyError =
        'El nombre del área de estudio no puede superar los 100 caracteres.';
      return;
    }

    if (this.editingStudy.id) {
      this.adminService
        .editarArea(this.editingStudy.id, nombre)
        .subscribe({
          next: (areaEditada) => {
            const idx = this.studyAreas.findIndex(
              area => area.id === areaEditada.id
            );

            if (idx !== -1) {
              this.studyAreas[idx] = {
                id: areaEditada.id,
                name: areaEditada.nombre,
                active: areaEditada.activo,
                original: areaEditada
              };
            }

            this.studyError = '';

            this.showToast(
              'Área de estudio actualizada',
              'success'
            );

            this.closeStudyModal();
          },

          error: (err: HttpErrorResponse) => {
            const errMap = erroresDesdeApi(err);

            this.studyError =
              errMap['api'] ||
              errMap['nombre'] ||
              errMap['firstName'] ||
              'No se pudo actualizar el área de estudio.';
          }
        });

      return;
    }

    this.adminService
      .crearArea(nombre)
      .subscribe({
        next: (nuevaArea) => {
          this.studyAreas.push({
            id: nuevaArea.id,
            name: nuevaArea.nombre,
            active: nuevaArea.activo,
            original: nuevaArea
          });

          this.studyError = '';

          this.showToast(
            'Área de estudio creada',
            'success'
          );

          this.closeStudyModal();
        },

        error: (err: HttpErrorResponse) => {
          const errMap = erroresDesdeApi(err);

          this.studyError =
            errMap['api'] ||
            errMap['nombre'] ||
            errMap['firstName'] ||
            'No se pudo crear el área de estudio.';
        }
      });
  }

  toggleStudyStatus(s: StudyAreaViewModel) {
    const accion$ = s.active 
      ? this.adminService.desactivarArea(s.id)
      : this.adminService.reactivarArea(s.id);

    accion$.subscribe({
      next: (areaActualizada) => {
        s.active = areaActualizada.activo;
        this.showToast(`Área ${areaActualizada.activo ? 'activada' : 'desactivada'}`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        const errMap = erroresDesdeApi(err);
        this.showToast(errMap['api'] || 'No se pudo cambiar el estado del área', 'error');
      }
    });
  }

  // --- Países, Instituciones, Puestos (Local / Mocks) ---

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
