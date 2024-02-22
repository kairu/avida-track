import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { MenuService } from './menu-service.service';

export const routeGuard = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const menuService = inject(MenuService);

  const userData = sessionStorage.getItem('backendUserData');
  let role = null;
  if(userData!=null){
    const parseObj = JSON.parse(userData);
    role = parseObj.user_type;
  }

  let protectedRoutes: string[] = [];
  protectedRoutes = menuService.getMenus().map(menu => menu.path);
  return !protectedRoutes.includes(state.url) ? router.navigate(['/']) : true;
};
