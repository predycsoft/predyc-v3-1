import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Chart } from 'chart.js';
import { Subscription, combineLatest } from 'rxjs';
import { ClassByStudent } from 'src/app/shared/models/class-by-student.model';
import { CourseByStudent } from 'src/app/shared/models/course-by-student.model';
import { Curso } from 'src/app/shared/models/course.model';
import { User } from 'src/app/shared/models/user.model';
import { CourseService } from 'src/app/shared/services/course.service';
import { UserService } from 'src/app/shared/services/user.service';
import { firestoreTimestampToNumberTimestamp, getFirstDaysOfMonth } from 'src/app/shared/utils';

@Component({
  selector: 'app-study-time-monthly-line-chart',
  templateUrl: './study-time-monthly-line-chart.component.html',
  styleUrls: ['./study-time-monthly-line-chart.component.css']
})
export class StudyTimeMonthlyLineChartComponent {

  constructor(
    private courseService: CourseService,
    private route: ActivatedRoute,
    private userService: UserService,
  ) {}

  uid = this.route.snapshot.paramMap.get('uid');
  courseServiceSubscription: Subscription
  chart: Chart
  student: User
  studentCourses: CourseByStudent[]
  studentClasses: ClassByStudent[]
  courses: Curso[]
  classes: {}

  async ngOnInit() {
    this.student = await this.userService.getUserByUid(this.uid)
    const userRef = this.userService.getUserRefById(this.uid)
    this.courseServiceSubscription = combineLatest([this.courseService.getCoursesByStudent$(userRef), this.courseService.getClassesByStudent$(userRef), this.courseService.getCourses$()]).subscribe(async ([studentCourses, studentClasses, allCourses]) => {
      this.courses = allCourses
      this.studentCourses = studentCourses.filter(item => item.active).sort((a, b) => a.dateEndPlan - b.dateEndPlan)
      const coursesIds = studentCourses.map(item => item.id)
      this.studentClasses = studentClasses.filter(item => coursesIds.includes(item.coursesByStudentRef.id) && item.completed).sort((a, b) => a.dateEnd - b.dateEnd)
      let classes = {}
      for (let studentClass of this.studentClasses) {
        const classId = studentClass.classRef.id
        if (!Object.keys(classes).includes(classId)) {
          // New class
          const classObj = await this.courseService.getClass(classId)
          classes[classId] = classObj
        }
      }
      this.classes = classes
      this.updateChart()
    })
  }

  updateChart() {
    const chartData = this.getChartData()
    this.getChart(chartData)
  }

  getChartData() {
    const months = {}
    console.log(this.studentCourses)
    const startPlanTimestampt = firestoreTimestampToNumberTimestamp(this.studentCourses[0].dateStartPlan)
    const endPlanTimestampt = firestoreTimestampToNumberTimestamp(this.studentCourses[this.studentCourses.length - 1].dateEndPlan)
    const firstDaysOfEachMonth = getFirstDaysOfMonth(startPlanTimestampt, endPlanTimestampt)
    console.log(firstDaysOfEachMonth)
    let remainingStudyPlanHours = 0
    this.studentCourses.forEach(course => {
      const courseJson = this.courses.find(item => item.id === course.courseRef.id)
      remainingStudyPlanHours += (courseJson.duracion/60)
    })
    remainingStudyPlanHours = Math.round(remainingStudyPlanHours)
    const studyPlanHours = remainingStudyPlanHours
    console.log("studyPlanHours", studyPlanHours)
    // Find first day of every month between start and end
    firstDaysOfEachMonth.forEach(firstDayOfMonth => {
      const expectedEndDate = firstDayOfMonth
      const expectedEndDateMonthNumber = expectedEndDate.getUTCMonth()
      const expectedEndDateYearNumber = expectedEndDate.getUTCFullYear();
      if (!Object.keys(months).includes(`${expectedEndDateMonthNumber}-${expectedEndDateYearNumber}`)) {
        let expectedMonthHours = Math.min(this.student.studyHours, remainingStudyPlanHours)
        if (expectedMonthHours > 0) remainingStudyPlanHours = remainingStudyPlanHours - expectedMonthHours
        months[`${expectedEndDateMonthNumber}-${expectedEndDateYearNumber}`] = {
          monthName: expectedEndDate.toLocaleString('es', { month: 'short' }) + '-' + expectedEndDateYearNumber,
          expectedHours: expectedMonthHours,
          realMinutes: 0,
          timestampForSort: firstDayOfMonth.getTime()
        }
      }
    })
    this.studentClasses.forEach(studentClass => {
      const realEndDate = new Date(firestoreTimestampToNumberTimestamp(studentClass.dateEnd))
      const realEndDateMonthNumber = realEndDate.getUTCMonth()
      const realEndDateYearNumber = realEndDate.getUTCFullYear();
      if (!Object.keys(months).includes(`${realEndDateMonthNumber}-${realEndDateYearNumber}`)) {
        months[`${realEndDateMonthNumber}-${realEndDateYearNumber}`] = {
          monthName: realEndDate.toLocaleString('es', { month: 'short' }) + '-' + realEndDateYearNumber,
          expectedHours: 0,
          realMinutes: 0,
          timestampForSort: firestoreTimestampToNumberTimestamp(studentClass.dateEnd)
        }
      }
      months[`${realEndDateMonthNumber}-${realEndDateYearNumber}`]['realMinutes'] = months[`${realEndDateMonthNumber}-${realEndDateYearNumber}`]['realMinutes'] + this.classes[studentClass.classRef.id].duracion
    })
    const orderedMonths = Object.keys(months).map(key => months[key]).sort((a, b) => a['timestampForSort'] - b['timestampForSort'])
    const data = []
    const now = Date.now()
    orderedMonths.forEach((item, index) => {
      if (index === 0) {
        data.push({
          monthName: item['monthName'],
          expectedHours: item['expectedHours'],
          realHours: item['realMinutes']/60,
          showRealHours: this.isTimestampInPastOrCurrentMonth(item['timestampForSort'])
        })
      } else {
        let expectedHours = 0
        let realMinutes = 0
        for (let i = index; i >= 0 ; i--) {
          const previousMonth = orderedMonths[i]
          expectedHours += previousMonth['expectedHours']
          realMinutes += previousMonth['realMinutes']
        }
        data.push({
          monthName: item['monthName'],
          expectedHours: expectedHours,
          realHours: realMinutes/60,
          showRealHours: this.isTimestampInPastOrCurrentMonth(item['timestampForSort'])
        })
      }
    })
    console.log("classes", this.classes)
    console.log("months", months)
    console.log("data", data)
    return data
  }

  isTimestampInPastOrCurrentMonth(timestamp) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
  
    const dateToCompare = new Date(timestamp);
    const yearToCompare = dateToCompare.getFullYear();
    const monthToCompare = dateToCompare.getMonth();
  
    if (yearToCompare < currentYear || (yearToCompare === currentYear && monthToCompare <= currentMonth)) {
      // Timestamp is in a previous month or current month
      return true;
    } else {
      // Timestamp is in a future month
      return false;
    }
  }

  getChart(chartData) {
    let labels = []
    let realValues = []
    let expectedValues = []
    chartData.forEach(data => {
      labels.push(data.monthName)
      expectedValues.push(data.expectedHours)
      if(data.showRealHours) realValues.push(data.realHours)
    });
    const canvas = document.getElementById("line-chart") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')
    // const horizontalMargin = this.horizontalMargin
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Estudio mensual acumulado',
          data: realValues,
          fill: false,
          tension: 0.5,
          backgroundColor: '#BCE8DF',
          borderColor: '#00BF9C',
          pointBackgroundColor: '#00BF9C',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#00BF9C',
          pointRadius: 3 
        },{
          label: 'Estudio mensual esperado acumulado',
          data: expectedValues,
          fill: false,
          tension: 0,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgb(54, 162, 235)',
          pointBackgroundColor: 'rgb(54, 162, 235)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(54, 162, 235)',
          pointRadius: 3 
        }]
      },
    })
    
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy()
    if (this.courseServiceSubscription) this.courseServiceSubscription.unsubscribe()
  }

}
