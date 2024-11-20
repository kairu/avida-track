import { Component } from '@angular/core';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { BackendDataService } from 'src/app/services/backend-data.service';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { SeverityService } from 'src/app/services/severity.service';

@Component({
  selector: 'app-feedback-complaint',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './feedback-complaint.component.html',
  styleUrl: './feedback-complaint.component.scss'
})
export class FeedbackComplaintComponent {

  constructor(public severity: SeverityService, private checkisadmin: CheckisAdminService, private backenddata: BackendDataService, private backendservice: BackendServiceService, private messageService: MessageService) { }
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
  isAdmin!: boolean;

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      this.getReportsData();
    });
    this.getFeedbackandComplaints();
  }

  adminDatas: any;
  getReportsData() {
    this.backendservice.getCMS().pipe(
      switchMap(response => {
        return of(
          response.filter((data: {
            date_to_end: null;
            date_to_post: null; cms_type: string;
          }) => {
            let type = data.cms_type.toLowerCase();
            return (
              type === 'feedback' ||
              type === 'complaint' ||
              (type === 'maintenance' &&
                (data.date_to_post == null ||
                  data.date_to_post == '' ||
                  data.date_to_post == undefined) &&
                (data.date_to_end == null ||
                  data.date_to_end == '' ||
                  data.date_to_end == undefined))
            );
          })
        );
      }),
      switchMap(filteredData => {
        return of(
          filteredData.reverse(),
          filteredData.map((data: { [x: string]: any; date_to_post: any; date_to_end: any; cms_id: any; archive: any; }) => {
            const { date_to_post, date_to_end, archive, ...rest } = data;
            return rest;
          })
        );
      }),
      switchMap(mappedData => {
        return combineLatest([
          of(mappedData),
          this.backendservice.getUsers(),
          this.backendservice.getUnits()
        ]);
      }),
      map(([datas, users, units]) => {
        return datas.map((data: { user_id: any; title: any; description: any; cms_type: any; date_posted: any; time_posted: any; status: any; cms_id: number; notes: any[] }) => {
          const user = users.find((u: { user_id: any; }) => u.user_id === data.user_id);
          const unit = units.find((u: { user_id: any; }) => u.user_id === data.user_id);

          return {
            cms_id: data.cms_id,
            'Full Name': `${user.last_name}, ${user.first_name}`,
            'Unit': `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`,
            'Title': data.title,
            'Description': data.description,
            'Type': data.cms_type,
            'Date Posted': data.date_posted + " " + data.time_posted,
            'Status': data.status == 'REVIEW' ? 'DENIED' : data.status == 'PAID' ? 'RESOLVED' : data.status,
            'Notes': data.notes.map(note => note.notes).reverse()
            // 'Time Posted': data.time_posted,
          };
        });
      })
    ).subscribe(datas => {
      this.adminDatas = datas.sort((a: { [x: string]: string | number | Date; }, b: { [x: string]: string | number | Date; }) => new Date(b['Date Posted']).getTime() - new Date(a['Date Posted']).getTime());
      this.adminDatas = datas;
    });
  }

  resolveOrDenyWindow: boolean = false;
  selectedRow: any;
  feedbackComplaintSelectedTitle!: string;
  feedbackComplaintDescription!: string;
  feedbackComplaintNotes!: string;
  resolveOrDeny(rowData: any, status: string) {
    if (status !== 'PENDING') {
      return;
    }
    this.resolveOrDenyWindow = true;
    this.feedbackComplaintSelectedTitle = rowData.Title;
    this.feedbackComplaintDescription = rowData.Description;
    this.selectedRow = rowData;
  }

  requireNotes: boolean = false;
  denyFeedbackComplaint() {
    if (this.validateNotes()) {
      return;
    }
    const data = {
      cms_id: this.selectedRow.cms_id,
      notes: this.feedbackComplaintNotes,
    }
    this.backendservice.addCMSNotes(data).pipe(
      switchMap(() => this.backendservice.updateCMS(this.selectedRow.cms_id, { status: 'REVIEW', feedback: true }))
    ).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Feedback/Complaint Updated!' });
        this.closeResolveOrDenyWindow();
        this.getFeedbackandComplaints();
        this.getReportsData();
      }
    });
  }

  resolveFeedbackComplaint() {
    if (this.validateNotes()) {
      return;
    }
    const data = {
      cms_id: this.selectedRow.cms_id,
      notes: this.feedbackComplaintNotes,
    }
    this.backendservice.addCMSNotes(data).pipe(
      switchMap(() => this.backendservice.updateCMS(this.selectedRow.cms_id, { status: 'PAID', feedback: true }))
    ).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Feedback/Complaint Updated!' });
        this.closeResolveOrDenyWindow();
        this.getFeedbackandComplaints();
        this.getReportsData();
      }
    });


  }

  private validateNotes(): boolean {
    if (this.feedbackComplaintNotes == '' || this.feedbackComplaintNotes == undefined) {
      this.requireNotes = true;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please provide a reason for denial!' });
      return true;
    }
    return false;
  }

  closeResolveOrDenyWindow() {
    this.requireNotes = false;
    this.resolveOrDenyWindow = false;
    this.selectedRow = undefined;
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

  expandedRows = {};
  getFeedbackandComplaints() {
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;

    this.backendservice.getUser(user_id).subscribe({
      next: (response: any) => {
        if (!response.cms || !Array.isArray(response.cms)) {
          return
        }
        this.datas = response.cms.filter((data: any) => {
          return data.cms_type === "FEEDBACK" ||
            data.cms_type === "COMPLAINT" ||
            (data.cms_type === 'MAINTENANCE' &&
              (data.date_to_post == null || data.date_to_post === '') &&
              (data.date_to_end == null || data.date_to_end === ''));
        }).map((data: { cms_id: number; title: string; description: string; cms_type: any; date_posted: Date; time_posted: any; status: any; notes: any[] }) => ({
          cms_id: data.cms_id,
          Title: data.title,
          Description: data.description,
          Type: data.cms_type,
          'Date Posted': data.date_posted + " " + data.time_posted,
          'Status': data.status == 'REVIEW' ? 'DENIED' : data.status == 'PAID' ? 'RESOLVED' : data.status,
          'Notes': data.notes.map((note: { notes: any; }) => note.notes).reverse()
        }));
        this.datas.sort((a: { [x: string]: string | number | Date; }, b: { [x: string]: string | number | Date; }) => new Date(b['Date Posted']).getTime() - new Date(a['Date Posted']).getTime());
        this.expandedRows = this.datas.reduce((acc: any, curr: any) => {
          acc[curr.cms_id] = true;
          return acc;
        }, this.expandedRows);
      }
    });
  }

  refreshTable(table: Table) {
    this.getFeedbackandComplaints();
    table.clear();
    this.searchText = undefined;
    this.searchText2 = undefined;
  }

  searchText: any;
  searchText2: any;
  clear(table: Table) {
    table.clear();
    this.searchText = undefined;
    this.searchText2 = undefined;

  }

  visible: boolean = false;
  visibleContent() {
    this.visible = true;
  }
}
