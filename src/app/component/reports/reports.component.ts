import { Component } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { CommonModule } from '@angular/common';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { TimeFormatPipe } from 'src/app/pipe/time-format.pipe';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { combineLatest, map, of, switchMap } from 'rxjs';
@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [InputTextModule, ButtonModule, TimeFormatPipe, KeysPipe, CommonModule, TableModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent {
  datas: any;
  rows = 10;

  constructor(private backendService: BackendServiceService) { }

  ngOnInit() {
    this.getReportsData();
  }

  clear(table: Table) {
    table.clear();
  }

  refreshTable() {
    this.getReportsData();
    // this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Table has been updated!' });
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
            'Date Posted': data.date_posted,
            'Time Posted': data.time_posted,
          };
        });
      })
    ).subscribe(datas => {
      this.datas = datas;
    });
  }


}
