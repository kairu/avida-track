import { Component, OnInit } from '@angular/core';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';
export type topcard = {
  bgcolor: string,
  icon: string,
  title: string,
  subtitle: string
}
@Component({
  selector: 'app-top-cards',
  templateUrl: './top-cards.component.html'
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
  constructor(private checkisadmin: CheckisAdminService, private backendservice: BackendServiceService) {
  }

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.getReportsData();
      }
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
