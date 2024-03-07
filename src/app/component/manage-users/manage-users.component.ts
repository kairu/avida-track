import { Component, ViewChild } from '@angular/core';
import { Table, TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { CommonModule } from '@angular/common';
import { KeysPipe } from 'src/app/pipe/keys.pipe';
import { FormsModule } from '@angular/forms';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { BackendDataService } from 'src/app/services/backend-data.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  imports: [DropdownModule, TagModule, InputTextModule, ButtonModule, PaginatorModule, FormsModule, TableModule, CommonModule, KeysPipe]
})
/**
 * Component for managing users in the application.
 * 
 * Fetches all users and units from the backend service.
 * Filters users to remove super admins and unassigned users. 
 * Maps user and unit data into table rows for display.
 * Handles CRUD operations on the table data.
 */

export class ManageUsersComponent {

  constructor(private backendservice: BackendServiceService, private messageService: MessageService, private backenddata: BackendDataService) { }
  datas: any;
  unitDatas: any;
  rows = 10;
  validationOption = [
    { name: 'Yes', code: true },
    { name: 'No', code: false }
  ];
  userTypeOptions = [
    { name: 'Admin', code: 'ADMIN' },
    { name: 'Owner', code: 'OWNER' },
    { name: 'Tenant', code: 'TENANT' },
    { name: 'Guest', code: 'GUEST' }
  ];



  /*
  *********************************************************
  getUsers() Returns the following objects:
    user_id
    first_name
    last_name
    email
    mobile_number
    user_type
    is_active
    is_validated
  *********************************************************
  getUnits() Returns the following objects:
    unit_id
    user_id
    tower_number
    floor_number
    unit_number
    sq_foot
    number_of_bedrooms
    number_of_bathrooms
    parking_slot
    remaining_balance
  */
  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {

    // Get all users
    this.backendservice.getUsers().subscribe({
      next: (usersResponse: any) => {

        // Get all units
        this.backendservice.getUnits().subscribe({
          next: (unitsResponse: any) => {

            // Filter users to remove super admins  
            const users = usersResponse
              .filter((user: {
                user_id: any;
                user_type: string;
              }) => {
                let type = user.user_type.toLowerCase();
                return type !== 'super_admin';
              })
              // Map user and unit data into table rows
              .flatMap((user: {
                user_id: any;
                is_validated: boolean;
                user_type: string;
                first_name: string;
                last_name: string;
                email: string;
                mobile_number: number;
              }) => {
                const userUnits = unitsResponse.filter((unit: { user_id: any }) => unit.user_id === user.user_id);
                return userUnits.map((unit: { unit_id: any; tower_number: any; floor_number: any; unit_number: any; remaining_balance: any; }) => ({
                  unit_id: unit.unit_id,
                  'User ID': user.user_id,
                  'Full Name': `${user.last_name}, ${user.first_name}`,
                  'Mobile Number': user.mobile_number,
                  'Unit': `Tower ${unit.tower_number}: ${unit.floor_number}-${unit.unit_number}`,
                  'Balance': unit.remaining_balance,
                  'User Type': this.capitalizeFirstLetter(user.user_type),
                  'Validated': user.is_validated ? 'Yes' : 'No',
                }));
              });

            // Save mapped user and unit data
            this.datas = users;
          }
        });
      }
    });

  }


  capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  clear(table: Table) {
    table.clear();
  }

  getSeverity(status: string) {
    switch (status) {
      case 'Admin':
        return 'primary';
      case 'Owner':
      case 'Tenant':
      case 'Yes':
        return 'success';
      case 'Guest':
      case 'No':
      default:
        return 'danger';
    }
  }
  clonedCellData: any;

  onCellEditInit(rowData: any) {
    this.clonedCellData = { ...rowData };
  }

  onCellEditCancel(rowData: any) {
    this.datas.find((data: { [x: string]: any; }) => data['User ID'] === this.clonedCellData.index)[this.clonedCellData.field] = this.clonedCellData.data;
    delete this.clonedCellData;
  }


  onCellEditComplete(rowData: any) {
    if (rowData.field == 'User ID' || rowData.field == 'Full Name' || rowData.field == 'Balance') { return }
    if (rowData.data == "") {
      this.onCellEditCancel(rowData);
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter a value' });
    } else {
      delete this.clonedCellData;
      // Save the edited cell onto the backend
      if (rowData.field == 'Unit') {
        const str = rowData.data;
        const towerNumber = str.slice(0, str.indexOf(':')).replace('Tower ', '');
        const floorAndUnit = str.slice(str.indexOf(':') + 1).trim();
        const floor = floorAndUnit.split('-')[0];
        const unit = floorAndUnit.split('-')[1];
        const unitId = this.datas.find((u: { [x: string]: any; }) => u['Unit'] === rowData.data && u['User ID'] === rowData.index).unit_id;
        const unitData = this.backenddata.unitData(rowData.index, towerNumber, floor, unit);
        this.backendservice.updateUnit(unitId, unitData).subscribe({
          next: (response: any) => {
            this.loadUsers();
            this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
          }
        });
      } else {
        // update user
        const fullName = this.datas.find((u: { [x: string]: any; }) => u['User ID'] === rowData.index)['Full Name'];
        const [last_name, first_name] = fullName.split(', ');
        let user_type: any;
        let is_validated: any;
        const user = this.datas.find((u: { [x: string]: any; }) => u['User ID'] === rowData.index);
       
        user_type = user['User Type'].code || user['User Type'].toUpperCase();
        is_validated = user['Validated'].code || user['Validated'] === 'Yes';

        // Get email via rowData.index
        this.backendservice.getUsers().subscribe({
          next: (response: any) => {
            const email = response.find((u: { [x: string]: any; }) => u['user_id'] === rowData.index).email;
            const data = this.backenddata.userData(
              first_name,
              last_name,
              rowData.field == 'Mobile Number' ? rowData.data : this.datas.find((u: { [x: string]: any; }) => u['User ID'] === rowData.index)['Mobile Number'],
              email,
              user_type,
              is_validated,
            );
            this.backendservice.updateUser(email, data).subscribe({
              next: (response: any) => {
                this.loadUsers();
                this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
              }
            });
          }
        });
      }

    }

  }
}

