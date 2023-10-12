import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-semigauge-chart',
  templateUrl: './semigauge-chart.component.html',
  styleUrls: ['./semigauge-chart.component.css'],
})
export class SemigaugeChartComponent {
  @Input() minValue: number;
  @Input() maxValue: number;
  @Input() value: number;
  @Input() lowValue: number;
  @Input() mediumValue: number;
  @Input() highValue: number;
}