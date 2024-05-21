import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'; 
import { ConfirmationService, MessageService } from 'primeng/api';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { HttpClient } from '@angular/common/http';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { FieldsetModule } from 'primeng/fieldset';
import { ButtonModule } from 'primeng/button';

enum CMSStatus {
  PENDING = 'PENDING',
  REVIEW = 'REVIEW',
  APPROVED = 'PAID'
}
interface Venue {
  name: string;
}
interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

interface CMSData {
  status: string;
  cms_id: number;
  title: string;
  description: string;
  cms_type: string;
  date_to_post: string;
  selectedVenue: string; 
  selectedTimeSlot: string;
}

@Component({
  selector: 'app-events-reservation',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, FieldsetModule, PanelModule, AdminModule, ConfirmDialogModule, ToastModule, ButtonModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './events-reservation.component.html',
  styleUrls: ['./events-reservation.component.scss']
})

export class EventsReservationComponent implements OnInit {
  reservationForm!: FormGroup;
  today: Date;
  disableReservedDate!: Date[]; 
  reservedDates: Date[] = [];
  isAdmin: boolean = true;
  cmsData: CMSData[] = [];
  approvedEntries: CMSData[] = [];
  rejectedEntries: CMSData[] = [];
  backendUrl: string = 'http://127.0.0.1:5000'; 
  cms_id!: number;
  venue: Venue[] = [
    { name: 'Outdoor Gym'},
    { name: 'Clubhouse'},
    { name: 'Swimming Pool'},
  ];
  timeSlots: any[] = [];
  cmsEntry: any;
 

  constructor(
    private fb: FormBuilder,
    private backendService: BackendServiceService,
    private messageService: MessageService,
    private http: HttpClient,
    private confirmationService: ConfirmationService,
  ) {
    this.today = new Date();
    this.checkisAdmin();
  }

  ngOnInit(): void {
    this.initForm();
    this.fetchReservedDates();
    // this.loadCmsDataFromLocalStorage();
    
  }
  

  getDescriptionWithoutVenueAndTimeSlot(description: string): string {
    const parts = description.split(' Venue: ');
    return parts[0];
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      selectedVenue: ['', Validators.required],
      date_to_post: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      selectedTimeSlot: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.reservationForm.valid) {
      const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
      if (email) {
        this.backendService.getUser(email).subscribe({
          next: (userId: any) => {
            const dateTime = new Date(this.reservationForm.value.date_to_post);
            // const hours = dateTime.getHours().toString().padStart(2, '0');
            // const minutes = dateTime.getMinutes().toString().padStart(2, '0');
            const backendData = {
              user_id: userId.user_id,
              title: this.reservationForm.value.title,
              description: this.reservationForm.value.description +
                ` Venue: ${this.reservationForm.value.selectedVenue.name}`+
                ` Time Slot: ${this.reservationForm.value.selectedTimeSlot.label}`,
              cms_type: 'RESERVATION',
              date_to_post: this.reservationForm.value.date_to_post.toLocaleDateString('en-CA'),
            };
            this.backendService.addCMS(backendData).subscribe(
              (response: any) => {
                console.log('Reservation added successfully:', response);
                this.cms_id = response.id;
                this.reservationForm.reset();
                this.messageService.add({ severity: 'success', summary: 'Reservation Submitted', 
                detail: 'Your reservation has been submitted successfully.' });
              },
              (error: any) => {
                console.error('Error adding reservation:', error);
                
              }
            );
          },
          error: (error: any) => {
            console.error('Error fetching user ID:', error);
          },
        });
        
      } else {
        console.error('No email found for logged-in user');
      }
    }
  }

  
  fetchReservedDates(): void {
    this.backendService.getCMS().subscribe((cmsData: any[]) => {
      const reservationData = cmsData.filter(cms => cms.cms_type === 'RESERVATION');
      this.reservedDates = reservationData.map(reservation => new Date(reservation.date_to_post));
    });
  }

  checkReservedDate(selectedDate: Date): boolean {
    return this.reservedDates.some(reservedDate => this.isSameDate(selectedDate, reservedDate));
  }
  
  isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  onDateSelect(selectedDate: Date) {
    const selectedTime: Date = this.reservationForm.value.date_to_post;

    this.updateTimeSlots(selectedDate, selectedTime);
    if (!selectedDate) {
      console.error('Selected date is undefined or null');
      return;
    }
    const isReserved = this.checkReservedDate(selectedDate);
    if (isReserved) {
      this.messageService.add({ severity: 'warn', summary: 'Cannot Proceed', detail: 'This date is already reserved.' });
    }
  }  
  updateTimeSlots(selectedDate: Date, selectedTime: Date) {
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2); // Assuming 2-hour time slot interval

    const startTimeSlot = this.formatTime(startDateTime);
    const endTimeSlot = this.formatTime(endDateTime);

    this.timeSlots = [{ label: startTimeSlot + ' - ' + endTimeSlot, value: { start: startDateTime, end: endDateTime } }];
  }

  formatTime(time: Date): string {
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
  }

  checkisAdmin() {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (response: any) => {
        if (response.user_type == 'ADMIN' || response.user_type == 'SUPER_ADMIN') {
          this.isAdmin = true;
          this.fetchCmsData();
          console.log(response);
        } else {
          this.isAdmin = false;
        }
      },
      error: (error: any) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

// datas: any;
  // fetchCmsData(){
  //   this.http.get<CMSData[]>(`${this.backendUrl}/cms`).subscribe({
  //     next: (data: CMSData[]) => {
  //       const reservationEntries = data.filter(
  //         (cms: {cms_type: string; status: string}) => {
  //           return cms.cms_type === 'RESERVATION' && cms.status === 'PENDING';
  //         }
  //       );
  //       reservationEntries.sort((a, b) => new Date(b.date_to_post).getTime() - new Date(a.date_to_post).getTime());
  //       this.cmsData = reservationEntries;
  //       this.cmsData.forEach(entry => {
  //         const descriptionParts = entry.description.split(' Venue: ');
  //         entry.selectedVenue = descriptionParts[1] ? descriptionParts[1].split(' Time Slot: ')[0] : '';
  //         entry.selectedTimeSlot = descriptionParts[1] ? descriptionParts[1].split(' Time Slot: ')[1] : '';
          
  //       });
  //       this.fetchApprovedCmsData();
  //       this.fetchRejectedCmsData();
  //       // this.saveCmsDataToLocalStorage(); // Save data to localStorage
  //     },
  //     error: (error) => {
  //       console.error('Error fetching CMS data:', error);
  //     }
  //   });
  // }
  fetchCmsData() {
    this.http.get<CMSData[]>(`${this.backendUrl}/cms`).subscribe({
      next: (data: CMSData[]) => {
        const reservationEntries = data.filter(cms => cms.cms_type === 'RESERVATION' && cms.status === 'PENDING');
        reservationEntries.sort((a, b) => new Date(b.date_to_post).getTime() - new Date(a.date_to_post).getTime());
        this.cmsData = reservationEntries.map(entry => this.populateVenueAndTimeSlot(entry));
        this.fetchApprovedCmsData();
        this.fetchRejectedCmsData();
      },
      error: (error) => {
        console.error('Error fetching CMS data:', error);
      }
    });
  }
  
  populateVenueAndTimeSlot(entry: CMSData): CMSData {
    const { venue, timeSlot } = this.parseDescription(entry.description);
    return {
      ...entry,
      selectedVenue: venue,
      selectedTimeSlot: timeSlot
    };
  }
  
  
  parseDescription(description: string): { venue: string, timeSlot: string } {
    const parts = description.split(' Venue: ');
    const venueAndTimeSlot = parts[1] ? parts[1].split(' Time Slot: ') : ['', ''];
    return {
      venue: venueAndTimeSlot[0] || '',
      timeSlot: venueAndTimeSlot[1] || ''
    };
  }


  approve(cms: CMSData): void {
    const updatedCMSData = { ...cms, status: 'PAID' };
    this.backendService.updateCMS(cms.cms_id, updatedCMSData).subscribe({
      next: (response: any) => {
        console.log('CMS entry approved:', cms.cms_id);
  
        // Remove approved CMS entry from main table
        const index = this.cmsData.findIndex(entry => entry.cms_id === cms.cms_id);
        if (index !== -1) {
          this.cmsData.splice(index, 1);
        }
  
        // Add approved CMS entry to approvedEntries array
        this.approvedEntries.push(this.populateVenueAndTimeSlot(updatedCMSData));
      },
    });
  }
  
  confirmApprove(cms: CMSData, event: Event) {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure that you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon: "none",
      rejectIcon: "none",
      acceptButtonStyleClass: "p-button-success p-button-text",
      rejectButtonStyleClass: "p-button-text",
      accept: () => {
        this.approve(cms);
        this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'You have accepted' });
      },
      reject: () => {
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have canceled', life: 3000 });
      }
    });
  }


  reject(cms: CMSData): void {
    const updatedCMSData = { ...cms, status: 'REVIEW' };
    this.backendService.updateCMS(cms.cms_id, updatedCMSData).subscribe({
      next: (response: any) => {
        console.log('CMS entry rejected:', cms.cms_id);
  
        // Remove rejected CMS entry from main table
        const index = this.cmsData.findIndex(entry => entry.cms_id === cms.cms_id);
        if (index !== -1) {
          this.cmsData.splice(index, 1);
        }
  
        // Add rejected CMS entry to rejectedEntries array
        this.rejectedEntries.push(this.populateVenueAndTimeSlot(updatedCMSData));
      },
    });
  }
  
confirmReject(cms: CMSData, event: Event) {
  this.confirmationService.confirm({
    target: event.target as EventTarget,
    message: 'Do you want to delete this record?',
    header: 'Delete Confirmation',
    icon: 'pi pi-info-circle',
    acceptButtonStyleClass: "p-button-danger p-button-text",
    rejectButtonStyleClass: "p-button-text p-button-text",
    acceptIcon: "none",
    rejectIcon: "none",
    accept: () => {
      this.reject(cms);
      this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'Entry Rejected' });
    },
    reject: () => {
      this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have canceled', life: 3000 });
    }
  });
}

  getCmsStatus(cms: CMSData): string {
    return cms.status === CMSStatus.APPROVED ? 'Approved' : 'Rejected';
  }
  
  getCmsStatusSeverity(cms: CMSData): string {
    return cms.status === CMSStatus.APPROVED ? 'success' : 'danger';
  }

  fetchApprovedCmsData() {
    this.http.get<CMSData[]>(`${this.backendUrl}/cms?status=paid`).subscribe({
      next: (data: CMSData[]) => {
        this.approvedEntries = data.filter(cms => cms.status === CMSStatus.APPROVED).map(entry => this.populateVenueAndTimeSlot(entry));
      },
      error: (error) => {
        console.error('Error fetching approved CMS data:', error);
      }
    });
  }
  
  
  fetchRejectedCmsData() {
    this.http.get<CMSData[]>(`${this.backendUrl}/cms?status=review`).subscribe({
      next: (data: CMSData[]) => {
        this.rejectedEntries = data.filter(cms => cms.status === CMSStatus.REVIEW).map(entry => this.populateVenueAndTimeSlot(entry));
      },
      error: (error) => {
        console.error('Error fetching rejected CMS data:', error);
      }
    });
  }
  
}