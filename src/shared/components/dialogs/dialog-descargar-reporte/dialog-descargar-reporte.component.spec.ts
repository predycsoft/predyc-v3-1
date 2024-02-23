import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogDescargarReporteComponent } from './dialog-descargar-reporte.component';

describe('DialogDescargarReporteComponent', () => {
  let component: DialogDescargarReporteComponent;
  let fixture: ComponentFixture<DialogDescargarReporteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogDescargarReporteComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogDescargarReporteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
