import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BackendDataService } from './backend-data.service';

@Injectable({
  providedIn: 'root'
})
export class BackendServiceService {
  // Temporary
  private backendUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient, backendData: BackendDataService) {}

  headers = new HttpHeaders({
    // TODO Add authorization
    // 'Authorization': 'Bearer'
    'Content-Type': 'application/json'
  });
  // createUser(user: any): Observable<any> {
  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //   });

  //   const rawBody = JSON.stringify(user);

  //   return this.http.post(this.backendUrl + '/user', rawBody, { headers: headers });
  // }
  

  getUsers(): Observable<any> {
    return this.http.get(`${this.backendUrl}/user`);
  }
  getUser(user: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/${user}`, {headers: this.headers});
  }
}
