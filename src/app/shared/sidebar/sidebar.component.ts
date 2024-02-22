import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ROUTES } from './menu-items';
import { RouteInfo } from './sidebar.metadata';
import { RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
import { BackendServiceService } from 'src/app/services/backend-service.service';
import { MenuService } from 'src/app/services/menu-service.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, NgIf],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent{
  showMenu = '';
  showSubMenu = '';
  public sidebarnavItems: RouteInfo[] = [];
  // this is for the open close
  addExpandClass(element: string) {
    if (element === this.showMenu) {
      this.showMenu = '0';
    } else {
      this.showMenu = element;
    }
  }

  menus: any = [];
  filteredMenus: any[] = [];
  role: string = '';
  access!: any[];
  constructor(private backendService: BackendServiceService, private menuService: MenuService) {
    // get access controls from the backend service
    this.backendService.getAccessControls().subscribe({
      next: (response: any) => {
        this.access = response;
        this.menus = ROUTES;
        const userData = sessionStorage.getItem('backendUserData');
        if (userData != null) {
          const parseObj = JSON.parse(userData);
          this.role = parseObj.user_type;
        }
        this.filteredMenus = this.menus.filter((menu: { title: any; }) => {
          const accessControl = this.access.find(control => control.module_name === menu.title);
          return accessControl && accessControl[this.role.toLowerCase()];
        });
        this.menuService.setMenus(this.filteredMenus);
        this.sidebarnavItems = this.filteredMenus;
      }
    });
  }
}


