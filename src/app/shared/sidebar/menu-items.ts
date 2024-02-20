import { RouteInfo } from './sidebar.metadata';

export const ROUTES: RouteInfo[] = [
 
  {
    path: '/dashboard',
    title: 'Dashboard',
    icon: 'bi bi-speedometer2',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['SUPER_ADMIN','ADMIN', 'OWNER', 'TENANT', 'GUEST']
  },
  {
    path: '/component/bulletin-board',
    title: 'Bulletin Board',
    icon: 'bi bi-clipboard',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['ADMIN', 'OWNER', 'TENANT', 'GUEST']
  },
  {
    path: '/component/manage-users',
    title: 'Manage Users',
    icon: 'bi bi-people',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['ADMIN']
  },
  {
    path: '/component/access-control',
    title: 'Access Control',
    icon: 'bi bi-universal-access',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['SUPER_ADMIN']
  },
  {
    path: '/component/tenant-lease',
    title: 'Tenant Lease Module',
    icon: 'bi bi-file-check',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['TENANT']
  },
  {
    path: '/component/history-invoice',
    title: 'History and Invoice',
    icon: 'bi bi-receipt-cutoff',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['OWNER', 'TENANT']
  },
  {
    path: '/component/validation',
    title: 'Validation',
    icon: 'bi bi-card-checklist',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['OWNER', 'TENANT']
  },
  {
    path: '/component/feedback-complaint',
    title: 'Feedback and Complaint',
    icon: 'bi bi-journal',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['OWNER', 'TENANT']
  },
  {
    path: '/component/events-reservation',
    title: 'Events Reservation',
    icon: 'bi bi-files-alt',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['OWNER','TENANT']
  },
  {
    path: '/component/maintenance',
    title: 'Maintenance',
    icon: 'bi bi-hammer',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['OWNER', 'TENANT']
  },
  {
    path: '/component/system-maintenance',
    title: 'System Maintenance',
    icon: 'bi bi-gear',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['SUPER_ADMIN']
  },
  // {
  //   path: '/component/alert',
  //   title: 'Tenant Lease Module',
  //   icon: 'bi bi-file-check',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   path: '/component/badges',
  //   title: 'History and Invoice',
  //   icon: 'bi bi-receipt-cutoff',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   path: '/component/buttons',
  //   title: 'Validation',
  //   icon: 'bi bi-card-checklist',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   path: '/component/card',
  //   title: 'Feedback and Complaint',
  //   icon: 'bi bi-journal',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   path: '/component/dropdown',
  //   title: 'Events Reservation',
  //   icon: 'bi bi-files-alt',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   path: '/component/pagination',
  //   title: 'Maintenance',
  //   icon: 'bi bi-hammer',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   path: '/component/nav',
  //   title: 'System Maintenance',
  //   icon: 'bi bi-gear',
  //   class: '',
  //   extralink: false,
  //   submenu: []
  // },
  // {
  //   // path: '/component/table',
  //   // title: 'Table',
  //   // icon: 'bi bi-layout-split',
  //   // class: '',
  //   // extralink: false,
  //   // submenu: []
  // },
  {
    path: '/about',
    title: 'About',
    icon: 'bi bi-people',
    class: '',
    extralink: false,
    submenu: [],
    roles: ['SUPER_ADMIN','ADMIN', 'OWNER', 'TENANT', 'GUEST']
  }
];
