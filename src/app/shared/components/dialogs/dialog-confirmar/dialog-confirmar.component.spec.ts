import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmarComponent } from './dialog-confirmar.component';

describe('DialogConfirmarComponent', () => {
  let component: DialogConfirmarComponent;
  let fixture: ComponentFixture<DialogConfirmarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogConfirmarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
