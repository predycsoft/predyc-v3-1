import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Profile } from 'src/app/shared/models/profile.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { CourseService } from 'src/app/shared/services/course.service';
import { Subscription, combineLatest, map, switchMap } from 'rxjs';
import { Log } from 'src/app/main-components/dashboard/users-study-time-container/users-study-time-container.component';
import { firestoreTimestampToNumberTimestamp } from 'src/app/shared/utils';


@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent {
  
  @Input() student: User
  originalStudentData: UserJson
  constructor(
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
    private alertService: AlertsService,
    private courseService: CourseService,
  ){}

  studentProfile: Profile
  courseServiceSubscription: Subscription

  logs: Log[] = []
  logsInCurrentMonth: Log[] = []
  hoursTimeMonth: number

  currentMonth = new Date().getUTCMonth();  

  currentYear = new Date().getUTCFullYear()


  ngOnInit() {
    this.studentProfile = this.student.profile ? this.profileService.getProfile(this.student.profile.id) : null
    if (this.student) this.originalStudentData = {... this.student};  

    //
    this.courseServiceSubscription = this.courseService.getClassesByStudent$(this.userService.getUserRefById(this.student.uid))
    .pipe(
      switchMap(classesByStudent => {
        if (classesByStudent.length > 0) {
          // Obtener un array de Observables para cada clase
          const classObservables = classesByStudent.map(studentClass =>
            this.courseService.getClass$(studentClass.classRef.id).pipe(
              map(clase => ({
                classDuration: clase.duracion,
                endDate: firestoreTimestampToNumberTimestamp(studentClass.dateEnd)
              }))
            )
          );
          return combineLatest(classObservables);
        } else {
          return [];
        }
      })
    )
    .subscribe(logs => {
      if (logs.length > 0) {
        // console.log("logs", logs); 
        this.logs = logs
        this.logsInCurrentMonth = logs.filter(log => {
          const logMonth = new Date(log.endDate).getUTCMonth(); 
          const logYear = new Date(log.endDate).getUTCFullYear();
          return logMonth === this.currentMonth && logYear === this.currentYear;
        })
        console.log("this.logsInCurrentMonth",this.logsInCurrentMonth)
        this.hoursTimeMonth = (this.logsInCurrentMonth.reduce((total, currentClass) => total + currentClass.classDuration, 0)) / 60;
      }
    });


  }

  async onStudentSaveHandler(student: User) {
    try {
      const [hasUserDataChanged, hasProfileChanged] = this.hasDataChanges(student);
      if (hasUserDataChanged){
        await this.userService.editUser(student)
        this.originalStudentData = {...student}
        if(hasProfileChanged) {
          this.studentProfile = this.profileService.getProfile(student.profile.id)
        }
        this.alertService.succesAlert(`Información editada satisfactoriamente`);
      }
    } catch (error) {
      console.log(error)
    }
  }

  hasDataChanges(newStudent: User) {
    let originalData = {...this.originalStudentData, profile: undefined, enterprise: undefined};
    let newData = {...newStudent, profile: undefined, enterprise: undefined};
  
    if (this.originalStudentData.profile) { originalData.profile = this.originalStudentData.profile.id; }
    if (this.originalStudentData.enterprise) { originalData.enterprise = this.originalStudentData.enterprise.id; }
    if (newStudent.profile) { newData.profile = newStudent.profile.id; }
    if (newStudent.enterprise) { newData.enterprise = newStudent.enterprise.id; }
    
    let hasProfileChanged = false
    if (originalData.profile != newData.profile) hasProfileChanged = true
    
    return [JSON.stringify(originalData) !== JSON.stringify(newData), hasProfileChanged];
  }
  

 
  
}
