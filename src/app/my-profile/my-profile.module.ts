import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Routes, RouterModule } from '@angular/router';

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
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
})
export class MyProfileModule { }
