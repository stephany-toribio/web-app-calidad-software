import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  MotivoRechazo,
  TableroKanban,
  MovimientoPostulacionRespuesta
} from './models/kanban.model';
import { PerfilPostulante } from './models/perfil-postulante.model';

@Injectable({ providedIn: 'root' })
export class KanbanService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}`;

  /** HU-06: Catálogo de motivos de rechazo permitidos */
  motivosRechazo(): Observable<MotivoRechazo[]> {
    return this.http
      .get<ApiResponse<MotivoRechazo[]>>(`${this.baseUrl}/motivos-rechazo`)
      .pipe(map(res => res.data));
  }

  /** HU-06: Tablero de postulantes de una vacante */
  tablero(vacanteId: number): Observable<TableroKanban> {
    return this.http
      .get<ApiResponse<TableroKanban>>(`${this.baseUrl}/empresas/me/vacantes/${vacanteId}/postulaciones`)
      .pipe(map(res => res.data));
  }

  /** HU-06: Historial de postulantes de una vacante */
  historial(vacanteId: number): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/empresas/me/vacantes/${vacanteId}/postulaciones/historial`)
      .pipe(map(res => res.data));
  }

  /** HU-06: Avanzar postulación a la siguiente etapa (sin body) */
  avanzar(vacanteId: number, postulacionId: number): Observable<MovimientoPostulacionRespuesta> {
    return this.http
      .patch<ApiResponse<MovimientoPostulacionRespuesta>>(
        `${this.baseUrl}/empresas/me/vacantes/${vacanteId}/postulaciones/${postulacionId}/avanzar`,
        {}
      )
      .pipe(map(res => res.data));
  }

  /** HU-06: Rechazar postulación con motivo obligatorio */
  rechazar(
    vacanteId: number,
    postulacionId: number,
    motivoRechazoId: number
  ): Observable<MovimientoPostulacionRespuesta> {
    return this.http
      .patch<ApiResponse<MovimientoPostulacionRespuesta>>(
        `${this.baseUrl}/empresas/me/vacantes/${vacanteId}/postulaciones/${postulacionId}/rechazar`,
        { motivo_rechazo_id: motivoRechazoId }
      )
      .pipe(map(res => res.data));
  }

  /** HU-06: Marcar postulación como contratada (sin body) */
  contratar(vacanteId: number, postulacionId: number): Observable<MovimientoPostulacionRespuesta> {
    return this.http
      .patch<ApiResponse<MovimientoPostulacionRespuesta>>(
        `${this.baseUrl}/empresas/me/vacantes/${vacanteId}/postulaciones/${postulacionId}/contratar`,
        {}
      )
      .pipe(map(res => res.data));
  }

  /** HU-17: Perfil completo del postulante para la empresa */
  perfilPostulante(postulacionId: number): Observable<PerfilPostulante> {
    return this.http
      .get<ApiResponse<PerfilPostulante>>(
        `${this.baseUrl}/empresas/me/postulaciones/${postulacionId}/perfil`
      )
      .pipe(map(res => res.data));
  }
}
