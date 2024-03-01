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
import { routeGuard } from '../route-guard.guard';
import { AboutComponent } from '../about/about.component';
import { AnalyticsComponent } from './analytics/analytics.component';

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
				path: 'analytics',
				component: AnalyticsComponent,
				canActivate: [routeGuard]
			},
			{ // Admin + Tenant + Owner + GUEST
				path: 'bulletin-board',
				component: BulletinBoardComponent,
				canActivate: [routeGuard]
			},
			{ // Admin
				path: 'manage-users',
				component: ManageUsersComponent,
				canActivate: [routeGuard]
			},
			{ // Super Admin
				path: 'access-control',
				component: AccessControlComponent,
				canActivate: [routeGuard]
			},
			{ // Tenant
				path: 'tenant-lease',
				component: TenantLeaseComponent,
				canActivate: [routeGuard]
			},
			{ // Owner + Tenant
				path: 'history-invoice',
				component: HistoryInvoiceComponent,
				canActivate: [routeGuard]
			},
			{ // Owner + Tenant
				path: 'validation',
				component: ValidationComponent,
				canActivate: [routeGuard]
			},
			{ // Owner + Tenant
				path: 'feedback-complaint',
				component: FeedbackComplaintComponent,
				canActivate: [routeGuard]
			},
			{ // Owner + Tenant
				path: 'events-reservation',
				component: EventsReservationComponent,
				canActivate: [routeGuard]
			},
			{ // Owner + Tenant
				path: 'maintenance',
				component: MaintenanceComponent,
				canActivate: [routeGuard]
			},
			{ // Super Admin
				path: 'system-maintenance',
				component: SystemMaintenanceComponent,
				canActivate: [routeGuard]
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
			{
				path: 'about',
				component: AboutComponent,
				canActivate: [routeGuard]
			}
		]
	}
];
