import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ToasterService } from '../Services/toaster.service';
import { Dialog } from 'primeng/dialog';

@Injectable()
export class AuthoriseInterceptor implements HttpInterceptor {

  constructor(private router: Router,private toaster:ToasterService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem('authToken'); // Adjust this to where your token is stored

    // Clone the request and add the authorization header if the token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Pass the request to the next handler and handle errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403 || error.error?.message === 'Invalid or expired token') {
          // Clear the token from local storage and redirect to login
        this.toaster.showWarn('Invalid or expired token')
          localStorage.removeItem('authToken');
        
          this.router.navigate(['auth/login']);
        }
        return throwError(error);
      })
    );
  }
}
