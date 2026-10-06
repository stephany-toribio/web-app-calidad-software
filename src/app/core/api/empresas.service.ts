import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  EmpresaRegistrada,
  LoginPayload,
  RegistroEmpresaPayload,
  SesionUsuario
} from './models/registro-empresa.model';

@Injectable({ providedIn: 'root' })
export class EmpresasService {
  private http = inject(HttpClient);

  private empresasUrl = `${environment.apiUrl}/empresas`;
  private loginUrl = `${environment.apiUrl}/auth/login`;

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

  login(payload: LoginPayload): Observable<SesionUsuario> {
    return this.http
      .post<ApiResponse<SesionUsuario>>(this.loginUrl, payload)
      .pipe(map(respuesta => respuesta.data));
  }
}
