import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SeverityService {

  constructor() { }

  public getSeverity(status: string) {
    switch (status.toUpperCase()) {
      case 'ADMIN':
      case 'WATER':
      case 'ASSOCIATION':
      case 'PARKING':
      case 'MAINTENANCE':
      case 'ETC':
        return 'primary';
      case 'OWNER':
      case 'TENANT':
      case 'YES':
      case 'PAID':
      case 'RESOLVED':
        return 'success';
      case 'REVIEW':
        return 'info'
      case 'GUEST':
      case 'NO':
      case 'PENDING':
      case 'DENIED':
      default:
        return 'danger';
    }
  }
}
