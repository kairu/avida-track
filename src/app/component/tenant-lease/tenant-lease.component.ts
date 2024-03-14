import { Component } from '@angular/core';
import { TableModule } from 'primeng/table';
import { BackendServiceService } from 'src/app/services/backend-service.service';

@Component({
  selector: 'app-tenant-lease',
  standalone: true,
  imports: [TableModule],
  templateUrl: './tenant-lease.component.html',
  styleUrl: './tenant-lease.component.scss'
})

export class TenantLeaseComponent {
  lease!: any[];

  constructor(private leaseService: BackendServiceService) {}

  ngOnInit(): void {
    this.LeaseAgreements();
  }

  LeaseAgreements(): void {
    this.leaseService
      .getLease()
      .subscribe((leaseAgreements: any[]) => {
        this.lease = leaseAgreements;
      });
  }
}

