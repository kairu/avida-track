import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
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
    });
  }

  createUser(user: any): Observable<any> {
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
          rawBody.unit_number
        );
        return this.http.post(this.backendUrl + '/unit', unitData, {
           headers: this.headers 
        });
      })
    );
  }

  updateUserData(userData: any): Observable<any> {
    const email = userData.email; // Extract email from userData
    const updatedUserData = {
      first_name: userData.first_name,
      last_name: userData.last_name,
      mobile_number: userData.mobile_number
    };
  
    return this.http.put(`${this.backendUrl}/user/${email}`, updatedUserData, { headers: this.headers });
  }

  getEmail(): Observable<string | null> {
    return of(JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email);
  }

  getUnits(): Observable<any> {
    return this.http.get(`${this.backendUrl}/unit`);
  }

  getBills(): Observable<any> {
    return this.http.get(`${this.backendUrl}/bill`);
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

  updateUnit(unit_id: number, data: any): Observable<any> {
    return this.http.put(`${this.backendUrl}/unit/${unit_id}`, JSON.stringify(data), {
      headers: this.headers
    });
  }

  updateUser(email: string, data: any): Observable<any> {
    return this.http.put(`${this.backendUrl}/user/${email}`, JSON.stringify(data), {
      headers: this.headers
    });
  }

  
}

