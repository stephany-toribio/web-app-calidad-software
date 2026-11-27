import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { getSessionInvalidationReason } from './session-policy';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const apiUrl = environment.apiUrl.replace(/\/+$/, '');

  const requestPath = req.url.split(/[?#]/, 1)[0];

  const belongsToApi =
    requestPath === apiUrl ||
    requestPath.startsWith(`${apiUrl}/`);

  if (!belongsToApi) {
    return next(req);
  }

  const isLoginRequest =
    requestPath === `${apiUrl}/auth/login`;

  const token = authService.getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (token && !isLoginRequest) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(
    req.clone({
      setHeaders: headers
    })
  ).pipe(
    catchError((error: HttpErrorResponse) => {
      const reason = getSessionInvalidationReason({
        status: error.status,
        payload: error.error,
        requestToken: token,
        currentToken: authService.getToken(),
        isLoginRequest
      });

      if (reason !== null) {
        authService.clearSession();

        void router.navigate(['/creo/landing'], {
          queryParams: {
            [reason]: 'true'
          }
        });
      }

      return throwError(() => error);
    })
  );
};
