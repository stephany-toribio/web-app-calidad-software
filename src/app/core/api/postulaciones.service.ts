import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  MiPostulacion,
  PostularVacantePayload,
  PostulacionCreada,
  PostulacionRetirada
} from './models/postulacion.model';
import { VacanteDetalle } from './models/vacante-detalle.model';

@Injectable({ providedIn: 'root' })
export class PostulacionesService {
  private http = inject(HttpClient);
  private candidatosUrl = `${environment.apiUrl}/candidatos/me/postulaciones`;
  private vacantesUrl = `${environment.apiUrl}/vacantes`;

  /**
   * HU-15: Listar todas las postulaciones del candidato autenticado,
   * incluidas las retiradas y las de vacantes eliminadas.
   */
  misPostulaciones(): Observable<MiPostulacion[]> {
    return this.http
      .get<ApiResponse<MiPostulacion[]>>(this.candidatosUrl)
      .pipe(map(res => res.data));
  }

  /**
   * HU-05: Postular a una vacante disponible.
   * El candidato sale del token. El body solo admite vacante_id.
   */
  postular(vacanteId: number): Observable<PostulacionCreada> {
    const payload: PostularVacantePayload = { vacante_id: vacanteId };
    return this.http
      .post<ApiResponse<PostulacionCreada>>(this.candidatosUrl, payload)
      .pipe(map(res => res.data));
  }

  /**
   * HU-16: Retirar una postulación propia (sin body).
   * Solo permitido desde recibido, en_revision o entrevista.
   */
  retirar(postulacionId: number): Observable<PostulacionRetirada> {
    return this.http
      .patch<ApiResponse<PostulacionRetirada>>(`${this.candidatosUrl}/${postulacionId}/retirar`, {})
      .pipe(map(res => res.data));
  }

  /**
   * HU-13: Detalle histórico de la vacante de una postulación propia.
   * Responde incluso si la vacante fue pausada, finalizada o eliminada.
   */
  obtenerVacanteHistorica(postulacionId: number): Observable<VacanteDetalle> {
    return this.http
      .get<ApiResponse<VacanteDetalle>>(`${this.candidatosUrl}/${postulacionId}/vacante`)
      .pipe(map(res => res.data));
  }

  /**
   * HU-13: Detalle de una vacante pública/disponible.
   */
  obtenerVacanteDisponible(vacanteId: number): Observable<VacanteDetalle> {
    return this.http
      .get<ApiResponse<VacanteDetalle>>(`${this.vacantesUrl}/${vacanteId}`)
      .pipe(map(res => res.data));
  }
}
