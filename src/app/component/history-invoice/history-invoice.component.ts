import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { TagModule } from 'primeng/tag';

@Component({
  standalone: true,
  imports: [TableModule, CommonModule, TagModule],
  selector: 'app-history-invoice',
  templateUrl: './history-invoice.component.html',
  styleUrls: ['./history-invoice.component.scss']
})
export class HistoryInvoiceComponent implements OnInit {
  bills: any[] = [];

  constructor(private backendService: BackendServiceService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.fetchBills();
    
  }

  fetchBills(): void {
    const email = this.backendService.getEmail();
    this.backendService.getUser(email).subscribe({
      next: (user: any) => {
        const userId = user.user_id;
        console.log(userId);

        // Fetch unit details based on the user's user_id
        this.backendService.getUnits().subscribe({
          next: (units: any[]) => {
            // Filter units to find the specific unit for the user
            const filteredUnits = units.filter(
              (unit: any) => unit.user_id === userId
            );

            if (filteredUnits.length > 0) {
              // Get the unitId of the first unit in the filteredUnits array
              const unitId = filteredUnits[0].unit_id;
              console.log(unitId);

              // Fetch bills from the backend
              this.backendService.getBills().subscribe({
                next: (bills: any[]) => {
                  // Filter bills based on whether unit's unit_id matches bill's unit_id
                  this.bills = bills.filter((bill) => bill.unit_id === unitId);
                  this.bills.forEach((bill) => {
                    if (bill.bill_type === 1) {
                      bill.bill_type = 'WATER';
                    } else if (bill.bill_type === 2) {
                      bill.bill_type = 'ASSOCIATION DUES';
                    } else if (bill.bill_type === 3) {
                      bill.bill_type = 'PARKING';
                    } else if (bill.bill_type === 4) {
                      bill.bill_type = 'MAINTENANCE';
                    } else if (bill.bill_type === 5) {
                      bill.bill_type = 'ETC';
                    }
                  });
                },
                error: (error: any) => {
                  console.error('Error fetching bills:', error);
                },
              });
            } else {
              console.error('Unit ID is undefined for the user.');
            }
          },
          error: (error: any) => {
            console.error('Error fetching units:', error);
          },
        });
      },
      error: (error: any) => {
        console.error('Error fetching user:', error);
      },
    });
  }
  
  


  getNextBillingDate(dueDate: string): string {
    const monthNames = [
        "JANUARY", "FEBRUARY", "MARCH", "APRIL",
        "MAY", "JUNE", "JULY", "AUGUST",
        "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
    ];

    // Convert the due date string to a Date object
    const dueDateObj = new Date(dueDate);
    
    // Extract month, day, and year from the due date
    const billingMonthIndex = dueDateObj.getMonth();
    const billingDay = dueDateObj.getDate();
    const billingYear = dueDateObj.getFullYear();

    // Calculate the next billing month and year
    let nextMonthIndex = billingMonthIndex + 1;
    let nextYear = billingYear;

    // If the next month index exceeds December (11),
    // set it to January and advance to the next year
    if (nextMonthIndex > 11) {
        nextMonthIndex = 0;
        nextYear++;
    }

    // Construct the next billing date string
    const nextMonth = monthNames[nextMonthIndex];

    // Return the formatted next billing date string
    return `${nextMonth} ${billingDay}, ${nextYear}`;
}



formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  const monthNames = [
      "January", "February", "March", "April",
      "May", "June", "July", "August",
      "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}


getSeverity(status: string): string {
  switch (status) {
    case 'PAID':
      return 'success'; // Green color for PAID
    case 'PENDING':
      return 'warning'; // Orange color for PENDING
    case 'REVIEW':
      return 'info'; // Blue color for REVIEW
    default:
      return 'default'; // Default color for other statuses
  }
}

}