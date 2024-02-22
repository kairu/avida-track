import { Component } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';

@Component({
  selector: 'app-access-control',
  templateUrl: './access-control.component.html',
  styleUrls: ['./access-control.component.scss']
})

export class AccessControlComponent {
  components!: any[];
  constructor(private backendService: BackendServiceService) {
    this.backendService.getAccessControls().subscribe({
      next: (response: any) => {
        this.components = response;
      }
    });
  }

  onChange(role: string, module_name: string, value: boolean){
    const component = this.components.find( c => c.module_name === module_name)
    if (component){
      component[role] = value;
    }
    this.backendService.updateAccessControls(component).subscribe({
      next: (response: any) => {
        // Add notif that the access has been updated.
        // console.log(response);
      }
    });
  }
}
