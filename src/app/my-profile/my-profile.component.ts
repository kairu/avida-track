import { Component } from "@angular/core";
import { BackendServiceService } from "../backend-service.service";


@Component({
  templateUrl: './my-profile.component.html'
})
export class MyProfileComponent{
  constructor(private backendService: BackendServiceService){}

  ngOnInit(){
    this.fetchAllUsers();
  }

  fetchAllUsers(){
    this.backendService.getAllUsers().subscribe({
      next: (data: any) => {
        console.log('List of users:', data);
      },
      error: (error: any) => {
        console.error('Error fetching users:', error);
      },
      complete: () => {
        console.log('All users fetched');
      }
    });
  }
}
