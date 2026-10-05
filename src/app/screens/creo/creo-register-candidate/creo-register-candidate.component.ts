import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable } from 'rxjs';
import { CreoWordmarkComponent } from '../../../components/creo-design-system/creo-wordmark/creo-wordmark.component';
import { CreoBtnComponent } from '../../../components/creo-design-system/creo-btn/creo-btn.component';
import { CreoFieldComponent } from '../../../components/creo-design-system/creo-field/creo-field.component';
import { CreoCardComponent } from '../../../components/creo-design-system/creo-card/creo-card.component';
import { CreoAlertComponent } from '../../../components/creo-design-system/creo-alert/creo-alert.component';
import { CreoStepIndicatorComponent } from '../../../components/creo-design-system/creo-step-indicator/creo-step-indicator.component';
import { CreoSkillPickerComponent } from '../../../components/creo-design-system/creo-skill-picker/creo-skill-picker.component';
import { StudyListComponent, StudyEntry } from './study-list/study-list.component';
import { LanguageListComponent, LanguageEntry } from './language-list/language-list.component';
import { ExperienceListComponent, ExperienceEntry } from './experience-list/experience-list.component';
import { CatalogosService } from '../../../core/api/catalogos.service';
import { CandidatosService } from '../../../core/api/candidatos.service';
import { CAMPOS_PASO } from '../../../core/api/registro-candidato.pasos';
import { RegistroCandidatoPayload } from '../../../core/api/models/registro-candidato.model';
import { Habilidad } from '../../../core/api/models/catalogos.model';
import { erroresDesdeApi } from '../../../core/api/mappers/errores-api.mapper';
import {
  aId, CatalogosRegistro, payloadCompleto, payloadDatosPersonales, payloadEstudiosIdiomas,
  payloadExperiencia, payloadHabilidades,
} from '../../../core/api/mappers/registro-candidato.mapper';

const STEPS = ['Cuenta y datos', 'Educación', 'Experiencia', 'Habilidades', 'Resumen'];
const MAX_SKILLS = 30;          // el backend acepta 30 en total (técnicas + blandas)
const GENDER_OPTIONS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

// Pantalla del formulario donde se corrige cada error (para volver a ella si falla el registro final)
const PASO_DE_ERROR: Record<string, number> = {
  firstName: 0, lastName: 0, birthdate: 0, dni: 0, dniTaken: 0, email: 0, emailTaken: 0,
  phone: 0, phoneTaken: 0, password: 0,
  carreras: 1, idiomas: 1,
  experiencia: 2,
  skills: 3,
};

@Component({
  selector: 'app-creo-register-candidate',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CreoWordmarkComponent, CreoBtnComponent, CreoFieldComponent,
    CreoCardComponent, CreoAlertComponent, CreoStepIndicatorComponent,
    CreoSkillPickerComponent, StudyListComponent, LanguageListComponent, ExperienceListComponent
  ],
  templateUrl: './creo-register-candidate.component.html',
  styleUrl: './creo-register-candidate.component.css'
})
export class CreoRegisterCandidateComponent implements OnInit {
  private router = inject(Router);
  private catalogosService = inject(CatalogosService);
  private candidatosService = inject(CandidatosService);

  steps = STEPS;
  genderOptions = GENDER_OPTIONS;
  maxSkills = MAX_SKILLS;

  /** true mientras se espera una respuesta de la API (deshabilita los botones) */
  enviando = false;

  // Catálogos que usa el mapper para convertir nombres en ids
  private catalogos: CatalogosRegistro = {
    paises: [], tiposEstudio: [], areasEstudio: [], idiomas: [], puestos: [], habilidades: [],
  };

  // Habilidades seleccionables para las áreas de los estudios (GET /habilidades?areas[]=)
  private habilidadesDisponibles: Habilidad[] = [];

  step = 0;

  // Paso 0 — Cuenta y datos personales
  firstName = '';
  lastName = '';
  birthDay = '';
  birthMonth = '';
  birthYear = '';
  dni = '';
  gender = '';
  email = '';
  password = '';
  phone = '';
  showPassword = false;

  dias = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  mesesNac = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  anosNac = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  // Paso 1 — Educación
  private _carreras: StudyEntry[] = [];
  private _educacionSuperior: StudyEntry[] = [];
  idiomas: LanguageEntry[] = [];
  salary = '';

  get carreras(): StudyEntry[] { return this._carreras; }
  set carreras(v: StudyEntry[]) { this._carreras = v; }

  get educacionSuperior(): StudyEntry[] { return this._educacionSuperior; }
  set educacionSuperior(v: StudyEntry[]) { this._educacionSuperior = v; }

  private get estudios(): StudyEntry[] {
    return [...this._carreras, ...this._educacionSuperior];
  }

  // Paso 2 — Experiencia
  hasExperience: boolean | null = null;
  experiencias: ExperienceEntry[] = [];

  // Paso 3 — Habilidades (por nombre; el mapper las convierte a ids)
  skills: string[] = [];
  softSkills: string[] = [];

  errors: Record<string, string> = {};

  ngOnInit() {
    // Los catálogos fijos se piden una sola vez (CatalogosService los reutiliza con shareReplay)
    forkJoin({
      paises: this.catalogosService.paises(),
      tiposEstudio: this.catalogosService.tiposEstudio(),
      areasEstudio: this.catalogosService.areasEstudio(),
      idiomas: this.catalogosService.idiomas(),
      puestos: this.catalogosService.puestos(),
    }).subscribe({
      next: c => this.catalogos = { ...c, habilidades: this.catalogos.habilidades },
      error: (err: HttpErrorResponse) => this.errors = erroresDesdeApi(err),
    });
  }

  // ---------------------------------------------------------------- Habilidades (paso 3)

  /** Técnicas de las áreas de los estudios (regla C) */
  get catalog(): string[] {
    return this.habilidadesDisponibles.filter(h => h.tipo_habilidad === 'tecnica').map(h => h.nombre);
  }

  get softCatalog(): string[] {
    return this.habilidadesDisponibles.filter(h => h.tipo_habilidad === 'blanda').map(h => h.nombre);
  }

  get selectedAreas(): string[] {
    return [...new Set(this.estudios.map(c => c.areaEstudio).filter(a => !!a))];
  }

  get hasAreaFilter(): boolean {
    return this.selectedAreas.length > 0;
  }

  /** Al entrar a la pantalla de habilidades: pide las de las áreas estudiadas y quita las que ya no aplican */
  private cargarHabilidades() {
    const areaIds = this.selectedAreas
      .map(nombre => aId(this.catalogos.areasEstudio, nombre))
      .filter((id): id is number => id !== null);

    this.catalogosService.habilidades(areaIds).subscribe({
      next: lista => {
        this.habilidadesDisponibles = lista;
        this.catalogos = { ...this.catalogos, habilidades: lista };
        const tecnicas = new Set(this.catalog);
        const blandas = new Set(this.softCatalog);
        this.skills = this.skills.filter(s => tecnicas.has(s));
        this.softSkills = this.softSkills.filter(s => blandas.has(s));
      },
      error: (err: HttpErrorResponse) => this.errors = erroresDesdeApi(err),
    });
  }

  private get totalHabilidades(): number {
    return this.skills.length + this.softSkills.length;
  }

  toggleSkill(s: string) {
    if (this.skills.includes(s)) {
      this.skills = this.skills.filter(x => x !== s);
      return;
    }
    if (this.skills.length >= MAX_SKILLS) return;
    this.skills = [...this.skills, s];
  }

  toggleSoftSkill(s: string) {
    if (this.softSkills.includes(s)) {
      this.softSkills = this.softSkills.filter(x => x !== s);
      return;
    }
    if (this.softSkills.length >= MAX_SKILLS) return;
    this.softSkills = [...this.softSkills, s];
  }

  // ---------------------------------------------------------------- Datos personales (paso 0)

  get passLength() { return this.password.length >= 8; }
  get passLetter() { return /[a-zA-Z]/.test(this.password); }
  get passNumber() { return /\d/.test(this.password); }
  get passSymbol() { return /[^a-zA-Z0-9]/.test(this.password); }

  // Correo, DNI y teléfono duplicados ya no se revisan con listas falsas: los informa el backend (Precognition)
  setDni(v: string) {
    this.dni = v.replace(/\D/g, '').slice(0, 8);
    delete this.errors['dniTaken'];
  }

  setPhone(v: string) {
    this.phone = v.replace(/\D/g, '').slice(0, 9);
    delete this.errors['phoneTaken'];
  }

  setEmail(v: string) {
    this.email = v;
    delete this.errors['emailTaken'];
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  validateAge() {
    if (this.birthDay && this.birthMonth && this.birthYear) {
      const bd = parseInt(this.birthDay);
      const bm = this.mesesNac.indexOf(this.birthMonth);
      const by = parseInt(this.birthYear);

      const today = new Date();
      let age = today.getFullYear() - by;
      if (today.getMonth() < bm || (today.getMonth() === bm && today.getDate() < bd)) {
        age--;
      }

      if (age < 17) {
        this.errors['birthdate'] = 'Debes tener al menos 17 años para registrarte';
      } else if (this.errors['birthdate'] === 'Debes tener al menos 17 años para registrarte') {
        delete this.errors['birthdate'];
      }
    }
  }

  validateStep0(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!this.firstName.trim()) e['firstName'] = 'El nombre es obligatorio';
    if (!this.lastName.trim()) e['lastName'] = 'El apellido es obligatorio';
    if (!this.birthDay || !this.birthMonth || !this.birthYear) {
      e['birthdate'] = 'La fecha de nacimiento es obligatoria';
    } else {
      this.validateAge();
      if (this.errors['birthdate']) e['birthdate'] = this.errors['birthdate'];
    }

    if (!this.dni.trim()) e['dni'] = 'El DNI es obligatorio';
    else if (this.dni.length !== 8) e['dni'] = 'El DNI debe tener exactamente 8 dígitos numéricos';

    if (!this.email.trim()) e['email'] = 'El correo es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) e['email'] = 'Correo inválido';

    if (!this.password.trim()) e['password'] = 'La contraseña es obligatoria';
    else if (!this.passLength || !this.passLetter || !this.passNumber || !this.passSymbol) {
      e['password'] = 'La contraseña no cumple los requisitos';
    }

    if (!this.phone.trim()) e['phone'] = 'El teléfono es obligatorio';
    else if (this.phone.length !== 9) e['phone'] = 'El teléfono debe tener exactamente 9 dígitos';

    return e;
  }

  // ---------------------------------------------------------------- Navegación entre pasos

  /** Validaciones locales (rápidas, sin red) de cada pantalla */
  private erroresLocales(step: number): Record<string, string> {
    switch (step) {
      case 0:
        return this.validateStep0();
      case 1: {
        const e: Record<string, string> = {};
        if (this._carreras.length === 0) e['carreras'] = 'Agrega al menos una carrera';
        if (this.idiomas.length === 0) e['idiomas'] = 'Agrega al menos un idioma';
        return e;
      }
      case 2:
        if (this.hasExperience === null) return { experiencia: 'Selecciona una opción sobre tu experiencia' };
        if (this.hasExperience && this.experiencias.length === 0) return { experiencia: 'Agrega al menos una experiencia laboral' };
        return {};
      case 3:
        return this.totalHabilidades === 0 ? { skills: 'Selecciona al menos una habilidad (técnica o blanda)' } : {};
      default:
        return {};
    }
  }

  /** Datos que se envían en el Precognition de cada pantalla */
  private payloadDelPaso(step: number): Partial<RegistroCandidatoPayload> {
    switch (step) {
      case 0:
        return payloadDatosPersonales(this);
      case 1:
        return payloadEstudiosIdiomas(this.estudios, this.idiomas, this.catalogos);
      case 2:
        return payloadExperiencia(this.hasExperience, this.experiencias, this.catalogos);
      default:
        // Habilidades + estudios: el backend valida que las técnicas sean de las áreas estudiadas (regla C)
        return {
          estudios: payloadEstudiosIdiomas(this.estudios, [], this.catalogos).estudios,
          ...payloadHabilidades([...this.skills, ...this.softSkills], this.catalogos),
        };
    }
  }

  handleNext(e: Event) {
    e.preventDefault();
    if (this.enviando) return;

    this.errors = this.erroresLocales(this.step);
    if (this.hasErrors()) return;

    if (this.step === 4) {
      this.registrar();
      return;
    }

    // Precognition: el backend valida solo los campos de esta pantalla y no guarda nada (204 = válido)
    const paso = this.step as 0 | 1 | 2 | 3;
    this.llamarApi(this.candidatosService.validarPaso(this.payloadDelPaso(paso), CAMPOS_PASO[paso]), () => {
      if (paso === 2) this.cargarHabilidades();     // la siguiente pantalla es la de habilidades
      this.goToStep(paso + 1);
    });
  }

  /** Paso 4: registro real (201). El backend vuelve a validar todo */
  private registrar() {
    const payload = payloadCompleto(
      this, this.estudios, this.idiomas, this.hasExperience, this.experiencias,
      [...this.skills, ...this.softSkills], this.catalogos,
    );

    this.llamarApi(this.candidatosService.registrar(payload), () => {
      // La pantalla de perfil (aún simulada) lee estos datos de localStorage; se quita al integrar HU-12
      localStorage.setItem('creo_user_profile', JSON.stringify({
        firstName: this.firstName, lastName: this.lastName, email: this.email, phone: this.phone, dni: this.dni,
        birthDate: payload.fecha_nacimiento, hardSkills: this.skills, softSkills: this.softSkills,
        experience: this.experiencias, education: this.estudios, languages: this.idiomas,
      }));
      this.router.navigate(['/creo/success/candidate'], { state: { name: this.firstName } });
    });
  }

  /** Llama a la API con el botón en "cargando"; si falla, muestra los errores y vuelve a la pantalla con problemas */
  private llamarApi(peticion: Observable<unknown>, alTerminar: () => void) {
    this.enviando = true;
    peticion.subscribe({
      next: () => {
        this.enviando = false;
        this.errors = {};
        alTerminar();
      },
      error: (err: HttpErrorResponse) => {
        this.enviando = false;
        this.errors = erroresDesdeApi(err);
        const pasoConError = Object.keys(this.errors)
          .map(clave => PASO_DE_ERROR[clave])
          .filter(p => p !== undefined)
          .sort((a, b) => a - b)[0];
        if (pasoConError !== undefined && pasoConError < this.step) this.goToStep(pasoConError);
      },
    });
  }

  goToLogin() {
    this.router.navigate(['/creo/landing']);
  }

  goBack() {
    if (this.step === 0) {
      this.router.navigate(['/creo/landing']);
    } else {
      this.goToStep(this.step - 1);
    }
  }

  goToStep(step: number) {
    this.step = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /** Errores de campos (el error general 'api' se muestra aparte) */
  hasErrors(): boolean {
    return Object.keys(this.errors).some(clave => clave !== 'api');
  }
}
