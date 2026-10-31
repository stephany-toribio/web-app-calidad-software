import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiPaginatedResponse, ApiResponse } from './models/api-response.model';
import { FiltrosBusquedaVacantes, PaginaVacantes, VacanteBusqueda } from './models/vacante-busqueda.model';
import {
  CrearVacantePayload,
  NivelPuestoResumen,
  PagarVacantePayload,
  PaginaModeracion,
  ResultadoAprobarMasivo,
  ResultadoPago,
  ResumenPagoVacante,
  RevisionModeracion,
  VacanteEmpresa,
  VacanteRevision
} from './models/vacante-empresa.model';

@Injectable({ providedIn: 'root' })
export class VacantesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /** Catálogo público de niveles de experiencia / niveles del puesto */
  nivelesExperiencia(): Observable<NivelPuestoResumen[]> {
    return this.http
      .get<ApiResponse<NivelPuestoResumen[]>>(`${this.apiUrl}/niveles-experiencia`)
      .pipe(map(res => res.data));
  }

  /**
   */
  buscarVacantes(filtros: FiltrosBusquedaVacantes): Observable<PaginaVacantes> {
    let params = new HttpParams();
    const titulo = filtros.titulo?.trim();
    if (titulo) params = params.set('titulo', titulo);
    (filtros.habilidades ?? []).forEach(id => params = params.append('habilidades[]', id));
    (filtros.niveles_puesto ?? []).forEach(id => params = params.append('niveles_puesto[]', id));
    if (filtros.area_estudio_id) params = params.set('area_estudio_id', filtros.area_estudio_id);
    if (filtros.solo_remoto) params = params.set('solo_remoto', 1);
    if (filtros.salario_minimo) params = params.set('salario_minimo', filtros.salario_minimo);
    if (filtros.page && filtros.page > 1) params = params.set('page', filtros.page);

    return this.http
      .get<ApiPaginatedResponse<VacanteBusqueda>>(`${this.apiUrl}/vacantes`, { params })
      .pipe(map(res => ({ vacantes: res.data, meta: res.meta })));
  }

  /** Vacantes guardadas del candidato que siguen disponibles, la más reciente primero */
  vacantesGuardadas(): Observable<VacanteBusqueda[]> {
    return this.http
      .get<ApiResponse<VacanteBusqueda[]>>(`${this.apiUrl}/candidatos/me/vacantes-guardadas`)
      .pipe(map(res => res.data));
  }

  guardarVacante(id: number): Observable<void> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.apiUrl}/candidatos/me/vacantes-guardadas/${id}`, {})
      .pipe(map(() => undefined));
  }

  quitarVacanteGuardada(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.apiUrl}/candidatos/me/vacantes-guardadas/${id}`)
      .pipe(map(() => undefined));
  }

  /** Mis vacantes no eliminadas (Empresa) */
  misVacantes(): Observable<VacanteEmpresa[]> {
    return this.http
      .get<ApiResponse<VacanteEmpresa[]>>(`${this.apiUrl}/empresas/me/vacantes`)
      .pipe(map(res => res.data));
  }

  /** Historial de vacantes eliminadas (Empresa) */
  vacantesEliminadas(): Observable<VacanteEmpresa[]> {
    return this.http
      .get<ApiResponse<VacanteEmpresa[]>>(`${this.apiUrl}/empresas/me/vacantes/eliminadas`)
      .pipe(map(res => res.data));
  }

  /** Detalle de vacante propia (Empresa, incluye eliminadas) */
  obtenerVacante(id: number): Observable<VacanteEmpresa> {
    return this.http
      .get<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes/${id}`)
      .pipe(map(res => res.data));
  }

  /** Registrar nueva vacante (Empresa - queda pendiente de revisión) */
  crearVacante(payload: CrearVacantePayload): Observable<VacanteEmpresa> {
    return this.http
      .post<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes`, payload)
      .pipe(map(res => res.data));
  }

  /** Editar vacante propia no pagada (Empresa - vuelve a revisión si estaba aprobada) */
  editarVacante(id: number, payload: CrearVacantePayload): Observable<VacanteEmpresa> {
    return this.http
      .put<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes/${id}`, payload)
      .pipe(map(res => res.data));
  }

  /** Pausar vacante activa (Empresa) */
  pausarVacante(id: number): Observable<VacanteEmpresa> {
    return this.http
      .patch<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes/${id}/pausar`, {})
      .pipe(map(res => res.data));
  }

  /** Reanudar vacante pausada (Empresa) */
  reanudarVacante(id: number): Observable<VacanteEmpresa> {
    return this.http
      .patch<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes/${id}/reanudar`, {})
      .pipe(map(res => res.data));
  }

  /** Finalizar vacante definitivamente (Empresa) */
  finalizarVacante(id: number): Observable<VacanteEmpresa> {
    return this.http
      .patch<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes/${id}/finalizar`, {})
      .pipe(map(res => res.data));
  }

  /** Eliminación lógica de vacante (Empresa) */
  eliminarVacante(id: number): Observable<VacanteEmpresa> {
    return this.http
      .delete<ApiResponse<VacanteEmpresa>>(`${this.apiUrl}/empresas/me/vacantes/${id}`)
      .pipe(map(res => res.data));
  }

  /** Resumen de pago e intentos (Empresa) */
  resumenPago(id: number): Observable<ResumenPagoVacante> {
    return this.http
      .get<ApiResponse<ResumenPagoVacante>>(`${this.apiUrl}/empresas/me/vacantes/${id}/pago`)
      .pipe(map(res => res.data));
  }

  /** Pago simulado que activa y publica la vacante (Empresa) */
  pagarVacante(id: number, payload: PagarVacantePayload): Observable<ResultadoPago> {
    return this.http
      .post<ApiResponse<ResultadoPago>>(`${this.apiUrl}/empresas/me/vacantes/${id}/pago`, payload)
      .pipe(map(res => res.data));
  }

  // ── Moderación de vacantes (Admin HU-22) ──────────────────────────────────

  /** Listar vacantes pendientes de revisión previa */
  vacantesPendientes(): Observable<VacanteRevision[]> {
    return this.http
      .get<ApiResponse<VacanteRevision[]>>(`${this.apiUrl}/admin/vacantes/pendientes`)
      .pipe(map(res => res.data));
  }

  /** Listado de moderación por estado de revisión, 10 por página */
  listadoModeracion(revision: RevisionModeracion, page = 1): Observable<PaginaModeracion> {
    let params = new HttpParams().set('revision', revision);
    if (page > 1) params = params.set('page', page);

    return this.http
      .get<ApiPaginatedResponse<VacanteRevision>>(`${this.apiUrl}/admin/vacantes`, { params })
      .pipe(map(res => ({ vacantes: res.data, meta: res.meta })));
  }

  /** Detalle de vacante para moderación */
  obtenerVacanteAdmin(id: number): Observable<VacanteRevision> {
    return this.http
      .get<ApiResponse<VacanteRevision>>(`${this.apiUrl}/admin/vacantes/${id}`)
      .pipe(map(res => res.data));
  }

  /** Aprobar vacante individual */
  aprobarVacante(id: number): Observable<VacanteRevision> {
    return this.http
      .patch<ApiResponse<VacanteRevision>>(`${this.apiUrl}/admin/vacantes/${id}/aprobar`, {})
      .pipe(map(res => res.data));
  }

  /** Aprobar varias vacantes a la vez (todo o nada) */
  aprobarMasivo(vacantes: number[]): Observable<ResultadoAprobarMasivo> {
    return this.http
      .post<ApiResponse<ResultadoAprobarMasivo>>(`${this.apiUrl}/admin/vacantes/aprobar-masivo`, { vacantes })
      .pipe(map(res => res.data));
  }

  /** No aprobar vacante con motivo obligatorio */
  noAprobarVacante(id: number, motivo: string): Observable<VacanteRevision> {
    return this.http
      .patch<ApiResponse<VacanteRevision>>(`${this.apiUrl}/admin/vacantes/${id}/no-aprobar`, { motivo })
      .pipe(map(res => res.data));
  }
}
