import { Routes } from '@angular/router';
import { NgbdpaginationBasicComponent } from './pagination/pagination.component';
import { NgbdAlertBasicComponent } from './alert/alert.component';

import { NgbdDropdownBasicComponent } from './dropdown-collapse/dropdown-collapse.component';
import { NgbdnavBasicComponent } from './nav/nav.component';
import { BadgeComponent } from './badge/badge.component';
import { NgbdButtonsComponent } from './buttons/buttons.component';
import { CardsComponent } from './card/card.component';
import { TableComponent } from './table/table.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { AccessControlComponent } from './access-control/access-control.component';
import { TenantLeaseComponent } from './tenant-lease/tenant-lease.component';
import { HistoryInvoiceComponent } from './history-invoice/history-invoice.component';
import { ValidationComponent } from './validation/validation.component';
import { FeedbackComplaintComponent } from './feedback-complaint/feedback-complaint.component';
import { EventsReservationComponent } from './events-reservation/events-reservation.component';
import { MaintenanceComponent } from './maintenance/maintenance.component';
import { SystemMaintenanceComponent } from './system-maintenance/system-maintenance.component';
import { BulletinBoardComponent } from './bulletin-board/bulletin-board.component';

export const ComponentsRoutes: Routes = [
	{
		path: '',
		children: [
			// {
			// 	path: 'table',
			// 	component: TableComponent
			// },
			// {
			// 	path: 'card',
			// 	component: CardsComponent
			// },
			// {
			// 	path: 'pagination',
			// 	component: NgbdpaginationBasicComponent
			// },
			// {
			// 	path: 'badges',
			// 	component: BadgeComponent
			// },
			{ // Admin + Tenant + Owner + GUEST
				path: 'bulletin-board',
				component: BulletinBoardComponent
			},
			{ // Admin
				path: 'manage-users',
				component: ManageUsersComponent
			},
			{ // Super Admin
				path: 'access-control',
				component: AccessControlComponent
			},
			{ // Tenant
				path: 'tenant-lease',
				component: TenantLeaseComponent
			},
			{ // Owner + Tenant
				path: 'history-invoice',
				component: HistoryInvoiceComponent
			},
			{ // Owner + Tenant
				path: 'validation',
				component: ValidationComponent
			},
			{ // Owner + Tenant
				path: 'feedback-complaint',
				component: FeedbackComplaintComponent
			},
			{ // Owner + Tenant
				path: 'events-reservation',
				component: EventsReservationComponent
			},
			{ // Owner + Tenant
				path: 'maintenance',
				component: MaintenanceComponent
			},
			{ // Super Admin
				path: 'system-maintenance',
				component: SystemMaintenanceComponent
			},
			// {
			// 	path: 'alert',
			// 	component: NgbdAlertBasicComponent
			// },
			// {
			// 	path: 'dropdown',
			// 	component: NgbdDropdownBasicComponent
			// },
			// {
			// 	path: 'nav',
			// 	component: NgbdnavBasicComponent
			// },
			// {
			// 	path: 'buttons',
			// 	component: NgbdButtonsComponent
			// }
		]
	}
];
