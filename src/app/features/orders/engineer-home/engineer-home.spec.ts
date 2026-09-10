import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EngineerHome } from './engineer-home';

describe('EngineerHome', () => {
  let component: EngineerHome;
  let fixture: ComponentFixture<EngineerHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EngineerHome],
    }).compileComponents();

    fixture = TestBed.createComponent(EngineerHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
