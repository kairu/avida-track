import { Component } from '@angular/core';
import { Table } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { MessageService } from 'primeng/api';
import { BackendDataService } from 'src/app/services/backend-data.service';
import { SeverityService } from 'src/app/services/severity.service';
import { AdminModule } from 'src/app/shared-module/admin-module';
import { ClientModule } from 'src/app/shared-module/client-module';
import { firstValueFrom, lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss'],
  imports: [AdminModule, ClientModule]
})
/**
 * Component for managing users in the application.
 * 
 * Fetches all users and units from the backend service.
 * Filters users to remove super admins and unassigned users. 
 * Maps user and unit data into table rows for display.
 * Handles CRUD operations on the table data.
 */

// TODO: Remove balance(maybe). For Tenants, the admin side should not be able to edit the validated column.

export class ManageUsersComponent {

  constructor(public severity: SeverityService, private backendservice: BackendServiceService, private messageService: MessageService, public backenddata: BackendDataService) { }
  datas: any;
  unitDatas: any;
  rows = 10;
  
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
  ngOnInit() {
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

  searchText: any;
  clear(table: Table) {
    table.clear();
    this.searchText = undefined;
  }

  refreshTable() {
    this.loadUsers();
    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Table has been updated!' });
  }

  clonedCellData: any;
  onCellEditInit(rowData: any) {
    this.clonedCellData = { ...rowData };
  }

  onCellEditCancel(rowData: any) {
    this.datas.find((data: { [x: string]: any; }) => data['User ID'] === this.clonedCellData.index)[this.clonedCellData.field] = this.clonedCellData.data;
    delete this.clonedCellData;
  }

  async onCellEditComplete(rowData: any) {
    if (await this.shouldSkipCellEdit(rowData)) {
      return;
    }

    if (rowData.data === "") {
      this.handleEmptyCellData(rowData);
    } else {
      this.processCellEdit(rowData);
    }
  }

  private async shouldSkipCellEdit(rowData: any): Promise<boolean> {
    const isTenant = await firstValueFrom(await this.backendservice.getUser(rowData.index))
    if (isTenant.user_type.toLowerCase() === 'tenant' && rowData.field === 'Validated') {
      return true;
    }
    const editableFields = ['User ID', 'Full Name', 'Balance'];
    return editableFields.includes(rowData.field);
  }

  private handleEmptyCellData(rowData: any): void {
    this.onCellEditCancel(rowData);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter a value' });
  }

  private processCellEdit(rowData: any): void {
    delete this.clonedCellData;

    if (rowData.field === 'Unit') {
      this.processUnitCellEdit(rowData);
    } else {
      this.processUserCellEdit(rowData);
    }
  }

  private processUnitCellEdit(rowData: any): void {
    const unitId = this.datas.find((u: any) => u['Unit'] === rowData.data && u['User ID'] === rowData.index).unit_id;
    const { towerNumber, floor, unit } = this.extractUnitDetails(rowData.data);
    const unitData = this.backenddata.unitData(rowData.index, towerNumber, floor, unit);

    this.backendservice.updateUnit(unitId, unitData).subscribe({
      next: (response: any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
      }
    });
  }

  private extractUnitDetails(unitString: string): { towerNumber: any, floor: any, unit: any } {
    const str = unitString;
    const towerNumber = str.slice(0, str.indexOf(':')).replace('Tower ', '');
    const floorAndUnit = str.slice(str.indexOf(':') + 1).trim();
    const floor = floorAndUnit.split('-')[0];
    const unit = floorAndUnit.split('-')[1];

    return { towerNumber, floor, unit };
  }

  private processUserCellEdit(rowData: any): void {
    const fullName = this.datas.find((u: any) => u['User ID'] === rowData.index)['Full Name'];
    const [last_name, first_name] = fullName.split(', ');
    const user = this.datas.find((u: any) => u['User ID'] === rowData.index);

    const user_type = user['User Type'].code || user['User Type'].toUpperCase();
    const is_validated = user['Validated'].code || user['Validated'] === 'Yes';

    this.backendservice.getUsers().subscribe({
      next: (response: any) => {
        const email = response.find((u: any) => u['user_id'] === rowData.index).email;
        let mobileNumber = '';
        if (rowData.field === 'Mobile Number') {
          mobileNumber = rowData.data.replace(/-/g, '');
        } else {
          mobileNumber = user['Mobile Number']
        }

        const data = this.backenddata.userData(
          first_name,
          last_name,
          mobileNumber,
          email,
          user_type,
          is_validated,
        );

        this.backendservice.updateUser(email, data).subscribe({
          next: (response: any) => {
            this.messageService.add({ severity: 'success', summary: 'Success', detail: response.message });
          }
        });
      }
    });
  }

  preventCellEdit(rowData: any): boolean {
    return rowData['User Type'] != 'Tenant'
  }

}

