import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment.prod';
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  url:any=environment.apiUrl
  constructor(private http:HttpClient) { }


  login(data:any){

    return this.http.post<any>(`${this.url}api/login`, data).pipe(
      tap((response: any) => {
        // Store the response data in local storage
        if (response && response.token) { // Assuming the response contains a token
          localStorage.setItem('authToken', response.token);
          localStorage.setItem('userData', JSON.stringify(response.user)); 
          
        }
      })
    );
  }

  sentOtp(email:any){
    return this.http.post<any>(`${this.url}api/forgotpassword`, email)
  }
  verifyOTP(formData:any){
    return this.http.post<any>(`${this.url}api/verifyotp`, formData)
  }
}
