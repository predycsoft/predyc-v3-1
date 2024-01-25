import { Component, Input } from '@angular/core';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
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
  constructor(
    public icon: IconService,
    private profileService: ProfileService,
    private userService: UserService,
    private alertService: AlertsService,
  ){}

  studentProfile: Profile


  ngOnInit() {
    this.studentProfile = this.student.profile ? this.profileService.getProfile(this.student.profile.id) : null
    
  }

  async onStudentSaveHandler(student: User) {
    try {
      console.log("student en componente padre", student)
      await this.userService.editUser(student)
      this.alertService.succesAlert(`Información editada satisfactoriamente`);
    } catch (error) {
      console.log(error)
    }
  }

 
  
}
