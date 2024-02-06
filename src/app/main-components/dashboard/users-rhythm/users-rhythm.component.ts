import { ChangeDetectorRef, Component, ElementRef, Input, SimpleChanges, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-users-rhythm',
  templateUrl: './users-rhythm.component.html',
  styleUrls: ['./users-rhythm.component.css']
})
export class UsersRhythmComponent {

  ctx : any;
  config : any;
  chartData : number[] = [];
  chartDatalabels : string[] = [];

  constructor(
    public icon: IconService,
    private cdr: ChangeDetectorRef

  ){}
  @Input() rythms: {high: number, medium: number, low: number, noPlan: number}

  highPercentage: number
  mediumPercentage: number
  lowPercentage: number
  noPlanPercentage: number
  goodRhythmPercentage: number

  chart: any
  

  ngOnInit() {
    // this.getChartData()
    // this.chartExample()
  }

  ngOnChanges(changes: SimpleChanges) {
    if (JSON.stringify(changes.rythms.currentValue) !== JSON.stringify(changes.rythms.previousValue)) {
      this.getChartData()
      if (this.chart) this.chart.destroy()
      this.chartExample()
    }

  }


  drawChart() {

    // const data = {
    //   labels: ['Ritmo alto', 'Ritmo medio', 'Ritmo bajo', 'Sin asignaciones'],
    //   datasets: [{
    //     data: [highPercentage, mediumPercentage, lowPercentage, noPlanPercentage],
    //     backgroundColor: [
    //       'rgb(255, 99, 132)',
    //       'rgb(54, 162, 235)',
    //       'rgb(255, 205, 86)',
    //       'rgb(201, 203, 207)'
    //     ],
    //     hoverOffset: 4
    //   }]
    // };



  }

  chartExample() {
    this.chartData = []
    this.chartData.push(this.highPercentage);
    this.chartData.push(this.mediumPercentage);
    this.chartData.push(this.lowPercentage);
    this.chartData.push(this.noPlanPercentage);
  
    this.chartDatalabels = []
    this.chartDatalabels.push('Alto');
    this.chartDatalabels.push('Medio');
    this.chartDatalabels.push('Bajo');
    this.chartDatalabels.push('Sin asignaciones');
  
    this.ctx = document.getElementById('myChart');
    this.config = {
      type: 'doughnut',
      data: {
        labels: this.chartDatalabels,
        datasets: [{ 
          label: 'Chart Data',
          data: this.chartData,
          borderWidth: 2,
          borderColor: '#F2F2F2',
          backgroundColor: ['#AFEF9F', 'rgb(255, 221, 0)', '#ED4758', '#D5DCE0']
          

        }],
      },
      options: {
        plugins: {
          legend: {
            display: false // disable the legend
          }
        }
      }
    };
    // const myChart = new Chart(this.ctx, this.config);
    this.chart = new Chart(this.ctx, this.config);
  }
  
  getChartData() {
    const total = this.rythms.high + this.rythms.medium + this.rythms.low + this.rythms.noPlan
    
    this.highPercentage = 0; this.mediumPercentage = 0; this.lowPercentage = 0; this.noPlanPercentage = 0, this.goodRhythmPercentage = 0; 

    this.highPercentage = total ? this.getPercentage(this.rythms.high, total) : 0
    this.mediumPercentage = total ? this.getPercentage(this.rythms.medium, total) : 0
    this.lowPercentage = total ? this.getPercentage(this.rythms.low, total) : 0
    this.noPlanPercentage = total ? this.getPercentage(this.rythms.noPlan, total) : 0
    this.goodRhythmPercentage = total ? this.getPercentage((this.rythms.high + this.rythms.medium), total) : 0
  }

  getPercentage(value: number, total: number) {
    return value * 100 / total
  }
}
