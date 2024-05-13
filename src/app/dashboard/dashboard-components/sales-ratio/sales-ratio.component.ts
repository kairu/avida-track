import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ApexAxisChartSeries,
  ApexChart,
  ChartComponent,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexXAxis,
  ApexTooltip,
  ApexTheme,
  ApexGrid,
  ApexPlotOptions
} from 'ng-apexcharts';

import { BackendServiceService } from 'src/app/services/backend-service.service';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';

export type salesChartOptions = {
  series: ApexAxisChartSeries | any;
  chart: ApexChart | any;
  xaxis: ApexXAxis | any;
  yaxis: ApexYAxis | any;
  stroke: any;
  theme: ApexTheme | any;
  tooltip: ApexTooltip | any;
  dataLabels: ApexDataLabels | any;
  legend: ApexLegend | any;
  colors: string[] | any;
  markers: any;
  grid: ApexGrid | any;
  plotOptions: ApexPlotOptions | any;
};

@Component({
  selector: 'app-sales-ratio',
  templateUrl: './sales-ratio.component.html'
})
export class SalesRatioComponent implements OnInit {

  @ViewChild("chart") chart: ChartComponent = Object.create(null);
  public salesChartOptions: Partial<salesChartOptions> = {
    series: [
      {
        name: "Owner",
        data: [20, 40, 50, 30, 40],
      },
      {
        name: "Tenants",
        data: [10, 20, 40, 60, 20],
      },
    ],
    chart: {
      fontFamily: 'Rubik,sans-serif',
      height: 265,
      type: 'bar',
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
  constructor(private checkisadmin: CheckisAdminService, private backendservice: BackendServiceService) {
  }

  isAdmin: boolean = false;

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.generateChart();
      }
    });
  }
  
  generateChart(){
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

        const series = [
          {
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
          },
        ];
        this.salesChartOptions.series = series;
      }
    );

  }
}
