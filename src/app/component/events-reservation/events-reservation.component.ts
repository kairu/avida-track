import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { SeverityService } from 'src/app/services/severity.service';

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
  pax: string;
  selectedTimeSlot: string;
  user_id: number;
}

@Component({
  selector: 'app-events-reservation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, FieldsetModule, PanelModule, AdminModule, ConfirmDialogModule, ToastModule, ButtonModule],
  providers: [ConfirmationService, MessageService],
  templateUrl: './events-reservation.component.html',
  styleUrls: ['./events-reservation.component.scss']
})

export class EventsReservationComponent implements OnInit {
  reservationForm!: FormGroup;
  today: Date;
  reservedDates: Date[] = [];
  isAdmin: boolean = true;
  cmsData: CMSData[] = [];
  approvedEntries: CMSData[] = [];
  rejectedEntries: CMSData[] = [];
  backendUrl: string = 'http://127.0.0.1:5000';
  cms_id!: number;
  venue: Venue[] = [
    { name: 'Outdoor Gym' },
    { name: 'Clubhouse' },
    { name: 'Swimming Pool' },
  ];
  timeSlots!: string;
  cmsEntry: any;

  paxMin: number = 1;
  paxMax: number = 30;
  enablePax: boolean = true;


  constructor(
    private fb: FormBuilder,
    private backendService: BackendServiceService,
    private messageService: MessageService,
    private http: HttpClient,
    private confirmationService: ConfirmationService,
    public severity: SeverityService
  ) {
    this.today = new Date();
    this.today.setDate(this.today.getDate() + 1);
    this.checkisAdmin();
  }

  ngOnInit(): void {
    this.initForm();
    this.fetchReservedDates();
    // this.loadCmsDataFromLocalStorage();

  }

  venueSelected: boolean = false;
  onVenueSelect(event: any){
    switch(event.value.name){
      case 'Outdoor Gym':
        this.paxMax = 15;
        break;
      case 'Clubhouse':
        this.paxMax = 30;
        break;
      case 'Swimming Pool':
        this.paxMax = 20;
        break;
      default:
        break;
    }
    this.venueSelected = true;
    return;
  }


  getDescriptionWithoutVenueAndTimeSlot(description: string): string {
    const parts = description.split(' Venue: ');
    return parts[0];
  }

  initForm(): void {
    this.reservationForm = this.fb.group({
      selectedVenue: [, Validators.required],
      date_to_post: [, Validators.required],
      title: [, Validators.required],
      pax: [, Validators.required],
      description: [, Validators.required],
    });
  }

  rsrveWndow: boolean = false;
  reserveWindow() {
    this.rsrveWndow = true;
  }

  convertTo24HourFormat(time: string): string {
    const [timePart, modifier] = time.split(' ');
    let [hours, minutes] = timePart.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  reserveList: any[] = [];
  onSubmit() {
    if (this.reservationForm.valid) {
      // Check if the selected date and time available is in the database to guard clause it.
      this.backendService.getCMS().subscribe({
        next: (response: any) => {
          response.forEach((item: CMSData) => {
            if (
              item.cms_type === 'RESERVATION' &&
              item.date_to_post === new Date(this.reservationForm.value.date_to_post).toLocaleDateString('en-CA') &&
              item.description.includes(this.reservationForm.value.selectedVenue.name)
            ) {
              this.reserveList.push(item)
            }
          });
          // check if reserveList is not empty to proceed with the guard clause
          if (this.reserveList.length) {
            // check the time of the reservation, the time must not overlap with the time of the reservation as well as allow at least 1 hour gap for the next reservation
            for (let i = 0; i < this.reserveList.length; i++) {
              const reserveItem = this.reserveList[i];
              const time = reserveItem.description.split(' Time Slot: ')[1];
              // db time
              const [first_time, end_time] = time.split(' - ').map((t: string) => this.convertTo24HourFormat(t.trim()));
              // reserving time
              const [first_time_res, end_time_res] = this.timeSlots.split(' - ').map((t: string) => this.convertTo24HourFormat(t.trim()));

              const isValid = this.isReservationValid(
                first_time_res, end_time_res,
                first_time, end_time
              )
              if (!isValid) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Time slot is not available' });
                return;
              }
            }
          }
          const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
          if (email) {
            this.backendService.getUser(email).subscribe({
              next: (userId: any) => {
                const dateTime = new Date(this.reservationForm.value.date_to_post);
                const backendData = {
                  user_id: userId.user_id,
                  title: this.reservationForm.value.title,
                  description: this.reservationForm.value.description +
                    ` Venue: ${this.reservationForm.value.selectedVenue.name}` +
                    ` Pax: ${this.reservationForm.value.pax}` +
                    ` Time Slot: ${this.timeSlots}`,
                  cms_type: 'RESERVATION',
                  date_to_post: this.reservationForm.value.date_to_post.toLocaleDateString('en-CA'),
                };
                this.backendService.addCMS(backendData).subscribe({
                  next: (response: any) => {
                    this.cms_id = response.id;
                    this.reservationForm.reset();
                    this.messageService.add({
                      severity: 'success', summary: 'Reservation Submitted',
                      detail: 'Your reservation has been submitted successfully.'
                    });
                    this.rsrveWndow = false;
                    this.fetchCmsData();
                  },
                });
              },
              error: (error: any) => {
                console.error('Error fetching user ID:', error);
              },
            });

          } else {
            console.error('No email found for logged-in user');
          }
        }
      });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill up all the required fields' });
    }
  }

  isReservationValid(
    reserveStart: string,
    reserveEnd: string,
    start: string,
    end: string
  ): boolean {
    const minGapHours = 1;
    // Check for overlap
    if (
      (reserveStart < end && reserveStart >= start) ||
      (reserveEnd > start && reserveEnd <= end) ||
      (reserveStart <= start && reserveEnd >= end)
    ) {
      return false; // Overlap found
    }

    // Check for minimum gap
    const reserveStartDate = new Date(`1970-01-01T${reserveStart}:00`);
    const reserveEndDate = new Date(`1970-01-01T${reserveEnd}:00`);
    const startDate = new Date(`1970-01-01T${start}:00`);
    const endDate = new Date(`1970-01-01T${end}:00`);

    const gapStart = Math.abs((reserveStartDate.getTime() - endDate.getTime()) / 3600000);
    const gapEnd = Math.abs((reserveEndDate.getTime() - startDate.getTime()) / 3600000);

    if (gapStart < 1 || gapEnd < minGapHours) {
      return false; // Not enough gap
    }


    return true; // No overlap, sufficient gap
  }

  fetchReservedDates(): void {
    this.backendService.getCMS().subscribe((cmsData: any[]) => {
      const reservationData = cmsData.filter(cms => cms.cms_type === 'RESERVATION');
      this.reservedDates = reservationData.map(reservation => new Date(reservation.date_to_post));
    });
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
      return;
    }
  }
  updateTimeSlots(selectedDate: Date, selectedTime: Date) {
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 2); // Assuming 2-hour time slot interval

    const startTimeSlot = this.formatTime(startDateTime);
    const endTimeSlot = this.formatTime(endDateTime);

    this.timeSlots = startTimeSlot + ' - ' + endTimeSlot;
  }

  formatTime(time: Date): string {
    return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' });
  }

  userId!: number;
  checkisAdmin() {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (response: any) => {
        if (response.user_type == 'ADMIN' || response.user_type == 'SUPER_ADMIN') {
          this.isAdmin = true;
          // console.log(response);
        } else {
          this.userId = response.user_id;
          this.isAdmin = false;
        }
        this.fetchCmsData();
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
        let reservationEntries: CMSData[] = [];
        if (this.isAdmin) {
          reservationEntries = data.filter(cms => cms.cms_type === 'RESERVATION' && cms.status === 'PENDING');
        } else {
          reservationEntries = data.filter(cms => cms.cms_type === 'RESERVATION' && cms.user_id === this.userId);
        }
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
    const { venue, timeSlot, pax } = this.parseDescription(entry.description);
    return {
      ...entry,
      selectedVenue: venue,
      pax: pax,
      selectedTimeSlot: timeSlot
    };
  }


  parseDescription(description: string): { venue: string, timeSlot: string, pax: string } {
    const venue = description.match(/Venue: (.*?)( Pax:| Time Slot:|$)/)?.[1].trim() || '';
    const pax = description.match(/Pax: (\d+)/)?.[1] || '';
    const timeSlot = description.match(/Time Slot: (.+)$/)?.[1].trim() || '';
    return {
      venue: venue,
      timeSlot: timeSlot,
      pax: pax
    };
  }


  approve(cms: CMSData): void {
    const updatedCMSData = { ...cms, status: 'PAID' };
    this.backendService.updateCMS(cms.cms_id, updatedCMSData).subscribe({
      next: (response: any) => {
        // console.log('CMS entry approved:', cms.cms_id);

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
        // console.log('CMS entry rejected:', cms.cms_id);

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