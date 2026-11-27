import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { defer, catchError, finalize, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConnectivityService } from './connectivity.service';

export const apiNetworkInterceptor: HttpInterceptorFn = (request, next) => {
  const connection = inject(ConnectivityService);
  const base = new URL(environment.apiUrl, document.baseURI);
  const target = new URL(request.url, document.baseURI);
  const prefix = base.pathname.replace(/\/+$/, '');
  if (target.origin !== base.origin ||
      !(target.pathname === prefix || target.pathname.startsWith(prefix + '/'))) {
    return next(request);
  }

  const write = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
  // Evaluate on subscription too: an Observable created online may be used offline.
  return defer(() => {
    if (!connection.online()) {
      return throwError(() => new HttpErrorResponse({
        status: 0,
        statusText: 'Offline',
        url: request.url,
        error: {
          success: false,
          error_code: 'OFFLINE',
          message: 'Sin conexión. La solicitud no se envió ni se guardó para reenviarla.'
        }
      }));
    }
    if (write) connection.beginWrite();
    // Preserve the API contract: bypass NGSW through a header,
    // never through additional query parameters.
    // Same-origin web requests do not require CORS preflight.
    // External API requests (including Android) remain unchanged.
    const sameOrigin = target.origin === new URL(document.baseURI).origin;
    const networkOnly = sameOrigin
      ? request.clone({
          setHeaders: { 'ngsw-bypass': 'true' }
        })
      : request;
    return defer(() => next(networkOnly)).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0 || error.status >= 500) connection.requestFailed(write);
        return throwError(() => error);
      }),
      finalize(() => { if (write) connection.endWrite(); })
    );
  });
};
