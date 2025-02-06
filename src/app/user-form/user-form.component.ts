import { Component, OnInit, NgZone } from '@angular/core';
import { BackendServiceService } from '../services/backend-service.service';
import { Router } from '@angular/router';
import { ClientModule } from '../shared-module/client-module';
import { ReactiveFormsModule, FormControl, FormGroup, Validators, FormArray, FormBuilder, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { Location } from '@angular/common';
import { BackendDataService } from '../services/backend-data.service';
import { Observable, of, switchMap, tap } from 'rxjs';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FileUploadModule } from 'primeng/fileupload';


@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  standalone: true,
  imports: [ClientModule, ReactiveFormsModule, FloatLabelModule, FileUploadModule],
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit {
  registerForm!: FormGroup;

  userTypeOptions = [
    { label: 'Owner', value: 'Owner' },
    { label: 'Tenant', value: 'Tenant' },
    // { label: 'Guest', value: 'Guest' },
  ];

  unitOptions = [
    { name: 'Studio', code: 'ST', size: 22 },
    { name: '1 Bedroom', code: '1BR', size: 37 },
    { name: '2 Bedroom', code: '2BR', size: 53 },
  ]

  paxOptions = [
    { name: 1 },
  ]

  towerOptions = Array.from({ length: 5 }, (_, i) => ({ label: `Tower ${i + 1}`, value: i + 1 }));

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
        Validators.pattern("^[a-zA-Z' -]+$"),
        Validators.minLength(3)
      ]
      ],
      last_name: ['', [
        Validators.required,
        Validators.pattern("^[a-zA-Z' -]+$"),
        Validators.minLength(3)
      ]
      ],
      mobile_number: ['', [
        Validators.required,
        Validators.pattern('^09\\d{2}-\\d{3}-\\d{4}$')
      ]
      ],
      userType: ['', Validators.required],
      unit_address: this.fb.array([this.createUnitAddress()], { validators: this.uniqueUnitValidator() }),
      representatives: this.fb.array([])
    });
  }

  createUnitAddress(): FormGroup {
    const group = this.fb.group({
      tower_number: [, Validators.required],
      floor_number: [, Validators.required],
      unit_number: [, Validators.required],
      unit_type: [, this.isTenant ? null : Validators.required],
      floors: [[]],
      units: [[]]
    });
    group.valueChanges.subscribe(() => this.registerForm.get('unit_address')?.updateValueAndValidity());
    return group;
  }

  createRepresentatives(): FormGroup {
    const group = this.fb.group({
      first_name: [, Validators.required],
      last_name: [, Validators.required],
      image: [, Validators.required],
    });

    group.valueChanges.subscribe(() => this.registerForm.get('representatives')?.updateValueAndValidity());
    return group;
  }

  getNoOfRepresentatives(event: any) {
    (this.registerForm.get('representatives') as FormArray).clear();
    if (!event.value) return;

    const totalPax = event.value.name
    for (let i = 0; i < totalPax; i++) {
      (this.registerForm.get('representatives') as FormArray).push(this.createRepresentatives());
    }
  }

  // Storing of Image
  uploadedImages: string[] = [];
  onImageSelect(event: any, index: number): void {
    const selectedFile = event.files[0];

    if (selectedFile) {
      const repGroup = (this.registerForm.get('representatives') as FormArray).at(index) as FormGroup;
      repGroup.get('image')?.setValue(selectedFile);

      const reader = new FileReader();
      reader.onload = (e: any) => {
        // Update the image source for the corresponding index
        this.uploadedImages[index] = e.target.result;
      };
      reader.readAsDataURL(selectedFile);

    }
  }

  onReplaceImage(index: number): void {
    // Clear the current image
    this.uploadedImages[index] = '';
    const repGroup = (this.registerForm.get('representatives') as FormArray).at(index) as FormGroup;
    repGroup.get('image')?.reset();
  }

  get representatives() {
    return (this.registerForm.get('representatives') as FormArray).controls;
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

  selectedUser: boolean = false;
  onUserTypeClick(event: any) {
    if (!this.selectedUser) this.selectedUser = true;
    
    this.showUnitButton = event.option.value === 'Owner';
    this.isTenant = !this.showUnitButton;
  
    // Reset the unit_address form array without reinitializing it
    const unitAddressArray = this.registerForm.get('unit_address') as FormArray;
    if (unitAddressArray) {
      unitAddressArray.clear();
      unitAddressArray.push(this.createUnitAddress()); // Clear existing entries but preserve the form structure
    }
  
    // Reset the representatives array
    const representativesArray = this.registerForm.get('representatives') as FormArray;
    if (representativesArray) representativesArray.clear();
  }
  

  towerSelected!: number;
  // tower 2: 21 floors 2nd floor to 14th floor = 18 units, 15 to 21 = 24 units ???
  onFloorSelect(event: any, index: number) {
    if (this.towerSelected != 2) return;
    const unitGroup = (this.registerForm.get('unit_address') as FormArray).at(index) as FormGroup;
    let units: { label: string, value: number }[] = [], noOfUnits = 0;
    if (event.value < 15) {
      noOfUnits = 20;
    } else {
      noOfUnits = 25;
    }

    units = Array.from({ length: noOfUnits }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 })).filter(units => units.label !== '13')
    unitGroup.get('unit_number')?.setValue(null);
    unitGroup.get('units')?.setValue(units)
  }

  onTowerSelect(event: any, index: number) {
    const unitGroup = (this.registerForm.get('unit_address') as FormArray).at(index) as FormGroup;
    this.towerSelected = event;
    let floors: { label: string, value: number }[] = [];
    let units: { label: string, value: number }[] = [];
    let noOfFloors = 0, noOfUnits = 0;
    switch (this.towerSelected) {
      case 1:
        noOfFloors = 20;
        noOfUnits = 20;
        break;
      case 2:
        noOfFloors = 21;
        // Units will be set when floor is selected
        break;
      case 3:
        noOfFloors = 21;
        noOfUnits = 19;
        break;
      case 4:
        noOfFloors = 18;
        noOfUnits = 19;
        break;
      case 5:
        noOfFloors = 18;
        noOfUnits = 17;
        break;
      default:
        break;
    }

    floors = Array.from({ length: noOfFloors }, (_, i) => ({ label: (i + 2).toString(), value: i + 2 })).filter(floor => floor.label !== '13');
    units = Array.from({ length: noOfUnits }, (_, i) => ({ label: (i + 1).toString(), value: i + 1 })).filter(unit => unit.label !== '13');
    unitGroup.get('floor_number')?.setValue(null);
    unitGroup.get('unit_number')?.setValue(null);
    unitGroup.get('floors')?.setValue(floors)
    unitGroup.get('units')?.setValue(units)

  }

  getFloorOptions(index: number) {
    return (this.registerForm.get('unit_address') as FormArray).at(index).get('floors')?.value
  }

  getUnitOptions(index: number) {
    return (this.registerForm.get('unit_address') as FormArray).at(index).get('units')?.value
  }

  addUnitClick(): void {
    (this.registerForm.get('unit_address') as FormArray).push(this.createUnitAddress());
  }

  removeUnitClick(index: number) {
    const unitAddressArray = this.registerForm.get('unit_address') as FormArray
    if (unitAddressArray.length > 1) {
      unitAddressArray.removeAt(index)
    }
  }

  get unitAddress() {
    return (this.registerForm.get('unit_address') as FormArray).controls;
  }

  private uniqueUnitValidator(): ValidatorFn {
    return (formArray: AbstractControl): ValidationErrors | null => {
      const units = (formArray as FormArray).controls;
      
      if (!this.cachedUnits || this.cachedUnits.length === 0) {
        return { noUnitsLoaded: true };  // Error if cachedUnits are not yet loaded
      }
  
      const uniqueCombinations = new Set(this.cachedUnits.map(u => `${u.tower_number}-${u.floor_number}-${u.unit_number}`));
  
      for (let unit of units) {
        const { tower_number, floor_number, unit_number } = unit.value;
        if (tower_number && floor_number && unit_number) {
          const combination = `${tower_number}-${floor_number}-${unit_number}`;
          if (uniqueCombinations.has(combination)) return null;
          uniqueCombinations.add(combination);
        }
      }
  
      return this.isTenant ? { noMatchingUnit: true } : null;
    };
  }
  

  isUnitSelectionComplete(): boolean {
    const unitAddressArray = this.registerForm.get('unit_address') as FormArray;
    if (!unitAddressArray || unitAddressArray.length === 0) return false;
  
    const unit = unitAddressArray.at(0).value; // Get first unit entry
    // Add constraints how many representatives based on the cachedUnits unit_type
    const foundUnit = this.cachedUnits.find(cachedUnit => 
      cachedUnit.tower_number === unit.tower_number && 
      cachedUnit.floor_number === unit.floor_number && 
      cachedUnit.unit_number === unit.unit_number &&
      cachedUnit.sq_foot != null && cachedUnit.sq_foot !== '' && // checks for null or empty string
      cachedUnit.unit_type != null && cachedUnit.unit_type !== '' // checks for null or empty string
    );  
    
    if(foundUnit){
      if(foundUnit.unit_type === '1BR' || foundUnit.unit_type === 'ST'){
        this.paxOptions = [
          { name: 1 },
          { name: 2 },
          { name: 3 },
          { name: 4 },
        ]
      }else{
        this.paxOptions = [
          { name: 1 },
          { name: 2 },
          { name: 3 },
          { name: 4 },
          { name: 5 },
        ]
      }
    }else{
      this.paxOptions = []
    }
    
    return !!(unit.tower_number && unit.floor_number && unit.unit_number);
  }

  onSubmit() {
    const { first_name, last_name, mobile_number, userType, unit_address, representatives } = this.registerForm.value;
    const unitData = unit_address.map(({ tower_number, floor_number, unit_number, unit_type }: any) =>
      ({ tower_number, floor_number, unit_number, unit_type })
    );
    let userData = {}

    if (userType === 'Owner') {
      // Owner
      userData = {
        first_name: first_name,
        last_name: last_name,
        mobile_number: mobile_number,
        email: this.backendService.getEmail(),
        user_type: userType.toUpperCase(),
      }

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

    } else {
      // Tenant
      const { tower_number, floor_number, unit_number } = unitData[0];
      this.backendService.getLessorID(tower_number, floor_number, unit_number).subscribe({
        next: (response: any) => {
          const userData = {
            first_name: first_name,
            last_name: last_name,
            mobile_number: mobile_number,
            email: this.backendService.getEmail(),
            user_type: userType.toUpperCase(),
            lessor_id: response[0].user_id // Accessing the first object in the array
          }

          const unitData2 = [{
            tower_number: tower_number,
            floor_number: floor_number,
            unit_number: unit_number,
            sq_foot: {size: response[0].sq_foot},
            unit_type: {code: response[0].unit_type},
          }]

          this.backendService.createUser(userData, unitData2, representatives).subscribe({
            next: (responseData: any) => {
              this.ngZone.run(() => {
                const storageData = {
                  user_id: responseData,
                  email: this.backendService.getEmail(),
                  user_type: userType.toUpperCase(),
                  lessor_id: response[0].user_id
                };
                sessionStorage.setItem('backendUserData', JSON.stringify(storageData));
                this.router.navigate(['dashboard']);
              });
            },
            error: (error: any) => console.error('Error creating user:', error)
          });



        }, error: (error: any) => {
          console.error('Error fetching lessor ID:', error);
        }
      })

    }

  }  

}
