import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { format, subMonths } from 'date-fns';
import { Log } from '../users-study-time-container.component';


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
    this.data = []
    let now = new Date();
    let currentMonth = now.getUTCMonth();
    this.hasProgress = false; 


    for(let i=0; i<12; i++) {
      let month = subMonths(now, i);
      const utcDate = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), month.getUTCDay(), month.getUTCHours(), month.getUTCMinutes(), month.getUTCSeconds()))
      let label = format(utcDate, 'MMM');
      let value = this.logs.reduce((total, log) => {
          let logDate = new Date(log.endDate);
          if(logDate.getUTCMonth() === month.getUTCMonth() && logDate.getUTCFullYear() === month.getUTCFullYear()) {
              return total + (log.classDuration/60);
          }
          return total;
      }, 0);
      this.data.unshift({value, label});
      if (month.getUTCMonth() === currentMonth) {
        this.currentLabel = label;
        if (value > 0) {
          this.hasProgress = true;
        }
      }
    }
    
    this.max = this.dayGoalHour
    let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
    if(max > this.max){
        this.max = max;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["logs"]) {
      this.data = []
      let now = new Date();
      let currentMonth = now.getUTCMonth();
      for(let i=0; i<12; i++) {
          let month = subMonths(now, i);
          const utcDate = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), month.getUTCDay(), month.getUTCHours(), month.getUTCMinutes(), month.getUTCSeconds()))
          let label = format(utcDate, 'MMM');
          let value = this.logs.reduce((total, log) => {
              let logDate = new Date(log.endDate);
              if(logDate.getUTCMonth() === month.getUTCMonth() && logDate.getUTCFullYear() === month.getUTCFullYear()) {
                  return total + (log.classDuration/60);
              }
              return total;
          }, 0);
          this.data.unshift({value, label});

          if (month.getUTCMonth() === currentMonth) {
            this.currentLabel = label;
          }
          if (month.getUTCMonth() === currentMonth) {
            this.hasProgress = value > 0;
          }
        }
  
      
      this.max = this.dayGoalHour
      let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
      if(max > this.max){
          this.max = max;
      }
      

      // Asegúrate de llamar a detectChanges para que Angular actualice la vista
      this.cdRef.detectChanges();
    }
   


  }

}
