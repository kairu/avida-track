import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { CommonModule } from '@angular/common';
import { PrimeNGConfig } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
@Component({
  selector: 'app-bulletin-board',
  standalone: true,
  imports: [CardModule, DialogModule, CommonModule, ButtonModule, RippleModule],
  templateUrl: './bulletin-board.component.html',
  styleUrl: './bulletin-board.component.scss'
})
export class BulletinBoardComponent {
  items = [
    { title: 'Card 1', subtitle: 'Announcment', content: 'This is the content for Card 1' },
    { title: 'Card 2', subtitle: 'News', content: 'This is the content for Card 2' },
    { title: 'Card 3', subtitle: 'Event', content: 'This is the content for Card 3' },
    { title: 'Card 4', subtitle: 'Feedback', content: 'This is the content for Card 4' },
    { title: 'Card 5', subtitle: 'Complaint', content: 'This is the content for Card 5' },
    { title: 'Card 6', subtitle: 'Reservation', content: 'This is the content for Card 6' },
    { title: 'Card 7', subtitle: 'Maintenance', content: 'This is the content for Card 7' },

  ];
  isAdmin: boolean = true;
  display: boolean = false;
  visible: boolean = false;
  selectedItem: any;

  constructor(private primengConfig: PrimeNGConfig){}
  ngOnInit(){
    this.primengConfig.ripple = true;
  }

  showDialog(item: any){
    this.selectedItem = item;
    this.display = true;
  }

  addContent(){
    this.visible = true;
  }
}
