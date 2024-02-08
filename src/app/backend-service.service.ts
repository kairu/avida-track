import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendServiceService {
  private backendUrl = 'http://127.0.0.1:5000';

  constructor(private http: HttpClient) {}

  // createUser(user: any): Observable<any> {
  //   const headers = new HttpHeaders({
  //     'Content-Type': 'application/json',
  //   });

  //   const rawBody = JSON.stringify(user);

  //   return this.http.post(this.backendUrl + '/user', rawBody, { headers: headers });
  // }
  getAllUsers(): Observable<any> {
    return this.http.get(`${this.backendUrl}/user`);
  }
}
