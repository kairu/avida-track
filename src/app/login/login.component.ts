declare var google: any;
import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnInit(): void {
    // Your initialization code here
    google.accounts.id.initialize({
      client_id: '542220434154-rng6tegmbaj2n1falj6iflbtgteltgbj.apps.googleusercontent.com',
      callback: (resp: any) => {
        this.ngZone.run(() => {
          this.handleLogin(resp);
        });
      }
    });

    google.accounts.id.renderButton(document.getElementById('google-btn'), {
      theme: 'filled_blue',
      size: 'large',
      shape: 'rectangle',
      width: 200
    });
  }

  private handleLogin(response: any) {
    if (response) {
      //decode
      const payLoad = this.decodeToken(response.credential);
      //store
      sessionStorage.setItem('loggedInUser', JSON.stringify(payLoad));
      //navigate to dashboard
      this.ngZone.run(() => {
        this.router.navigate(['dashboard']);
      });
    }
  }

  private decodeToken(token: string) {
    return JSON.parse(atob(token.split('.')[1]));
  }
}
