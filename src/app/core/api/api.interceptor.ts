import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../../environments/environment";

export const apiInterceptor: HttpInterceptorFn = (req, next) =>
    next(req.url.startsWith(environment.apiUrl)
        ? req.clone({ setHeaders: { Accept: 'application/json' } })
        : req);