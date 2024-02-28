declare var google: any;
import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { BackendServiceService } from '../services/backend-service.service';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';

window.Buffer = window.Buffer || require("buffer").Buffer;
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [DialogModule, CommonModule, ButtonModule, RippleModule],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit {
  visible: boolean = false;
  position: string = 'center';
  constructor(private primengConfig: PrimeNGConfig, private router: Router, private ngZone: NgZone, private backendService: BackendServiceService) { }

  ngOnInit(): void {
    this.primengConfig.ripple = true;
  }

  handleLogin(response: any) {
    if (response) {
      //decode
      const payLoad = this.decodeToken(response.credential);
      //store
      sessionStorage.setItem('loggedInUser', JSON.stringify(payLoad));

      this.backendService.getUser(payLoad.email).subscribe({
        next: (response: any) => {
          if (!response.hasOwnProperty('email')) {
            this.ngZone.run(() => {
              this.router.navigate(['user-form']);
            });
            return;
          }
          this.ngZone.run(() => {
            sessionStorage.setItem('backendUserData', JSON.stringify(response));
            this.router.navigate(['dashboard']);
          });
        }
      });
    }
  }

  login(position: string) {
    this.position = position;
    this.visible = true;

    setTimeout(() => {
      google.accounts.id.renderButton(document.getElementById('google-btn'), {
        theme: 'filled_blue',
        size: 'large',
        shape: 'rectangle',
        width: 200
      });
    }, 0);

    google.accounts.id.initialize({
      client_id: '542220434154-rng6tegmbaj2n1falj6iflbtgteltgbj.apps.googleusercontent.com',
      callback: (resp: any) => {
        this.ngZone.run(() => {
          this.handleLogin(resp);
        });
      }
    });


  }

  private decodeToken(token: string) {
    // return JSON.parse(atob(token.split('.')[1]));  }
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('ascii'));
  }
}


