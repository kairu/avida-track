import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent } from "ng-apexcharts";
import { NgApexchartsModule } from "ng-apexcharts";
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexFill,
  ApexDataLabels,
  ApexLegend,
  ApexMarkers
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries | any;
  chart: ApexChart | any;
  responsive: ApexResponsive[] | any;
  labels: any;
  fill: ApexFill | any;
  legend: ApexLegend | any;
  dataLabels: ApexDataLabels | any;
  markers: ApexMarkers | any;
};

import { BackendServiceService } from 'src/app/services/backend-service.service';
import { ButtonModule } from 'primeng/button';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';

@Component({
  selector: 'app-feeds',
  standalone: true,
  imports: [CommonModule, ButtonModule, NgApexchartsModule],
  templateUrl: './feeds.component.html'
})
export class FeedsComponent implements OnInit {
  @ViewChild("chart") chart!: ChartComponent;
  public chartOptions: Partial<ChartOptions> = {
    // series: [],
    chart: {
      width: 400,
      type: "donut"
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200,
        },
        legend: {
          position: "bottom"
        }
      }
    }],
    // labels: [],
    fill: {
      type: "gradient"
    },
    legend: {},
    dataLabels: { enabled: true },
  };
  constructor(private checkisadmin: CheckisAdminService, private backendservice: BackendServiceService) { }
  isAdmin: boolean = false;
  isOwnerTenant: boolean = false;
  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.billsDistribution();
      } else {
        this.checkisadmin.checkisOwnerTenant().subscribe(isOwnerTenant => {
          this.isOwnerTenant = isOwnerTenant;
          if (this.isOwnerTenant) {
            this.collectedRent();
          } else {

          }
        });
      }
    });
  }

  collectedRent() {
    let totalBalance = 0;
    let paymentBalance = 0;
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;
    this.backendservice.getUser(user_id).subscribe(
      (response: any) => {
        response.lease_agreements.forEach((agreement: {
          remaining_balance: number; payments: any[];
        }) => {
          totalBalance += agreement.remaining_balance;

          agreement.payments.forEach(payment => {
            if (payment.status === "REVIEW" || payment.status === "PAID") {
              paymentBalance += payment.amount;
            }
          });
        });

        const chartOptions = {
          series: [paymentBalance, totalBalance - paymentBalance],
          chart: {
            type: 'donut',
          },
          plotOptions: {
            pie: {
              startAngle: -90,
              endAngle: 90,
              offsetY: 10,
            }
          },
          labels: ['Collected', 'Outstanding Balance'],
          dataLabels: {
            enabled: true
          },
          responsive: [{
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                position: "bottom"
              }
            }
          }],
          legend: {
            position: 'bottom'
          }
        };

        var chart = new ApexCharts(document.querySelector("#chartO"), chartOptions);
        chart.render();
      });
  }

  efficiencyRate() {
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
        this.chartOptions.series = [efficiencyRate, unPaid];
        this.chartOptions.labels = ['Collected', 'Pending'];
      },
    });
  }

  billsDistribution() {
    this.backendservice.getBills().subscribe(
      (data: any) => {
        let reviewCount = 0;
        let paidCount = 0;
        let pendingCount = 0;
        for (const item of data) {
          if (item.status === 'REVIEW') {
            reviewCount++;
          } else if (item.status === 'PAID') {
            paidCount++;
          } else if (item.status === 'PENDING') {
            pendingCount++;
          }
        }
        let chartData = [reviewCount, paidCount, pendingCount];
        this.chartOptions.labels = ['Review', 'Paid', 'Pending'];
        this.chartOptions.series = chartData;
      },
    );
  }

}
