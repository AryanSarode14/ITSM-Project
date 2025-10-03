import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class HrmanagementService {
  url:any=environment.apiUrl

  constructor(private http: HttpClient) { }

  createIncident(assetData: any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage

    // Set headers with authentication token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(`${this.url}api/createhr`, assetData, { headers });
  }

  updateIncident(id:any,assetData: any): Observable<any>{
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage

    // Set headers with authentication token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<any>(`${this.url}api/updatehr/${id}`, assetData, { headers });
  }

  getCallModes(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/call_modes`, { headers });
  }

  getAllCallTypes(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/call_types`, { headers });
  }
  
  getAllSLAs(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/slas`, { headers });
  }
  getAllStatuses(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/statuses`, { headers });
  }
  getUserAssets(userId:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/getassetsuser/${userId}`, { headers });
  }
  getSupportGroups(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/support_group_details`, { headers });
  }
  getAllService(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/getallservice`, { headers });
  }
  getCiById(id:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/getcibyservice/${id}`, { headers });
  }
  getallHR(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/getallhr`, { headers });
  }
  getMyTickets(id:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/hrmytickets/${id}`, { headers });
  }
  getIncidentById(id:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/gethrbyid/${id}`, { headers });
  }
  getTicketsByStatus(status:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/hr_request/${status}`, { headers });
  }
  getbySupportGrp(id:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/hrtickeysbysupportgroup/${id}`, { headers });
  }
  getbyAssignedToTickets(id:any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/hrticketassignedto/${id}`, { headers });
  }
  getAllUsers(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/getreporting`, { headers });
  }
  getAllIncidents(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/incidentsname`, { headers });
  }

  //get impact data list
  getAllImpacts(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
  
      // Set headers with authentication token
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
      return this.http.get<any>(`${this.url}api/impacts`, { headers });
  }

}
