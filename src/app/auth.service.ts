declare var google:any;
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router) {}

  signOut() {
    google.accounts.id.disableAutoSelect();
    // Perform any additional sign-out logic if needed
    // ...

    // Navigate to the home or sign-in page
    this.router.navigate(['/']);
  }
}
