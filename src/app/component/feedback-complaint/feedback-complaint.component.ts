import { Component } from '@angular/core';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { BackendDataService } from 'src/app/services/backend-data.service';

@Component({
  selector: 'app-feedback-complaint',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './feedback-complaint.component.html',
  styleUrl: './feedback-complaint.component.scss'
})
export class FeedbackComplaintComponent {

  constructor(private backenddata: BackendDataService, private backendservice: BackendServiceService, private messageService: MessageService) { }
  datas: any;
  rows = 10;
  type: { name: string; code: string; }[] = [
    { name: 'Maintenance', code: 'MAINTENANCE' },
    { name: 'Feedback', code: 'FEEDBACK' },
    { name: 'Complaint', code: 'COMPLAINT' },
  ];

  selectedType: { name: string; code: string; } | undefined;
  title: string = '';
  description: string = '';

  ngOnInit() {
    this.getFeedbackandComplaints();
  }

  onCloseButton() {
    this.title = '';
    this.description = '';
    this.selectedType = undefined;
  }

  createFeedbackComplaint() {
    if (!this.title || !this.description || !this.selectedType) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill out all the fields!' });
      return;
    }

    // Proceed with invoice creation
    const userData = sessionStorage.getItem('backendUserData');
    const userID = JSON.parse(userData || '{}').user_id;
    const cmsData = this.backenddata.cmsData(
      userID,
      this.title,
      this.description,
      this.selectedType.code,
    );

    this.backendservice.addCMS(cmsData).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
        this.onCloseButton();
        this.getFeedbackandComplaints();
        this.visible = false;
      }
    });
  }

  getFeedbackandComplaints() {
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;

    this.backendservice.getUser(user_id).subscribe({
      next: (response: any) => {
        this.datas = response.cms.filter((data: any) => {
          return data.cms_type === "FEEDBACK" ||
            data.cms_type === "COMPLAINT" ||
            (data.cms_type === 'MAINTENANCE' &&
              (data.date_to_post == null || data.date_to_post === '') &&
              (data.date_to_end == null || data.date_to_end === ''));
        }).map((data: any) => ({
          Title: data.title,
          Description: data.description,
          Type: data.cms_type,
          'Date Posted': data.date_posted + " " + data.time_posted
        }));
        this.datas.sort((a: { [x: string]: string | number | Date; }, b: { [x: string]: string | number | Date; }) => new Date(b['Date Posted']).getTime() - new Date(a['Date Posted']).getTime());
      }
    });
  }

  refreshTable(table: Table) {
    this.getFeedbackandComplaints();
    table.clear();
    this.searchText = undefined;
  }

  searchText: any;
  clear(table: Table) {
    table.clear();
    this.searchText = undefined;
  }

  visible: boolean = false;
  visibleContent() {
    this.visible = true;
  }
}
