import { Component, NgModule } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { DecimalFormatPipe } from 'src/app/pipe/decimal-format.pipe';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [TableModule, TagModule, CommonModule, KeysPipe, DecimalFormatPipe],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})

export class AnalyticsComponent {
  billDatas: any;
  datas: any;
  groupedData: any[] = [];
  monthlyRevenues: any[] = [];
  constructor(private backendservice: BackendServiceService) { }
  
  ngOnInit() {
    this.backendservice.getUnits().subscribe({
      next: (response: any) => {
        this.datas = response;
        this.backendservice.getBills().subscribe({
          next: (response: any) => {
            this.billDatas = response;
            this.groupData();
            this.calculateMonthlyRevenue();
          }
        });
      }
    });
  }

  calculateMonthlyRevenue(): void {
    const currentDate = new Date();
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(currentDate.getMonth() - 1);

    const groupedMap = this.groupDataByTowerNumber();

    this.billDatas.forEach((bill: any) => {
      const dueDate = new Date(bill.due_date);

      if (
        dueDate.getMonth() === previousMonth.getMonth() &&
        dueDate.getFullYear() === previousMonth.getFullYear()
      ) {
        const unitId = bill.unit_id;
        for (const [towerNumber, units] of groupedMap.entries()) {
          const matchingUnit = units.find((unit: any) => unit.unit_id === unitId);
          if (matchingUnit) {
            const monthlyRevenue = matchingUnit.monthlyRevenue || 0;
            matchingUnit.monthlyRevenue = monthlyRevenue + (bill.status === 'PAID' ? bill.total_amount : 0);
            matchingUnit.totalPaidAmount = (matchingUnit.totalPaidAmount || 0) + (bill.status === 'PAID' ? bill.total_amount : 0);
            matchingUnit.totalUnpaidAmount = (matchingUnit.totalUnpaidAmount || 0) + (bill.status === 'REVIEW' || bill.status === 'PENDING' ? bill.total_amount : 0);
            break; // No need to continue searching other towers
          }
        }
      }
    });

    this.monthlyRevenues = Array.from(groupedMap.entries()).map(([towerNumber, group]) => {
      const monthlyRevenue = group.reduce((sum: number, unit: any) => sum + (unit.monthlyRevenue || 0), 0);
      const totalPaidAmount = group.reduce((sum: number, unit: any) => sum + (unit.totalPaidAmount || 0), 0);
      const totalUnpaidAmount = group.reduce((sum: number, unit: any) => sum + (unit.totalUnpaidAmount || 0), 0);

      return {
        'Tower Number': towerNumber,
        'Total Paid Amount': totalPaidAmount,
        'Total Unpaid Amount': totalUnpaidAmount,
        'Monthly Revenue': monthlyRevenue
        
      };
    });

    // Add a new row for the total
    const totalMonthlyRevenue = this.monthlyRevenues.reduce((sum, data) => sum + data['Monthly Revenue'], 0);
    const totalPaidAmount = this.monthlyRevenues.reduce((sum, data) => sum + data['Total Paid Amount'], 0);
    const totalUnPaidAmount = this.monthlyRevenues.reduce((sum, data) => sum + data['Total Unpaid Amount'], 0);

    const totalRow = {
      'Tower Number': 'Total',
      'Total Paid Amount': totalPaidAmount,
      'Total Unpaid Amount': totalUnPaidAmount,
      'Monthly Revenue': totalMonthlyRevenue
      
    };

    this.monthlyRevenues.push(totalRow);

    // Sort monthlyRevenues by tower number in ascending order
    this.monthlyRevenues.sort((a, b) => a['Tower Number'] - b['Tower Number']);
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

    this.datas.forEach((data: { tower_number: any; }) => {
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
}
