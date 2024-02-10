import { Component, AfterViewInit, OnInit } from '@angular/core';
import { ROUTES } from './menu-items';
import { RouteInfo } from './sidebar.metadata';
import { RouterModule } from '@angular/router';
import { CommonModule, NgIf } from '@angular/common';
//declare var $: any;

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports:[RouterModule, CommonModule, NgIf],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  showMenu = '';
  showSubMenu = '';
  public sidebarnavItems:RouteInfo[]=[];
  // this is for the open close
  addExpandClass(element: string) {
    if (element === this.showMenu) {
      this.showMenu = '0';
    } else {
      this.showMenu = element;
    }
  }

  menus: any =[];
  filteredMenus: any [] = [];
  role: string = '';
  constructor() {
    this.menus = ROUTES;
    const userData = sessionStorage.getItem('backendUserData');
    if(userData!=null){
      const parseObj = JSON.parse(userData);
      this.role = parseObj.user_type;
    }
    this.menus.forEach((element: any) => {
      const isRolePresent = element.roles.find((role:any) => role == this.role);
      if(isRolePresent != undefined){
        this.filteredMenus.push(element);
      }
    });
  }

  // End open close
  ngOnInit() {
    // this.sidebarnavItems = ROUTES.filter(sidebarnavItem => sidebarnavItem);
    this.sidebarnavItems = this.filteredMenus;
  }
}
