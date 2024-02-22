import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menus: any[] = [];

  setMenus(menus: any[]) {
    this.menus = menus;
    sessionStorage.setItem('menus', JSON.stringify(menus));
  }

  getMenus() {
    if (this.menus.length === 0) {
      this.menus = JSON.parse(sessionStorage.getItem('menus') || '[]');
    }
    return this.menus;
  }
}
