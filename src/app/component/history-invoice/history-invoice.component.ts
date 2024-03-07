import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { BackendServiceService } from 'src/app/services/backend-service.service';

@Component({
  selector: 'app-history-invoice',
  templateUrl: './history-invoice.component.html',
  styleUrls: ['./history-invoice.component.scss']
})
export class HistoryInvoiceComponent implements OnInit {
  bills: any[] = [];

  constructor(private backendService: BackendServiceService) { }

  // ngOnInit(): void {
  //   this.getEmail().subscribe((email: string | null) => {
  //     if (email) {
  //       this.fetchBills(email);
  //     } else {
  //       console.error("Email is null or undefined.");
  //       // Handle the case where email is null or undefined
  //     }
  //   });
  // }

  // getEmail(): Observable<string | null> {
  //   return new Observable((observer) => {
  //     const email = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}').email;
  //     observer.next(email);
  //     observer.complete();
  //   });
  // }

  // fetchBills(email: string): void {
  //   this.backendService.getUser(email).subscribe({
  //     next: (user: any) => {
  //       const userId = user.user_id;
  
  //       this.backendService.getBills().subscribe({
  //         next: (bills: any[]) => {
  //           this.bills = bills.filter((bill) => bill.user_id === userId);
  //         },
  //         error: (error: any) => {
  //           console.error('Error fetching bills:', error);
  //         }
  //       });
  //     },
  //     error: (error: any) => {
  //       console.error('Error fetching user:', error);
  //     }
  //   });
  // }

  ngOnInit(): void {
    this.fetchBills();
  }

  fetchBills(): void {
    const email = this.backendService.getEmail();
  
    this.backendService.getUser(email).subscribe({
      next: (user: any) => {
        // Assuming user object contains 'user_id'
        const userId = user.user_id;
  
        // Fetch unit details based on the user's user_id
        this.backendService.getUnits().subscribe({
          next: (units: any[]) => {
            // Filter units to find the specific unit for the user
            const filteredUnits = units.filter((unit: any) => unit.user_id === userId);
  
            if (filteredUnits.length > 0) {
              // Get the unitId of the first unit in the filteredUnits array
              const unitId = filteredUnits[0].unit_id;
              console.log(unitId);
  
              // Fetch bills from the backend
              this.backendService.getBills().subscribe({
                next: (bills: any[]) => {
                  // Filter bills based on whether unit's unit_id matches bill's unit_id
                  this.bills = bills.filter((bill) => bill.unit_id === unitId);
                  console.log(this.bills);
                },
                error: (error: any) => {
                  console.error('Error fetching bills:', error);
                }
              });
            } else {
              console.error('Unit ID is undefined for the user.');
            }
          },
          error: (error: any) => {
            console.error('Error fetching units:', error);
          }
        });
      },
      error: (error: any) => {
        console.error('Error fetching user:', error);
      }
    });
  }
  
  

  getNextBillingDate(month: string, currentYear: number): string {
    const currentMonth = new Date().getMonth() + 1;
    let nextMonth = parseInt(month) + 1;
    let nextYear = currentYear;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear++;
    }

    return `${nextMonth}/${nextYear}`;
  }
}
