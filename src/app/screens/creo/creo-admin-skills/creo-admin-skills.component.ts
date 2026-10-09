import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminShellComponent } from '../../../components/creo-design-system/admin-shell/admin-shell.component';
import { AdminService } from '../../../core/api/admin.service';
import { AreaEstudio, Habilidad, PaisAdmin, InstitucionAdmin, PuestoAdmin } from '../../../core/api/models/admin.model';
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

export interface CountryViewModel {
  id: number;
  name: string;
  active: boolean;
}

export interface InstitutionViewModel {
  id: number;
  name: string;
  countryId: number | null;
  country: string;
  active: boolean;
}

export interface PositionViewModel {
  id: number;
  name: string;
  active: boolean;
  /** Escrito por un candidato: es solo suyo, no se edita ni pasa al catálogo global */
  personalizado: boolean;
  /** "Nombre Apellidos" del candidato que lo escribió; null en los del catálogo */
  creadoPor: string | null;
  /** Cuántos candidatos escribieron ese mismo nombre como personalizado */
  mismoNombre: number;
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

  query = '';
  categoryFilter = 'Todas';
  statusFilter: 'all' | SkillStatus = 'all';
  activeTab: 'habilidades' | 'estudios' | 'paises' | 'instituciones' | 'puestos' = 'estudios';

  loadingHabilidades = false;
  loadingAreas = false;
  loadingCountries = false;
  loadingInstitutions = false;
  loadingPositions = false;

  skills: SkillItemViewModel[] = [];
  studyAreas: StudyAreaViewModel[] = [];

  countries: CountryViewModel[] = [];
  institutions: InstitutionViewModel[] = [];
  positions: PositionViewModel[] = [];

  /** Países activos: únicos que se pueden elegir al crear una institución */
  get activeCountries() {
    return this.countries.filter(c => c.active);
  }

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
  editingCountry: CountryViewModel = { id: 0, name: '', active: true };
  countryError = '';

  showInstitutionModal = false;
  editingInstitution: InstitutionViewModel = { id: 0, name: '', countryId: null, country: '', active: true };
  institutionError = '';

  // Puestos: filtros en el cliente (se cargan todos una vez, como habilidades)
  positionQuery = '';
  positionTypeFilter: 'all' | 'global' | 'personalizado' = 'all';
  positionStatusFilter: 'all' | SkillStatus = 'all';

  showPositionModal = false;
  editingPosition: { id: number; name: string } = { id: 0, name: '' };
  positionError = '';

  ngOnInit() {
    this.cargarAreas();
    this.cargarHabilidades();
    this.cargarPaises();
    this.cargarInstituciones();
    this.cargarPuestos();
  }

  /** Primer mensaje de error de la API (422 con detalle, 409 de negocio, sin conexión...) */
  private mensajeError(err: HttpErrorResponse, porDefecto: string): string {
    return Object.values(erroresDesdeApi(err))[0] || porDefecto;
  }

  private aPaisVM(p: PaisAdmin): CountryViewModel {
    return { id: p.id, name: p.nombre, active: p.activo };
  }

  private aInstitucionVM(i: InstitucionAdmin): InstitutionViewModel {
    return {
      id: i.id,
      name: i.nombre,
      countryId: i.pais_id,
      country: i.pais?.nombre ?? '',
      active: i.activo
    };
  }

  private aPuestoVM(p: PuestoAdmin): PositionViewModel {
    return {
      id: p.id,
      name: p.nombre,
      active: p.activo,
      personalizado: p.personalizado,
      creadoPor: p.creado_por ? `${p.creado_por.nombre} ${p.creado_por.apellidos}` : null,
      mismoNombre: p.candidatos_con_mismo_nombre ?? 0
    };
  }

  get filteredPositions() {
    const q = this.positionQuery.trim().toLowerCase();
    return this.positions.filter(p => {
      const matchQ = p.name.toLowerCase().includes(q);
      const matchTipo = this.positionTypeFilter === 'all'
        || (this.positionTypeFilter === 'personalizado') === p.personalizado;
      const matchEstado = this.positionStatusFilter === 'all'
        || (this.positionStatusFilter === 'active') === p.active;
      return matchQ && matchTipo && matchEstado;
    });
  }

  cargarPaises() {
    this.loadingCountries = true;
    this.adminService.listarPaises().subscribe({
      next: (paises) => {
        this.loadingCountries = false;
        this.countries = paises.map(p => this.aPaisVM(p));
      },
      error: (err: HttpErrorResponse) => {
        this.loadingCountries = false;
        this.showToast(this.mensajeError(err, 'No se pudieron cargar los países.'), 'error');
      }
    });
  }

  cargarInstituciones() {
    this.loadingInstitutions = true;
    this.adminService.listarInstituciones().subscribe({
      next: (instituciones) => {
        this.loadingInstitutions = false;
        this.institutions = instituciones.map(i => this.aInstitucionVM(i));
      },
      error: (err: HttpErrorResponse) => {
        this.loadingInstitutions = false;
        this.showToast(this.mensajeError(err, 'No se pudieron cargar las instituciones.'), 'error');
      }
    });
  }

  cargarPuestos() {
    this.loadingPositions = true;
    this.adminService.listarPuestos().subscribe({
      next: (puestos) => {
        this.loadingPositions = false;
        this.positions = puestos.map(p => this.aPuestoVM(p));
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPositions = false;
        this.showToast(this.mensajeError(err, 'No se pudieron cargar los puestos.'), 'error');
      }
    });
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

  // --- Países ---

  openCountryModal(c?: CountryViewModel) {
    this.editingCountry = c ? { ...c } : { id: 0, name: '', active: true };
    this.countryError = '';
    this.showCountryModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeCountryModal() {
    this.showCountryModal = false;
    document.body.style.overflow = 'auto';
  }

  saveCountry() {
    this.countryError = '';
    const nombre = this.editingCountry.name.trim();

    if (!nombre) {
      this.countryError = 'El nombre del país es requerido.';
      return;
    }
    if (nombre.length > 100) {
      this.countryError = 'El nombre del país no puede superar los 100 caracteres.';
      return;
    }

    const editando = this.editingCountry.id !== 0;
    const peticion$ = editando
      ? this.adminService.editarPais(this.editingCountry.id, nombre)
      : this.adminService.crearPais(nombre);

    peticion$.subscribe({
      next: (pais) => {
        const vm = this.aPaisVM(pais);
        if (editando) {
          const idx = this.countries.findIndex(x => x.id === vm.id);
          if (idx !== -1) this.countries[idx] = vm;
          // El nombre del país se muestra también en la tabla de instituciones
          this.institutions = this.institutions.map(i =>
            i.countryId === vm.id ? { ...i, country: vm.name } : i
          );
        } else {
          this.countries.push(vm);
          this.countries.sort((a, b) => a.name.localeCompare(b.name));
        }
        this.showToast(editando ? 'País actualizado' : 'País creado', 'success');
        this.closeCountryModal();
      },
      error: (err: HttpErrorResponse) => {
        this.countryError = this.mensajeError(err, 'No se pudo guardar el país.');
      }
    });
  }

  toggleCountryStatus(c: CountryViewModel) {
    const accion$ = c.active
      ? this.adminService.desactivarPais(c.id)
      : this.adminService.reactivarPais(c.id);

    accion$.subscribe({
      next: (pais) => {
        c.active = pais.activo;
        this.showToast(`País ${pais.activo ? 'activado' : 'desactivado'}`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.showToast(this.mensajeError(err, 'No se pudo cambiar el estado del país.'), 'error');
      }
    });
  }

  // --- Instituciones ---

  openInstitutionModal(i?: InstitutionViewModel) {
    this.editingInstitution = i
      ? { ...i }
      : { id: 0, name: '', countryId: null, country: '', active: true };
    this.institutionError = '';
    this.showInstitutionModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeInstitutionModal() {
    this.showInstitutionModal = false;
    document.body.style.overflow = 'auto';
  }

  saveInstitution() {
    this.institutionError = '';
    const nombre = this.editingInstitution.name.trim();

    if (!nombre) {
      this.institutionError = 'El nombre de la institución es requerido.';
      return;
    }
    if (nombre.length > 255) {
      this.institutionError = 'El nombre de la institución no puede superar los 255 caracteres.';
      return;
    }

    const editando = this.editingInstitution.id !== 0;

    if (!editando && !this.editingInstitution.countryId) {
      this.institutionError = 'Debes seleccionar un país.';
      return;
    }

    const peticion$ = editando
      ? this.adminService.editarInstitucion(this.editingInstitution.id, nombre)
      : this.adminService.crearInstitucion({
          nombre,
          pais_id: Number(this.editingInstitution.countryId)
        });

    peticion$.subscribe({
      next: (institucion) => {
        const vm = this.aInstitucionVM(institucion);
        if (editando) {
          const idx = this.institutions.findIndex(x => x.id === vm.id);
          if (idx !== -1) this.institutions[idx] = vm;
        } else {
          this.institutions.unshift(vm);
        }
        this.showToast(editando ? 'Institución actualizada' : 'Institución creada', 'success');
        this.closeInstitutionModal();
      },
      error: (err: HttpErrorResponse) => {
        this.institutionError = this.mensajeError(err, 'No se pudo guardar la institución.');
      }
    });
  }

  toggleInstitutionStatus(i: InstitutionViewModel) {
    const accion$ = i.active
      ? this.adminService.desactivarInstitucion(i.id)
      : this.adminService.reactivarInstitucion(i.id);

    accion$.subscribe({
      next: (institucion) => {
        i.active = institucion.activo;
        this.showToast(`Institución ${institucion.activo ? 'activada' : 'desactivada'}`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.showToast(this.mensajeError(err, 'No se pudo cambiar el estado de la institución.'), 'error');
      }
    });
  }

  // --- Puestos: el admin crea y edita los del catálogo; los personalizados solo los activa o desactiva ---

  openPositionModal(p?: PositionViewModel) {
    if (p?.personalizado) {
      return; // el texto es del candidato: no se edita
    }
    this.editingPosition = p ? { id: p.id, name: p.name } : { id: 0, name: '' };
    this.positionError = '';
    this.showPositionModal = true;
    document.body.style.overflow = 'hidden';
  }

  closePositionModal() {
    this.showPositionModal = false;
    document.body.style.overflow = 'auto';
  }

  savePosition() {
    this.positionError = '';
    const nombre = this.editingPosition.name.trim();

    if (!nombre) {
      this.positionError = 'El nombre del puesto es requerido.';
      return;
    }
    if (nombre.length > 200) {
      this.positionError = 'El nombre del puesto no puede superar los 200 caracteres.';
      return;
    }

    const editando = this.editingPosition.id !== 0;
    const peticion$ = editando
      ? this.adminService.editarPuesto(this.editingPosition.id, nombre)
      : this.adminService.crearPuesto(nombre);

    peticion$.subscribe({
      next: (puesto) => {
        const idx = this.positions.findIndex(x => x.id === puesto.id);
        // La respuesta de crear/editar no trae el conteo: se conserva el que ya tenía la fila
        const vm = { ...this.aPuestoVM(puesto), mismoNombre: idx !== -1 ? this.positions[idx].mismoNombre : 0 };
        if (idx !== -1) {
          this.positions[idx] = vm;
        } else {
          this.positions.unshift(vm);
        }
        this.showToast(editando ? 'Puesto actualizado' : 'Puesto creado', 'success');
        this.closePositionModal();
      },
      error: (err: HttpErrorResponse) => {
        this.positionError = this.mensajeError(err, 'No se pudo guardar el puesto.');
      }
    });
  }

  togglePositionStatus(p: PositionViewModel) {
    const accion$ = p.active
      ? this.adminService.desactivarPuesto(p.id)
      : this.adminService.reactivarPuesto(p.id);

    accion$.subscribe({
      next: (puesto) => {
        p.active = puesto.activo;
        this.showToast(`Puesto ${puesto.activo ? 'activado' : 'desactivado'}`, 'success');
      },
      error: (err: HttpErrorResponse) => {
        this.showToast(this.mensajeError(err, 'No se pudo cambiar el estado del puesto.'), 'error');
      }
    });
  }
}
