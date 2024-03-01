import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { BackendDataService } from './backend-data.service';

@Injectable({
  providedIn: 'root'
})
export class BackendServiceService {
  // Temporary
  private backendUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient, private backendData: BackendDataService) {}

  headers = new HttpHeaders({
    // TODO Add authorization
    // 'Authorization': 'Bearer'
    'Content-Type': 'application/json'
  });

  updateAccessControls(data: any): Observable<any>{
    return this.http.put(`${this.backendUrl}/accesscontrol`, JSON.stringify(data), {
      headers: this.headers
    })
  }

  createUser(user: any): Observable<any>{
    const rawBody = JSON.parse(JSON.stringify(user));
    const userData = this.backendData.userData(
      rawBody.first_name, 
      rawBody.last_name, 
      rawBody.mobile_number,
      this.getEmail(),
      rawBody.userType
    );
    return this.http.post(this.backendUrl + '/user', userData, { 
      headers: this.headers 
    }).pipe(
      switchMap((uid: any) => {
        const unitData = this.backendData.unitData(
          uid.user_id, 
          rawBody.tower_number, 
          rawBody.floor_number, 
          rawBody.unit_number,
        );
        return this.http.post(this.backendUrl + '/unit', unitData, {
           headers: this.headers 
        });
      })
    );
  }

  getEmail(): Observable<string | null> {
    return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
  }
  
  getUsers(): Observable<any> {
    return this.http.get(`${this.backendUrl}/user`);
  }
  getUser(user: any): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/${user}`, {headers: this.headers});
  }

  getAccessControls(): Observable<any> {
    return this.http.get(`${this.backendUrl}/accesscontrol`);
  }

  getCMS(): Observable<any> {
    return this.http.get(`${this.backendUrl}/cms`);
  }

  addCMS(data: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/cms`, JSON.stringify(data), {
      headers: this.headers
    });
  }

  updateCMS(cms_id: number, data: any): Observable<any> {
    return this.http.put(`${this.backendUrl}/cms/${cms_id}`, JSON.stringify(data), {
      headers: this.headers
    });
  }
}
