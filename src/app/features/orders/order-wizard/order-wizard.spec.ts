import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderWizard } from './order-wizard';

describe('OrderWizard', () => {
  let component: OrderWizard;
  let fixture: ComponentFixture<OrderWizard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderWizard],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderWizard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
