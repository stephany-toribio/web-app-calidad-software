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
  EditarHabilidadPayload
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
}
