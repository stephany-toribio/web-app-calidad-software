import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  LoginPayload,
  SesionUsuario
} from './models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private loginUrl = `${environment.apiUrl}/auth/login`;
  private logoutUrl = `${environment.apiUrl}/auth/logout`;

  login(payload: LoginPayload): Observable<SesionUsuario> {
    return this.http
      .post<ApiResponse<SesionUsuario>>(this.loginUrl, payload)
      .pipe(map(respuesta => respuesta.data));
  }

  /** Revoca el token en el backend (Sanctum) y limpia la sesión local, aunque la petición falle */
  logout(): Observable<void> {
    return this.http
      .post<ApiResponse<null>>(this.logoutUrl, {})
      .pipe(
        map(() => undefined),
        finalize(() => this.clearSession())
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getUser(): {
    usuario_id: number;
    correo: string;
    rol: string;
  } | null {
    const rawUser = localStorage.getItem('creo_user');

    if (!rawUser) {
      return null;
    }

    try {
      const user = JSON.parse(rawUser);

      if (
        typeof user?.usuario_id !== 'number' ||
        typeof user?.correo !== 'string' ||
        typeof user?.rol !== 'string'
      ) {
        return null;
      }

      return user;
    } catch {
      return null;
    }
  }

  saveSession(session: SesionUsuario): void {
    localStorage.setItem('token', session.token);

    localStorage.setItem(
      'creo_user',
      JSON.stringify({
        usuario_id: session.usuario_id,
        correo: session.correo,
        rol: session.rol
      })
    );
  }

  clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('creo_user');
  }

  isAdmin(): boolean {
    const token = this.getToken();
    const user = this.getUser();

    return !!token && user?.rol === 'admin';
  }

  isEmpresa(): boolean {
    const token = this.getToken();
    const user = this.getUser();

    return !!token && user?.rol === 'empresa';
  }

  isCandidato(): boolean {
    const token = this.getToken();
    const user = this.getUser();

    return !!token && user?.rol === 'candidato';
  }
}
