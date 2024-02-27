import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { PaginatorModule } from 'primeng/paginator';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { TimeFormatPipe } from 'src/app/pipe/time-format.pipe';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { BackendDataService } from 'src/app/services/backend-data.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-bulletin-board',
  standalone: true,
  imports: [InputTextareaModule, InputTextModule, CardModule, DialogModule, CommonModule, ButtonModule, RippleModule, PaginatorModule, TimeFormatPipe],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.scss',
})
export class BulletinBoardComponent {
  isAdmin: boolean = true;
  display: boolean = false;
  visible: boolean = false;
  contentEdit: boolean = false;
  selectedItem: any;
  pagedItems: any[] = [];
  totalRecords: number = 0;
  datas: any;
  selectedCmsType: any;
  editTitle!: string;
  editCms: any;
  editDescription!: string;
  cms_id!: number;
  filter: string = '';
  cmsTypeOptions = [
    { label: 'Announcement', value: 'Announcement' },
    { label: 'News', value: 'News' },
    { label: 'Event', value: 'Event' },
    { label: 'Maintenance', value: 'Maintenance' },
  ];
  constructor(private messageService: MessageService, private backenddata: BackendDataService, private backendservice: BackendServiceService, private primengConfig: PrimeNGConfig) { }
  ngOnInit() {
    this.primengConfig.ripple = true;
    this.getCmsData()
  }

  getCmsData(): void {
    this.backendservice.getCMS().subscribe({
      next: (response: any) => {
        this.datas = response.filter((data: { cms_type: string; }) => {
          let type = data.cms_type.toLowerCase();
          return type !== 'complaint' && type !== 'feedback' && type !== 'reservation';
        });
        this.datas.reverse();
        this.paginate({ first: 0, rows: 9 });
      }
    });
  }

  showDialog(item: any) {
    this.selectedItem = item;
    this.display = true;
  }

  addContent() {
    this.visible = true;
  }

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  displayCmsType(cms_type: string) {
    return cms_type ? this.capitalizeFirstLetter(cms_type) : '';
  }

  paginate(event: any) {
    let startIndex = event.first;
    let endIndex = startIndex + event.rows;
    let filteredItems = this.filter ? this.datas.filter((data: { cms_type: string; }) => this.capitalizeFirstLetter(data.cms_type) === this.filter) : this.datas;
    this.totalRecords = filteredItems.length;
    this.pagedItems = filteredItems.slice(startIndex, endIndex);
  }

  setFilter(category: string) {
    this.filter = category;
    this.paginate({ first: 0, rows: 9 });
  }

  editItem(item: any, event: Event) {
    event.stopPropagation();
    this.contentEdit = true;
    this.cms_id = item.cms_id;
    this.editCms = this.displayCmsType(this.selectedItem.cms_type);
    this.editTitle = this.selectedItem.title;
    this.editDescription = this.selectedItem.description;
  }

  onCloseButton() {
    this.contentEdit = false
  }

  updateAll(item: any): void {
    this.contentEdit = false;
    let userID: number;
    const email = this.backendservice.getEmail();
    this.backendservice.getUser(email).subscribe({
      next: (response: any) => {
        userID = response.user_id;
        const cmsData = this.backenddata.cmsData(
          userID,
          this.editTitle,
          this.editDescription,
          this.editCms.toUpperCase()
        );
        this.backendservice.updateCMS(this.cms_id, cmsData).subscribe({
          next: (response: any) => {
            this.messageService.add( { severity: 'success', summary: 'Success', detail: response.message});
            this.getCmsData()
            this.selectedItem.title = this.editTitle;
            this.selectedItem.cms_type = this.editCms;
            this.selectedItem.description = this.editDescription;
            this.selectedItem.date_posted = response.date_posted;
            this.selectedItem.time_posted = response.time_posted;
          }
        });
      }
    });

  }
}
