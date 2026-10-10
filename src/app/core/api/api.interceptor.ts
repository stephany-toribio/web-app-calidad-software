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
      if (!isLoginRequest) {
        if (error.status === 401 && token === authService.getToken()) {
          authService.clearSession();

          router.navigate(['/creo/landing'], {
            queryParams: { sessionExpired: 'true' }
          });
        } else if (error.status === 403) {
          const msg = (error.error?.message || '').toLowerCase();
          if (msg.includes('suspend') || msg.includes('bloquead')) {
            authService.clearSession();

            router.navigate(['/creo/landing'], {
              queryParams: { accountSuspended: 'true' }
            });
          }
        }
      }

      return throwError(() => error);
    })
  );
};
