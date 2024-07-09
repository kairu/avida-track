import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { Observable, catchError, forkJoin, switchMap, map, of } from 'rxjs';
import { FileUploadModule } from 'primeng/fileupload';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { ImageModule } from 'primeng/image';
import { CalendarModule } from 'primeng/calendar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
interface UploadEvent {
  originalEvent: Event;
  files: File[];
}
@Component({
  selector: 'app-tenant-lease',
  standalone: true,
  imports: [TableModule, FileUploadModule, CommonModule, InputNumberModule, FormsModule, 
            ImageModule, CalendarModule, ButtonModule, RippleModule, DialogModule, AutoCompleteModule, ToastModule,
            InputTextModule],
  templateUrl: './tenant-lease.component.html',
  styleUrls: ['./tenant-lease.component.scss']
})

export class TenantLeaseComponent implements OnInit {
  uploadedFile: any;
  fileName: string | undefined;
  imageSrc: any;
  leases: any[] = [];
  selectedItem: any;
  updatedMonthlyRents: { [leaseId: number]: number } = {};
  date: Date[] | undefined;
  today: Date = new Date();
  numberOfMonths: number | null = null;
  computedEndDates: { [key: string]: string } = {};
  units: any[] = []; 
  loggedUser: any;
  displayUsers: any;
  
  constructor(private backendService: BackendServiceService, private messageService: MessageService) {
    this.today = new Date();
  }
  
  onUpload(event: UploadEvent) {
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Basic Mode' });
}


  ngOnInit(): void {
    this.leases.forEach(lease => lease.numberOfMonths = 1);
    this.loadTenantNames();
    this.loadLeases();
  }



loadLeases() {
  this.backendService.getLeases().subscribe({
    next: (data) => {
      this.leases = data;
      console.log('Loaded leases:', this.leases);
    },
    error: (error) => {
      console.error('Error loading leases:', error);
    }
  });
}


  loadTenantNames() {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (currentUser) => {
        this.backendService.getUnits().subscribe({
          next: (unitsResponse) => {
            const filteredUnits = unitsResponse.filter((unit: { tower_number: any; unit_number: any; floor_number: any; }) =>
              unit.tower_number === currentUser.units[0].tower_number &&
              unit.unit_number === currentUser.units[0].unit_number &&
              unit.floor_number === currentUser.units[0].floor_number
            );
            
            this.backendService.getUsers().subscribe({
              next: (usersResponse) => {
                const tenantUsers = usersResponse.filter((user: { user_type: string; }) => user.user_type === 'TENANT');
                const matchedTenants = tenantUsers.filter((user: { user_id: any; }) =>
                  filteredUnits.some((unit: { user_id: any; }) => unit.user_id === user.user_id)
                );
                
                const tenantNames = new Set();
                this.leases = this.leases.map(lease => {
                  const tenant = matchedTenants.find((user: { user_id: any; }) => user.user_id === lease.tenant_id);
                  if (tenant) {
                    lease.tenantName = tenant.first_name + ' ' + tenant.last_name;
                    tenantNames.add(lease.tenantName);
                    return lease; 
                  }
                  return null;
                }).filter(lease => lease !== null);
    
                console.log('Tenant Name:', this.leases);
              },
              error: (err) => console.error('Failed to load users:', err)
            });
          }
        });
      }
    });
  }
  


  onEditComplete(event: any) {
    console.log('Entire Event Object:', event);
    
    if (!event.data) {
      console.error('Event data is missing');
      return;
    }
    // Directly log the event data to inspect its structure
    console.log('Event Data:', event.data);
  
    // Check if event.data contains the full row data
    const lease = event;
    console.log('Lease:', lease.index);
  
    if (!lease) {
      console.error('Lease object is missing or undefined');
      return;
    }
  
    const lease_agreement_id = lease.index;
    console.log('Lease Agreement ID:', lease_agreement_id);
  
    if (lease_agreement_id) {
      console.error('Lease ID is missing or undefined');
      return;
    }
      const updateFields = {
        lease_agreement_id: lease.lease_agreement_id,
        unit_id: lease.unit_id,
        owner_id: lease.owner_id,
        tenant_id: lease.tenant_id,
        contract: lease.contract,
        start_date: lease.start_date,
        end_date: lease.end_date,
        monthly_rent: lease.monthly_rent, 
        security_deposit: lease.security_deposit,
        remaining_balance: lease.remaining_balance,
      };
      this.backendService.updateLease(lease_agreement_id, updateFields).subscribe({
        next: (response) => {
          console.log('Lease Agreement updated successfully:', response);
          this.messageService.add({ severity: 'success', summary: 'Rent Updated', detail: 'Successfully Saved.' });
          lease.updatedMonthlyRent = null;
        },
        error: (error) => {
          console.error('Error updating Lease Agreement:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to Save' });
        }
      });
    }
  

  
  async storeImageData(event: any, lease_agreement_id: number) {
    console.log(lease_agreement_id);
    this.uploadedFile = event.files[0];
    this.fileName = this.uploadedFile.name;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      this.imageSrc = e.target.result;

      const formData = new FormData();
      formData.append('file', this.uploadedFile);

      try {
        const response = await this.backendService.uploadImageToLease(formData, lease_agreement_id);
        console.log('Image uploaded to lease agreement successfully:', response);
      } catch (error) {
        console.error('Error uploading image to lease agreement:', error);
      }
    };
    reader.readAsDataURL(event.files[0]);
  }

  updateRent(lease: any): void {
    if (lease.updatedMonthlyRent !== null && lease.updatedMonthlyRent !== undefined) {
      if (lease.updatedMonthlyRent >= 0) { // Change this condition to allow any positive value
        const remainingBalanceAfterRent = lease.remaining_balance - lease.updatedMonthlyRent;
        lease.remaining_balance = remainingBalanceAfterRent;
        console.log('Remaining balance:', lease.remaining_balance);
  
      const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
        if (email) {
          this.backendService.getUser(email).subscribe({
            next: (userData: any) => {
              const ownerId = userData.owner_id || userData.user_id;
              console.log('owner id:', ownerId);
  
              if (ownerId) {
                const leaseData = {
                  lease_agreement_id: lease.lease_agreement_id,
                  unit_id: lease.unit_id,
                  owner_id: ownerId,
                  tenant_id: lease.tenant_id,
                  contract: lease.contract || '',
                  start_date: this.getFormattedDate(lease.start_date),
                  end_date: lease.end_date,
                  monthly_rent: lease.updatedMonthlyRent,
                  security_deposit: lease.security_deposit,
                  remaining_balance: lease.remaining_balance
                };
                
                console.log('leaseData:', leaseData);
                // lease.disabledInput = true;
                this.backendService.updateLease(lease.lease_agreement_id, leaseData).subscribe({
                  next: (response) => {
                    console.log('Lease Agreement updated successfully:', response);
                    this.messageService.add({ severity: 'success', summary: 'Rent Updated', detail: 'Remaining balance updated successfully.' });
                    lease.updatedMonthlyRent = null;
                  },
                  error: (error) => {
                    console.error('Error updating Lease Agreement:', error);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update Remaining Balance.' });
                  }
                });
              } else {
                console.error('User data is incomplete. Missing necessary information.');
              }
            },
            error: (error: any) => {
              console.error('Error fetching user data:', error);
            }
          });
        } else {
          console.error('Email not found in session storage.');
        }
      }
    }
  }


getFormattedDate(date: string): string {
        const startDateWithoutTime = new Date(date);
        startDateWithoutTime.setHours(0, 0, 0, 0);
        return startDateWithoutTime.toISOString().slice(0, 10);
    }

    computeDates(lease: any): void {
        console.log('Computing dates for lease:', lease);
        if (lease.numberOfMonths && lease.start_date) {
            const startDate = new Date(lease.start_date);
            const numberOfMonths = lease.numberOfMonths;
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + numberOfMonths);
            const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
            this.computedEndDates[lease.lease_agreement_id] = formattedEndDate;
            lease.end_date = formattedEndDate;
            
        }
    }

    onStartDateChange(lease: any): void {
        console.log('Start date changed for lease:', lease);
        this.computeDates(lease);
    }

    updateLeaseDates(lease: any): void {
        if (lease.start_date && lease.end_date) {
            const startDate = new Date(lease.start_date);
            const endDate = new Date(lease.end_date);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.error('Invalid start date or end date');
                return;
            }
            const formattedStartDate = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;
            const formattedEndDate = `${endDate.getFullYear()}-${(endDate.getMonth() + 1).toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;

            const data = {
                ...lease,
                start_date: formattedStartDate,
                end_date: formattedEndDate
            };

            this.backendService.updateLease(lease.lease_agreement_id, data).subscribe({
                next: (response) => {
                    console.log('Lease dates updated successfully:', response);
                    this.messageService.add({ severity: 'success', summary: 'Lease Dates Updated', detail: 'Start and end dates updated successfully.' });
                    lease.startDateSaved = true;
                },
                error: (error) => {
                    console.error('Error updating lease dates:', error);
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update lease dates.' });
                }
            });
        } else {
            console.error('Start date or end date is missing.');
        }
    }
}