import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
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

  createUser(userData: any, unit: any): Observable<any> {
    return this.http.post(this.backendUrl + '/user', userData, { 
      headers: this.headers 
    }).pipe(
      switchMap((uid: any) => {
        const unitDataRequests = unit.map((u: { tower_number: number; floor_number: number; unit_number: number; }) => {
          const unitData = this.backendData.unitData(
            uid.user_id,
            u.tower_number,
            u.floor_number,
            u.unit_number
          );
          return this.http.post(this.backendUrl + '/unit', unitData, {
            headers: this.headers
          });
        });

        return forkJoin(unitDataRequests).pipe(
          map(() => uid.user_id)
        );      
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
    return JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
  }

  getUnits(): Observable<any> {
    return this.http.get(`${this.backendUrl}/unit`);
  }

  getUnit(unit: any): Observable<any> {
    return this.http.get(`${this.backendUrl}/unit/${unit}`);
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

  getLease(leaseIDorTenantID: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/lease/${leaseIDorTenantID}`);
  }
  
  getLeases(): Observable<any> {
    return this.http.get(`${this.backendUrl}/lease`);
  }

  getPayment(agreementOrPaymentID: string): Observable<any> {
    return this.http.get(`${this.backendUrl}/payment/${agreementOrPaymentID}`);
  }
  
  getTenant(): Observable<any> {
    return this.http.get(`${this.backendUrl}/user/tenant`);
  }
  

  getAccessControls(): Observable<any> {
    return this.http.get(`${this.backendUrl}/accesscontrol`);
  }

  getCMS(): Observable<any> {
    return this.http.get(`${this.backendUrl}/cms`);
  }

  async getCMSById(id: number){
    return this.http.get(`${this.backendUrl}/cms/${id}`);
  }

  getReceiptImage(image: any){
    return this.http.get(`${this.backendUrl}/ocr/${image}`, {responseType: 'blob'});
  }

  getImage(image: any){
    return this.http.get(`${this.backendUrl}/bulletin/${image}`, {responseType: 'blob'});
  }

  getPaymentImage(image: any){
    return this.http.get(`${this.backendUrl}/paymentImage/${image}`, {responseType: 'blob'});
  }

  async renderImageCard(image: any){
    return this.http.get(`${this.backendUrl}/bulletin/${image}`, {responseType: 'blob'});
  }

  addCMS(data: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/cms`, JSON.stringify(data), {
      headers: this.headers
    });
  }

  addBills(data: any): Observable<any> {
    return this.http.post(`${this.backendUrl}/bill`, JSON.stringify(data), {
      headers: this.headers
    });
  }

  async uploadImage(filename: any){
    const formData = new FormData();
    formData.append('file', filename);
    return this.http.post(`${this.backendUrl}/bulletin`, formData);
  }

  ocrImageDetails(filename: any, data: any){
    const formData = new FormData();
    formData.append('file', filename);
    formData.append('data', JSON.stringify(data));
    return this.http.post(`${this.backendUrl}/ocr`, formData);
  }

  updateBills(bill_id: number, data: any): Observable<any> {
    return this.http.put(`${this.backendUrl}/bill/${bill_id}`, JSON.stringify(data), {
      headers: this.headers
    });
  }
  async uploadImageToLease(formData: FormData, lease_agreement_id: number){
    return this.http.post(`${this.backendUrl}/contract`, formData);
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

  updateLease(lease_agreement_id: number, data: any): Observable<any> {
    return this.http.put(`${this.backendUrl}/lease/${lease_agreement_id}`, JSON.stringify(data), {
      headers: this.headers
    });
  }
  
  
addLeaseAgreement(data: any): Observable<any> {
  return this.http.post(`${this.backendUrl}/lease`, JSON.stringify(data), {
    headers: this.headers
  });
}

}

