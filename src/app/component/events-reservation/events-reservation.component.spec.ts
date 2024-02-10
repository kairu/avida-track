import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsReservationComponent } from './events-reservation.component';

describe('EventsReservationComponent', () => {
  let component: EventsReservationComponent;
  let fixture: ComponentFixture<EventsReservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsReservationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EventsReservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
