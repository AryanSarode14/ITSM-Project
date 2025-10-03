import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';

export const loginAuthGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('authToken');
  // console.log(token);
  
  const router = inject(Router); // Inject Router

  if (token) {
    // Navigate to the dashboard if a token exists
    router.navigate(['/admin/admin-dashboard']);
    return false; // Prevent access to the login page
  }

  // Allow access to the login page if no token
  return true;
};
