import { Component, OnInit } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';
import { CurrencyPipe } from '@angular/common';
export type topcard = {
  bgcolor: string,
  icon: string,
  title: string,
  subtitle: string
}

@Component({
  selector: 'app-top-cards',
  templateUrl: './top-cards.component.html',
  providers: [CurrencyPipe]
})


export class TopCardsComponent implements OnInit {

  topcards: topcard[] = [
    {
      bgcolor: 'danger',
      icon: 'bi bi-arrow-right',
      title: '5',
      subtitle: 'Pending Receipts'
    },
    {
      bgcolor: 'info',
      icon: 'bi bi-receipt',
      title: '5',
      subtitle: 'Review Receipts'
    },
    {
      bgcolor: 'success',
      icon: 'bi bi-person-fill',
      title: '100',
      subtitle: 'Registered Owners'
    },
    {
      bgcolor: 'info',
      icon: 'bi bi-people-fill',
      title: '100',
      subtitle: 'Registered Tenants'
    },
  ];

  isAdmin: boolean = false;
  isOwnerTenant: boolean = false;
  constructor(private currencyPipe: CurrencyPipe, private checkisadmin: CheckisAdminService, private backendservice: BackendServiceService) {
  }

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.getReportsData();
      } else {
        this.checkisadmin.checkisOwnerTenant().subscribe(isOwnerTenant => {
          this.isOwnerTenant = isOwnerTenant;
          if (this.isOwnerTenant) {
            this.getOwnerData();
          } else {
            // TENANT
            this.getTenantData();
          }
        })
      }
    });
  }

  getTenantData() {
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;
    this.backendservice.getLease(user_id + "TENANT").subscribe({
      next: (response: any) => {
        let lease_agreement_id = response.find((item: any) => item.hasOwnProperty('lease_agreement_id'))
        lease_agreement_id = lease_agreement_id.lease_agreement_id;
        let monthlyRent = response.find((item: any) => item.hasOwnProperty('monthly_rent'))
        monthlyRent = monthlyRent.monthly_rent;
        monthlyRent = this.currencyPipe.transform(monthlyRent, 'PHP');

        this.backendservice.getPayment(lease_agreement_id + "LEASE").subscribe({
          next: (response2: any) => {
            this.topcards[0].title = response2.filter((payment: { status: string; }) => payment.status === 'PENDING').length.toString();
            this.topcards[0].subtitle = 'Pending Bills';
            this.topcards[1].title = response2.filter((payment: { status: string; }) => payment.status === 'REVIEW').length.toString();
            this.topcards[2].title = response2.filter((payment: { status: string; }) => payment.status === 'PAID').length.toString();
            this.topcards[2].subtitle = 'Paid';
            this.topcards[3] = { 
              bgcolor: 'info', 
              icon: 'bi bi-wallet', 
              title: monthlyRent.toString(), 
              subtitle: 'Monthly Rent' };
          }
        });
      }

    });
  }

  getOwnerData() {
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;
    this.backendservice.getUser(user_id).subscribe(
      (response: any) => {
        const allBills: any[] = [];
        response.units.forEach((unit: any) => {
          allBills.push(...unit.bills);
        });
        const pending = allBills.filter((bill: { status: string; }) => bill.status === 'PENDING').length;
        const review = allBills.filter((bill: { status: string; }) => bill.status === 'REVIEW').length;
        const paid = allBills.filter((bill: { status: string; }) => bill.status === 'PAID').length;

        const leases: any[] = [];
        response.lease_agreements.forEach((lease_agreement_id: any) => {
          leases.push(lease_agreement_id);
        });

        this.topcards = [
          {
            bgcolor: 'danger',
            icon: 'bi bi-arrow-right',
            title: pending.toString(),
            subtitle: 'Pending Bills'
          },
          {
            bgcolor: 'info',
            icon: 'bi bi-receipt',
            title: review.toString(),
            subtitle: 'Review Receipts'
          },
          {
            bgcolor: 'success',
            icon: 'bi bi-hand-thumbs-up',
            title: paid.toString(),
            subtitle: 'Paid Bills'
          },
          {
            bgcolor: 'info',
            icon: 'bi bi-person',
            title: leases.length.toString(),
            subtitle: 'Tenants'
          },
        ]
      });
  }

  getReportsData() {
    this.backendservice.getBills().subscribe(
      (data: any) => {
        const pending = data.filter((bill: { status: string; }) => bill.status === 'PENDING').length;
        const review = data.filter((bill: { status: string; }) => bill.status === 'REVIEW').length;

        this.backendservice.getUsers().subscribe(
          (data: any) => {
            const owner = data.filter((user: { user_type: string; }) => user.user_type === 'OWNER').length;
            const tenant = data.filter((user: { user_type: string; }) => user.user_type === 'TENANT').length;

            this.topcards = [
              {
                bgcolor: 'danger',
                icon: 'bi bi-arrow-right',
                title: pending,
                subtitle: 'Pending Receipts'
              },
              {
                bgcolor: 'info',
                icon: 'bi bi-receipt',
                title: review,
                subtitle: 'Review Receipts'
              },
              {
                bgcolor: 'success',
                icon: 'bi bi-person-fill',
                title: owner,
                subtitle: 'Registered Owners'
              },
              {
                bgcolor: 'info',
                icon: 'bi bi-people-fill',
                title: tenant,
                subtitle: 'Registered Tenants'
              },
            ];

          }
        );
      }
    );
  }
}
