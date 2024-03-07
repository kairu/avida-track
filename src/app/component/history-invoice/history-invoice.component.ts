import { Component, OnInit } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';

@Component({
  selector: 'app-history-invoice',
  templateUrl: './history-invoice.component.html',
  styleUrls: ['./history-invoice.component.scss']
})
export class HistoryInvoiceComponent implements OnInit {
  bills: any[] = [];

  constructor(private backendService: BackendServiceService) { }

  ngOnInit(): void {
    this.fetchBills();
  }

  fetchBills(): void {
    this.backendService.getBills().subscribe({
      next: (bills: any[]) => {
        this.bills = bills;
      },
      error: (error: any) => {
        console.error('Error fetching bills:', error);
      }
    });
  }

  getNextBillingDate(month: string, currentYear: number): string {
    const currentMonth = new Date().getMonth() + 1; // Adding 1 because getMonth() returns 0-indexed month
    let nextMonth = parseInt(month) + 1;
    let nextYear = currentYear;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    return `${nextMonth}/${nextYear}`;
  }
}
