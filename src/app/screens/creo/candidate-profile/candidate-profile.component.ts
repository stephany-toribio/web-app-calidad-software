import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { CandidateShellComponent } from '../../../components/creo-design-system/candidate-shell/candidate-shell.component';
import { ExperienceListComponent } from '../creo-register-candidate/experience-list/experience-list.component';
import { StudyListComponent } from '../creo-register-candidate/study-list/study-list.component';
import { LanguageListComponent } from '../creo-register-candidate/language-list/language-list.component';
import { CreoSkillPickerComponent } from '../../../components/creo-design-system/creo-skill-picker/creo-skill-picker.component';
import { CandidatosService } from '../../../core/api/candidatos.service';
import { CatalogosService } from '../../../core/api/catalogos.service';
import { Habilidad } from '../../../core/api/models/catalogos.model';
import { CandidatoPerfil } from '../../../core/api/models/candidato-perfil.model';
import { RegistroCandidatoPayload } from '../../../core/api/models/registro-candidato.model';
import { PerfilVista, payloadDatosPerfil, perfilDesdeApi } from '../../../core/api/mappers/candidato-perfil.mapper';
import {
  aId, CatalogosRegistro, payloadEstudiosIdiomas, payloadExperiencia, payloadHabilidades,
} from '../../../core/api/mappers/registro-candidato.mapper';
import { erroresDesdeApi } from '../../../core/api/mappers/errores-api.mapper';
import { AVISO_LISTA_ACTUALIZADA, corregirCatalogosRechazados } from '../../../core/api/mappers/catalogos-rechazados.mapper';

const MAX_SKILLS = 15;          // por tipo (técnicas y blandas), igual que el backend

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
  private catalogosService = inject(CatalogosService);

  // Solo existen mientras su modal está abierto (están dentro de un *ngIf)
  @ViewChild(StudyListComponent) private studyList?: StudyListComponent;
  @ViewChild(ExperienceListComponent) private experienceList?: ExperienceListComponent;

  // Se llena con GET /candidatos/me y se refresca con la respuesta de cada PUT
  candidate: PerfilVista = {
    initials: '', name: '', firstName: '', lastName: '', email: '',
    phone: '', dni: '', birthDate: '',
    hardSkills: [], softSkills: [], experience: [], education: [], languages: [],
  };

  cargando = true;
  errorCarga = '';
  guardando = false;
  errores: Record<string, string> = {};
  maxSkills = MAX_SKILLS;

  showEditModal = false;
  showExpModal = false;
  showEduModal = false;
  showSkillsModal = false;

  editForm = { firstName: '', lastName: '', email: '', phone: '', dni: '', birthDate: '' };

  hardSkillsCatalog: string[] = [];
  softSkillsCatalog: string[] = [];

  // Catálogos para traducir nombres → IDs al guardar (los mismos que usa el registro)
  private catalogos: CatalogosRegistro = {
    paises: [], tiposEstudio: [], areasEstudio: [], idiomas: [], puestos: [], habilidades: [],
  };
  // Habilidades que ya tiene el candidato: se suman al catálogo aunque el admin las haya desactivado
  private habilidadesActuales: Habilidad[] = [];
  // Copia del perfil al abrir un modal: cerrar sin guardar la restaura
  private copia: PerfilVista | null = null;

  ngOnInit() {
    this.cargarPerfil();
  }

  /** GET /candidatos/me + catálogos. Un 401 lo resuelve el interceptor (vuelve al landing) */
  cargarPerfil() {
    this.cargando = true;
    this.errorCarga = '';

    forkJoin({
      perfil: this.candidatosService.obtenerMiPerfil(),
      catalogos: this.catalogosFijos(),
    }).subscribe({
      next: ({ perfil, catalogos }) => {
        this.catalogos = { ...catalogos, habilidades: this.catalogos.habilidades };
        this.aplicarPerfil(perfil);
        this.cargando = false;
      },
      error: () => {
        this.errorCarga = 'No se pudo cargar tu perfil. Inténtalo nuevamente.';
        this.cargando = false;
      },
    });
  }

  /** Catálogos para traducir nombres → IDs al guardar */
  private catalogosFijos() {
    return forkJoin({
      paises: this.catalogosService.paises(),
      tiposEstudio: this.catalogosService.tiposEstudio(),
      areasEstudio: this.catalogosService.areasEstudio(),
      idiomas: this.catalogosService.idiomas(),
      puestos: this.candidatosService.misPuestos(),   // globales + sus personalizados: el mapper los convierte en id
    });
  }

  private aplicarPerfil(perfil: CandidatoPerfil) {
    this.candidate = perfilDesdeApi(perfil);
    this.habilidadesActuales = perfil.habilidades;
    this.cargarHabilidades(perfil.estudios.map(e => e.area_estudio.id));
  }

  /**
   * Habilidades seleccionables para las áreas de sus estudios (GET /habilidades?areas[]=) + las que ya tiene.
   * depurarSeleccion: quita de lo seleccionado las que ya no están (tras un 422 por una habilidad desactivada)
   */
  private cargarHabilidades(areaIds: number[], depurarSeleccion = false) {
    this.catalogosService.habilidades([...new Set(areaIds)]).subscribe({
      next: lista => {
        const todas = [...new Map([...lista, ...this.habilidadesActuales].map(h => [h.id, h])).values()];
        this.catalogos = { ...this.catalogos, habilidades: todas };
        this.hardSkillsCatalog = todas.filter(h => h.tipo_habilidad === 'tecnica').map(h => h.nombre);
        this.softSkillsCatalog = todas.filter(h => h.tipo_habilidad === 'blanda').map(h => h.nombre);

        if (depurarSeleccion) {
          this.candidate.hardSkills = this.candidate.hardSkills.filter(s => this.hardSkillsCatalog.includes(s));
          this.candidate.softSkills = this.candidate.softSkills.filter(s => this.softSkillsCatalog.includes(s));
        }
      },
    });
  }

  /**
   * Igual que el registro: si la API rechazó un valor de catálogo que el admin desactivó mientras se editaba,
   * se vacía ese campo y se vuelven a pedir las listas, para que lo elija de nuevo sin cerrar el modal.
   */
  private corregirCatalogosRechazados(err: HttpErrorResponse) {
    const correccion = corregirCatalogosRechazados(err, this.candidate.education, this.candidate.experience);
    if (!correccion) return;

    this.candidate = { ...this.candidate, education: correccion.estudios, experience: correccion.experiencias };

    this.catalogosFijos().subscribe(catalogos => this.catalogos = { ...catalogos, habilidades: this.catalogos.habilidades });
    if (correccion.recargarEstudios) {
      this.studyList?.recargarCatalogos();
      if (this.errores['carreras']) this.errores['carreras'] += AVISO_LISTA_ACTUALIZADA;
    }
    if (correccion.recargarExperiencias) {
      this.experienceList?.recargarCatalogos();
      if (this.errores['experiencia']) this.errores['experiencia'] += AVISO_LISTA_ACTUALIZADA;
    }
    if (correccion.recargarHabilidades) {
      const areaIds = this.candidate.education
        .map(e => aId(this.catalogos.areasEstudio, e.areaEstudio))
        .filter((id): id is number => id !== null);
      this.cargarHabilidades(areaIds, true);
    }
  }

  /** PUT /candidatos/me con una sola sección. Si sale bien, la pantalla toma la respuesta del backend */
  private guardar(payload: Partial<RegistroCandidatoPayload>) {
    if (this.guardando) return;
    this.guardando = true;
    this.errores = {};

    this.candidatosService.actualizarMiPerfil(payload).subscribe({
      next: perfil => {
        this.guardando = false;
        this.aplicarPerfil(perfil);
        this.copia = null;            // lo guardado ya es el estado actual: cerrar no restaura nada
        this.cerrarModal();
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.errores = erroresDesdeApi(err);
        this.corregirCatalogosRechazados(err);
      },
    });
  }

  private abrirModal() {
    this.copia = structuredClone(this.candidate);
    this.errores = {};
    document.body.style.overflow = 'hidden';
  }

  /** Cerrar sin guardar: descarta los cambios y vuelve a lo que había */
  private cerrarModal() {
    if (this.copia) this.candidate = this.copia;
    this.copia = null;
    this.errores = {};
    this.showEditModal = this.showExpModal = this.showEduModal = this.showSkillsModal = false;
    document.body.style.overflow = 'auto';
  }

  // Datos personales
  openEditModal() {
    const { firstName, lastName, email, phone, dni, birthDate } = this.candidate;
    this.editForm = { firstName, lastName, email, phone, dni, birthDate };
    this.abrirModal();
    this.showEditModal = true;
  }
  closeEditModal() { this.cerrarModal(); }
  saveProfile() { this.guardar(payloadDatosPerfil(this.editForm)); }

  // Experiencia: sin experiencias => busca_primer_empleo = true (el backend borra las guardadas)
  openExpModal() { this.abrirModal(); this.showExpModal = true; }
  closeExpModal() { this.cerrarModal(); }
  saveExp() {
    const { experience } = this.candidate;
    this.guardar(payloadExperiencia(experience.length > 0, experience, this.catalogos));
  }

  // Estudios e idiomas comparten modal
  openEduModal() { this.abrirModal(); this.showEduModal = true; }
  closeEduModal() { this.cerrarModal(); }
  saveEdu() {
    this.guardar(payloadEstudiosIdiomas(this.candidate.education, this.candidate.languages, this.catalogos));
  }

  // Habilidades (técnicas + blandas en una sola lista de IDs)
  openSkillsModal() { this.abrirModal(); this.showSkillsModal = true; }
  closeSkillsModal() { this.cerrarModal(); }
  saveSkills() {
    this.guardar(payloadHabilidades([...this.candidate.hardSkills, ...this.candidate.softSkills], this.catalogos));
  }

  toggleHardSkill(skill: string) {
    this.candidate.hardSkills = this.alternar(this.candidate.hardSkills, skill);
  }

  toggleSoftSkill(skill: string) {
    this.candidate.softSkills = this.alternar(this.candidate.softSkills, skill);
  }

  /** Quita la habilidad si está; si no, la agrega mientras no pase el máximo por tipo */
  private alternar(lista: string[], skill: string): string[] {
    if (lista.includes(skill)) return lista.filter(s => s !== skill);
    return lista.length >= MAX_SKILLS ? lista : [...lista, skill];
  }
}
