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
    // private profileService: ProfileService,
    private userService: UserService,
    private courseService: CourseService,
    //
    private afs: AngularFirestore,
    //
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
    // if the student has a profile, get the data and show the study plan
    if (this.selectedProfile) {
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
  }

  async ngOnChanges(changes: SimpleChanges) {
    // setting profile for the first time
    if(changes.selectedProfile) {
      if (changes.selectedProfile.previousValue === null && changes.selectedProfile.currentValue) {
        this.showInitForm = true
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
  
  async saveInitForm() {
    await this.userService.saveStudyPlanHoursPerMonth(this.student.uid, this.hoursPermonthInitForm)
    this.showInitForm = false

    // calculate dates and create studyplan using this.hoursPermonthInitForm and this.startDateInitForm
    await this.createStudyPlan()
  }



  async createStudyPlan() {
    const coursesRefs: DocumentReference[] = this.selectedProfile.coursesRef
    for (let i = 0; i < coursesRefs.length; i++) {
      // -------- this is just for test data. Substitute for the correct dates calculation
      const dateStartPlan = this.randomDate(new Date('2023-12-01'), new Date('2024-03-2'));
      const dateEndPlan = this.randomDate(new Date(dateStartPlan), new Date('2024-03-15'));
      // -------

      // --- move this to a service
      const ref = this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc().ref;
      const userRefer: DocumentReference = this.userService.getUserRefById(this.student.uid)
      const courseByStudent = {
        id: ref.id,
        userRef: userRefer,
        courseRef: coursesRefs[i],
        dateStartPlan: dateStartPlan,
        dateEndPlan: dateEndPlan,
        progress: 0,
        dateStart: null,
        dateEnd: null,
        active: true,
        finalScore: 0
      } as CourseByStudent;

      await this.afs.collection(CourseByStudent.collection).doc(courseByStudent.id).set(courseByStudent);
      // ---
    }

    // Create months 
    const userRef = this.userService.getUserRefById(this.student.uid)
    combineLatest([ this.courseService.getCourses$(), this.courseService.getActiveCoursesByStudent(userRef)]).
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

  // just for test DataTransfer. Delete it
  randomDate = (start: Date, end: Date): Date => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  };
  

  ngOnDestroy() {
    this.combinedObservableSubscription ? this.combinedObservableSubscription.unsubscribe() : null
  }

}
