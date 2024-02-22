import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UserDataService {
  private userData: any;

  addUser(user: any) {
    this.userData = user;
  }

  getUserData() {
    return this.userData;
  }
}
