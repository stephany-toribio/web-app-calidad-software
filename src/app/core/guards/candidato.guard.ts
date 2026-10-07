import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../api/auth.service';

export const candidatoGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isCandidato()) {
    return true;
  }

  authService.clearSession();

  return router.createUrlTree(['/creo/landing']);
};
