import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { combineLatest, forkJoin, map, of, switchMap } from 'rxjs';
import { TimeFormatPipe } from 'src/app/pipe/time-format.pipe';
import { SeverityService } from 'src/app/services/severity.service';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';
import { ImageModule } from 'primeng/image';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
  selector: 'app-top-selling',
  standalone: true,
  imports: [ImageModule, TimeFormatPipe, CommonModule, AdminModule],
  templateUrl: './top-selling.component.html'
})
export class TopSellingComponent implements OnInit {

  datas: any;
  isAdmin: boolean = false;
  isOwnerTenant: boolean = false;
  constructor(private sanitizer: DomSanitizer, private checkisadmin: CheckisAdminService, public severity: SeverityService, private backendService: BackendServiceService) { }

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.getReportsData();
      } else {
        this.checkisadmin.checkisOwnerTenant().subscribe(isOwnerTenant => {
          this.isOwnerTenant = isOwnerTenant;
          if (this.isOwnerTenant) {
            this.getTenantsData();
          } else {
            this.getTenantPaymentHistory();
          }
        });

      }
    });
  }

  getTenantPaymentHistory() {
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;
    this.backendService.getLease(user_id + "TENANT").subscribe({
      next: (response: any) => {
        let lease_agreement_id = response.find((item: any) => item.hasOwnProperty('lease_agreement_id'))
        lease_agreement_id = lease_agreement_id.lease_agreement_id;
        this.backendService.getPayment(lease_agreement_id + "LEASE").subscribe({
          next: (response2: any) => {
            this.datas = [
              ...response2.map((item: { amount: any; image_path: any; payment_date: any; reference_number: any; status: any; }) => ({
                'Image': item.image_path,
                'Payment Date': item.payment_date,
                'Amount': item.amount,
                'Status': item.status
              }))
            ]
            
            this.serve_image();
          }
        });

      }
    });
  }

  serve_image() {
    this.datas.forEach((item: { Image: any; }) => {
      if (item.Image === null) return
      this.backendService.getPaymentImage(item.Image).subscribe({
        next: (response: any) => {
          item.Image = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(response));
        }
      });
    });
  }

  getTenantsData() {
    const userData = sessionStorage.getItem('backendUserData');
    const user_id = JSON.parse(userData || '{}').user_id;
    this.backendService.getUser(user_id).subscribe({
      next: (response: any) => {
        const tenantInfos$ = response.lease_agreements.map((agreement: any) => {
          const tenant = agreement.tenant_info;
          const unit_id = agreement.unit_id;
          return this.backendService.getUnit(unit_id).pipe(
            map((unit: any) => {
              return {
                'Full Name': `${tenant.last_name}, ${tenant.first_name}`,
                'Unit': `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`,
                'Email': tenant.email,
                'Phone Number': tenant.mobile_number,
                'Remaining Balance': agreement.remaining_balance,
              };
            })
          );
        });

        // Use forkJoin to wait for all observables to complete
        forkJoin(tenantInfos$).subscribe(
          tenantInfos => {
            this.datas = tenantInfos;
          },
        );
      }
    });
  }

  getReportsData() {
    this.backendService.getCMS().pipe(
      switchMap(response => {
        return of(
          response.filter((data: {
            date_to_end: null;
            date_to_post: null; cms_type: string;
          }) => {
            let type = data.cms_type.toLowerCase();
            return (
              type === 'feedback' ||
              type === 'complaint' ||
              (type === 'maintenance' &&
                (data.date_to_post == null ||
                  data.date_to_post == '' ||
                  data.date_to_post == undefined) &&
                (data.date_to_end == null ||
                  data.date_to_end == '' ||
                  data.date_to_end == undefined))
            );
          })
        );
      }),
      switchMap(filteredData => {
        return of(
          filteredData.reverse(),
          filteredData.map((data: { [x: string]: any; date_to_post: any; date_to_end: any; cms_id: any; archive: any; }) => {
            const { date_to_post, date_to_end, cms_id, archive, ...rest } = data;
            return rest;
          })
        );
      }),
      switchMap(mappedData => {
        return combineLatest([
          of(mappedData),
          this.backendService.getUsers(),
          this.backendService.getUnits()
        ]);
      }),
      map(([datas, users, units]) => {
        return datas.map((data: { user_id: any; title: any; description: any; cms_type: any; date_posted: any; time_posted: any; }) => {
          const user = users.find((u: { user_id: any; }) => u.user_id === data.user_id);
          const unit = units.find((u: { user_id: any; }) => u.user_id === data.user_id);

          return {
            'Full Name': `${user.last_name}, ${user.first_name}`,
            'Unit': `Tower ${unit.tower_number}: ${unit.floor_number} - ${unit.unit_number}`,
            'Title': data.title,
            'Description': data.description,
            'Type': data.cms_type,
            'Date Posted': data.date_posted + " " + data.time_posted,
            // 'Time Posted': data.time_posted,
          };
        });
      })
    ).subscribe(datas => {
      this.datas = datas.sort((a: { [x: string]: string | number | Date; }, b: { [x: string]: string | number | Date; }) => new Date(b['Date Posted']).getTime() - new Date(a['Date Posted']).getTime());
      this.datas = datas.slice(0, 4).sort((a: { [x: string]: string | number | Date; }, b: { [x: string]: string | number | Date; }) => new Date(b['Date Posted']).getTime() - new Date(a['Date Posted']).getTime());
    });
  }

}
