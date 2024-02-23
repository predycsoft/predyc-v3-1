import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogProgresoReporteComponent } from './dialog-progreso-reporte.component';

describe('DialogProgresoReporteComponent', () => {
  let component: DialogProgresoReporteComponent;
  let fixture: ComponentFixture<DialogProgresoReporteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogProgresoReporteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogProgresoReporteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
