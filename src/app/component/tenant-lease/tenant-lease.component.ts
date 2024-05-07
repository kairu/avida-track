import { Component, OnInit } from '@angular/core';
import { TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { FileUploadModule } from 'primeng/fileupload';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { ImageModule } from 'primeng/image';

interface UploadEvent {
  originalEvent: Event;
  files: File[];
}

@Component({
  selector: 'app-tenant-lease',
  standalone: true,
  imports: [TableModule, FileUploadModule, CommonModule, InputNumberModule, FormsModule, ImageModule],
  templateUrl: './tenant-lease.component.html',
  styleUrls: ['./tenant-lease.component.scss']
})

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