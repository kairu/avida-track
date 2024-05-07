import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BackendServiceService } from '../services/backend-service.service';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent implements OnInit {
  userDataForm!: FormGroup;
  errorMessage!: string;
  userData: any;

  constructor(private fb: FormBuilder, private backendService: BackendServiceService, private messageService: MessageService ) {}

  ngOnInit(): void {
    this.initForm();
    this.fetchUserData();
  }

  initForm() {
    this.userDataForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      mobile_number: ['', Validators.required],
      
    });
  }

  fetchUserData() {
    this.backendService.getEmail().subscribe(email => {
      if (email) {
        this.backendService.getUser(email).subscribe({
          next: (data: any) => {
            this.userDataForm.patchValue({
              first_name: data.first_name,
              last_name: data.last_name,
              mobile_number: data.mobile_number
              
            });
            this.userData = data; // Assign fetched user data to userData variable
          },
          error: (error: any) => {
            console.error('Error fetching user data:', error);
            this.errorMessage = 'Error fetching user data';
          }
        });
      } else {
        console.error('No email found for logged-in user');
        this.errorMessage = 'No email found for logged-in user';
      }
    });
  }

  updateUserData() {
    if (this.userDataForm.invalid) {
      this.errorMessage = 'Please fill up all the fields';
      this.showError();
      return;
    }

    const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
    const userData = {
      first_name: this.userDataForm.value.first_name,
      last_name: this.userDataForm.value.last_name,
      mobile_number: this.userDataForm.value.mobile_number,
      email: email
    };
  
    this.backendService.updateUserData(userData).subscribe({
      next: (data: any) => {
        this.showSuccess(); 
      },
      error: (error: any) => {
        this.showError(); 
      }
    });
  }

  showSuccess() {
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'New Information Saved' });
  }

  showError() {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: this.errorMessage });
  }
}