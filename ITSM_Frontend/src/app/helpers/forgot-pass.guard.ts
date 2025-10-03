import { CanActivateFn, Router } from '@angular/router';
import { ToasterService } from '../Services/toaster.service';
import { inject } from '@angular/core';

export const forgotPassGuard: CanActivateFn = (route, state) => {
  const toastServise = inject(ToasterService);
  const router = inject(Router);
  const otpEmail = localStorage.getItem('otpEmail');

  if (otpEmail ) {
    return true; // Allow navigation to the current route
  } else {
    // Use the ConfirmationService to show a styled alert box
    toastServise.showInfo('Something Went Wrong ! please sign in again.')
    router.navigate(['auth/login'])

    // Prevent navigation until confirmation is handled
    return false;
  }
};
