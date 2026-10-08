import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import { RestablecerPasswordPayload, VerificarCodigoRespuesta } from './models/recuperacion-password.model';

@Injectable({ providedIn: 'root' })
export class RecuperacionPasswordService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/auth`;

  /** Paso 1: siempre 200 (no revela si el correo existe) */
  solicitarCodigo(correo: string): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.url}/forgot-password`, { correo })
      .pipe(map(() => undefined));
  }

  /** Paso 2: devuelve el reset_token para el paso 3 */
  verificarCodigo(correo: string, codigo: string): Observable<VerificarCodigoRespuesta> {
    return this.http
      .post<ApiResponse<VerificarCodigoRespuesta>>(`${this.url}/verify-reset-code`, { correo, codigo })
      .pipe(map(respuesta => respuesta.data));
  }

  /** Paso 3: cambia la contraseña y revoca todas las sesiones */
  restablecer(payload: RestablecerPasswordPayload): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(`${this.url}/reset-password`, payload)
      .pipe(map(() => undefined));
  }
}
