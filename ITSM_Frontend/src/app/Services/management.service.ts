import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root',
})
export class ManagementService {
  url: any = environment.apiUrl;

  constructor(private http: HttpClient) {}
  getAllData(url: any) {
    return this.http.get<any>(`${this.url + url}`);
  }

  getDropdownListData(url: any) {
    return this.http.get<any>(`${this.url + url}`);
  }
  postAllData(url: any, data: any) {
    return this.http.post<any>(`${this.url + url}`, data);
  }
  postDataByID(url: any, id: any, data: any) {
    const urls = this.url + url + '/' + id;
    return this.http.post<any>(urls, data);
  }

  editData(url: any, id: any, data: any) {
    const urls = this.url + url + '/' + id;
    return this.http.put<any>(urls, data);
  }
  updateHas_Access(url: any, data: any) {
    const urls = this.url + url;
    return this.http.put<any>(urls, data);
  }
  addOptions(url: any, data: any) {
    const urls = this.url + url;
    return this.http.post<any>(urls, data);
  }
  cibulkUpload(url: any, data: any) {
    return this.http.post<any>(`${this.url + url}`, data);
  }
  userbulkUpload(url: any, data: any) {
    return this.http.post<any>(`${this.url + url}`, data);
  }
  myprofileUpload(url: any, data: any) {
    return this.http.post<any>(`${this.url + url}`, data);
  }
  deleteprofileUpload(url: any) {
    return this.http.delete<any>(`${this.url + url}`);
  }
  getUserById(url: any, userid: number) {
    const urls = this.url + url + '/' + userid;
    return this.http.get<any>(urls);
  }
  // create problem ticket related to incident
  createProblem(formdata: any): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage

    // Set headers with authentication token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.post<any>(`${this.url}api/problem`, formdata, { headers });
  }
  //get all problem data list
  getAllProblemListData(): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
    // Set headers with authentication token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.get<any>(`${this.url}api/problems`, { headers });
  }

  //get problem details by id
  getProblemDetailsById(id: number): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage

    // Set headers with authentication token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
    return this.http.get<any>(`${this.url}api/problems/${id}`, { headers });
  }
  // Update problem details ticket related to incident
  updateProblem(formdata: any, id: number): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
    // Set headers with authentication token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.put<any>(`${this.url}api/problem/${id}`, formdata, {
      headers,
    });
  }
  // delete problem attachment by id
  deleteProblem(id: number): Observable<any> {
    const token = localStorage.getItem('authToken'); // Retrieve token from local storage
    // Set headers with authentication token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.delete<any>(
      `${this.url}api/deleteproblemattachment/${id}`,
      { headers }
    );
  }
  deleteDataById(url: any, id: any) {
    const urls = this.url + url + '/' + id;
    return this.http.delete<any>(urls);
  }

  //get dashboard details for incident
  getDashboardDetailsForIncident(days: any, sDate: any, eDate: any) {
    return this.http.get<any[]>(
      `${this.url}api/incidentcount?days=${days}&sDate=${sDate}&eDate=${eDate}`
    );
  }
}
