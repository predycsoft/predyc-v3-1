import { Component, Input, SimpleChanges } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { CourseByStudent } from 'src/app/shared/models/course-by-student';
import { Curso } from 'src/app/shared/models/course.model';
import { Profile } from 'src/app/shared/models/profile.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { CourseService } from 'src/app/shared/services/course.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';
import { firestoreTimestampToNumberTimestamp } from 'src/app/shared/utils';

interface Month {
  monthName: string;
  monthNumber: number
  yearNumber: number
  courses: any[];
}

@Component({
  selector: 'app-student-study-plan-and-competences',
  templateUrl: './student-study-plan-and-competences.component.html',
  styleUrls: ['./student-study-plan-and-competences.component.css']
})
export class StudentStudyPlanAndCompetencesComponent {

  constructor(
    public icon: IconService,
    private userService: UserService,
    private courseService: CourseService,
  ){}

  @Input() student: UserJson
  @Input() selectedProfile: Profile;

  coursesData: any

  combinedObservableSubscription: Subscription
  months: Month[]

  showInitForm = false
  hoursPermonthInitForm: number = 0
  startDateInitForm: {year: number, month: number, day: number} | null = null

  // -------------------------------- hardcode data
  competences = [
    {
      title: "Pilar 1: Mantenimiento",
      categories: [
        "Equipos Estáticos",
        "VDF",
        "VDF",
        "Mecánica de precisión",
        "Equipos Estáticos",
        "Mecánica de precisión"
      ]
    },
    {
      title: "Pilar 2: Industria 4.0",
      categories: [
        "Motores eléctricos",
        "Puesta a tierra",
        "Calibración",
        "Motores eléctricos",
        "Calibración",
        "Puesta a tierra"
      ]
    },
    {
      title: "Pilar 3: Procesos",
      categories: [
        "Compresores",
        "Control de Fluidos",
        "Neumática",
        "Neumática",
        "Control de Fluidos",
        "Compresores",
      ]
    }
  ];
  // --------------------------------

  ngOnInit() {
    const userRef = this.userService.getUserRefById(this.student.uid)
    // if the student has a profile, get the data and show the study plan
    this.combinedObservableSubscription = combineLatest([ this.courseService.getCourses$(), this.courseService.getActiveCoursesByStudent$(userRef)]).
    subscribe(([coursesData, coursesByStudent]) => {
      if (coursesData.length > 0) {
        this.coursesData = coursesData
        if (this.selectedProfile) {
          if (coursesByStudent.length > 0) {
            this.buildMonths(coursesByStudent, coursesData)
          } 
          else {
            this.showInitForm = true
            this.hoursPermonthInitForm = this.selectedProfile.hoursPerMonth
            console.log("El usuario no posee studyPlan");
          }
        }
      }
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    // setting profile for the first time
    if(changes.selectedProfile) {
      if (changes.selectedProfile.previousValue === null && changes.selectedProfile.currentValue) {
        this.showInitForm = true
        this.hoursPermonthInitForm = changes.selectedProfile.currentValue.hoursPerMonth
      }
      // setting new profile
      if (changes.selectedProfile.previousValue && changes.selectedProfile.currentValue && 
      (changes.selectedProfile.currentValue.id !== changes.selectedProfile.previousValue.id )) {

        // Set active = false in prev profile courses
        this.courseService.setCoursesByStudentInactive(this.userService.getUserRefById(this.student.uid))

        // calculate dates and create studyPlan using student.studyHours and startDate of the first course of the prev studyPlan (?)
        await this.createStudyPlan()
      }
    }

  }


  buildMonths(coursesByStudent: CourseByStudent[], coursesData) {
    const months = {}; 
    coursesByStudent.forEach(courseByStudent => {
      // console.log("courseByStudent.id", courseByStudent.id)
      const courseData = coursesData.find(courseData => courseData.id === courseByStudent.courseRef.id);
      if (courseData) {
        const studyPlanData = {
          duration: courseData.duracion / 60,
          courseTitle: courseData.titulo,
          dateStartPlan: firestoreTimestampToNumberTimestamp(courseByStudent.dateStartPlan),
          dateEndPlan: firestoreTimestampToNumberTimestamp(courseByStudent.dateEndPlan),
          dateStart: firestoreTimestampToNumberTimestamp(courseByStudent.dateStart),
          dateEnd: firestoreTimestampToNumberTimestamp(courseByStudent.dateEnd),
        };
        
        const monthName = new Date(studyPlanData.dateEndPlan).toLocaleString('es', { month: 'long' });

        if (!months[monthName]) {
          months[monthName] = [];
        }

        // Add course to the related month
        months[monthName].push(studyPlanData);
      }
      else { 
        console.log("No exite el curso")
        return
      }
    });
    // Transform data to the desired structure 
    this.months = Object.keys(months).map(monthName => {
      const date = new Date(months[monthName][0].dateEndPlan);
      const monthNumber = date.getUTCMonth()
      const yearNumber = date.getUTCFullYear();

      const sortedCourses = months[monthName].sort((a, b) => {
        return b.dateEndPlan - a.dateEndPlan;
      });

      return {
        monthName,
        monthNumber,
        yearNumber,
        courses: sortedCourses
      };
    });
    this.months.sort((a, b) => {
      const yearDiff = b.yearNumber - a.yearNumber;
      if (yearDiff !== 0) return yearDiff;
      return b.monthNumber - a.monthNumber;
    });
    console.log("this.months", this.months);
  }

  isMonthCompleted(month: Month): boolean {
    return month.courses.every(course => course.dateEnd !== null);
  }
  
  isMonthPast(month: any): boolean {
    const currentMonth = new Date().getUTCMonth();
    // const currentMonth = 2; // testing with march
    const currentYear = new Date().getUTCFullYear();
    return (month.yearNumber < currentYear || (month.yearNumber === currentYear && month.monthNumber < currentMonth));
  }

  getDelayedMonthsCount(): number {
    return this.months ? this.months.filter(month => this.isMonthPast(month) && !this.isMonthCompleted(month)).length : null;
  }
  
  async saveInitForm() {
    await this.userService.saveStudyPlanHoursPerMonth(this.student.uid, this.hoursPermonthInitForm)
    this.showInitForm = false
    // calculate dates and create studyplan using this.startDateInitForm
    await this.createStudyPlan()
  }

  async createStudyPlan() {
    const coursesRefs: DocumentReference[] = this.selectedProfile.coursesRef
    let dateStartPlan: number
    let dateEndPlan: number
    let now = new Date()
    let hoy = +new Date(now.getFullYear(), now.getMonth(), now.getDate())
    for (let i = 0; i < coursesRefs.length; i++) {
      const userRef: DocumentReference = this.userService.getUserRefById(this.student.uid)
      const courseData = this.coursesData.find(courseData => courseData.id === coursesRefs[i].id);
      const courseDuration = courseData.duracion
      let hoursPermonth = this.hoursPermonthInitForm ? this.hoursPermonthInitForm : this.student.studyHours

      if (this.startDateInitForm){
        dateStartPlan = +new Date(this.startDateInitForm.year, this.startDateInitForm.month - 1, this.startDateInitForm.day);
        this.startDateInitForm = null
      }
      else dateStartPlan = dateEndPlan ? dateEndPlan : hoy;

      dateEndPlan = this.calculatEndDatePlan(dateStartPlan, courseDuration, hoursPermonth)
      await this.courseService.saveCourseByStudent(coursesRefs[i], userRef, new Date(dateStartPlan), new Date(dateEndPlan))
    }

    // Create months 
    const userRef = this.userService.getUserRefById(this.student.uid)
    this.courseService.getActiveCoursesByStudent$(userRef).subscribe(coursesByStudent => {
      if (coursesByStudent.length > 0) {
        this.buildMonths(coursesByStudent, this.coursesData)
      } else {
        console.log("El usuario no posee studyPlan");
      }
    })
  }


  calculatEndDatePlan(startDate: number, courseDuration: number, hoursPermonth: number): number {
    const monthDays = this.getDaysInMonth(startDate)
    return startDate + 24 * 60 * 60 * 1000 * Math.ceil((courseDuration / 60) / (hoursPermonth / monthDays));
  }

  getDaysInMonth(timestamp: number) {
    const date = new Date(timestamp)

    // Create a new date object for the first day of the next month
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    // Subtract one day to get the last day of the required month
    nextMonth.setDate(nextMonth.getDate() - 1);

    // Return the day of the month, which is the number of days in that month
    return nextMonth.getDate();
  }
  

  ngOnDestroy() {
    this.combinedObservableSubscription ? this.combinedObservableSubscription.unsubscribe() : null
  }

}
