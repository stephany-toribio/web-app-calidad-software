import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const isLoginRequest = req.url.includes('/auth/login');
  // Token con el que sale esta petición (puede cambiar antes de que llegue la respuesta)
  const token = authService.getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(
    req.clone({
        setHeaders: headers
    })
    ).pipe(
    catchError((error: HttpErrorResponse) => {
        // Solo se cierra la sesión si el 401 es del token actual; una respuesta tardía
        // de un token anterior (logout + nuevo login) no debe borrar la sesión nueva
        if (error.status === 401 && !isLoginRequest && token === authService.getToken()) {
        authService.clearSession();

        router.navigate(['/creo/landing'], {
            queryParams: { sessionExpired: 'true' }
        });
        }

        return throwError(() => error);
    })
    );
};
