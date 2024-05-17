import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { TimeFormatPipe } from 'src/app/pipe/time-format.pipe';
import { SeverityService } from 'src/app/services/severity.service';
import { CheckisAdminService } from 'src/app/services/checkis-admin.service';
@Component({
  selector: 'app-top-selling',
  standalone: true,
  imports: [TimeFormatPipe, CommonModule, AdminModule],
  templateUrl: './top-selling.component.html'
})
export class TopSellingComponent implements OnInit {

  datas: any;
  isAdmin: boolean = false;

  constructor(private checkisadmin: CheckisAdminService, public severity: SeverityService, private backendService: BackendServiceService) { }

  ngOnInit() {
    this.checkisadmin.checkisAdmin().subscribe(isAdmin => {
      this.isAdmin = isAdmin;
      if (this.isAdmin) {
        this.getReportsData();
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
