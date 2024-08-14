import { Component, OnInit, NgZone } from '@angular/core';
import { BackendServiceService } from '../services/backend-service.service';
import { Router } from '@angular/router';
import { ClientModule } from '../shared-module/client-module';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormArray, FormBuilder, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Location } from '@angular/common';
import { BackendDataService } from '../services/backend-data.service';
import { Observable, of, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  standalone: true,
  imports: [ClientModule, ReactiveFormsModule]
})
export class UserFormComponent implements OnInit {
  registerForm!: FormGroup;

  userTypeOptions = [
    { label: 'Owner', value: 'Owner' },
    { label: 'Tenant', value: 'Tenant' },
    // { label: 'Guest', value: 'Guest' },
  ];

  towerOptions = Array.from({ length: 5 }, (_, i) => ({ label: `Tower ${i + 1}`, value: i + 1 }));
  floors = Array.from({ length: 19 }, (_, i) => ({ label: (i + 2).toString(), value: i + 2 }));
  units = Array.from({ length: 10 }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 }));

  showUnitButton = false;
  isTenant = false;
  private cachedUnits: any[] = [];

  constructor(
    private ngZone: NgZone,
    private backendService: BackendServiceService,
    private router: Router,
    private fb: FormBuilder,
    private location: Location,
    private backendData: BackendDataService
  ) { }

  ngOnInit() {
    this.checkExistingAccount();
    this.initForm();
    this.fetchAndCacheUnits().subscribe();
  }

  private initForm() {
    this.registerForm = this.fb.group({
      first_name: ['', [
        Validators.required,
        Validators.pattern('^[a-zA-Z]+$'),
        Validators.minLength(3)
      ]
      ],
      last_name: ['', [
        Validators.required, 
        Validators.pattern('^[a-zA-Z]+$'),
        Validators.minLength(3)
      ]
      ],
      mobile_number: ['', [
        Validators.required,
        Validators.pattern('^09\\d{2}-\\d{3}-\\d{4}$')
      ]
      ],
      userType: ['', Validators.required],
      unit_address: this.fb.array([this.createUnitAddress()], { validators: this.uniqueUnitValidator() })
    });
  }

  backClick() {
    this.location.back();
  }

  checkExistingAccount() {
    const storedUser = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
    this.backendService.getUser(storedUser.email).pipe(
      switchMap((response: any) => {
        if (response.hasOwnProperty('email')) {
          return this.ngZone.run(() => this.router.navigate(['dashboard']));
        } else if (Object.keys(storedUser).length === 0) {
          return this.router.navigate(['/']);
        }
        return of(null);
      })
    ).subscribe();
  }

  private fetchAndCacheUnits(): Observable<any[]> {
    return this.cachedUnits.length ? of(this.cachedUnits) : this.backendService.getUnits().pipe(
      tap((units: any[]) => this.cachedUnits = units)
    );
  }

  onUserTypeClick(event: any) {
    this.showUnitButton = event.option.value === 'Owner';
    this.isTenant = !this.showUnitButton;
    if (this.isTenant) {
      this.registerForm.setControl('unit_address', this.fb.array([this.createUnitAddress()], { validators: this.uniqueUnitValidator() }));
    }
  }

  createUnitAddress(): FormGroup {
    const group = this.fb.group({
      tower_number: [, Validators.required],
      floor_number: [, Validators.required],
      unit_number: [, Validators.required]
    });
    group.valueChanges.subscribe(() => this.registerForm.get('unit_address')?.updateValueAndValidity());
    return group;
  }

  addUnitClick(): void {
    (this.registerForm.get('unit_address') as FormArray).push(this.createUnitAddress());
  }

  get unitAddress() {
    return (this.registerForm.get('unit_address') as FormArray).controls;
  }

  private uniqueUnitValidator(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const units = (formArray as FormArray).controls;
      const uniqueCombinations = new Set(this.cachedUnits.map(u => `${u.tower_number}-${u.floor_number}-${u.unit_number}`));

      for (let unit of units) {
        const { tower_number, floor_number, unit_number } = unit.value;
        if (tower_number && floor_number && unit_number) {
          const combination = `${tower_number}-${floor_number}-${unit_number}`;
          if (this.isTenant) {
            if (uniqueCombinations.has(combination)) return null;
          } else {
            if (uniqueCombinations.has(combination)) return { duplicateUnit: true };
          }
          uniqueCombinations.add(combination);
        }
      }

      return this.isTenant ? { noMatchingUnit: true } : null;
    };
  }

  onSubmit() {
    const { first_name, last_name, mobile_number, userType, unit_address } = this.registerForm.value;
    const userData = this.backendData.userData(
      first_name,
      last_name,
      mobile_number,
      this.backendService.getEmail(),
      userType.toUpperCase()
    );
    const unitData = unit_address.map(({ tower_number, floor_number, unit_number }: any) =>
      ({ tower_number, floor_number, unit_number })
    );

    this.backendService.createUser(userData, unitData).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          const storageData = {
            user_id: response,
            email: this.backendService.getEmail(),
            user_type: userType.toUpperCase(),
          };
          sessionStorage.setItem('backendUserData', JSON.stringify(storageData));
          this.router.navigate(['dashboard']);
        });
      },
      error: (error: any) => console.error('Error creating user:', error)
    });
  }
}
