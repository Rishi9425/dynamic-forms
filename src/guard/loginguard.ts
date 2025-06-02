// src/app/guards/login.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FormService } from '../service/form-service.service';

export const loginGuard: CanActivateFn = (route, state) => {
  const formService = inject(FormService);
  const router = inject(Router);

  if (formService.isAuthenticated()) {
   
    router.navigate(['/Home-Page'], { replaceUrl: true });
    return false;
  } else {
  
    return true;
  }
};