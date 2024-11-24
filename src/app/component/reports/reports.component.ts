import { Component } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { CommonModule } from '@angular/common';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { TimeFormatPipe } from 'src/app/pipe/time-format.pipe';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DecimalFormatPipe } from 'src/app/pipe/decimal-format.pipe';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable'
import { DropdownModule } from 'primeng/dropdown';
import { saveAs } from 'file-saver-es';


@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [DropdownModule, DecimalFormatPipe, TooltipModule, FormsModule, InputTextModule, ButtonModule, KeysPipe, CommonModule, TableModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})

export class ReportsComponent {
  billDatas: any;
  unitData: any;
  groupedData: any[] = [];
  monthlyRevenues: any[] = [];
  delinquentData: any[] = [];
  rows = 10;
  revenueBtnSelected: boolean = true;
  delinquentBtnSelected: boolean = false;
  billsBreakdownBtnSelected: boolean = false;

  utilityServiceData: any[] = [];
  columns: any[] = [
    { field: 'tower_number', header: 'Tower' },
    { field: 'UTILITY', header: 'Utility Cost' },
    { field: 'WATER', header: 'Water Cost' },
    { field: 'ASSOCIATION', header: 'Association Cost' },
    { field: 'PARKING', header: 'Parking Cost' },
    { field: 'MAINTENANCE', header: 'Maintenance Cost' },
    { field: 'ETC', header: 'Other Costs' },
  ];
  months = [
    { label: 'January', value: '01' },
    { label: 'February', value: '02' },
    { label: 'March', value: '03' },
    { label: 'April', value: '04' },
    { label: 'May', value: '05' },
    { label: 'June', value: '06' },
    { label: 'July', value: '07' },
    { label: 'August', value: '08' },
    { label: 'September', value: '09' },
    { label: 'October', value: '10' },
    { label: 'November', value: '11' },
    { label: 'December', value: '12' }
  ];
  statusOptions = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Review', value: 'REVIEW' },
    { label: 'Paid', value: 'PAID' }
  ];
  selectedMonth: string | undefined;
  selectedYear: number | undefined;
  selectedStatus: string | undefined;
  yearOptions: any[] = [];

  constructor(private backendService: BackendServiceService) { }

  ngOnInit() {
    this.backendService.getUnits().pipe(
      switchMap((response: any) => {
        this.unitData = response;
        return this.backendService.getBills();
      }),
      switchMap((response: any) => {
        this.billDatas = response;
        this.groupData();
        return of(null); // Return a dummy observable to complete the chain
      })
    ).subscribe();

    this.backendService.getDelinquentBills().subscribe({
      next: (response: any) => {
        this.delinquentData = response;
      }
    })
    this.fetchBillingPerformance()
  }

  showReport(btnType: number){
    if(btnType == 1){
      this.revenueBtnSelected = true;
      this.delinquentBtnSelected = false;
      this.billsBreakdownBtnSelected = false;
    }
    else if(btnType == 2){
      this.revenueBtnSelected = false;
      this.delinquentBtnSelected = true;
      this.billsBreakdownBtnSelected = false;
    }
    else if(btnType == 3){
      this.revenueBtnSelected = false;
      this.delinquentBtnSelected = false;
      this.billsBreakdownBtnSelected = true;
    }
  }

  fetchBillingPerformance(){
    this.backendService.getAvailableYears().subscribe({
      next: (response: any) => {
        this.yearOptions = response.map((year: any) => ({ label: year, value: year }));
      }
    })
    this.backendService.getBillingPerformance(this.selectedMonth, this.selectedYear, this.selectedStatus).subscribe({
      next: (response: any) => {
        this.utilityServiceData = Object.keys(response).map((towerNumber) => {
          const towerCosts = response[towerNumber];
          return {
            tower_number: towerNumber,
            WATER: towerCosts.WATER?.total_cost || 0,
            ASSOCIATION: towerCosts.ASSOCIATION?.total_cost || 0,
            PARKING: towerCosts.PARKING?.total_cost || 0,
            MAINTENANCE: towerCosts.MAINTENANCE?.total_cost || 0,
            ETC: towerCosts.ETC?.total_cost || 0,
          };
        })

      }
        
    })
  }

  applyFilter() {
    this.fetchBillingPerformance();
  }


  groupData(): void {
    const groupedMap = this.groupDataByTowerNumber();
    this.mergeBillsIntoGroupedData(groupedMap);
    this.calculateAdditionalMetrics(groupedMap);
    this.addTotalRow();
    this.sortGroupedData();
  }

  private groupDataByTowerNumber(): Map<number, any[]> {
    const groupedMap = new Map<number, any[]>();

    this.unitData.forEach((data: { tower_number: any; }) => {
      const towerNumber = data.tower_number;
      groupedMap.set(towerNumber, groupedMap.get(towerNumber) ?? []); // Initialize if undefined
      groupedMap.get(towerNumber)?.push(data);
    });

    return groupedMap;
  }

  private mergeBillsIntoGroupedData(groupedMap: Map<number, any[]>): void {
    this.billDatas.forEach((bill: any) => {
      const unitId = bill.unit_id;
      for (const [towerNumber, units] of groupedMap.entries()) {
        const matchingUnit = units.find((unit: any) => unit.unit_id === unitId);
        if (matchingUnit) {
          if (!matchingUnit.bills) {
            matchingUnit.bills = [];
          }
          matchingUnit.bills.push(bill);
          break; // No need to continue searching other towers
        }
      }
    });
  }

  private calculateAdditionalMetrics(groupedMap: Map<number, any[]>): void {
    this.groupedData = Array.from(groupedMap.entries()).map(([towerNumber, group]) => {
      const numUnits = group.length;

      // Filter unpaid bills for all units in the group
      const unpaidBills = group.flatMap((unit: any) => unit.bills ? unit.bills.filter((bill: any) => bill.status === 'REVIEW' || bill.status === 'PENDING') : []);
      const unpaidAmount = unpaidBills.reduce((sum: number, bill: any) => sum + bill.total_amount, 0);

      // Calculate total amount for PAID bills for all units in the group
      const paidBills = group.flatMap((unit: any) => unit.bills ? unit.bills.filter((bill: any) => bill.status === 'PAID') : []);
      const paidAmount = paidBills.reduce((sum: number, bill: any) => sum + bill.total_amount, 0);

      const revenue = paidAmount - unpaidAmount;

      return {
        'Tower Number': towerNumber,
        'Number of Units Occupied': numUnits,
        'Total Paid Amount': paidAmount,
        'Total Unpaid Amount': unpaidAmount,
        'Revenue': revenue
      };
    });
  }

  private addTotalRow(): void {
    const totalUnits = this.groupedData.reduce((sum, data) => sum + data['Number of Units Occupied'], 0);
    const totalPaidAmount = this.groupedData.reduce((sum, data) => sum + data['Total Paid Amount'], 0);
    const totalUnPaidAmount = this.groupedData.reduce((sum, data) => sum + data['Total Unpaid Amount'], 0);
    const totalRevenue = this.groupedData.reduce((sum, data) => sum + data['Revenue'], 0);

    const totalRow = {
      'Tower Number': 'Total',
      'Number of Units Occupied': totalUnits,
      'Total Paid Amount': totalPaidAmount,
      'Total Unpaid Amount': totalUnPaidAmount,
      'Revenue': totalRevenue
    };

    this.groupedData.push(totalRow);
  }

  private sortGroupedData(): void {
    // Sort the data by tower_number in ascending order
    this.groupedData.sort((a, b) => a['Tower Number'] - b['Tower Number']);
  }



  searchText: any;
  clear(table: Table) {
    table.clear();
    this.searchText = undefined;
  }

  refreshTable() {
    // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Table has been updated!' });
  }

  exportHeaderOverallRevenue = [
    { field: 'Tower Number', header: 'Tower_Number' },
    { field: 'Number of Units Occupied', header: 'NumberOfUnitsOccupied' },
    { field: 'Total Paid Amount', header: 'TotalPaidAmount' },
    { field: 'Total Unpaid Amount', header: 'TotalUnpaidAmount' },
    { field: 'Revenue', header: 'Revenue' },
  ];
  exportHeaderDelinquentUsers = [
    { field: 'Owner', header: 'Owner' },
    { field: 'Unit', header: 'Unit' },
    { field: 'Bill Type', header: 'BillType' },
    { field: 'Due Date', header: 'DueDate' },
    { field: 'Amount', header: 'Amount' },
    { field: 'Delinquent Amount', header: 'DelinquentAmount' },
  ]
  exportHeaderBillBreakdownPerTower = [
    { field: 'Tower', header: 'Tower'},
    { field: 'Water', header: 'Water' },
    { field: 'Association', header: 'Association' },
    { field: 'Parking', header: 'Parking' },
    { field: 'Maintenance', header: 'Maintenance' },
    { field: 'Other Costs', header: 'OtherCosts' },
  ]

  exportToExcel(data: any[], fileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  exportToPDF(data: any[], fileName: string): void {
    const doc = new jsPDF();
    
    const tableData = data;
    const columns = Object.keys(tableData[0]);
    const rows = tableData.map(row => Object.values(row).map(String));

    autoTable(doc, {
      head: [columns],
      body: rows.map(row => row.map(cell => {
        if (typeof cell === 'object') {
          return JSON.stringify(cell);
        }
        return cell;
      })),
    });
    doc.save(`${fileName}.pdf`);
  }

  exportAsCSVDelinquentData(data: any[], fileName: string) {
    const rows: { Unit: any; User: any; 'Bill Type': any; 'Due Date': any; Amount: any; 'Delinquent Amount': any; 'Total Amount': any; }[] = [];
    data.forEach(item => {
      item.delinquent_bills.forEach((bill: { bill_type: any; due_date: any; amount: any; delinquent_amount: any; total_amount: any; }) => {
        rows.push({
          Unit: item.Unit,
          User: item.user_name,
          'Bill Type': bill.bill_type,
          'Due Date': bill.due_date,
          Amount: bill.amount,
          'Delinquent Amount': bill.delinquent_amount,
          'Total Amount': bill.total_amount,
        });
      });
    });
  
    const csv = rows
      .map(row => Object.values(row).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, `${fileName}.csv`);
  }

  exportAsXLSXDelinquentData(data: any[], fileName: string) {
    const rows: any[] = [];
    data.forEach(item => {
      item.delinquent_bills.forEach((bill: { bill_type: any; due_date: any; amount: any; delinquent_amount: any; total_amount: any; }) => {
        rows.push({
          Unit: item.Unit,
          User: item.user_name,
          'Bill Type': bill.bill_type,
          'Due Date': bill.due_date,
          Amount: bill.amount,
          'Delinquent Amount': bill.delinquent_amount,
          'Total Amount': bill.total_amount,
        });
      });
    });
  
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `${fileName}.xlsx`);
  }

  exportAsPDFDelinquentData(data: any[], fileName: string) {
    const doc = new jsPDF();
    const rows: any[][] = [];
    const columns = ['Unit', 'User', 'Bill Type', 'Due Date', 'Amount', 'Delinquent Amount', 'Total Amount'];
  
    data.forEach(item => {
      item.delinquent_bills.forEach((bill: { bill_type: any; due_date: any; amount: any; delinquent_amount: any; total_amount: any; }) => {
        rows.push([
          item.Unit,
          item.user_name,
          bill.bill_type,
          bill.due_date,
          bill.amount,
          bill.delinquent_amount,
          bill.total_amount,
        ]);
      });
    });
  
    autoTable(doc, {
      head: [columns],
      body: rows,
    });
  
    doc.save(`${fileName}.pdf`);
  }
}
