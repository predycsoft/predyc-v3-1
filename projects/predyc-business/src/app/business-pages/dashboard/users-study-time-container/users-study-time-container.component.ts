import { Component } from '@angular/core';
import { combineLatest, filter, map, of, Subscription, switchMap, take } from 'rxjs';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';

export class Log {
  endDate: number = 0
  classDuration: number = 0 
}
@Component({
  selector: 'app-users-study-time-container',
  templateUrl: './users-study-time-container.component.html',
  styleUrls: ['./users-study-time-container.component.css']
})
export class UsersStudyTimeContainerComponent {

  constructor(
    public icon: IconService,
    private courseService: CourseService
  ){}
  
  chartTab: number = 0
  hoursTimeWeek: number = 0 // Suma de los tiempos (en horas) empleados en la ultima semana
  hoursTimeMonth: number = 0
  logs: Log[] = []
  now = new Date()
  startOfWeek: number
  startOfMonth: number

  targetHoursPerMonth = 20

  ngOnInit() {
    // Set of first day of the week and first day on the last 12 months
    let startOfWeek = new Date();
    startOfWeek.setUTCDate(this.now.getUTCDate() - ((this.now.getUTCDay() + 6) % 7));
    startOfWeek.setUTCHours(0,0,0,0)
    this.startOfWeek = +startOfWeek

    const now = new Date();
    now.setUTCMonth(now.getUTCMonth() - 11);
    now.setUTCDate(1);
    now.setUTCHours(0, 0, 0, 0);
    this.startOfMonth = +now

    //Datos de ejemplo:
    // this.logs = this.generateTestData()
    // console.log("this.logs", this.logs)
    // -----
    this.chartData()
  }

  courseServiceSubscription: Subscription
  logsInCurrentMonth: Log[]
  currentMonth = new Date().getUTCMonth();  
  currentYear = new Date().getUTCFullYear()

  async chartData() {
    const classesByStudent = await this.courseService.getClassesByEnterprise();

    // const allClassesId = classesByStudent.map(x => x.classRef.id)
    // console.log("allClassesId", allClassesId)
    const classesIds: string[] = Array.from(
      new Set(classesByStudent.map(classItem => classItem.classRef.id))
    );

    const classesData = await this.courseService.getClassesByIds(classesIds)
    // console.log("classesData docs", classesData.length)

    const logs = await Promise.all(
      classesByStudent.map(async classByStudent => {
        // const clase = await this.courseService.getClass(classByStudent.classRef.id);
        const clase = classesData.find(x => x.id === classByStudent.classRef.id)
        return {
          classDuration: clase.duracion,
          endDate: firestoreTimestampToNumberTimestamp(classByStudent.dateEnd)
        };
      })
    );

    this.logs = logs
    this.logsInCurrentMonth = logs.filter(log => {
      const logMonth = new Date(log.endDate).getUTCMonth(); 
      const logYear = new Date(log.endDate).getUTCFullYear();
      return logMonth === this.currentMonth && logYear === this.currentYear;
    });
    this.hoursTimeMonth = this.logsInCurrentMonth.reduce((total, currentClass) => total + currentClass.classDuration, 0) / 60;
    
  }
  
  
}
