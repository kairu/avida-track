import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageUsersComponent } from './manage-users.component';

describe('ManageUsersComponent', () => {
  let component: ManageUsersComponent;
  let fixture: ComponentFixture<ManageUsersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ManageUsersComponent]
    });
    fixture = TestBed.createComponent(ManageUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Custom
describe('ManageUsersComponent', () => {

  it('should capitalize first letter', () => {
    component.capitalizeFirstLetter('guest');
    expect(component.capitalizeFirstLetter('guest')).toBe('Guest');
  });

  it('should get severity based on status', () => {
    expect(component.getSeverity('Admin')).toBe('primary');
    expect(component.getSeverity('Owner')).toBe('success');
    expect(component.getSeverity('Tenant')).toBe('success');
    expect(component.getSeverity('Yes')).toBe('success');
    expect(component.getSeverity('Guest')).toBe('danger');
    expect(component.getSeverity('No')).toBe('danger');
    expect(component.getSeverity('Invalid')).toBe('danger');
  });

  it('should handle cell edit cancel', () => {
    component.clonedCellData = {
      index: 1,
      field: 'Mobile Number',
      data: 1234567890
    };
    component.onCellEditCancel({
      index: 1,
      field: 'Mobile Number',
      data: 9876543210
    });
    expect(component.datas[0]['Mobile Number']).toBe(1234567890);
    expect(component.clonedCellData).toBeUndefined();
  });

  it('should handle invalid cell edit complete', () => {
    spyOn(component.messageService, 'add');
    component.onCellEditComplete({
      index: 1,
      field: 'Mobile Number',
      data: ''
    });
    expect(component.messageService.add).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a value'
    });
  });

});
