import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemigaugeChartComponent } from './semigauge-chart.component';

describe('SemigaugeChartComponent', () => {
  let component: SemigaugeChartComponent;
  let fixture: ComponentFixture<SemigaugeChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SemigaugeChartComponent]
    });
    fixture = TestBed.createComponent(SemigaugeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
