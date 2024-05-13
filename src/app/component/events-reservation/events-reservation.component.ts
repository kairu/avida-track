import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'; 
import { MessageService } from 'primeng/api';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { HttpClient } from '@angular/common/http';


enum CMSStatus {
  PENDING = 1,
  REVIEW = 2,
  APPROVED = 3 // Changed this to APPROVED for clarity
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
  status: CMSStatus;
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
  approvedCmsData: CMSData[] = [];
  rejectedCmsData: CMSData[] = [];
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
    private http: HttpClient
  ) {
    this.today = new Date();
    this.checkisAdmin();
  }

  ngOnInit(): void {
    this.initForm();
    this.fetchReservedDates();
    if (this.isAdmin) {
      this.http.get<CMSData[]>(`${this.backendUrl}/cms`).subscribe({
        next: (data: CMSData[]) => {
          console.log(data); 
          const reservationEntries = data.filter(cms => cms.cms_type === 'RESERVATION');
          reservationEntries.sort((a, b) => new Date(b.date_to_post).getTime() - new Date(a.date_to_post).getTime());
          this.cmsData = reservationEntries;
          this.cmsData.forEach(entry => {
            const descriptionParts = entry.description.split(' Venue: ');
            entry.selectedVenue = descriptionParts[1] ? descriptionParts[1].split(' Time Slot: ')[0] : '';
            entry.selectedTimeSlot = descriptionParts[1] ? descriptionParts[1].split(' Time Slot: ')[1] : '';
          });
  
          // Retrieve approved and rejected entries from local storage
          const approvedCmsData = JSON.parse(localStorage.getItem('approvedCmsData') || '[]');
          const rejectedCmsData = JSON.parse(localStorage.getItem('rejectedCmsData') || '[]');
  
          this.approvedCmsData = approvedCmsData;
          this.rejectedCmsData = rejectedCmsData;
  
          // Remove approved and rejected entries from the main table
          this.removeApprovedAndRejectedEntriesFromMainTable();
        },
        error: (error) => {
          console.error('Error fetching CMS data:', error);
        }
      });
    }
  }
  
  removeApprovedAndRejectedEntriesFromMainTable(): void {
    const approvedAndRejectedEntries = [...this.approvedCmsData, ...this.rejectedCmsData];
    approvedAndRejectedEntries.forEach(entry => {
      const index = this.cmsData.findIndex(mainEntry => mainEntry.cms_id === entry.cms_id);
      if (index !== -1) {
        this.cmsData.splice(index, 1);
      }
    });
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
                this.messageService.add({ severity: 'success', summary: 'Reservation Submitted', detail: 'Your reservation has been submitted successfully.' });
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
  

  // approve(cmsToApprove: any): void {
  //   const updatedCMSData = { ...cmsToApprove, status: 3 };
  //   this.backendService.updateCMS(cmsToApprove.cms_id, updatedCMSData)
  //     .subscribe({
  //       next: (response: any) => {
  //         console.log('CMS entry approved:', cmsToApprove.cms_id);
  //         this.messageService.add({
  //           severity: 'success',
  //           summary: 'Approved',
  //           detail: 'Entry Approved.',
  //         });
  //       },
  //       error: (error: any) => {
  //         console.error('Error updating CMS entry:', error);
  //         this.messageService.add({
  //           severity: 'error',
  //           summary: 'Error',
  //           detail: 'Failed to approve entry.',
  //         });
  //       },
  //     });
  // }

  approve(cms: CMSData): void {
    const updatedCMSData = { ...cms, status: 3 }; // Assuming 3 corresponds to approved status
    this.backendService.updateCMS(cms.cms_id, updatedCMSData).subscribe({
      next: (response: any) => {
        console.log('CMS entry approved:', cms.cms_id);
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Entry Approved.' });
  
        // Remove approved CMS entry from main table
        const index = this.cmsData.findIndex(entry => entry.cms_id === cms.cms_id);
        if (index !== -1) {
          this.cmsData.splice(index, 1);
        }
  
        // Add approved CMS entry to approved table
        this.approvedCmsData.push(cms);
  
        // Store updated lists in local storage
        localStorage.setItem('approvedCmsData', JSON.stringify(this.approvedCmsData));
        localStorage.setItem('cmsData', JSON.stringify(this.cmsData)); // Update local storage for main table data
      },
      error: (error: any) => {
        console.error('Error updating CMS entry:', error);
      }
    });
  }
   
  

  reject(cms: CMSData): void {
    const updatedCMSData = { ...cms, status: 2 }; // Set status to "Rejected"
    this.backendService.updateCMS(cms.cms_id, updatedCMSData).subscribe({
      next: (response: any) => {
        // Remove rejected CMS entry from main table
        const index = this.cmsData.findIndex(entry => entry.cms_id === cms.cms_id);
        if (index !== -1) {
          this.cmsData.splice(index, 1);
        }
        this.rejectedCmsData.push(cms);
        
    
        localStorage.setItem('rejectedCmsData', JSON.stringify(this.rejectedCmsData));
        localStorage.setItem('cmsData', JSON.stringify(this.cmsData));
        
        
        this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'Entry Rejected.' });
      },
      error: (error: any) => {
        console.error('Error updating CMS entry:', error);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject entry.' });
      }
    });
  }
  


  getCmsStatus(cms: CMSData): string {
    return cms.status === CMSStatus.APPROVED ? 'Approved' : 'Rejected';
  }
  
  getCmsStatusSeverity(cms: CMSData): string {
    return cms.status === CMSStatus.APPROVED ? 'success' : 'danger';
  }
  
  
}
