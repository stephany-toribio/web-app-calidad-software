import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  EmpresaRegistrada,
  RegistroEmpresaPayload
} from './models/registro-empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private http = inject(HttpClient);

  private empresasUrl = `${environment.apiUrl}/empresas`;

  validarPaso(
    payload: Partial<RegistroEmpresaPayload>,
    campos: string[]
  ): Observable<void> {
    const headers = new HttpHeaders({
      Precognition: 'true',
      'Precognition-Validate-Only': campos.join(','),
    });

    return this.http.post<void>(this.empresasUrl, payload, { headers });
  }

  registrar(payload: RegistroEmpresaPayload): Observable<EmpresaRegistrada> {
    return this.http
      .post<ApiResponse<EmpresaRegistrada>>(this.empresasUrl, payload)
      .pipe(map(respuesta => respuesta.data));
  }

  /** Datos de la empresa del token */
  miEmpresa(): Observable<EmpresaRegistrada> {
    return this.http
      .get<ApiResponse<EmpresaRegistrada>>(`${this.empresasUrl}/me`)
      .pipe(map(respuesta => respuesta.data));
  }
}
