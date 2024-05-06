import { Component, ViewChild } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { Table } from 'primeng/table';
import { SeverityService } from 'src/app/services/severity.service';
import { PrimeNGConfig } from 'primeng/api';
import { MessageService } from 'primeng/api';
import { ClientModule } from 'src/app/shared-module/client-module';
import { AdminViewComponent } from './admin-view/admin-view.component';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [ClientModule, AdminViewComponent],
  templateUrl: './validation.component.html',
  styleUrl: './validation.component.scss'
})

export class ValidationComponent {
  
  rows: number = 10;
  constructor(private messageService: MessageService, private primengConfig: PrimeNGConfig, private backendservice: BackendServiceService, public severity: SeverityService) { }
  datas: any;

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.getInvoices();
  }

  uploadedFile: any;
  fileName: string | undefined;
  // TODO: Add upload counter to change status to REVIEW amount needs to be decimal, only accepting integer
  storeReceipt(event: any) {
    this.uploadedFile = event.files[0];
    this.fileName = this.uploadedFile.name;
    // console.log(this.selectedRowData)
    this.toggleProgressBar(this.selectedRowData);
    this.backendservice.ocrImageDetails(this.uploadedFile, this.selectedRowData).subscribe({
      next: (response: any) => {
        this.toggleProgressBar(this.selectedRowData);
        this.refreshTable();
        if(response.attempts > 2){
          this.messageService.add({ severity:'info', summary: 'Information', detail: response.message })
        }else{
          this.messageService.add({ severity:'success', summary: 'Success', detail: response.message })
        }
      },
      error: (error: any) => {
        this.toggleProgressBar(this.selectedRowData);
        this.iterateAttempts(this.selectedRowData);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error.message })
      }
    });
  }

  iterateAttempts(rowData: any){
    rowData.attempts += 1;
    this.datas.find((data: { bill_id: any; attempts: number; }) => {
      if (data.bill_id == rowData.bill_id) {
        data.attempts = rowData.attempts;
      }
    });
  }

  toggleProgressBar(rowData: any) {
    this.datas.find((data: { bill_id: any; isUploading: boolean; }) => {
      if (data.bill_id == rowData.bill_id) {
        data.isUploading =!data.isUploading;
      }
    });
  }

  @ViewChild('fileReceipt', { static: false }) fileReceipt!: any;
  selectedRowData: any;
  uploadReceipt(rowData: any) {
    if (this.fileReceipt) {
      if (this.fileReceipt.files[0]) {
        this.uploadedFile = undefined;
        this.fileReceipt.clear()
        rowData.isUploading = false;
        delete this.selectedRowData;
      } else {
        this.selectedRowData = rowData;
        this.fileReceipt.basicFileInput.nativeElement.click(rowData);
      }
    }
  }

  getInvoices() {
    const email = this.backendservice.getEmail();
    this.backendservice.getUser(email).subscribe({
      next: (response: any) => {
        const allBills: any[] = [];
        response.units.forEach((unit: any) => {
          allBills.push(...unit.bills);
        });
        // this.datas = allBills;
        // console.log(this.datas);
        this.datas = allBills.map((bill: any) => {
          const unit = response.units.find((u: any) => u.unit_id === bill.unit_id); // Assuming each bill has a 'unit_id' property
          return {
            bill_id: bill.bill_id,
            'SOA ID': bill.soa_id,
            'Unit': `Tower ${unit.tower_number} : ${unit.floor_number} - ${unit.unit_number}`,
            'Amount': bill.total_amount,
            'Breakdown': bill.breakdown,
            'Bill Type': bill.bill_type,
            'Due Date': bill.due_date,
            'Status': bill.status,
            'Pay': bill.status === 'PAID' ? 'Paid' : bill.status === 'REVIEW' ? 'Paid' : 'Unpaid',
            isUploading: false,
            attempts: 0
          };
        });

        this.datas.sort((a: { [x: string]: string | number | Date; }, b: { [x: string]: string | number | Date; }) => {
          return new Date(b['Due Date']).getTime() - new Date(a['Due Date']).getTime();
        });

      }
    });
  }
  
  searchText: any;
  clear(table: Table) {
    table.clear();
    this.searchText = undefined;
  }

  refreshTable() {
    this.getInvoices();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Table has been updated!' });
  }
  
}
