import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDataService } from '../services/user-data.service';
import { BackendServiceService } from '../services/backend-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isFirstTimeUser!: boolean;

  constructor(
    private fb: FormBuilder,
    private userDataService: UserDataService,
    private ngZone: NgZone,
    private backendService: BackendServiceService,
    private router: Router
  ) {}

  initForm() {
    this.userForm = this.fb.group({
      tower_number: ['', Validators.required],
      floor_number: ['', Validators.required],
      unit_number: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      mobile_number: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.isFirstTimeUser = !this.userDataService.getUserData();
    const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    // console.log(storedUser.email || 'User data not found in session storage.');
    this.initForm();
    this.backendService.getUser(storedUser.email).subscribe({
      next: (response: any) => {
        // Return has email on backend
        if(response.hasOwnProperty('email')) {
          this.ngZone.run(() => {
            this.router.navigate(['dashboard']);
          });
          return;
        }
      }
    })
    

    // if (this.isFirstTimeUser) {
      // this.initForm();
      // console.log('First Time User - Show form');
  //  } else {
      // console.log('Returning User - No form needed');  
    // }
  }



  onSubmit() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      this.backendService.createUser(userData).subscribe({
        next: (response: any) => {
          // Handle the response from the backend (if needed)
          this.ngZone.run(() => {
            this.router.navigate(['dashboard']);
          });
        },
        error: (error: any) => {
          // Handle any errors (if needed)
          console.error('Error creating user:', error);
        }
      });
    }
  }
}
