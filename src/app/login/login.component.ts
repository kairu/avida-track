declare var google: any;
import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BackendServiceService } from '../services/backend-service.service';

window.Buffer = window.Buffer || require("buffer").Buffer; 
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  constructor(private router: Router, private ngZone: NgZone, private backendService: BackendServiceService) {}

  ngOnInit(): void {
    // Your initialization code here
    google.accounts.id.initialize({
      client_id: '675078533314-b10oan58740m5aanbvfsdomelbtd0m3n.apps.googleusercontent.com',
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

  handleLogin(response: any) {
    if (response) {
      //decode
      const payLoad = this.decodeToken(response.credential);
      //store
      sessionStorage.setItem('loggedInUser', JSON.stringify(payLoad));

      this.backendService.getUser(payLoad.email).subscribe({
        next: (response: any) => {
          if(!response.hasOwnProperty('email')){
            this.ngZone.run(() => {
              this.router.navigate(['user-form']);
            });
            return;
          }
          const userData = {
            user_id: response.user_id,
            email: response.email,
            user_type: response.user_type,
          }
          this.ngZone.run(() => {
            sessionStorage.setItem('backendUserData', JSON.stringify(userData));
            this.router.navigate(['dashboard']);
          });
        }
      });
    }
  }

  private decodeToken(token: string) {
    // return JSON.parse(atob(token.split('.')[1]));  }
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('ascii'));}
  }
