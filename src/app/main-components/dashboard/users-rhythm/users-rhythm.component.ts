import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Chart } from 'chart.js';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-users-rhythm',
  templateUrl: './users-rhythm.component.html',
  styleUrls: ['./users-rhythm.component.css']
})
export class UsersRhythmComponent {

  // @ViewChild('doughnutCanvas') doughnutCanvas: ElementRef<HTMLCanvasElement>;
  // doughnutChart: Chart;

  ctx : any;
  config : any;
  chartData : number[] = [];
  chartDatalabels : any[] = [];

  constructor(
    public icon: IconService,

  ){}
  @Input() high: number
  @Input() medium: number
  @Input() low: number
  @Input() noPlan: number

  highPercentage
  mediumPercentage
  lowPercentage
  noPlanPercentage

  goodRhythmPercentage
  

  ngOnInit() {
    const total = this.high + this.medium + this.low + this.noPlan
    this.highPercentage = total ? this.getPercentage(this.high, total) : 0
    this.mediumPercentage = total ? this.getPercentage(this.medium, total) : 0
    this.lowPercentage = total ? this.getPercentage(this.low, total) : 0
    this.noPlanPercentage = total ? this.getPercentage(this.noPlan, total) : 0
    this.goodRhythmPercentage = total ? this.getPercentage((this.high + this.medium), total) : 0

  }

  ngAfterViewInit() {
    // this.drawChart();
    this.chartExample()
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
    this.chartData.push(this.highPercentage);
    this.chartData.push(this.mediumPercentage);
    this.chartData.push(this.lowPercentage);
    this.chartData.push(this.noPlanPercentage);
  
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
    const myChart = new Chart(this.ctx, this.config);
  }
  


  getPercentage(value: number, total: number) {
    return value * 100 / total
  }
}
