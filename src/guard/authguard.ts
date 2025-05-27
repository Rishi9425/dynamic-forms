import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FormService } from '../service/form-service.service';

export const authGuard: CanActivateFn = (route, state) => {
  const formService = inject(FormService);
  const router = inject(Router);

  if (formService.isAuthenticated()) {
    return true;
  } else {
    // Redirect to the login page with a return URL
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
};