import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToasterService } from '../Services/toaster.service';

export const authGuard: CanActivateFn = (route, state) => {
  
  const router = inject(Router);
  const confirmationService = inject(ConfirmationService);
  const messageService = inject(MessageService);
  const toastServise = inject(ToasterService);
  const token = localStorage.getItem('authToken'); // Adjust the storage location as needed
  const userData = localStorage.getItem('userData'); // Adjust to your method of retrieving the role

  // Parse userData to an object to extract roleName
  const parsedUserData = userData ? JSON.parse(userData) : null;
  const roleName = parsedUserData?.role;
console.log(parsedUserData,'user2');
//   console.log(token);
// console.log("role",roleName);
  if (token) {
    
    return true; // Allow navigation to the current route
  } else {
    // Use the ConfirmationService to show a styled alert box
    toastServise.showInfo('Something Went Wrong ! please sign in again.')
    router.navigate(['auth/login'])

    // Prevent navigation until confirmation is handled
    return false;
  }
};
