import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { Log } from '../users-study-time-container.component';
import { format, subMonths } from 'date-fns';


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
  currentLabel

  ngOnChanges(changes: SimpleChanges) {
    if (changes["logs"]) {
      let now = new Date();
      let currentMonth = now.getMonth();
      for(let i=0; i<12; i++) {
          let month = subMonths(now, i);
          let label = format(month, 'MMM');
          let value = this.logs.reduce((total, log) => {
              let logDate = new Date(log.timestamp);
              if(logDate.getMonth() === month.getMonth() && logDate.getFullYear() === month.getFullYear()) {
                  return total + (log.time/60);
              }
              return total;
          }, 0);
          this.data.unshift({value, label});
          if (month.getMonth() === currentMonth) {
            this.currentLabel = label;
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

  ngOnInit(): void {
    this.data = []
    let now = new Date();
    let currentMonth = now.getMonth();

    for(let i=0; i<12; i++) {
        let month = subMonths(now, i);
        let label = format(month, 'MMM');
        let value = this.logs.reduce((total, log) => {
            let logDate = new Date(log.timestamp);
            if(logDate.getMonth() === month.getMonth() && logDate.getFullYear() === month.getFullYear()) {
                return total + (log.time/60);
            }
            return total;
        }, 0);
        this.data.unshift({value, label});
        if (month.getMonth() === currentMonth) {
          this.currentLabel = label;
      }
    }
    
    this.max = this.dayGoalHour
    let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
    if(max > this.max){
        this.max = max;
    }
  }

}
