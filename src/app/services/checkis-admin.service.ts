import { Injectable } from '@angular/core';
import { BackendServiceService } from './backend-service.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CheckisAdminService {

  constructor(private backendservice: BackendServiceService) { }

  checkisAdmin(): Observable<boolean>{
    const email = this.backendservice.getEmail();
    return this.backendservice.getUser(email).pipe(
      map((response: any) => {
        return response.user_type === 'ADMIN' || response.user_type === 'SUPER_ADMIN';
      })
    );
  }
}
