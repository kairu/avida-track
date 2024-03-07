import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MyProfileComponent } from './my-profile.component';

const routes: Routes = [
  {
    path: "",
    data: {
      title: "Profile",
      urls: [{title: "Profile", url: "/my-profile"}, {title: "Profile"}],
    },
    component: MyProfileComponent
  }
];


@NgModule({
  declarations: [MyProfileComponent],
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class MyProfileModule { }
