import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EngineerLogin } from './engineer-login';

describe('EngineerLogin', () => {
  let component: EngineerLogin;
  let fixture: ComponentFixture<EngineerLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EngineerLogin],
    }).compileComponents();

    fixture = TestBed.createComponent(EngineerLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
