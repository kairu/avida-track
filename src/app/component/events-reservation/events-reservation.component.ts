import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms'; 
import { MessageService } from 'primeng/api';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { HttpClient } from '@angular/common/http';

interface Venue {
  name: string;
}
interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

interface CMSData {
  title: string;
  description: string;
  cms_type: string;
  date_to_post: string;
  selectedVenue: string; 
  // mobileNumber: number;
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
  backendUrl: string = 'http://127.0.0.1:5000'; 
  cms_id!: number;
  showRejectionReasonInput: boolean = false;
  rejectionReasonForm: FormGroup;
  

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
    this.rejectionReasonForm = this.fb.group({
      rejectionReason: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.fetchReservedDates();
    if (this.isAdmin) {
      this.http.get<CMSData[]>(`${this.backendUrl}/cms`).subscribe({
        next: (data: CMSData[]) => {
          console.log(data); 
      
          data.sort((a, b) => new Date(b.date_to_post).getTime() - new Date(a.date_to_post).getTime());
      
          if (data.length > 0) {
            this.cmsData = [data[0]];
      
            // Extract venue and time slot information from the description
            const descriptionParts = this.cmsData[0].description.split(' Venue: ');
            // const descriptionWithoutVenue = descriptionParts[0]; // Description without venue information
            const venue = descriptionParts[1] ? descriptionParts[1].split(' Time Slot: ')[0] : ''; 
            const timeSlot = descriptionParts[1] ? descriptionParts[1].split(' Time Slot: ')[1] : ''; 
      
            this.cmsData[0].selectedVenue = venue;
            this.cmsData[0].selectedTimeSlot = timeSlot;
          }
        },
        error: (error) => {
          console.error('Error fetching CMS data:', error);
        }
      });
    }
  }

  getDescriptionWithoutVenueAndTimeSlot(description: string): string {
    const parts = description.split(' Venue: ');
    return parts[0];
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      selectedVenue: ['', Validators.required],
      // mobileNumber: ['', Validators.required],
      date_to_post: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      selectedTimeSlot: ['', Validators.required],
      rejectionReason: [''],
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
  

  approve(): void {
  const userEmail = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
  
  this.backendService.getCMS().subscribe({
    next: (cmsEntries: any[]) => {
      cmsEntries.sort((a, b) => new Date(b.date_to_post).getTime() - new Date(a.date_to_post).getTime());

      const cmsToApprove = cmsEntries.find(cms => cms.cms_type === 'RESERVATION');

      if (cmsToApprove) {
        const updatedCMSData = { ...cmsToApprove, status: 3 };
        this.backendService.updateCMS(cmsToApprove.cms_id, updatedCMSData).subscribe({
          next: (response: any) => {
            console.log('CMS entry approved:', cmsToApprove.cms_id);
              this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Entry Approved.' });
            
          },
          error: (error: any) => {
            console.error('Error updating CMS entry:', error);
          }
        });
      } else {
        console.log('No CMS entry requiring approval found.');
      }
    },
    error: (error: any) => {
      console.error('Error fetching CMS data:', error);
    }
  });
}


reject(): void {
  if (this.isAdmin) {
    const rejectionReasonControl = this.rejectionReasonForm.get('rejectionReason');
    console.log('Rejection Reason Control:', rejectionReasonControl);
    if (rejectionReasonControl && rejectionReasonControl.valid && rejectionReasonControl.value) {
      const rejectionReason = rejectionReasonControl.value;
      console.log('Rejection reason:', rejectionReason);
    } else {
      console.error('Rejection reason is required.');
    }
  } else {
    console.error('User is not authorized to reject forms.');
  }
}


fetchAndRejectCMS(rejectionReason: string): void {
  this.backendService.getCMS().subscribe(
    (cmsEntries: any[]) => {
      const cmsToReject = cmsEntries.find(cms => cms.cms_type === 'RESERVATION');

      if (cmsToReject) {
        const updatedCMSData = { ...cmsToReject, status: 1 , rejectionReason: rejectionReason };

        this.backendService.updateCMS(cmsToReject.cms_id, updatedCMSData).subscribe(
          (response: any) => {
            console.log('CMS entry rejected:', cmsToReject.cms_id);
          },
          (error: any) => {
            console.error('Error updating CMS entry:', error);
          }
        );
      } else {
        console.log('No CMS entry requiring rejection found.');
      }
    },
    (error: any) => {
      console.error('Error fetching CMS data:', error);
    }
  );
}

  cancelRejection() {
    this.showRejectionReasonInput = false;
  }
}
