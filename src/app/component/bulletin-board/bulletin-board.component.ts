import { Component, Renderer2, ElementRef } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { PaginatorModule } from 'primeng/paginator';
@Component({
  selector: 'app-bulletin-board',
  standalone: true,
  imports: [CardModule, DialogModule, CommonModule, ButtonModule, RippleModule, PaginatorModule],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.scss'
})
export class BulletinBoardComponent {
  items = [
    { title: 'Card 1', subtitle: 'Announcement', content: 'This is the content for Card 1' },
    { title: 'Card 2', subtitle: 'News', content: 'This is the content for Card 2' },
    { title: 'Card 3', subtitle: 'Event', content: 'This is the content for Card 3' },
    { title: 'Card 4', subtitle: 'Feedback', content: 'This is the content for Card 4' },
    { title: 'Card 5', subtitle: 'Complaint', content: 'This is the content for Card 5' },
    { title: 'Card 6', subtitle: 'Reservation', content: 'This is the content for Card 6' },
    { title: 'Card 7', subtitle: 'Maintenance', content: 'This is the content for Card 7' },
    { title: 'Card 8', subtitle: 'Announcement', content: 'This is the content for Card 8' },
    { title: 'Card 9', subtitle: 'News', content: 'This is the content for Card 9' },
    { title: 'Card 10', subtitle: 'Event', content: 'This is the content for Card 10' }
  ];
  isAdmin: boolean = true;
  display: boolean = false;
  visible: boolean = false;
  selectedItem: any;
  pagedItems: any[] = [];
  totalRecords: number = 0;

  constructor(private primengConfig: PrimeNGConfig, private renderer: Renderer2, private el: ElementRef) { }
  ngOnInit() {
    this.primengConfig.ripple = true;
    this.paginate({ first: 0, rows: 9 });
  }

  showDialog(item: any) {
    this.selectedItem = item;
    this.display = true;
    this.removeCloseonModal();
  }

  removeCloseonModal() {
    setTimeout(() => {
      let elements = this.el.nativeElement.getElementsByClassName('p-dialog-header-close');
      for (let i = 0; i < elements.length; i++) {
        this.renderer.setStyle(elements[i], 'display', 'none');
      }
    }, 0);
  }

  editItem(item: any, event: Event) {
    event.stopPropagation();
    console.log(item);
  }

  addContent() {
    this.visible = true;

    this.removeCloseonModal();
  }

  paginate(event: any) {
    let startIndex = event.first;
    let endIndex = startIndex + event.rows;
    let filteredItems = this.filter ? this.items.filter(item => item.subtitle === this.filter) : this.items;
    this.totalRecords = filteredItems.length;
    this.pagedItems = filteredItems.slice(startIndex, endIndex);
  }

  filter: string = '';

  setFilter(category: string) {
    this.filter = category;
    this.paginate({ first: 0, rows: 9 });
  }

}
