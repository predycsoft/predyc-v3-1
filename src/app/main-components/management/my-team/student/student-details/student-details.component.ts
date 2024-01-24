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
import { firestoreTimestampToNumberTimestamp } from 'src/app/shared/utils';


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


  ngOnInit() {
    this.studentProfile = this.student.profile ? this.profileService.getProfile(this.student.profile.id) : null
    
  }

 
  
}
