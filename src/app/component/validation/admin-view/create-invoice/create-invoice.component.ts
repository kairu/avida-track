import { Component } from '@angular/core';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { BackendDataService } from 'src/app/services/backend-data.service';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-create-invoice',
  standalone: true,
  imports: [AdminModule],
  templateUrl: './create-invoice.component.html',
  styleUrl: './create-invoice.component.scss'
})
export class CreateInvoiceComponent {

  constructor(private messageService: MessageService, public backenddata: BackendDataService, private backendservice: BackendServiceService) { }

  ngOnInit() {
    this.getUserAndUnit();
  }

  invoiceWindow: boolean = false;
  showInvoiceWindow() {
    this.invoiceWindow = true;
  }

  userOptions: { label: string; value: any; }[] = [];
  unitOptions: { label: string; value: any; }[] = [];
  user: { label: string; value: any; }[] = [];
  unit!: number;
  soa_id!: string;
  billType: { name: string, code: string } | null = null;
  amount!: number;
  due_date: any;
  breakdown!: string;
  userSelected: boolean = true;
  unitSelected: boolean = true;
  soaEntried: boolean = true;
  billSelected: boolean = true;
  amountEntried: boolean = true;
  due_DateSelected: boolean = true;

  filterUnitOptions(event: any) {
    this.backendservice.getUnits().subscribe({
      next: (response: any[]) => {
        this.unitOptions = [];
        response.forEach((unit: any) => {
          if (unit.user_id == event.value.value) {
            this.unitOptions.push({ label: `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`, value: unit.unit_id });
          }
        });
        this.userSelected = false;
      }
    });
  }

  createInvoice() {
    if (!this.user || !this.unit || !this.soa_id || !this.billType || !this.amount || !this.due_date) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill out all the fields!' });
      return;
    }

    // Proceed with invoice creation
    const billsData = this.backenddata.billsData(
      this.unit,
      this.soa_id,
      this.backenddata.convertDate(new Date(this.due_date)),
      this.amount,
      this.breakdown,
      this.billType!.code,
    );
    
    this.backendservice.addBills(billsData).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity:'success', summary: 'Success', detail: 'Invoice has been created!' });
        this.onCloseButton();
      }
    });
  }
 
  showBody(event: any) {
    this.unit = event.value.value;
    this.unitSelected = false;
  }

  getUserAndUnit() {
    this.backendservice.getUsers().subscribe({
      next: (response: any[]) => {
        response.forEach((user: any) => {
          this.userOptions.push({ label: user.last_name + ', ' + user.first_name, value: user.user_id });
        });
      }
    });
  }

  onCloseButton() {
    this.userSelected = true;
    this.unitSelected = true;
    this.soaEntried = true;
    this.billSelected = true;
    this.amountEntried = true;
    this.due_DateSelected = true;
    this.unitOptions = [];
    this.user = [];
    this.unit = 0;
    this.billType = null;
    this.soa_id = '';
    
  }
}
