// src/app/guards/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FormService } from '../service/form-service.service';

export const authGuard: CanActivateFn = (route, state) => {
  const formService = inject(FormService);
  const router = inject(Router);

  if (formService.isAuthenticated()) {
    return true;
  } else {
    // User is NOT authenticated, redirect to login page
    router.navigate([''], { replaceUrl: true });
    return false;
  }
};