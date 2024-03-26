import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { Curso } from 'projects/shared/models/course.model';
import { Profile } from 'projects/shared/models/profile.model';
import { User } from 'projects/shared/models/user.model';
import { Subscription, combineLatest } from 'rxjs';

@Component({
  selector: 'app-student-extra-courses',
  templateUrl: './student-extra-courses.component.html',
  styleUrls: ['./student-extra-courses.component.css']
})
export class StudentExtraCoursesComponent {

  @Input() userProfileRef: DocumentReference<Profile>
  @Input() userRef: DocumentReference<User>

  constructor(
    private courseService: CourseService,
    private profileService: ProfileService,
    private alertService: AlertsService,
  ){}

  combinedObservableSubscription: Subscription
  profile: Profile
  allcoursesData: Curso[]
  coursesByStudent: CourseByStudent[]
  coursesInfo: any[]
  hasExtraCourses = true


  ngOnInit() {
    console.log("this.userProfileRef", this.userProfileRef)

    if (this.userProfileRef) {
      this.combinedObservableSubscription = combineLatest([ 
        this.courseService.getCourses$(), 
        this.courseService.getActiveCoursesByStudent$(this.userRef), 
        this.profileService.getProfile$(this.userProfileRef.id)
      ]).
      subscribe(([allcoursesData, coursesByStudent, profile]) => {
        this.profile = profile
        console.log("this.profile", this.profile)
        if (allcoursesData.length > 0) {
          this.allcoursesData = allcoursesData
          if (coursesByStudent.length > 0) {
            this.coursesByStudent = coursesByStudent;
            // Studyplan case
            if (coursesByStudent[0].dateStartPlan) {
              this.hasExtraCourses = false
              console.log("El estudiante posee un plan de estudios")
            }
            // Extra courses case
            else {
              this.hasExtraCourses = true
              console.log("El estudiante posee cursos extracurriculares")
            }
            this.coursesInfo = this.coursesByStudent.map(courseByStudent => {
              const courseInfo = this.allcoursesData.find(x => x.id === courseByStudent.courseRef.id)
              return {
                courseTitle: courseInfo.titulo
              }
            })
          } 
          else {
            this.alertService.infoAlert("Aun no posee plan de estudio o cursos extracurriculares")
          }
        }
      });
    }
    else {
      console.log("El estudiante no tiene perfil asignado")
    }
  }

  async saveAsExtraCourse() {
    const coursesRefs: DocumentReference[] = this.profile.coursesRef
    for (let i = 0; i < coursesRefs.length; i++) {

      const courseByStudent: CourseByStudent | null = await this.courseService.getCourseByStudent(this.userRef as DocumentReference<User>, coursesRefs[i] as DocumentReference<Curso>)
      //  ---------- if it already exists, activate it, otherwise, create it ---------- 
      if (courseByStudent) {
        console.log("Activando courseByStudent", courseByStudent)
        await this.courseService.setCourseByStudentActive(courseByStudent.id, null, null)
      } else {
        console.log("Creando nuevo courseByStudent", coursesRefs[i])
        await this.courseService.saveCourseByStudent(coursesRefs[i], this.userRef, null, null)
        // await this.courseService.setCoursesByStudentInactive(this.userRef)
      }
    }
  }

}