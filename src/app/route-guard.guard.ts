import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Inject } from '@angular/core';

export const routeGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const userData = sessionStorage.getItem('backendUserData');
  let role = null;
  if(userData!=null){
    const parseObj = JSON.parse(userData);
    role = parseObj.user_type;
  }
  let protectedRoutes: string [] = [];
  switch(role){
    case 'SUPER_ADMIN':
      protectedRoutes = ['/access-control', '/system-maintenance'];
      break;
    case 'ADMIN':
      protectedRoutes = ['/bulletin-board', '/manage-users'];
      break;
    case 'OWNER':
      protectedRoutes = ['/bulletin-board', '/history-invoice', '/validation', '/events-reservation', '/maintenance', '/feedback-complaint'];
      break;
    case 'TENANT':
      protectedRoutes = ['/bulletin-board', '/tenant-lease', '/history-invoice', '/validation', '/feedback-complaint', '/maintenance'];
      break;
    case 'GUEST':
    default:
      protectedRoutes = [];
      break;
  }
  const router:Router = Inject(Router);
  return protectedRoutes.includes(state.url) ? router.navigate(['/']) : true;
};
