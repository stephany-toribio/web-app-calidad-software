import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const isLoginRequest = req.url.includes('/auth/login');
  const token = localStorage.getItem('token');

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
        if (error.status === 401 && !isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('creo_user');

        router.navigate(['/creo/landing'], {
            queryParams: { sessionExpired: 'true' }
        });
        }

        return throwError(() => error);
    })
    );
};
