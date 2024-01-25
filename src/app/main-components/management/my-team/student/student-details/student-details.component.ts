import { Component, Input } from '@angular/core';
import { Profile } from 'src/app/shared/models/profile.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';
import { AlertsService } from 'src/app/shared/services/alerts.service';


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
  ){}

  studentProfile: Profile


  ngOnInit() {
    this.studentProfile = this.student.profile ? this.profileService.getProfile(this.student.profile.id) : null
    if (this.student) this.originalStudentData = {... this.student};  
  }

  async onStudentSaveHandler(student: User) {
    try {
      if (this.hasDataChanges(student)){
        await this.userService.editUser(student)
        this.originalStudentData = {...student}
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
  
    return JSON.stringify(originalData) !== JSON.stringify(newData);
  }
  

 
  
}
