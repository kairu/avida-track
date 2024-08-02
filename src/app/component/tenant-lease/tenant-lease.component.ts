import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
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
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
interface UploadEvent {
  originalEvent: Event;
  files: File[];
}
@Component({
  selector: 'app-tenant-lease',
  standalone: true,
  imports: [TableModule, FileUploadModule, CommonModule, InputNumberModule, FormsModule, 
            ImageModule, CalendarModule, ButtonModule, RippleModule, DialogModule, AutoCompleteModule, ToastModule,
            InputTextModule, DropdownModule, TagModule, ConfirmDialogModule],
  templateUrl: './tenant-lease.component.html',
  styleUrls: ['./tenant-lease.component.scss'],
  providers: [ConfirmationService]
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
  pendingTenants: any[] = [];
  editingValidationStatus: { [key: string]: boolean } = {};
  paymentHistory: any[] = [];
  isTENANT: boolean = true;

  constructor(private backendService: BackendServiceService, private messageService: MessageService, private confirmationService: ConfirmationService) {
    this.today = new Date();
    this.checkisTENANT();

  }
  
  onUpload(event: UploadEvent) {
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Basic Mode' });
}

  ngOnInit(): void {
    this.leases.forEach(lease => {
      lease.numberOfMonths = 1;
      
    });
    this.loadTenantNames();
    this.loadLeases();
    // this.loadLeasesWithValidation();
    this.fetchPendingTenants();
    this.fetchPaymentHistory();
  }

  validationOptions = [
    { label: 'Yes', value: 'valid' },
    { label: 'No', value: 'invalid' }
];

loadLeases() {
  this.backendService.getLeases().subscribe((leases: any[]) => {
    this.backendService.getUsers().subscribe((users: any[]) => {
      this.leases = leases.map((lease: any) => {
        const user = users.find((u: { user_id: any; }) => u.user_id === lease.tenant_id);
        const numberOfMonths = this.calculateMonthsBetweenDates(new Date(lease.start_date), new Date(lease.end_date));
        return {
          ...lease,
          is_validated: user ? user.is_validated : null,
          validationStatus: user && user.is_validated ? 'valid' : 'invalid',
          isValidated: user ? user.is_validated === 1 : true,
          numberOfMonths: numberOfMonths
        };
      });
    });
  });
}

calculateMonthsBetweenDates(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  return yearDiff * 12 + monthDiff;
}

onValidationChange(event: any, lease: any) {
  lease.validationStatus = event.value;
  lease.is_validated = event.value === 'valid' ? 1 : 0;
  this.editingValidationStatus[lease.lease_agreement_id] = false;
  
  if (event.value === 'valid') {
    lease.isEditable = true;
    this.markAsValid(lease);
  } else if (event.value === 'invalid') {
    lease.isEditable = false;
    this.markAsInvalid(lease);
  }
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

fetchPendingTenants(): void {
  const email = this.backendService.getEmail();
  this.backendService.getUser(email).subscribe({
    next: (currentUser) => {
      this.backendService.getUnits().subscribe({
        next: (unitsResponse) => {
          // Filter units to match the current user's unit details
          const filteredUnits = unitsResponse.filter((unit: { tower_number: any; unit_number: any; floor_number: any; }) =>
            unit.tower_number === currentUser.units[0].tower_number &&
            unit.unit_number === currentUser.units[0].unit_number &&
            unit.floor_number === currentUser.units[0].floor_number
          );

          this.backendService.getUsers().subscribe({
            next: (usersResponse) => {
              // Filter to get tenants only
              const tenantUsers = usersResponse.filter((user: { user_type: string; }) => user.user_type === 'TENANT');
              
              // Further filter to get pending tenants only (is_validated is false)
              const pendingTenants = tenantUsers.filter((user: any) =>
                filteredUnits.some((unit: { user_id: any; }) => unit.user_id === user.user_id) &&
              (!user.lease_agreements || user.lease_agreements.length === 0)
              );
              this.pendingTenants = pendingTenants;
            },
            error: (err) => console.error('Failed to load users:', err)
          });
        },
        error: (err) => console.error('Failed to load units:', err)
      });
    },
    error: (err) => console.error('Failed to load current user:', err)
  });
}

Confirm(tenant: any): void {
  const tenantId = tenant.user_id;
  if (!tenant.units || !tenant.units[0].unit_id) {
    console.error('Tenant object is missing unit_id:', tenant);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Tenant data is incomplete.' });
    return;
  }
  const unitId = tenant.units[0].unit_id;
  this.backendService.getUser(tenantId).subscribe({
    next: (tenantDetails) => {
      const updateData = {
        first_name: tenantDetails.first_name,
        last_name: tenantDetails.last_name,
        email: tenantDetails.email,
        is_validated: 1,
        mobile_number: tenantDetails.mobile_number,
      };

      this.backendService.updateUser(tenantDetails.email, updateData).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Approved Tenant.' });

          const currentUserEmail = this.backendService.getEmail();
          this.backendService.getUser(currentUserEmail).subscribe({
            next: (currentUser) => {
              if (!currentUser || !currentUser.user_id) {
                console.error('Current user details are missing:', currentUser);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch current user details.' });
                return;
              }
              const ownerId = currentUser.user_id;

              // Provide default dates
              const startDate = new Date().toISOString().split('T')[0]; // Today's date
              const endDate = new Date();
              endDate.setFullYear(endDate.getFullYear() + 1); // One year from today
              const endDateStr = endDate.toISOString().split('T')[0];

              const newLeaseAgreement = {
                tenant_id: tenantId,
                unit_id: unitId,
                owner_id: unitId,
                contract: '',
                start_date: startDate,
                end_date: endDateStr,
                monthly_rent: 0,
                security_deposit: 0,
                remaining_balance: 0,
                // isValidated: true  // Set isValidated to true
              };
              this.backendService.addLeaseAgreement(newLeaseAgreement).subscribe({
                next: (response) => {
                  this.messageService.add({ severity: 'success', summary: 'Lease Created', detail: 'Lease Agreement Created Successfully.' });
                  this.fetchPendingTenants();

                  // Find the created lease and set its isValidated property to true
                  const createdLease = this.leases.find(lease => lease.tenant_id === tenantId && lease.unit_id === unitId);
                  if (createdLease) {
                    createdLease.isValidated = true;
                  }
                },
                error: (err) => {
                  console.error('Failed to create lease agreement:', err);
                  console.error('Error details:', err.error);
                  this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create lease agreement.' });
                }
              });
            },
            error: (err) => {
              console.error('Failed to fetch current user details:', err);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to fetch current user details.' });
            }
          });
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

confirm1(tenant: any, event: Event) {
  this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: 'Are you sure that you want to proceed?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptIcon:"none",
      rejectIcon:"none",
      acceptButtonStyleClass: "p-button-success p-button-text",
      rejectButtonStyleClass: "p-button-text",
      accept: () => {
        this.Confirm(tenant);
          this.messageService.add({ severity: 'success', summary: 'Confirmed', detail: 'You have accepted' });
      },
      reject: () => {
          this.messageService.add({ severity: 'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 });
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
                  // lease.isValidated = tenant.is_validated === 1;
                  return lease;
                }
                return null;
              }).filter(lease => lease !== null);
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
        const originalMonthlyRent = lease.monthly_rent;
        const paymentAmount = lease.updatedMonthlyRent;
        if (paymentAmount < originalMonthlyRent) {
          this.messageService.add({severity: 'error', summary: 'Error', detail: 'Payment cannot be less than monthly rent'});
          return;
        }
        const remainingBalanceAfterRent = lease.remaining_balance - lease.updatedMonthlyRent;
        lease.remaining_balance = remainingBalanceAfterRent;

      const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
        if (email) {
          this.backendService.getUser(email).subscribe({
            next: (userData: any) => {
              const ownerId = userData.owner_id || userData.user_id;
              
              if (ownerId) {
                const leaseData = {
                  lease_agreement_id: lease.lease_agreement_id,
                  unit_id: lease.unit_id,
                  owner_id: lease.owner_id,
                  tenant_id: lease.tenant_id,
                  contract: lease.contract || '',
                  start_date: this.getFormattedDate(lease.start_date),
                  end_date: lease.end_date,
                  monthly_rent: originalMonthlyRent,
                  security_deposit: lease.security_deposit,
                  remaining_balance: lease.remaining_balance
                };

                // lease.disabledInput = true;
                this.backendService.updateLease(lease.lease_agreement_id, leaseData).subscribe({
                  next: (response) => {
                    this.messageService.add({ severity: 'success', summary: 'Rent Updated', detail: 'Remaining balance updated successfully.' });
                    lease.updatedMonthlyRent = null;

                    const paymentData = {
                      lease_agreement_id: lease.lease_agreement_id,
                      amount: paymentAmount,
                      payment_date: this.getFormattedDate(new Date().toISOString()),
                      status: 'PAID',
                    };
                    this.backendService.addPayment(paymentData).subscribe({
                      next: (paymentResponse) => {
                        // this.fetchPaymentHistory(lease);
                        this.messageService.add({ severity: 'success', summary: 'Payment Recorded', detail: 'Payment has been recorded successfully.' });
                      },
                      error: (paymentError) => {
                        console.error('Error adding payment:', paymentError);
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to record payment.' });
                      }
                    });
                  },
                    error: (error) => {

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

  fetchPaymentHistory(): void {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (currentUser) => {

        this.backendService.getUnits().subscribe({
          next: (unitsResponse) => {
            
            const filteredUnits = unitsResponse.filter((unit: any) =>
              unit.tower_number === currentUser.units[0].tower_number &&
              unit.unit_number === currentUser.units[0].unit_number &&
              unit.floor_number === currentUser.units[0].floor_number
            );
            this.backendService.getUsers().subscribe({
              next: (usersResponse) => {

                const tenantUsers = usersResponse.filter((user: any) =>
                  user.user_type === 'TENANT' &&
                  filteredUnits.some((unit: any) => unit.user_id === user.user_id)
                );
                const tenantPaymentHistories = new Map<string, any[]>();
                this.backendService.getLeases().subscribe({
                  next: (leaseResponse) => {
                    const relevantLeases = leaseResponse.filter((lease: { lease_agreement_id: number; tenant_id: any; }) =>
                      tenantUsers.some((tenant: { user_id: any; }) => tenant.user_id === lease.tenant_id)
                    );
                    if (relevantLeases.length === 0) {
                      console.warn('No relevant leases found.');
                      this.paymentHistory = [];
                      return;
                    }
                    let pendingRequests = relevantLeases.length;
  
                    relevantLeases.forEach((lease: any) => {
                      this.backendService.getPayment(`LEASE${lease.lease_agreement_id}`).subscribe({
                        next: (payments) => {

                          if (payments && payments.length > 0) {
                            const tenantId = lease.tenant_id;
                            if (!tenantPaymentHistories.has(tenantId)) {
                              tenantPaymentHistories.set(tenantId, []);
                            }
                            tenantPaymentHistories.get(tenantId)!.push(...payments);
                          }
                          pendingRequests--;
                          if (pendingRequests === 0) {
                            this.processPaymentHistories(tenantUsers, tenantPaymentHistories, currentUser.user_id);
                          }
                        },
                        error: (error) => {
                          console.error('Error fetching payments:', error);
                          pendingRequests--;
                          if (pendingRequests === 0) {
                            this.processPaymentHistories(tenantUsers, tenantPaymentHistories, currentUser.user_id);
                          }
                        }
                      });
                    });
                  },
                  error: (error) => console.error('Error fetching leases:', error)
                });
              },
              error: (error) => console.error('Error fetching users:', error)
            });
          },
          error: (error) => console.error('Error fetching units:', error)
        });
      },
      error: (error) => console.error('Error fetching current user:', error)
    });
  }
  
  processPaymentHistories(tenantUsers: any[], tenantPaymentHistories: Map<string, any[]>, currentUserId: string) {
    tenantUsers.forEach((tenant: { paymentHistory: any[]; user_id: string; }) => {
      tenant.paymentHistory = tenantPaymentHistories.get(tenant.user_id) || [];
    });
    const currentUserPayments = tenantPaymentHistories.get(currentUserId) || [];
    this.backendService.getLeases().subscribe({
      next: (leases) => {
        const currentUserLeases = leases.filter((lease: any) => lease.tenant_id === currentUserId);
        currentUserPayments.forEach((payment: any) => {
          const lease = currentUserLeases.find((lease: any) => lease.lease_agreement_id === payment.lease_agreement_id);
          if (lease) {
            payment.remaining_balance = lease.remaining_balance;
          }
        });
        this.paymentHistory = currentUserPayments;
      },
      error: (error) => console.error('Error fetching leases for remaining balance:', error)
    });
  }
  
  getPaymentStatusSeverity(status: string | undefined | null): string {
    if (!status) {
      return 'info'; // or any default value you prefer
    }
    switch (status.toUpperCase()) {
      case 'PAID':
        return 'success';
      case 'REVIEW':
        return 'info';
      case 'PENDING':
        return 'warning';
      default:
        return 'info';
    }
  }
  
  checkisTENANT(){
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (response: any) => {
        if (response.user_type === 'TENANT') {
          this.isTENANT = true;
        } else {
          this.isTENANT = false;
        }
      }
    })
  }

onEditComplete(event: any) {
  if (!event.data) {
    console.error('Event data is missing');
    return;
  }

  const editedField = event.field;
  const editedValue = event.data;
  const lease_agreement_id = event.index;

  this.backendService.getLeases().subscribe({
    next: (response: any[]) => {
      const lease = response.find(item => item.lease_agreement_id == lease_agreement_id);

      if (!lease) {
        console.error('Lease object is missing or undefined');
        return;
      }
      
      lease[editedField] = editedValue;

      if (editedField === 'monthly_rent') {
        const startDate = new Date(lease.start_date);
        const endDate = new Date(lease.end_date);
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
        lease.numberOfMonths = monthsDiff;
      
        this.computeRemainingBalance(lease);
      }

      if (editedField === 'numberOfMonths') {
        const startDate = new Date(lease.start_date);
        const newEndDate = new Date(startDate.setMonth(startDate.getMonth() + parseInt(editedValue)));
        lease.end_date = newEndDate.toISOString().slice(0, 10);
      
        this.computeRemainingBalance(lease);
      }
      
      if (!lease.numberOfMonths && editedField !== 'numberOfMonths') {
        lease.numberOfMonths = response.find(item => item.lease_agreement_id == lease_agreement_id).numberOfMonths;
      }

      if (editedField === 'start_date' || editedField === 'numberOfMonths') {
        this.computeDates(lease);
      }
      const formattedStartDate = this.convertDateToLocal(new Date(lease.start_date));
      const formattedEndDate = this.convertDateToLocal(new Date(lease.end_date));
      
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
        numberOfMonths: lease.numberOfMonths || 1, 
        isValidated: lease.isValidated
      };

      this.backendService.updateLease(lease_agreement_id, updateFields).subscribe({
        next: (response) => {

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

computeRemainingBalance(lease: any) {
  lease.remaining_balance = lease.monthly_rent * lease.numberOfMonths;
}

onMonthlyRentChange(lease: any): void {
  this.computeRemainingBalance(lease);
  this.onEditComplete({data: lease, field: 'monthly_rent'});
  
}

onStartDateChange(lease: any): void {
  if (lease.numberOfMonths) {
    this.computeDates(lease);
    const formattedStartDate = this.getFormattedDate(lease.start_date);
    lease.start_date = formattedStartDate;
    this.updateLeaseDates(lease);
  }
  
}

onNumberOfMonthsChange(lease: any): void {
  if (lease.start_date) {
    this.computeDates(lease);
    this.updateLeaseDates(lease);
  }
 // Calculate remaining balance
 if (lease.monthly_rent && lease.numberOfMonths) {
  lease.remaining_balance = lease.monthly_rent * lease.numberOfMonths;
}
// this.onEditComplete({data: lease, field: 'numberOfMonths'});
}

getFormattedDate(date: string): string {
  const dateObject = new Date(date);
  const localDate = this.convertDateToLocal(dateObject);
  return this.convertDate(localDate);
}

convertDateToLocal(date: Date): Date {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate;
}

convertDate(date: any): string {
  return date.toLocaleDateString('en-CA');
}

computeDates(lease: any): void {
  if (lease.numberOfMonths && lease.start_date) {
    const startDate = new Date(lease.start_date);
    const numberOfMonths = lease.numberOfMonths;
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + numberOfMonths);
    lease.end_date = this.convertDate(this.convertDateToLocal(endDate));
    lease.start_date = this.convertDate(this.convertDateToLocal(startDate));
  } else {
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