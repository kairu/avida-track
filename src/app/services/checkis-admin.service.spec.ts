import { TestBed } from '@angular/core/testing';

import { CheckisAdminService } from './checkis-admin.service';

describe('CheckisAdminService', () => {
  let service: CheckisAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckisAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
