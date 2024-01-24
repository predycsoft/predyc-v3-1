import { Component, Input } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { Profile } from 'src/app/shared/models/profile.model';
import { CourseByStudent } from 'src/app/shared/models/course-by-student';
import { User } from 'src/app/shared/models/user.model';
import { CourseService } from 'src/app/shared/services/course.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';


interface Month {
  monthName: string;
  monthNumber: number
  courses: any[];
}

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent {
  
  @Input() student: User
  constructor(
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
    private courseService: CourseService,
  ){}

  studentProfile: Profile
  combinedObservableSubscription: Subscription
  months: Month[]
  

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
    this.studentProfile = this.student.profile ? this.profileService.getProfile(this.student.profile.id) : null

    const userRef = this.userService.getUserRefById(this.student.uid)

    this.combinedObservableSubscription = combineLatest([ this.courseService.getCourses$(), this.courseService.getCoursesByStudent(userRef)]).
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

  buildMonths(coursesByStudent: CourseByStudent[], coursesData) {
    const months = {}; 
    coursesByStudent.forEach(courseByStudent => {
      const courseData = coursesData.find(courseData => courseData.id === courseByStudent.courseRef.id);
      if (courseData) {
        const studyPlanData = {
          duration: courseData.duracion / 60,
          courseTitle: courseData.titulo,
          dateStartPlan: courseByStudent.dateStartPlan,
          dateEndPlan: courseByStudent.dateEndPlan,
          dateStart: courseByStudent.dateStart,
          dateEnd: courseByStudent.dateEnd,
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
      const monthNumber = new Date(months[monthName][0].dateEndPlan).getUTCMonth()
      return {
        monthName,
        monthNumber,
        courses: months[monthName]
      };
    });
    this.months.sort((a, b) => b.monthNumber - a.monthNumber);
    console.log("this.months", this.months);
  }
  
}
