import { Component, ViewChild } from '@angular/core';
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
import { CalendarModule } from 'primeng/calendar';
import { DomSanitizer } from '@angular/platform-browser';
import { ImageModule } from 'primeng/image';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-bulletin-board',
  standalone: true,
  imports: [TooltipModule, FileUploadModule, ImageModule, CalendarModule, InputTextareaModule, InputTextModule, CardModule, DialogModule, CommonModule, ButtonModule, RippleModule, PaginatorModule, TimeFormatPipe],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.scss',
})

/**
 * BulletinBoardComponent handles displaying CMS content like announcements, 
 * news, events, and maintenance notices on the bulletin board page.
 *
 * It fetches the CMS data from the backend, handles pagination, filtering,
 * and rendering of the content. Admin users can also add, edit, archive CMS
 * content.
 */
export class BulletinBoardComponent {
  isAdmin: boolean = false;
  display: boolean = false;
  visible: boolean = false;
  contentEdit: boolean = false;
  selectedItem: any;
  pagedItems: any[] = [];
  totalRecords: number = 0;
  datas: any;
  selectedCmsType: any;
  editTitle!: string;
  addTitle!: string;
  editCms: any;
  addCms: any;
  editDescription!: string;
  addDescription!: string;
  addStartDate!: any;
  editStartDate!: any;
  addEndDate!: any;
  editEndDate!: any;
  cms_id!: number;
  filter: string = '';
  cmsTypeOptions = [
    { label: 'Announcement', value: 'Announcement' },
    { label: 'News', value: 'News' },
    { label: 'Event', value: 'Event' },
    { label: 'Maintenance', value: 'Maintenance' },
  ];
  constructor(private sanitizer: DomSanitizer, private messageService: MessageService, private backenddata: BackendDataService, private backendservice: BackendServiceService, private primengConfig: PrimeNGConfig) { this.checkisAdmin(); }
  ngOnInit() {
    this.primengConfig.ripple = true;
    this.getCmsData();
    this.setStartDateToday();
  }

  uploadedFile: any;
  fileName: string | undefined;
  imageSrc: any;
  storeImageData(event: any) {
    this.uploadedFile = event.files[0];
    this.fileName = this.uploadedFile.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageSrc = e.target.result;
    }
    reader.readAsDataURL(event.files[0]);
  }

  @ViewChild('fileUpload',) fileUpload: any;
  clearFile() {
    this.fileUpload.clear()
    this.uploadedFile = undefined;
    this.fileName = undefined;
    this.imageSrc = undefined;
  }

  @ViewChild('replaceImage', { static: false }) replaceImage!: any;
  replaceImageUpload() {
    if (this.replaceImage) {
      if (this.replaceImage.files[0]) {
        this.uploadedFile = undefined;
        this.imageSrc = undefined;
        this.replaceImage.clear()
      } else {
        this.replaceImage.basicFileInput.nativeElement.click();
      }
    }
  }

  onCloseButton() {
    this.contentEdit = false
    this.uploadedFile = undefined;
    this.fileName = undefined;
    this.imageSrc = undefined;
  }

  setStartDateToday() {
    let today = new Date();
    this.addStartDate = today;
  }


  checkisAdmin() {
    const email = this.backendservice.getEmail();
    this.backendservice.getUser(email).subscribe({
      next: (response: any) => {
        if (response.user_type == 'ADMIN' || response.user_type == 'SUPER_ADMIN') {
          this.isAdmin = true;
          return true;
        }
        return false;
      }
    });
  }

  processImage() {
    this.datas.forEach((data: { image_path: any; }) => {
      if (data.image_path) {
        this.backendservice.getImage(data.image_path).subscribe({
          next: (imageResponse) => {
            const imageUrl = URL.createObjectURL(imageResponse);
            data.image_path = this.sanitizer.bypassSecurityTrustUrl(imageUrl);
          }
        });
      }
    });
  }

  getCmsData(): void {
    this.backendservice.getCMS().subscribe({
      next: (response: any) => {
        this.datas = response.filter((data: {
          time_to_end: null;
          date_to_end: null;
          time_to_post: null;
          date_to_post: null; cms_type: string;
        }) => {
          let type = data.cms_type.toLowerCase();
          return type !== 'complaint' && type !== 'feedback' && type !== 'reservation' &&
            (data.date_to_post !== null &&
              (data.date_to_end !== null || data.date_to_end === null)
            );
        });
        this.processImage();

        this.datas.sort((a: { date_to_post: string | number | Date; }, b: { date_to_post: string | number | Date; }) => {
          const dateA = new Date(a.date_to_post);
          const dateB = new Date(b.date_to_post);
          let dateDiff = dateB.getTime() - dateA.getTime();
          return dateDiff;

        });

        this.paginate({ first: 0, rows: 9 });
      }
    });
  }

  showDialog(item: any) {
    this.selectedItem = item;
    this.display = true;
  }

  visibleContent() {
    this.visible = true;
  }

  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  displayCmsType(cms_type: string) {
    return cms_type ? this.capitalizeFirstLetter(cms_type) : '';
  }

  paginate(event: any) {
    let currentDate = new Date().toLocaleDateString('en-CA');
    let startIndex = event.first;
    let endIndex = startIndex + event.rows;
    let filteredItems = this.filter === 'Archived' ?
      this.datas.filter((data: { archive: boolean; }) => data.archive) :
      this.filter === 'Announcement' || this.filter === 'News' || this.filter === 'Event' || this.filter === 'Maintenance' ?
        this.datas.filter((data: { archive: boolean; cms_type: string; date_to_post: string; }) => this.capitalizeFirstLetter(data.cms_type) === this.filter && !data.archive && data.date_to_post <= currentDate) :
        this.filter === 'Future' ?
          this.datas.filter((data: {
            date_to_post: string; archive: boolean;
          }) => !data.archive && data.date_to_post > currentDate) :
          this.datas.filter((data: {
            date_to_post: string; archive: boolean;
          }) => !data.archive && data.date_to_post <= currentDate);
    this.totalRecords = filteredItems.length;
    this.pagedItems = filteredItems.slice(startIndex, endIndex);
  }

  setFilter(category: string) {
    this.filter = category;
    this.paginate({ first: 0, rows: 9 });
  }

  editImage: any;
  editItem(item: any, event: Event) {
    event.stopPropagation();
    this.contentEdit = true;
    this.cms_id = item.cms_id;
    this.editCms = this.displayCmsType(this.selectedItem.cms_type);
    this.editTitle = this.selectedItem.title;
    this.editDescription = this.selectedItem.description;
    this.editStartDate = this.selectedItem.date_to_post;
    this.editEndDate = this.selectedItem.date_to_end;
    this.editImage = this.selectedItem.image_path;
  }

  addContent(): void {
    if (!this.addTitle || !this.addDescription || !this.addCms || !this.addStartDate) {
      this.messageService.add({ severity: 'error', summary: 'Caution', detail: 'Title, Start Date, Description or the Content must not be left blank.' })
      return;
    }

    let userID: number;
    const email = this.backendservice.getEmail();
    this.backendservice.getUser(email).subscribe({
      next: async (response: any) => {

        // Image to upload
        if (this.uploadedFile) {
          this.uploadedFile = await firstValueFrom(await this.backendservice.uploadImage(this.uploadedFile));
        }

        userID = response.user_id;
        const cmsData = this.backenddata.cmsData(
          userID,
          this.addTitle,
          this.addDescription,
          this.addCms.toUpperCase(),
          this.convertDate(new Date(this.addStartDate)),
          !this.addEndDate ? null : this.addEndDate = this.convertDate(new Date(this.addEndDate)),
          this.uploadedFile ? this.uploadedFile.file : null,
        );

        this.backendservice.addCMS(cmsData).subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message
            });
            this.getCmsData();
          }
        });
      }
    });
    this.visible = false;
  }

  copiedData: any;
  updateAll(item: any): void {
    this.contentEdit = false;
    const email = this.backendservice.getEmail();
    this.backendservice.getUser(email).subscribe({
      next: async (response: any) => {
        const userID = response.user_id;

        // Image to upload
        if (this.uploadedFile) {
          this.uploadedFile = await firstValueFrom(await this.backendservice.uploadImage(this.uploadedFile));
        }
        this.copiedData = await lastValueFrom(await this.backendservice.getCMSById(this.cms_id));
        const cmsData = this.backenddata.cmsData(
          userID,
          this.editTitle,
          this.editDescription,
          this.editCms.toUpperCase(),
          this.convertDate(new Date(this.editStartDate)),
          !this.editEndDate ? null : this.editEndDate = this.convertDate(new Date(this.editEndDate)),
          this.uploadedFile ? this.uploadedFile.file : this.copiedData.image_path

        );
        this.backendservice.updateCMS(this.cms_id, cmsData).subscribe({
          next: (response: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message
            });
            this.getCmsData();
            Object.assign(item, {
              title: this.editTitle,
              cms_type: this.editCms,
              description: this.editDescription,
              date_posted: response.date_posted,
              time_posted: response.time_posted,
              date_to_start: this.editStartDate,
              date_to_end: this.editEndDate,
              image_path: this.uploadedFile ? this.renderImage(this.uploadedFile.file) : this.editImage,
            });
          }
        });
      }
    });
  }

  async renderImage(image: any) {
    image = await firstValueFrom(await this.backendservice.renderImageCard(image));
    image = URL.createObjectURL(image);
    image = this.sanitizer.bypassSecurityTrustUrl(image);
    return image
  }

  convertDate(date: any) {
    return date.toLocaleDateString('en-CA');
  }
}
