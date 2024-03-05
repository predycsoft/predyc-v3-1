import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogConfirmarAgregarCursoComponent } from './dialog-confirmar-agregar-curso.component';

describe('DialogConfirmarAgregarCursoComponent', () => {
  let component: DialogConfirmarAgregarCursoComponent;
  let fixture: ComponentFixture<DialogConfirmarAgregarCursoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogConfirmarAgregarCursoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogConfirmarAgregarCursoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
