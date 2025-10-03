import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonservicesService {

  private userSubject = new BehaviorSubject<any>(null); // Initialize with null or default user
  user$ = this.userSubject.asObservable();

  setUser(user: any) {
    this.userSubject.next(user); // Update user data
  }
}
