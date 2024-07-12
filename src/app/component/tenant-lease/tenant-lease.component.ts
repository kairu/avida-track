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
  lease: any[] = [];
  selectedItem: any;
  updatedMonthlyRents: { [leaseId: number]: number } = {};
  date: Date[] | undefined;
  today: Date = new Date();
  numberOfMonths: number | null = null;
  computedEndDates: { [key: string]: string } = {};
  units: any[] = []; 
  loggedUser: any;
  displayUsers: any;
  paymentHistoryData: any[] = [];
  
  
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
    // this.loadLeasesWithValidation();
    
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

markAsValid(lease: any): void {
  const tenantId = lease.tenant_id;
  this.backendService.getUser(tenantId).subscribe({
    next: (tenant) => {
      const updateData = {
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email,
        is_validated: 1,
        mobile_number: tenant.mobile_number,
      };
      this.backendService.updateUser(tenant.email, updateData).subscribe({
        next: () => {
          // Update the isValidated property of the lease object
          lease.isValidated = true;
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Approved Tenant.' });
        },
        error: (err) => {
          console.error('Failed to validate user:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to validate user.' });
        }
      });
    },
    error: (err) => {
      console.error('Failed to get tenant:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to get tenant.' });
    }
  });
}


markAsInvalid(lease: any): void {
  const tenantId = lease.tenant_id;
  this.backendService.getUser(tenantId).subscribe({
    next: (tenant) => {
      const updateData = {
        first_name: tenant.first_name,
        last_name: tenant.last_name,
        email: tenant.email,
        is_validated: 0,
        mobile_number: tenant.mobile_number,
      };
      this.backendService.updateUser(tenant.email, updateData).subscribe({
        next: () => {
          lease.isValidated = false;
          this.messageService.add({ severity: 'success', summary: 'Invalidated', detail: 'Invalidated Tenant.' });
        },
        error: (err) => {
          console.error('Failed to invalidate user:', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to invalidate user.' });
        }
      });
    },
    error: (err) => {
      console.error('Failed to get tenant:', err);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to get tenant.' });
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
                const tenant = matchedTenants.find((user: { user_id: any; is_validated: any; }) => user.user_id === lease.tenant_id);
                if (tenant) {
                  lease.tenantName = tenant.first_name + ' ' + tenant.last_name;
                  tenantNames.add(lease.tenantName);
                  lease.isValidated = tenant.is_validated === 1; // Set the isValidated property based on the tenant's is_validated value
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
      if (lease.updatedMonthlyRent >= 0) { 
        const remainingBalanceAfterRent = lease.remaining_balance - lease.updatedMonthlyRent;
        lease.remaining_balance = remainingBalanceAfterRent;
        console.log('Remaining balance:', lease.remaining_balance);

        const paymentHistory = {
          date: new Date(), 
          paymentAmount: lease.updatedMonthlyRent,
          remainingBalance: lease.remaining_balance
        };
        lease.paymentHistory = lease.paymentHistory || [];
        lease.paymentHistory.push(paymentHistory);

        
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


onEditComplete(event: any) {
  console.log('Entire Event Object:', event);

  if (!event.data) {
    console.error('Event data is missing');
    return;
  }

  const editedField = event.field;
  const editedValue = event.data;
  const lease_agreement_id = event.index;

  console.log('Edited Field:', editedField);
  console.log('Edited Value:', editedValue);
  console.log('Lease Agreement ID:', lease_agreement_id);

  
  this.backendService.getLeases().subscribe({
    next: (response: any[]) => {
      const lease = response.find(item => item.lease_agreement_id == lease_agreement_id);

      if (!lease) {
        console.error('Lease object is missing or undefined');
        return;
      }

      
      lease[editedField] = editedValue;

      
      if (!lease.numberOfMonths && editedField !== 'numberOfMonths') {
        lease.numberOfMonths = response.find(item => item.lease_agreement_id == lease_agreement_id).numberOfMonths;
      }

      
      console.log('Before formatting dates:', { start_date: lease.start_date, end_date: lease.end_date });
      const formattedStartDate = this.convertDateToLocal(new Date(lease.start_date));
      const formattedEndDate = this.convertDateToLocal(new Date(lease.end_date));
      console.log('Formatted Dates:', { start_date: formattedStartDate, end_date: formattedEndDate });

      const updateFields = {
        lease_agreement_id: lease.lease_agreement_id,
        unit_id: lease.unit_id,
        owner_id: lease.owner_id,
        tenant_id: lease.tenant_id,
        contract: lease.contract || '',
        start_date: formattedStartDate.toISOString().slice(0, 10),
        end_date: formattedEndDate ? formattedEndDate.toISOString().slice(0, 10) : null, 
        monthly_rent: lease.monthly_rent,
        security_deposit: lease.security_deposit,
        remaining_balance: lease.remaining_balance,
        numberOfMonths: lease.numberOfMonths 
      };

      console.log('Fields:', updateFields);

      this.backendService.updateLease(lease_agreement_id, updateFields).subscribe({
        next: (response) => {
          console.log('Lease Agreement updated successfully:', response);
          this.messageService.add({ severity: 'success', summary: 'Lease Updated', detail: 'Successfully Saved.' });
        },
        error: (error) => {
          console.error('Error updating Lease Agreement:', error);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to Save' });
        }
      });
    },
    error: (error) => {
      console.error('Error fetching Lease data:', error);
    }
  });
}

onStartDateChange(lease: any): void {
  if (lease.numberOfMonths) {
    this.computeDates(lease);
    const formattedStartDate = this.getFormattedDate(lease.start_date);
    lease.start_date = formattedStartDate;

    // Update the lease with the new start and end dates
    this.updateLeaseDates(lease);
  }
}

onNumberOfMonthsChange(lease: any): void {
  if (lease.start_date) {
    this.computeDates(lease);
    this.updateLeaseDates(lease);
  }
}

getFormattedDate(date: string): string {
  const dateObject = new Date(date);
  dateObject.setUTCHours(0, 0, 0, 0);
  return this.convertDate(dateObject);
}

convertDateToLocal(date: Date): Date {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate;
}

convertDate(date: any): string {
  return date.toLocaleDateString('en-CA');
}

computeDates(lease: any): void {
  console.log('Computing dates for lease:', lease);
  if (lease.numberOfMonths && lease.start_date) {
    const startDate = new Date(lease.start_date);
    console.log('Initial Start Date:', startDate.toISOString());

    const numberOfMonths = lease.numberOfMonths;
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + numberOfMonths);
    console.log('Initial End Date:', endDate.toISOString());

    lease.end_date = this.convertDate(this.convertDateToLocal(endDate));
    lease.start_date = this.convertDate(this.convertDateToLocal(startDate));
    console.log('Computed End Date:', lease.end_date);
    console.log('Computed Start Date:', lease.start_date);
    console.log('Entered number of months:', lease.numberOfMonths);
  } else {
    console.log('Missing required fields for date computation.');
  }
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
                    // lease.startDateSaved = true;
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




