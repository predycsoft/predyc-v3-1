import { ChangeDetectorRef, Component, Input, SimpleChanges } from '@angular/core';
import { Log } from '../users-study-time-container.component';

@Component({
  selector: 'app-study-time-weekly-chart',
  templateUrl: './study-time-weekly-chart.component.html',
  styleUrls: ['./study-time-weekly-chart.component.css']
})
export class StudyTimeWeeklyChartComponent {

  @Input() logs: Log[]
  
  constructor(private cdRef: ChangeDetectorRef) { }
  
  data = [
    { value: 0, label: "Lun" },
    { value: 0, label: "Mar" },
    { value: 0, label: "Mie" },
    { value: 0, label: "Jue" },
    { value: 0, label: "Vie" },
    { value: 0, label: "Sab" },
    { value: 0, label: "Dom" },
  ];

  dayGoalHour = 1
  max = 0
  now = new Date();
  currentDayOfWeek = this.now.getDay();

  ngOnChanges(changes: SimpleChanges) {
    if (changes["logs"]) {
      this.data = [
        { value: 0, label: "Lun" },
        { value: 0, label: "Mar" },
        { value: 0, label: "Mie" },
        { value: 0, label: "Jue" },
        { value: 0, label: "Vie" },
        { value: 0, label: "Sab" },
        { value: 0, label: "Dom" },

      ]
      let startOfWeek = new Date(this.now);
      startOfWeek.setDate(this.now.getDate() - ((this.now.getDay() + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);  // Set time to 00:00:00.000

      // Sum times for each day of week from Monday to current day
      for (let log of this.logs) {
        let logDate = new Date(log.endDate);
        let logDayOfWeek = (logDate.getDay() + 6) % 7;  // 0 is Monday, 6 is Sunday

        if (logDate >= startOfWeek && logDayOfWeek <= this.currentDayOfWeek) {
          this.data[logDayOfWeek].value += log.classDuration/60;
        }
      }
      this.max = this.dayGoalHour
      let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
      if (max > this.max) {
        this.max = max;
      }
      // Asegúrate de llamar a detectChanges para que Angular actualice la vista
      this.cdRef.detectChanges();
    }
  }

  ngOnInit(): void {
    this.data = [
      { value: 0, label: "Lun" },
      { value: 0, label: "Mar" },
      { value: 0, label: "Mie" },
      { value: 0, label: "Jue" },
      { value: 0, label: "Vie" },
      { value: 0, label: "Sab" },
      { value: 0, label: "Dom" },

    ]
    let startOfWeek = new Date(this.now);
    startOfWeek.setDate(this.now.getDate() - ((this.now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);  // Set time to 00:00:00.000

    // Sum times for each day of week from Monday to current day
    for (let log of this.logs) {
      let logDate = new Date(log.endDate);
      let logDayOfWeek = (logDate.getDay() + 6) % 7;  // 0 is Monday, 6 is Sunday

      if (logDate >= startOfWeek) {
        this.data[logDayOfWeek].value += log.classDuration/60;
      }
    }
    this.max = this.dayGoalHour
    let max = this.data.reduce((max, item) => item.value > max ? item.value : max, this.data[0].value);
    if (max > this.max) {
      this.max = max
    }

  }

}
