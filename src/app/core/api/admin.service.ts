import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  UsuarioAdmin,
  AreaEstudio,
  Habilidad,
  CrearHabilidadPayload,
  EditarHabilidadPayload,
  PaisAdmin,
  InstitucionAdmin,
  PuestoAdmin,
  CrearInstitucionPayload
} from './models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin`;

  // --- Usuarios (ADM-01 a ADM-03) ---

  /** ADM-01: Listar todos los usuarios */
  listarUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http
      .get<ApiResponse<UsuarioAdmin[]>>(`${this.baseUrl}/usuarios`)
      .pipe(map(res => res.data));
  }

  /** ADM-02: Suspender cuenta de usuario (candidato o empresa) */
  suspenderUsuario(id: number, motivo?: string): Observable<UsuarioAdmin> {
    return this.http
      .patch<ApiResponse<UsuarioAdmin>>(`${this.baseUrl}/usuarios/${id}/suspender`, { motivo })
      .pipe(map(res => res.data));
  }

  /** ADM-03: Reactivar cuenta suspendida */
  reactivarUsuario(id: number): Observable<UsuarioAdmin> {
    return this.http
      .patch<ApiResponse<UsuarioAdmin>>(`${this.baseUrl}/usuarios/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }

  // --- Áreas de Estudio (ADM-04 a ADM-08) ---

  /** ADM-04: Listar todas las áreas (activas e inactivas) */
  listarAreas(): Observable<AreaEstudio[]> {
    return this.http
      .get<ApiResponse<AreaEstudio[]>>(`${this.baseUrl}/areas-estudio`)
      .pipe(map(res => res.data));
  }

  /** ADM-05: Crear área de estudio */
  crearArea(nombre: string): Observable<AreaEstudio> {
    return this.http
      .post<ApiResponse<AreaEstudio>>(`${this.baseUrl}/areas-estudio`, { nombre })
      .pipe(map(res => res.data));
  }

  /** ADM-06: Renombrar área de estudio */
  editarArea(id: number, nombre: string): Observable<AreaEstudio> {
    return this.http
      .patch<ApiResponse<AreaEstudio>>(`${this.baseUrl}/areas-estudio/${id}`, { nombre })
      .pipe(map(res => res.data));
  }

  /** ADM-07: Desactivar área de estudio */
  desactivarArea(id: number): Observable<AreaEstudio> {
    return this.http
      .patch<ApiResponse<AreaEstudio>>(`${this.baseUrl}/areas-estudio/${id}/desactivar`, {})
      .pipe(map(res => res.data));
  }

  /** ADM-08: Reactivar área de estudio */
  reactivarArea(id: number): Observable<AreaEstudio> {
    return this.http
      .patch<ApiResponse<AreaEstudio>>(`${this.baseUrl}/areas-estudio/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }

  // --- Habilidades (ADM-09 a ADM-13) ---

  /** ADM-09: Listar todas las habilidades (activas e inactivas) */
  listarHabilidades(): Observable<Habilidad[]> {
    return this.http
      .get<ApiResponse<Habilidad[]>>(`${this.baseUrl}/habilidades`)
      .pipe(map(res => res.data));
  }

  /** ADM-10: Crear habilidad */
  crearHabilidad(payload: CrearHabilidadPayload): Observable<Habilidad> {
    return this.http
      .post<ApiResponse<Habilidad>>(`${this.baseUrl}/habilidades`, payload)
      .pipe(map(res => res.data));
  }

  /** ADM-11: Editar habilidad */
  editarHabilidad(id: number, payload: EditarHabilidadPayload): Observable<Habilidad> {
    return this.http
      .patch<ApiResponse<Habilidad>>(`${this.baseUrl}/habilidades/${id}`, payload)
      .pipe(map(res => res.data));
  }

  /** ADM-12: Desactivar habilidad */
  desactivarHabilidad(id: number): Observable<Habilidad> {
    return this.http
      .patch<ApiResponse<Habilidad>>(`${this.baseUrl}/habilidades/${id}/desactivar`, {})
      .pipe(map(res => res.data));
  }

  /** ADM-13: Reactivar habilidad */
  reactivarHabilidad(id: number): Observable<Habilidad> {
    return this.http
      .patch<ApiResponse<Habilidad>>(`${this.baseUrl}/habilidades/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }

  // --- Países ---

  listarPaises(): Observable<PaisAdmin[]> {
    return this.http
      .get<ApiResponse<PaisAdmin[]>>(`${this.baseUrl}/paises`)
      .pipe(map(res => res.data));
  }

  crearPais(nombre: string): Observable<PaisAdmin> {
    return this.http
      .post<ApiResponse<PaisAdmin>>(`${this.baseUrl}/paises`, { nombre })
      .pipe(map(res => res.data));
  }

  editarPais(id: number, nombre: string): Observable<PaisAdmin> {
    return this.http
      .patch<ApiResponse<PaisAdmin>>(`${this.baseUrl}/paises/${id}`, { nombre })
      .pipe(map(res => res.data));
  }

  desactivarPais(id: number): Observable<PaisAdmin> {
    return this.http
      .patch<ApiResponse<PaisAdmin>>(`${this.baseUrl}/paises/${id}/desactivar`, {})
      .pipe(map(res => res.data));
  }

  reactivarPais(id: number): Observable<PaisAdmin> {
    return this.http
      .patch<ApiResponse<PaisAdmin>>(`${this.baseUrl}/paises/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }

  // --- Instituciones ---

  listarInstituciones(): Observable<InstitucionAdmin[]> {
    return this.http
      .get<ApiResponse<InstitucionAdmin[]>>(`${this.baseUrl}/instituciones`)
      .pipe(map(res => res.data));
  }

  crearInstitucion(payload: CrearInstitucionPayload): Observable<InstitucionAdmin> {
    return this.http
      .post<ApiResponse<InstitucionAdmin>>(`${this.baseUrl}/instituciones`, payload)
      .pipe(map(res => res.data));
  }

  /** Solo se puede renombrar: el país de una institución no cambia. */
  editarInstitucion(id: number, nombre: string): Observable<InstitucionAdmin> {
    return this.http
      .patch<ApiResponse<InstitucionAdmin>>(`${this.baseUrl}/instituciones/${id}`, { nombre })
      .pipe(map(res => res.data));
  }

  desactivarInstitucion(id: number): Observable<InstitucionAdmin> {
    return this.http
      .patch<ApiResponse<InstitucionAdmin>>(`${this.baseUrl}/instituciones/${id}/desactivar`, {})
      .pipe(map(res => res.data));
  }

  reactivarInstitucion(id: number): Observable<InstitucionAdmin> {
    return this.http
      .patch<ApiResponse<InstitucionAdmin>>(`${this.baseUrl}/instituciones/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }

  // --- Puestos ---

  listarPuestos(): Observable<PuestoAdmin[]> {
    return this.http
      .get<ApiResponse<PuestoAdmin[]>>(`${this.baseUrl}/puestos`)
      .pipe(map(res => res.data));
  }

  /** Crea un puesto del catálogo global. */
  crearPuesto(nombre: string): Observable<PuestoAdmin> {
    return this.http
      .post<ApiResponse<PuestoAdmin>>(`${this.baseUrl}/puestos`, { nombre })
      .pipe(map(res => res.data));
  }

  /** Solo puestos globales: un personalizado responde 409 (pertenece al candidato). */
  editarPuesto(id: number, nombre: string): Observable<PuestoAdmin> {
    return this.http
      .patch<ApiResponse<PuestoAdmin>>(`${this.baseUrl}/puestos/${id}`, { nombre })
      .pipe(map(res => res.data));
  }

  desactivarPuesto(id: number): Observable<PuestoAdmin> {
    return this.http
      .patch<ApiResponse<PuestoAdmin>>(`${this.baseUrl}/puestos/${id}/desactivar`, {})
      .pipe(map(res => res.data));
  }

  /** Solo lo habilita: un personalizado sigue siendo del candidato y no pasa al catálogo global. */
  reactivarPuesto(id: number): Observable<PuestoAdmin> {
    return this.http
      .patch<ApiResponse<PuestoAdmin>>(`${this.baseUrl}/puestos/${id}/reactivar`, {})
      .pipe(map(res => res.data));
  }
}
