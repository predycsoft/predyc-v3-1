import { Component } from '@angular/core';
import { Chart } from 'chart.js';
import { IconService } from 'src/app/shared/services/icon.service';
import { roundNumber } from 'src/app/shared/utils';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.css']
})
export class ProfilesComponent {

  constructor(
    public icon: IconService
  ) {}

  isEditing: boolean = true

  chart: Chart

  studyPlan = [
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
    {
      title: 'Curso',
      duration: 120
    },
  ]

  ngOnInit() {
    this.getChart()
  }

  onCancel() {
    this.isEditing = false
    console.log("Cancel")
  }

  roundNumber(number: number) {
    return roundNumber(number)
  }

  removeItemFromPlan() {
    console.log("Remove item from plan")
  }

  getChartData() {
    const data = [
      {
        label: 'Mantenimientos',
        value: 28
      },
      {
        label: 'Proyectos',
        value: 48
      },
      {
        label: 'Petróleo',
        value: 40
      },
      {
        label: 'Confiabilidad',
        value: 19
      },
      {
        label: 'Manufactura',
        value: 96
      },
      {
        label: 'Equipos dinámicos',
        value: 27
      },
      {
        label: 'Procesos',
        value: 100
      },
      {
        label: 'Industria 4.0',
        value: 50
      }
    ]
    return data
  }

  getChart() {
    const chartData = this.getChartData()
    let labels = []
    let values = []
    chartData.forEach(data => {
      labels.push(data.label)
      values.push(data.value)
    });
    const canvas = document.getElementById("chart") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')
    // const horizontalMargin = this.horizontalMargin
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          fill: true,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
              display: false
          },
        },
        elements: {
          line: {
            borderWidth: 3
          }
        },
        scales: {
          r: {
            ticks: {
              display: false,
              stepSize: 20
            }
          }
        }
      }
    })
  }

  onSave() {
    this.isEditing = false;
    console.log("Save")
  }

}
