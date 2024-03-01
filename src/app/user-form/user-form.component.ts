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
  userTypeOptions = [
    { label: 'Owner', value: 'Owner' },
    { label: 'Tenant', value: 'Tenant' },
    { label: 'Guest', value: 'Guest' },
  ];

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
      userType: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.isFirstTimeUser = !this.userDataService.getUserData();
    const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    this.initForm();
    this.backendService.getUser(storedUser.email).subscribe({
      next: (response: any) => {
        // Return has email on backend
        if(response.hasOwnProperty('email')) {
          this.ngZone.run(() => {
            this.router.navigate(['dashboard']);
          });
        }else if(Object.keys(storedUser).length === 0){
          this.router.navigate(['/']);
        }
        return;
      }
    })
  }



  onSubmit() {
    if (this.userForm.valid) {
      this.userForm.value.userType = this.userForm.value.userType.toUpperCase();
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
