import { Component, NgModule, ViewChild } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { DecimalFormatPipe } from 'src/app/pipe/decimal-format.pipe';
import { ChartModule } from 'primeng/chart';
import { of, switchMap } from 'rxjs';
import * as ApexCharts from 'apexcharts';


@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [ChartModule, TableModule, TagModule, CommonModule, KeysPipe, DecimalFormatPipe],
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
    this.backendservice.getUnits().pipe(
      switchMap((response: any) => {
        this.datas = response;
        return this.backendservice.getBills();
      }),
      switchMap((response: any) => {
        this.billDatas = response;
        this.groupData();
        this.calculateMonthlyRevenue();
        return of(null); // Return a dummy observable to complete the chain
      })
    ).subscribe();

    this.generateChart();
    this.billsDistribution();
  }

  billsDistribution() {
    this.backendservice.getBills().subscribe({
      next: (data: any) => {
        let collectedBills = 0;
        let pendingBills = 0;

        for (const item of data) {
          if (item.status === 'REVIEW' || item.status === 'PAID') {
            collectedBills++;
          } else if (item.status === 'PENDING') {
            pendingBills++;
          }
        }
        let efficiencyRate = (collectedBills / (collectedBills + pendingBills)) * 100;
        const unPaid = 100 - efficiencyRate;

        const options = {
          series: [efficiencyRate, unPaid],
          chart: {
            width: 380,
            type: 'donut',
          },
          labels: ['Collected', 'Pending'],
          responsive: [{
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: 'bottom'
              }
            }
          }],
          legend: {
            position: 'bottom'
          }
        };
        const chart = new ApexCharts(document.querySelector("#collectionRate"), options);
        chart.render();
      },
    });
  }

  generateChart() {
    this.backendservice.getUsers().subscribe(
      (data: any) => {
        const ownersByTower = data
          .filter((user: any) => user.user_type === "OWNER") // Filter out only owners
          .reduce((acc: { [x: string]: number; }, curr: any) => {
            // Iterate through each unit of the owner
            curr.units.forEach((unit: any) => {
              const towerNumber = unit.tower_number.toString(); // Convert tower number to string
              acc[towerNumber] = acc[towerNumber] ? acc[towerNumber] + 1 : 1; // Increment count for tower number
            });
            return acc;
          }, {});

        const tenantsByTower = data
          .filter((user: any) => user.user_type === "TENANT") // Filter out only tenants
          .reduce((acc: { [x: string]: number; }, curr: any) => {
            // Iterate through each unit of the tenant
            curr.units.forEach((unit: any) => {
              const towerNumber = unit.tower_number.toString(); // Convert tower number to string
              acc[towerNumber] = acc[towerNumber] ? acc[towerNumber] + 1 : 1; // Increment count for tower number
            });
            return acc;
          }, {});

        const options = {
          series:[{
            name: "Owner",
            data: [
              ownersByTower["1"] || 0,
              ownersByTower["2"] || 0,
              ownersByTower["3"] || 0,
              ownersByTower["4"] || 0,
              ownersByTower["5"] || 0
            ]
          },
          {
            name: "Tenants",
            data: [
              tenantsByTower["1"] || 0,
              tenantsByTower["2"] || 0,
              tenantsByTower["3"] || 0,
              tenantsByTower["4"] || 0,
              tenantsByTower["5"] || 0
            ]

          }],
          chart: {
            fontFamily: 'Rubik,sans-serif',
            type: 'bar',
            height: 350,
            toolbar: {
              show: false
            },
            stacked: false,
          },
          dataLabels: {
            enabled: false
          },
          legend: {
            show: true,
          },
          plotOptions: {
            bar: {
              columnWidth: '50%',
              barHeight: '70%',
              borderRadius: 3,
            },
          },
          colors: ["#0d6efd", "#009efb", "#6771dc"],
          stroke: {
            show: true,
            width: 4,
            colors: ["transparent"],
          },
          grid: {
            strokeDashArray: 3,
          },
          markers: {
            size: 3
          },
          xaxis: {
            categories: [
              "Tower 1",
              "Tower 2",
              "Tower 3",
              "Tower 4",
              "Tower 5"
            ],
          },
          tooltip: {
            theme: 'dark'
          }
        };
        const chart = new ApexCharts(document.querySelector("#chart"), options);
        chart.render();
      }
    );

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
    this.createChartForMonthlyRevenue();
  }

  createChartForMonthlyRevenue(): void {
    const chartData = this.monthlyRevenues.map(data => ({
      name: data['Tower Number'],
      value: data['Monthly Revenue']
    }));

    const options = {
      title: {
        text: 'Monthly Revenue'
      },
      series: [
        {
          name: 'Revenue',
          data: chartData
        }
      ],
      chart: {
        type: 'area',
        height: 350
      },
      xaxis: {
        type: 'category'
      }
    };

    const areaChart =new ApexCharts(document.querySelector("#MonthlyChart"), options);
    areaChart.render();

  }
  

  groupData(): void {
    const groupedMap = this.groupDataByTowerNumber();
    this.mergeBillsIntoGroupedData(groupedMap);
    this.calculateAdditionalMetrics(groupedMap);
    this.addTotalRow();
    this.sortGroupedData();
    this.createChartForGroupedData();
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

  private createChartForGroupedData(){
    const options = {
      series: [
        {
          name: 'Revenue',
          data: this.groupedData.map(data => data['Revenue'])
        }
      ],
      chart: {
        type: 'area',
        height: 350
      },
      xaxis: {
        categories: this.groupedData.map(data => data['Tower Number'].toString())
      }
    };

    const areaChart =new ApexCharts(document.querySelector("#OverallChart"), options);
    areaChart.render();
  }

}
