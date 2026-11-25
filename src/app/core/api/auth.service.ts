import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from './models/api-response.model';
import {
  LoginPayload,
  SesionUsuario
} from './models/auth.model';

/**
 * La sesión vive en sessionStorage: cada pestaña tiene la suya, así cerrar sesión
 * o entrar con otro rol en una pestaña no afecta a las demás.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private loginUrl = `${environment.apiUrl}/auth/login`;
  private logoutUrl = `${environment.apiUrl}/auth/logout`;

  constructor() {
    // Restos de la versión anterior, que guardaba la sesión compartida en localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('creo_user');
  }

  login(payload: LoginPayload): Observable<SesionUsuario> {
    return this.http
      .post<ApiResponse<SesionUsuario>>(this.loginUrl, payload)
      .pipe(map(respuesta => respuesta.data));
  }

  /** Revoca el token en el backend (Sanctum) y limpia la sesión local, aunque la petición falle */
  logout(): Observable<void> {
    const token = this.getToken();

    return this.http
      .post<ApiResponse<null>>(this.logoutUrl, {})
      .pipe(
        map(() => undefined),
        finalize(() => {
          if (token !== null && token === this.getToken()) {
            this.clearSession();
          }
        })
      );
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  getUser(): {
    usuario_id: number;
    correo: string;
    rol: string;
  } | null {
    const rawUser = sessionStorage.getItem('creo_user');

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
    sessionStorage.setItem('token', session.token);

    sessionStorage.setItem(
      'creo_user',
      JSON.stringify({
        usuario_id: session.usuario_id,
        correo: session.correo,
        rol: session.rol
      })
    );
  }

  clearSession(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('creo_user');
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
