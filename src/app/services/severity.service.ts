import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SeverityService {

  constructor() { }

  public getSeverity(status: string) {
    switch (status) {
      case 'Admin':
      case 'WATER':
      case 'ASSOCIATION':
      case 'PARKING':
      case 'MAINTENANCE':
      case 'ETC':
        return 'primary';
      case 'Owner':
      case 'Tenant':
      case 'Yes':
      case 'PAID':
        return 'success';
      case 'REVIEW':
        return 'info'
      case 'Guest':
      case 'No':
      case 'PENDING':
      default:
        return 'danger';
    }
  }
}
