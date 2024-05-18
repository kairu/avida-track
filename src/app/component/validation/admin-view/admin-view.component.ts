import { Component } from '@angular/core';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { BackendDataService } from 'src/app/services/backend-data.service';
import { SeverityService } from 'src/app/services/severity.service';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { CreateInvoiceComponent } from './create-invoice/create-invoice.component';
import { ImageModule } from 'primeng/image';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [ImageModule, AdminModule, CreateInvoiceComponent],
  templateUrl: './admin-view.component.html',
  styleUrl: './admin-view.component.scss'
})
// TODO Click Image to enlarge.
export class AdminViewComponent {
  constructor(private sanitizer: DomSanitizer, private messageService: MessageService, public severity: SeverityService, public backenddata: BackendDataService, private backendservice: BackendServiceService, private checkisadmin: CheckisAdminService) { }
  isAdmin: boolean = false;
  rows: number = 5;

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.getAllInvoices();
      }
    });
  }

  adminViews: any;
  getAllInvoices() {
    this.backendservice.getUsers().subscribe({
      next: (response: any[]) => {
        this.adminViews = this.processUserData(response);
        this.serve_images();
      }
    });
  }

  serve_images(){
    this.adminViews.forEach((data: { bills: any;}) => {
      data.bills.forEach((bill: any) => {
        if(bill.Image){
          this.backendservice.getReceiptImage(bill.Image).subscribe({
            next: (response: any) => {
              bill.Image = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(response));
            }
          });
        }
      });
    });
  }

  processUserData(users: any[]): any[] {
    let allInvoices: any[] = [];
    users.forEach((user: any) => {
      allInvoices = allInvoices.concat(this.processUserUnits(user));
    });
    return allInvoices;
  }

  processUserUnits(user: any): any[] {
    let userInvoices: any[] = [];
    user.units.forEach((unit: any) => {
      userInvoices.push(this.processUnitData(user, unit));
    });
    return userInvoices;
  }

  processUnitData(user: any, unit: any): any {
    let statusCounts: any = this.getStatusCounts(unit.bills);
    let unitData: any = {
      'Full Name': `${user.last_name}, ${user.first_name}`,
      'Unit': `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`,
      bills: this.processBills(unit.bills, unit),
      'Information': statusCounts
    };
    return unitData;
  }

  getStatusCounts(bills: any[]): any {
    // let statusCounts: any = {};
    let statusCounts: number = 0;
    bills.forEach((bill: any) => {
      const status = bill.status;
      if (status == 'REVIEW') {
        statusCounts += 1;
      }
      // statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    if (statusCounts > 0) {
      return "REVIEW: " + statusCounts;
    } else {
      return 0;
    }

  }

  processBills(bills: any[], unit: any): any[] {
    return bills.map((bill: any) => ({
      bill_id: bill.bill_id,
      'SOA ID': bill.soa_id,
      'Unit': `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`,
      'Image': bill.image_path,
      'Amount': bill.total_amount,
      'Delinquent Amount': bill.delinquent_amount,
      'Breakdown': bill.breakdown,
      'Bill Type': bill.bill_type,
      'Due Date': bill.due_date,
      Status: bill.status
    })).sort((a: any, b: any) => new Date(b['Due Date']).getTime() - new Date(a['Due Date']).getTime());
  }

  getStatusKeys(statusCounts: any): string[] {
    return Object.keys(statusCounts);
  }

  refreshTable() {
    if (this.isAdmin) {
      this.getAllInvoices();
    }
    // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Table has been updated!' });
  }

  searchText: any;
  clear(table: Table) {
    table.clear();
    this.searchText = undefined;
  }

  clonedCellData: any;
  onCellEditInit(rowData: any) {
    this.clonedCellData = { ...rowData };
  }

  onCellEditCancel(rowData: any) {
    const unitWithBill = Object.keys(this.adminViews).find((key: string) => {
      return this.adminViews[key].bills && this.adminViews[key].bills.some((bill: any) => bill.bill_id === this.clonedCellData.index);
    });
    if (unitWithBill) {
      const billIndex = this.adminViews[unitWithBill].bills.findIndex((bill: any) => bill.bill_id === this.clonedCellData.index);

      if (billIndex !== -1) {
        this.adminViews[unitWithBill].bills[billIndex][this.clonedCellData.field] = this.clonedCellData.data;
      }
    }
  }

  onCellEditComplete(rowData: any) {
    if (this.skipCellEdit(rowData)) {
      return;
    }

    if (rowData.data === "") {
      this.emptyCellData(rowData);
    } else {
      this.onCellEditSave(rowData);
    }
  }

  onCellEditSave(rowData: any): void {
    delete this.clonedCellData;
    const fieldName: { [key: string]: string } = {
      'SOA ID': 'soa_id',
      'Amount': 'total_amount',
      'Breakdown': 'breakdown',
      'Bill Type': 'bill_type',
      'Due Date': 'due_date',
      'Status': 'status'
    };

    const dataName = rowData.field === 'Bill Type' && typeof rowData.data === 'object'
      ? rowData.data.code
      : rowData.field === 'Status' && typeof rowData.data === 'object'
        ? rowData.data.code
        : rowData.field === 'Due Date'
          ? this.backenddata.convertDate(new Date(rowData.data))
          : rowData.data;
    const data = {
      [fieldName[rowData.field]]: dataName
    };
    this.backendservice.updateBills(rowData.index, data).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Bill has been updated!' });
        this.getAllInvoices();
      }
    });
  }

  emptyCellData(rowData: any): void {
    this.onCellEditCancel(rowData);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter a value' });
  }

  skipCellEdit(rowData: any): boolean {
    const editableFields = ['Unit', 'Image', 'Delinquent Amount'];
    return editableFields.includes(rowData.field);
  }

}
