import { Component, Input, SimpleChanges } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { CourseByStudent } from 'src/app/shared/models/course-by-student';
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
    // private profileService: ProfileService,
    private userService: UserService,
    private courseService: CourseService,
  ){}

  @Input() student: UserJson
  @Input() selectedProfile: Profile;


  combinedObservableSubscription: Subscription
  months: Month[]

  showInitForm = false
  hoursPermonthInitForm: number = 0
  startDateInitForm: number = 0

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

    this.combinedObservableSubscription = combineLatest([ this.courseService.getCourses$(), this.courseService.getActiveCoursesByStudent(userRef)]).
    subscribe(([coursesData, coursesByStudent]) => {
      if (coursesByStudent.length > 0) {
        if (coursesData.length > 0) {
          this.buildMonths(coursesByStudent, coursesData)
        }
      } else {
        console.log("El usuario no posee studyPlan");
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // console.log("changes", changes)
    if (changes.selectedProfile && changes.selectedProfile.previousValue === null && changes.selectedProfile.currentValue) {
      console.log('selected profile:', changes.selectedProfile.currentValue);
      this.showInitForm = true

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

      return {
        monthName,
        monthNumber,
        yearNumber,
        courses: months[monthName]
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
  
  saveInitForm() {
    this.userService.saveStudyPlanHoursPerMonth(this.student.uid, this.hoursPermonthInitForm)
    this.showInitForm = false
  }
  

  ngOnDestroy() {
    this.combinedObservableSubscription.unsubscribe()
  }

}
