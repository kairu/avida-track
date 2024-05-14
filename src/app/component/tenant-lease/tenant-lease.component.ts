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

interface UploadEvent {
  originalEvent: Event;
  files: File[];
}

@Component({
  selector: 'app-tenant-lease',
  standalone: true,
  imports: [TableModule, FileUploadModule, CommonModule, InputNumberModule, FormsModule, ImageModule, CalendarModule],
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
  date: Date | undefined;
  today: Date;
  numberOfMonths: number | null = null;
  computedEndDates: { [leaseId: number]: string } = {};



  constructor(private backendService: BackendServiceService, private messageService: MessageService) {
    this.today = new Date();
  }

  ngOnInit(): void {
    this.getLease();
    const storedLeases = localStorage.getItem('leases');
    if (storedLeases) {
      this.leases = JSON.parse(storedLeases);
    }
    if (this.leases.length > 0) {
      this.selectedItem = this.leases[0];
      
    }
    this.leases.forEach(lease => lease.numberOfMonths = 1);
    // this.leases.forEach(lease => {
    //   lease.numberOfMonths = JSON.parse(localStorage.getItem(`numberOfMonths_${lease.lease_agreement_id}`) || '1');
    //   const storedStartDate = localStorage.getItem(`startDate_${lease.lease_agreement_id}`);
    //   lease.start_date = storedStartDate ? JSON.parse(storedStartDate) : lease.start_date;

    //   const storedEndDate = localStorage.getItem(`endDate_${lease.lease_agreement_id}`);
    //   lease.end_date = storedEndDate ? JSON.parse(storedEndDate) : lease.end_date;
    // }); 
  }

  getLease(): void {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (userData) => {
        const leases: any[] = [];

        if (userData.lease_agreements && Array.isArray(userData.lease_agreements)) {
          userData.lease_agreements.forEach((leaseAgreement: any) => {
            const tenantEmail = leaseAgreement.tenant_info.email;
            this.backendService.getUser(tenantEmail).subscribe({
              next: (tenantData) => {
                const leaseInfo = {
                  lease_agreement_id: leaseAgreement.lease_agreement_id,
                  unit_id: leaseAgreement.unit_id,
                  owner_id: leaseAgreement.owner_id,
                  tenant_id: leaseAgreement.tenant_id,
                  start_date: leaseAgreement.start_date,
                  end_date: leaseAgreement.end_date,
                  monthly_rent: leaseAgreement.monthly_rent,
                  remaining_balance: leaseAgreement.remaining_balance,
                  security_deposit: leaseAgreement.security_deposit,
                  contract: leaseAgreement.contract,
                  tenant_info: {
                    first_name: tenantData.first_name,
                    last_name: tenantData.last_name,
                    email: tenantData.email,
                  },
                  startDateSaved: false,
                  disabledInput: false,
                  updatedMonthlyRent: null, // Initialize with the current monthly rent
                };
                leases.push(leaseInfo);
                console.log('Lease added:', leaseInfo);
              },
              error: (error) => {
                console.error('Error fetching tenant data:', error);
              }
            });
          });
        } else {
          console.error('Lease agreements data not found or invalid.');
        }
        this.leases = leases;

        if (this.leases.length > 0) {
          this.selectedItem = this.leases[0];
          console.log(this.selectedItem);
        } else {
          
        }
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
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
                  monthly_rent: lease.updatedMonthlyRent, // Use the updated monthly rent
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
    startDateWithoutTime.setHours(0, 0, 0, 0); // Set time to midnight
    return startDateWithoutTime.toISOString().slice(0, 10); // Return formatted date string
  }

  computeDates(lease: any): void {
    if (lease.numberOfMonths && lease.start_date) {
      const startDate = new Date(lease.start_date);
      const numberOfMonths = lease.numberOfMonths;
  
      const endDate = new Date(startDate.setMonth(startDate.getMonth() + numberOfMonths));
      const formattedEndDate = `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()}`;

      this.computedEndDates[lease.lease_agreement_id] = formattedEndDate;
      lease.end_date = formattedEndDate;
      localStorage.setItem(`endDate_${lease.lease_agreement_id}`, formattedEndDate); // Save end date to local storage
    }
  }
  
  
  onStartDateChange(lease: any): void {
    this.computeDates(lease);
    localStorage.setItem(`startDate_${lease.lease_agreement_id}`, lease.start_date); // Save start date to local storage
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
          lease.startDateSaved = true; // Set the startDateSaved flag to true
          localStorage.setItem('leases', JSON.stringify(this.leases));
          // To set the numberOfMonths in local storage
          // localStorage.setItem(`numberOfMonths_${lease.lease_agreement_id}`, JSON.stringify(lease.numberOfMonths));
          // localStorage.setItem(`startDate_${lease.lease_agreement_id}`, JSON.stringify(lease.start_date));
          // localStorage.setItem(`endDate_${lease.lease_agreement_id}`, JSON.stringify(lease.end_date));

          
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

export class TenantLeaseComponent implements OnInit {
  uploadedFile: any;
  fileName: string | undefined;
  imageSrc: any;
  leases: any[] = [];
  selectedItem: any;
  monthly_rent!: number;
  updatedMonthlyRent: number | undefined;

  constructor(private backendService: BackendServiceService, private messageService: MessageService) { }

  ngOnInit(): void {
    this.getLease();
    if (this.leases.length > 0) {
      this.selectedItem = this.leases[0];
      console.log(this.selectedItem);
    }
    // this.updatedMonthlyRent = 0;
  }


  // getLease(): void {
  //     const email = this.backendService.getEmail();
  //     this.backendService.getUser(email).subscribe({
  //       next: (userData) => {
  //         const leases: any[] = [];

  //         if (userData.lease_agreements && Array.isArray(userData.lease_agreements)) {
  //           userData.lease_agreements.forEach((leaseAgreement: any) => {
  //             const tenantEmail = leaseAgreement.tenant_info.email;
  //             this.backendService.getUser(tenantEmail).subscribe({
  //               next: (tenantData) => {
  //                 const leaseInfo = {
  //                   lease_agreement_id: leaseAgreement.lease_agreement_id,
  //                   unit_id: leaseAgreement.unit_id,
  //                   owner_id: leaseAgreement.owner_id,
  //                   tenant_id: leaseAgreement.tenant_id,
  //                   start_date: leaseAgreement.start_date,
  //                   end_date: leaseAgreement.end_date,
  //                   monthly_rent: leaseAgreement.monthly_rent,
  //                   remaining_balance: leaseAgreement.remaining_balance,
  //                   security_deposit: leaseAgreement.security_deposit,
  //                   contract: leaseAgreement.contract,
  //                   tenant_info: {
  //                     first_name: tenantData.first_name,
  //                     last_name: tenantData.last_name,
  //                     email: tenantData.email,
  //                   }
  //                 };
  //                 leases.push(leaseInfo);
  //                 console.log('Lease added:', leaseInfo); // Log when a lease is added
  //                 // console.log('Leases array:', leases); // Log the current state of leases array
  //               },
  //               error: (error) => {
  //                 console.error('Error fetching tenant data:', error);
  //               }
  //             });
  //           });
  //         } else {
  //           console.error('Lease agreements data not found or invalid.');
  //         }
  //         this.leases = leases;
  //       },
  //       error: (error) => {
  //         console.error('Error fetching user data:', error);
  //       }
  //     });
  //   }

  getLease(): void {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (userData) => {
        const leases: any[] = [];

        if (userData.lease_agreements && Array.isArray(userData.lease_agreements)) {
          userData.lease_agreements.forEach((leaseAgreement: any) => {
            const tenantEmail = leaseAgreement.tenant_info.email;
            this.backendService.getUser(tenantEmail).subscribe({
              next: (tenantData) => {
                const leaseInfo = {
                  lease_agreement_id: leaseAgreement.lease_agreement_id,
                  unit_id: leaseAgreement.unit_id,
                  owner_id: leaseAgreement.owner_id,
                  tenant_id: leaseAgreement.tenant_id,
                  start_date: leaseAgreement.start_date,
                  end_date: leaseAgreement.end_date,
                  monthly_rent: leaseAgreement.monthly_rent,
                  remaining_balance: leaseAgreement.remaining_balance,
                  security_deposit: leaseAgreement.security_deposit,
                  contract: leaseAgreement.contract,
                  tenant_info: {
                    first_name: tenantData.first_name,
                    last_name: tenantData.last_name,
                    email: tenantData.email,
                  }
                };
                leases.push(leaseInfo);
                console.log('Lease added:', leaseInfo);
                // Log when a lease is added
                // console.log('Leases array:', leases); // Log the current state of leases array
              },
              error: (error) => {
                console.error('Error fetching tenant data:', error);
              }
            });
          });
        } else {
          console.error('Lease agreements data not found or invalid.');
        }
        this.leases = leases;

        // Check if leases array is not empty before accessing its first item
        if (this.leases.length > 0) {
          // Assign selectedItem after leases are fetched
          this.selectedItem = this.leases[0];
          console.log(this.selectedItem);
        } else {
          console.error('Leases array is empty');
        }
      },
      error: (error) => {
        console.error('Error fetching user data:', error);
      }
    });
  }

  storeImageData(event: any, lease_agreement_id: number) {
    console.log(lease_agreement_id);
    this.uploadedFile = event.files[0];
    this.fileName = this.uploadedFile.name;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imageSrc = e.target.result;
    };
    reader.readAsDataURL(event.files[0]);

    // Create FormData object and append the image file
    const formData = new FormData();
    formData.append('file', this.uploadedFile);

    // Call uploadImageToLease function to upload the image to the lease agreement
    // File storing to backend
    // console.log(lease_agreement_id)
    this.backendService.uploadImageToLease(formData, lease_agreement_id).subscribe({
      next: (response: any) => {
        const data ={
          lease_agreement_id: lease_agreement_id,
          contract: response.file
        }

        console.log(data)
      }
    });
    // console.log(data)

    // const data = {
    //   lease_agreement_id: lease_agreement_id,
    //   contract: file
    // }
    // this.backendService.uploadImageToLease(formData, lease_agreement_id).subscribe({
    //   next: (response) => {
    //     contract = response.file;
    //     data = {
    //       lease_agreement_id: lease_agreement_id,
    //       contract: response.file
    //     }
    //     this.backendService.updateLease(lease_agreement_id)
    //     console.log('Image uploaded to lease agreement successfully:', response);
    //     // Handle success, if needed
    //   },
    //   error: (error) => {
    //     console.error('Error uploading image to lease agreement:', error);
    //     // Handle error, if needed
    //   }
    // })

  }


  //   async storeImageData(event: any, lease_agreement_id: number) {
  //     console.log(lease_agreement_id);
  //     this.uploadedFile = event.files[0];
  //     this.fileName = this.uploadedFile.name;

  //     const reader = new FileReader();
  //     reader.onload = async (e: any) => {
  //         this.imageSrc = e.target.result;

  //         // Create FormData object and append the image file
  //         const formData = new FormData();
  //         formData.append('file', this.uploadedFile);

  //         try {
  //             // Call uploadImageToLease function to upload the image to the lease agreement
  //             const response = await this.backendService.uploadImageToLease(formData, lease_agreement_id);
  //             console.log('Image uploaded to lease agreement successfully:', response);
  //             // Handle success, if needed
  //         } catch (error) {
  //             console.error('Error uploading image to lease agreement:', error);
  //             // Handle error, if needed
  //         }
  //     };
  //     reader.readAsDataURL(event.files[0]);
  // }


  // storeImageData(event: any, leaseId: number) {
  //   console.log(leaseId); 
  //   this.uploadedFile = event.files[0];
  //   this.fileName = this.uploadedFile.name;

  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     this.imageSrc = e.target.result;


  //     const leaseAgreement = this.leases.find(lease => leaseId === lease.lease_agreement_id);
  //     if (leaseAgreement) {
  //       const updatedLeaseData = {
  //         contract: this.imageSrc
  //       };

  //       // Call the backend service to update the Lease Agreement
  //       this.backendService.updateLease(leaseAgreement.lease_agreement_id, updatedLeaseData).subscribe(
  //         (response) => {
  //           console.log('Lease Agreement updated successfully:', response);
  //           // Add any additional logic or notifications here
  //         },
  //         (error) => {
  //           console.error('Error updating Lease Agreement:', error);
  //           // Handle the error case
  //         }
  //       );
  //     } else {
  //       console.error('Lease agreement not found');
  //       // Handle the case when the lease agreement is not found
  //     }
  //   };

  //   reader.readAsDataURL(event.files[0]);
  // }



  // storeImageData(event: any, leaseId: number) {
  //   console.log('Lease ID:', leaseId);

  //   this.uploadedFile = event.files[0];
  //   this.fileName = this.uploadedFile.name;

  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     this.imageSrc = e.target.result;

  //     const updatedLeaseData = {
  //       contract: this.imageSrc
  //     };

  //       console.log('Updated lease data:', updatedLeaseData);
  //     // Call the backend service to update the Lease Agreement
  //     this.backendService.updateLease(leaseId, updatedLeaseData).subscribe(
  //       (response) => {
  //         console.log('Lease Agreement updated successfully:', response);

  //       },
  //       (error) => {
  //         console.error('Error updating Lease Agreement:', error);
  //       }
  //     );
  //   };
  //   reader.readAsDataURL(event.files[0]);
  // }

  // storeImageData(event: any, leaseId: number) {
  //   console.log('Lease ID:', leaseId);

  //   // Assuming you have a method to fetch lease data from the backend
  //   this.backendService.getLease().subscribe(
  //     (leaseData) => {
  //       // Assuming leaseData contains relevant lease information
  //       console.log('Lease Data:', leaseData);

  //       this.uploadedFile = event.files[0];
  //       this.fileName = this.uploadedFile.name;

  //       const reader = new FileReader();
  //       reader.onload = (e: any) => {
  //         this.imageSrc = e.target.result;

  //         const updatedLeaseData = {
  //           contract: this.imageSrc
  //         };

  //         console.log('Updated lease data:', updatedLeaseData);

  //         // Call the backend service to update the Lease Agreement
  //         this.backendService.updateLease(leaseId, updatedLeaseData).subscribe(
  //           (response) => {
  //             console.log('Lease Agreement updated successfully:', response);
  //           },
  //           (error) => {
  //             console.error('Error updating Lease Agreement:', error);
  //           }
  //         );
  //       };
  //       reader.readAsDataURL(event.files[0]);
  //     },
  //     (error) => {
  //       console.error('Error fetching Lease data:', error);
  //     }
  //   );
  // }


  // onBasicUploadAuto(event: UploadEvent) {
  //   this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Auto Mode' });
  // }


  updateRent(lease: any): void {
    if (this.updatedMonthlyRent !== undefined && this.updatedMonthlyRent !== null) {
      if (this.updatedMonthlyRent >= lease.monthly_rent) {
        const remainingBalanceAfterRent = lease.remaining_balance - this.updatedMonthlyRent;
        lease.remaining_balance = remainingBalanceAfterRent;
        console.log('Remaining balance:', lease.remaining_balance);

        const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
        if (email) {

          this.backendService.getUser(email).subscribe({
            next: (userData: any) => {

              // const userId = userData.user_id;
              const ownerId = userData.owner_id || userData.user_id;
              console.log('owner id:', ownerId);

              if (ownerId) {
                const leaseData = {
                  lease_agreement_id: lease.lease_agreement_id,
                  unit_id: lease.unit_id,
                  owner_id: ownerId,
                  tenant_id: lease.tenant_id,
                  contract: lease.contract || '',
                  start_date: lease.start_date,
                  end_date: lease.end_date,
                  monthly_rent: lease.monthly_rent,
                  security_deposit: lease.security_deposit,
                  remaining_balance: lease.remaining_balance
                };
                console.log('leaseData:', leaseData);

                this.backendService.updateLease(lease.lease_agreement_id, leaseData).subscribe({
                  next: (response) => {
                    console.log('Lease Agreement updated successfully:', response);
                    this.messageService.add({ severity: 'success', summary: 'Rent Updated', detail: 'Remaining balance updated successfully.' });
                    this.updatedMonthlyRent = 0;
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

}