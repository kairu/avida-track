import { Component, OnInit } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { FileUploadModule } from 'primeng/fileupload';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { CalendarModule } from 'primeng/calendar';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ToastModule } from 'primeng/toast';
import { from, lastValueFrom, map, switchMap } from 'rxjs';
import { KeysPipe } from "../../pipe/keys.pipe";
import { ClientModule } from 'src/app/shared-module/client-module';
import { BackendDataService } from 'src/app/services/backend-data.service';
import { SeverityService } from 'src/app/services/severity.service';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
interface UploadEvent {
  originalEvent: Event;
  files: File[];
}
@Component({
  selector: 'app-tenant-lease',
  standalone: true,
  imports: [ReactiveFormsModule, ClientModule, FileUploadModule, CommonModule,
    CalendarModule, AutoCompleteModule, ToastModule,
    KeysPipe],
  templateUrl: './tenant-lease.component.html',
  styleUrls: ['./tenant-lease.component.scss']
})

export class TenantLeaseComponent implements OnInit {
  uploadedFile: any;
  fileName: string | undefined;
  imageSrc: any;
  leases: any[] = [];
  selectedItem: any;
  today: Date = new Date();
  pendingTenants: any[] = [];
  isTENANT!: boolean;
  user_id!: number;
  datas: any;

  constructor(
    private fb: FormBuilder,
    private backendService: BackendServiceService,
    public backendData: BackendDataService,
    private messageService: MessageService,
    public severity: SeverityService
  ) {

  }

  onUpload(event: UploadEvent) {
    this.messageService.add({ severity: 'info', summary: 'Success', detail: 'File Uploaded with Basic Mode' });
  }

  async ngOnInit() {
    const userData = sessionStorage.getItem('backendUserData');
    this.user_id = JSON.parse(userData || '{}').user_id;
    this.today = new Date();
    await this.checkisTENANT();
    if (!this.isTENANT) {
      this.initForm();
      this.initInvoiceForm();
      this.reloadTables();
    } else {
      this.loadTenantInvoiceHistory()
    }
  }

  async checkisTENANT() {
    try {
      const response: any = await lastValueFrom(this.backendService.getUser(this.user_id));
      this.isTENANT = response.user_type === 'TENANT';
    } catch (error) {
      console.error('Error checking user type:', error);
    }
  }

  reloadTables() {
    this.fetchPendingTenants();
    this.loadLeases();
    this.loadInvoiceHistory()
  }

  fetchPendingTenants(): void {
    this.backendService.getUser(this.user_id).subscribe({
      next: (currentUser) => {
        this.backendService.getUnits().subscribe({
          next: (unitsResponse) => {
            this.backendService.getUsers().subscribe({
              next: (usersResponse) => {
                // Combine filtering and mapping into a single operation
                this.pendingTenants = usersResponse
                  .filter((user: any) =>
                    user.user_type === 'TENANT' &&
                    currentUser.units.some((userUnit: any) =>
                      unitsResponse.some((unit: any) =>
                        unit.tower_number === userUnit.tower_number &&
                        unit.unit_number === userUnit.unit_number &&
                        unit.floor_number === userUnit.floor_number &&
                        unit.user_id === user.user_id
                      )
                    ) &&
                    ((!user.lease_agreements || user.lease_agreements.length === 0) && !user.is_validated)
                  )
                  .map((user: any) => {
                    const unit = unitsResponse.find((u: any) => u.user_id === user.user_id);
                    return {
                      tenant_id: user.user_id,
                      unit_id: unit.unit_id,
                      'Full Name': `${user.last_name}, ${user.first_name}`,
                      'Unit': `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`,
                      'Phone Number': user.mobile_number
                    };
                  });
              }
            });
          }
        });
      }
    });
  }

  leaseForm!: FormGroup;
  private initForm() {
    this.leaseForm = this.fb.group({
      monthly_rent: [null,
        Validators.required,
      ],
      number_of_months: [null,
        Validators.required,
      ],
      start_date: [null,
        Validators.required,
      ],
    });
  }

  invoiceForm!: FormGroup;
  private initInvoiceForm() {
    this.invoiceForm = this.fb.group({
      issue_to: [null,
        Validators.required,
      ],
      due_date: [null,
        Validators.required,
      ],
      amount: [null,
        Validators.required,
      ],
    })
  }

  leaseWindow: boolean = false;
  selectedRowData: any;
  showLeaseWindow(rowData: any) {
    this.selectedRowData = rowData;
    this.leaseWindow = true;
  }

  singleInvoice: boolean = false;
  showSingleInvoiceWindow() {
    this.singleInvoice = true;
  }

  resetSingleInvoiceWindow() {
    this.invoiceForm.reset();
    this.singleInvoice = false;
  }

  btnCreateInvoice(){
    const paymentInvoice = {
      lease_agreement_id: this.invoiceForm.value.issue_to.lease_id,
      amount: this.invoiceForm.value.amount,
      due_date: this.backendData.convertDate(this.invoiceForm.value.due_date),
      status: 'PENDING'
    }
    const leaseData = {
      add_balance: this.invoiceForm.value.amount
    }

    this.backendService.addPayment(paymentInvoice).pipe(
      switchMap(() => this.backendService.updateLease(this.invoiceForm.value.issue_to.lease_id, leaseData))
    ).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'New Rent Invoice Added!' });
        this.reloadTables();
        this.resetSingleInvoiceWindow();
      }
    });

  }

  ownerReview(rowData: any) {
    const paymentData = {
      status: 'REVIEW'
    }

    this.backendService.updatePayment(rowData.payment_id, paymentData).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invoice Updated' });
        this.loadTenantInvoiceHistory()
      }
    })
  }

  markPaid(rowData: any) {
    const paymentData = {
      status: 'PAID'
    }
    const leaseData = {
      deduct_balance: rowData['Amount']
    }
    this.backendService.updatePayment(rowData.payment_id, paymentData).pipe(
      switchMap(() => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invoice Updated' });
        return this.backendService.updateLease(rowData.lease_agreement_id, leaseData);
      })
    ).subscribe({
      next: () => {
        this.reloadTables();
      }
    });
  }

  markPending(rowData: any) {
    const data = {
      status: 'PENDING'
    }
    this.backendService.updatePayment(rowData.payment_id, data).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Invoice Updated' });
        this.reloadTables();
      },
    });
  }

  resetLeaseWindow() {
    this.leaseForm.reset();
    this.leaseWindow = false;
  }

  removeTenant(rowData: any) {
    console.log(rowData)
  }

  endDate!: Date;
  totalBalance!: number;
  computeEndDateTotalBalance() {
    if (this.leaseForm.value.monthly_rent && this.leaseForm.value.number_of_months && this.leaseForm.value.start_date) {
      const monthlyRent = this.leaseForm.value.monthly_rent;
      const numberOfMonths = this.leaseForm.value.number_of_months;
      const totalBalance = monthlyRent * numberOfMonths;
      this.totalBalance = totalBalance;
      this.endDate = new Date(this.leaseForm.value.start_date)
      this.endDate.setMonth(this.endDate.getMonth() + numberOfMonths)
    }
  }

  onConfirm() {
    this.backendService.updateUser(this.selectedRowData.tenant_id, { is_validated: true }).subscribe({
      next: (response) => {
        // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully' });
        const leaseData = this.backendData.leaseData(
          this.selectedRowData.unit_id,
          this.user_id,
          this.selectedRowData.tenant_id,
          this.backendData.convertDate(this.leaseForm.value.start_date),
          this.backendData.convertDate(this.endDate),
          this.leaseForm.value.monthly_rent,
          this.totalBalance
        );

        this.backendService.addLeaseAgreement(leaseData).subscribe({
          next: async (response) => {
            let paymentInvoices = []

            for (let i = 0; i < this.leaseForm.value.number_of_months; i++) {
              let paymentDate = new Date(this.leaseForm.value.start_date)
              paymentDate.setMonth(paymentDate.getMonth() + i)

              let paymentInvoice = {
                lease_agreement_id: response.lease_agreement_id,
                amount: this.leaseForm.value.monthly_rent,
                due_date: this.backendData.convertDate(paymentDate)
              }

              paymentInvoices.push(paymentInvoice)
            }

            try {
              for (const paymentInvoice of paymentInvoices) {
                await lastValueFrom(this.backendService.addPayment(paymentInvoice));
              }
              this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Lease agreement added successfully' });
              this.resetLeaseWindow();
              this.reloadTables();
            } catch (error) {
              console.error('Error adding payment:', error);
            }
          }
        });
      }
    });
  }

  issue_names!: [{ name: string; user_id: number; lease_id: number; }];
  loadLeases() {
    this.backendService.getUser(this.user_id).subscribe({
      next: (response) => {
        if (response.lease_agreements) {
          this.leases = response.lease_agreements.map((lease: { unit_id: number; contract: any; end_date: any; lease_agreement_id: any; monthly_rent: any; remaining_balance: any; start_date: any; tenant_info: { user_id: number; first_name: any; last_name: any; }; }) => ({
            lease_agreement_id: lease.lease_agreement_id,
            user_id: lease.tenant_info.user_id,
            'Full Name': `${lease.tenant_info.last_name}, ${lease.tenant_info.first_name}`,
            'Unit': this.backendService.getUnit(lease.unit_id).pipe(
              map((unit: { tower_number: any; floor_number: any; unit_number: any; }) => `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`)
            ),
            'Contract': lease.contract,
            'Monthly Rent': lease.monthly_rent,
            'Start Date': lease.start_date,
            'End Date': lease.end_date,
            'Remaining Balance': lease.remaining_balance,
          }))
          this.issue_names = this.leases.map(lease => ({
            name: lease['Full Name'],
            // user_id: lease.user_id,
            lease_id: lease.lease_agreement_id
          })) as [{ name: string; user_id: number; lease_id: number; }]
        }
      }
    })


  }

  historyInvoice: any[] = [];
  loadInvoiceHistory() {
    this.backendService.getUser(this.user_id).subscribe({
      next: (response) => {
        if (response.lease_agreements) {
          this.historyInvoice = response.lease_agreements.flatMap((lease: {
            contract: any; end_date: any; lease_agreement_id: any; monthly_rent: any; remaining_balance: any; start_date: any; tenant_info: {
              user_id: any; first_name: any; last_name: any;
            }; payments: { payment_id: number; due_date: any; payment_date: any; status: any; amount: number; image_path: any; }[]
          }) =>
            lease.payments.map(payment => ({
              lease_agreement_id: lease.lease_agreement_id,
              user_id: lease.tenant_info.user_id,
              payment_id: payment.payment_id,
              'Full Name': `${lease.tenant_info.last_name}, ${lease.tenant_info.first_name}`,
              'Due Date': payment.due_date,
              'Amount': payment.amount,
              'Image': payment.image_path,
              'Status': payment.status
            }))
          )
          this.historyInvoice.sort((a, b) => new Date(a['Due Date']).getTime() - new Date(b['Due Date']).getTime())
        }
      }
    });
  }

  tenantHistoryInvoice: any[] = [];
  ownerName: string = 'placeholder';
  ownerMobileNo: number = 99999;
  loadTenantInvoiceHistory() {
    this.backendService.getLease(this.user_id + 'TENANT').subscribe({
      next: (leaseResponse) => {
        from(leaseResponse as { lease_agreement_id: any; owner_id: any }[]).pipe(
          map((lease: { lease_agreement_id: any; owner_id: any }) => ({
            lease_agreement_id: lease.lease_agreement_id,
            owner_id: lease.owner_id
          }))
        ).subscribe(({ lease_agreement_id, owner_id }) => {
          const leaseID = lease_agreement_id;
          this.backendService.getUser(owner_id).subscribe({
            next: (response) => {
              this.ownerName = response.last_name + ', ' + response.first_name;
              this.ownerMobileNo = response.mobile_number;
            }
          });
          this.backendService.getPayment(leaseID + 'LEASE').subscribe({
            next: (response) => {
              this.tenantHistoryInvoice = response.map((payment: { payment_id: any; due_date: any; payment_date: any; status: any; amount: number; image_path: any; }) => ({
                payment_id: payment.payment_id,
                lease_agreement_id: leaseID,
                'Due Date': payment.due_date,
                'Amount': payment.amount,
                'Image': payment.image_path,
                'Status': payment.status
              }))
              this.tenantHistoryInvoice.sort((a, b) => new Date(a['Due Date']).getTime() - new Date(b['Due Date']).getTime())
            }
          })
        });
      }
    });
  }

  async storeImageData(event: any, lease_agreement_id: number) {
    // console.log(lease_agreement_id);
    this.uploadedFile = event.files[0];
    this.fileName = this.uploadedFile.name;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      this.imageSrc = e.target.result;

      const formData = new FormData();
      formData.append('file', this.uploadedFile);

      try {
        const response = await this.backendService.uploadImageToLease(formData, lease_agreement_id);
        // console.log('Image uploaded to lease agreement successfully:', response);
      } catch (error) {
        console.error('Error uploading image to lease agreement:', error);
      }
    };
    reader.readAsDataURL(event.files[0]);
  }
}
