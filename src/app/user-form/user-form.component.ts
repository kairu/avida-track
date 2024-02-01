import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDataService } from '../user-data.service';


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
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.isFirstTimeUser = !this.userDataService.getUserData();

    if (this.isFirstTimeUser) {
      this.initForm();
      console.log('First Time User - Show form');
    } else {
      console.log('Returning User - No form needed');
      
    }
  }

  initForm() {
    this.userForm = this.fb.group({
      towerNumber: ['', Validators.required],
      unitNumber: ['', Validators.required],
      floorNumber: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      mobileNumber: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.userForm.valid) {
      const userData = this.userForm.value;
      this.userDataService.addUser(userData);
      console.log('User submitted:', userData);
      this.userForm.reset();
    }
  }
}
