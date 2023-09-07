import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigationCardComponent } from './navigation-card.component';

describe('NavigationCardComponent', () => {
  let component: NavigationCardComponent;
  let fixture: ComponentFixture<NavigationCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [NavigationCardComponent]
    });
    fixture = TestBed.createComponent(NavigationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
