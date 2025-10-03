import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {
  url:any=environment.apiUrl

  constructor(private http: HttpClient) { }

  createAsset(url:any,data:any){
    return this.http.post<any>(`${this.url+url}`,data)
  }

  updateAsset(url:any,id:any,data:any){
    const urls=this.url+url+'/'+id;
    return this.http.put<any>(urls,data)
  }

  assetbulkUpload(url:any,data:any){
    return this.http.post<any>(`${this.url+url}`,data)
  }

  getAssetById(url:any,assetid:number){
    const urls=this.url+url+'/'+assetid;
    return this.http.get<any>(urls)
  }

  getOwners(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getAssetType(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getCiCategory(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getCiClassifications(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getServices(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getSupportGroups(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getVendors(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getAllBranches(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getAllModals(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }

  getAssets(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }
  getproblems(url:any){
    return this.http.get<any>(`${this.url+url}`)
  }
  sendMessage(message: any) {
    return this.http.post<any[]>(
      `${this.url}api/getQuestions`,
      message 
    );
  }

  sendEmail(message: string) {
     return this.http.post<any[]>(
       `${this.url}api/getQuestions`,
       { email: message }
     );
   }
   validateOTP(message: any) {
     return this.http.post<any[]>(
       `${this.url}api/getQuestions`,
       message 
     );
   }

   //create incident through chatbot
   createTicketByChatbot(message: any) {
     return this.http.post<any[]>(
       `${this.url}api/createIncidentForBot`,
        message 
     );
   }
   getAssetsbyUser(userId: string) {
    return this.http.get<any[]>(
      `${this.url}api/getassetsuser/${userId}`,
    );
  }
  getAssetsHistorybyAssetID(assetId: string) {
    return this.http.get<any[]>(
      `${this.url}api/assethistory/${assetId}`,
    );
  }

  //surrender Asset
  surrenderAssetbyAssetID(asset_id: string) {
    return this.http.post<any[]>(
      `${this.url}api/surrenderasset/`,{'asset_id':asset_id}
    );
  }
}
