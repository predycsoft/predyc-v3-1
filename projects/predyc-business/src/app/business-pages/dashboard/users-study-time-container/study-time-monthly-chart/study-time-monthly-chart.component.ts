import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { format, subMonths } from 'date-fns';
import { Log } from '../users-study-time-container.component';
import { Chart } from 'chart.js';


@Component({
  selector: 'app-study-time-monthly-chart',
  templateUrl: './study-time-monthly-chart.component.html',
  styleUrls: ['./study-time-monthly-chart.component.css']
})
export class StudyTimeMonthlyChartComponent {

  constructor(private cdRef: ChangeDetectorRef) { }

  @Input() logs: Log[] = []


  data = []
  dayGoalHour = 1
  max = 0
  currentLabel: string | null = null;
  hasProgress : boolean = false;
 

  ngOnInit(): void {
    // this.data = []
    // let now = new Date();
    // let currentMonth = now.getUTCMonth();
    // this.hasProgress = false; 


    // for(let i=0; i<12; i++) {
    //   let month = subMonths(now, i);
    //   console.log('month',month)
    //   const utcDate = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), month.getUTCDay(), month.getUTCHours(), month.getUTCMinutes(), month.getUTCSeconds()))
    //   let label = format(utcDate, 'MMM');
    //   let value = this.logs.reduce((total, log) => {
    //       let logDate = new Date(log.endDate);
    //       if(logDate.getUTCMonth() === month.getUTCMonth() && logDate.getUTCFullYear() === month.getUTCFullYear()) {
    //           return total + (log.classDuration/60);
    //       }
    //       return total;
    //   }, 0);
    //   this.data.unshift({value, label});
    //   if (month.getUTCMonth() === currentMonth) {
    //     this.currentLabel = label;
    //     if (value > 0) {
    //       this.hasProgress = true;
    //     }
    //   }
    // }
    
    // this.max = this.dayGoalHour
    // let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
    // if(max > this.max){
    //     this.max = max;
    // }
  }

  obtenerUltimoDiaDelMes(fecha: number) {
    fecha = fecha * 1000;
    let fechaOriginal = new Date(fecha);
    const anio = fechaOriginal.getFullYear();
    const mes = fechaOriginal.getMonth();
    const ultimoDiaDelMes = new Date(anio, mes + 1, 0);
  
    // Establecer la hora a 23:59:59
    ultimoDiaDelMes.setHours(23, 59, 59);
  
    return ultimoDiaDelMes;
  }

  getPreviousMonthDate(date, monthsToSubtract) {
    const newDate = new Date(date);
    newDate.setDate(1); // Establecer el día al 1 para evitar desbordamientos de mes
    newDate.setMonth(newDate.getMonth() - monthsToSubtract);

    // Ajustar al último día del mes si es necesario
    const lastDayOfPreviousMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    if (newDate.getDate() > lastDayOfPreviousMonth) {
        newDate.setDate(lastDayOfPreviousMonth);
    }

    return newDate;
}

getDataGraph() {
  this.data = [];
  let now = new Date();
  let currentMonth = now.getUTCMonth();

  // Recolectar datos de los últimos 12 meses
  for (let i = 0; i < 12; i++) {
    let month = this.getPreviousMonthDate(now, i);
    const monthLabel = month.toLocaleString('default', { month: 'short' });
    let label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1); // Primera letra en mayúscula
    let value = this.logs.reduce((total, log) => {
      let logDate = new Date(log.endDate);
      if (logDate.getUTCMonth() === month.getUTCMonth() && logDate.getUTCFullYear() === month.getUTCFullYear()) {
        return total + (log.classDuration / 60);
      }
      return total;
    }, 0);
    this.data.unshift({ value, label });

    if (month.getUTCMonth() === currentMonth) {
      this.currentLabel = label;
    }
    if (month.getUTCMonth() === currentMonth) {
      this.hasProgress = value > 0;
    }
  }

  // Filtrar los meses con valores distintos de 0
  let nonZeroData = this.data.filter(item => item.value !== 0);
  let zeroData = this.data.filter(item => item.value === 0);

  // Obtener el primer mes con datos
  let firstNonZeroIndex = this.data.findIndex(item => item.value !== 0);

  // Ordenar los meses con datos al principio y completar con los meses restantes en orden
  if (firstNonZeroIndex > -1) {
    this.data = [
      ...this.data.slice(firstNonZeroIndex),
      ...this.data.slice(0, firstNonZeroIndex),
    ];
  }

  // Asegurarse de que tenemos exactamente 12 meses, añadiendo meses con valor 0 si es necesario
  if (this.data.length < 12) {
    let additionalMonthsNeeded = 12 - this.data.length;
    for (let i = 0; i < additionalMonthsNeeded; i++) {
      let month = this.getPreviousMonthDate(now, nonZeroData.length + i);
      const monthLabel = month.toLocaleString('default', { month: 'short' });
      let label = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1); // Primera letra en mayúscula
      this.data.push({ value: 0, label });
    }
  }

  this.max = this.dayGoalHour;
  let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
  if (max > this.max) {
    this.max = max;
  }

  console.log('dataGrafico', this.data);
  this.createChart();

  // Asegúrate de llamar a detectChanges para que Angular actualice la vista
  this.cdRef.detectChanges();
}


  chart: Chart;



  createChart() {
    const labels = this.data.map(item => item.label);
    const values = this.data.map(item => item.value);
  
    if (this.chart) {
      this.chart.destroy();
    }
  
    this.chart = new Chart('myLineChart', {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Horas',
            data: values,
            fill: false,
            borderColor: '#008CE3',
            tension: 0.1,
            borderWidth: 2,
            pointBackgroundColor: labels.map(label => label === this.currentLabel ? '#74d96e' : '#008CE3'),
            pointBorderColor: labels.map(label => label === this.currentLabel ? '#74d96e' : '#008CE3'),
            pointRadius: 3 // Opcional: Cambia el tamaño del punto
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += Math.round(context.parsed.y * 100) / 100;
                }
                if (context.label === this.currentLabel) {
                  label += ' (Mes actual)';
                }
                return label;
              }.bind(this) // bind this to access currentLabel
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: false,
              text: 'Mes'
            },
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Horas'
            }
          }
        }
      }
    });
  }
  
  
  

  ngOnChanges(changes: SimpleChanges) {
    if (changes["logs"]) {
      this.getDataGraph()
    }
   


  }

}
