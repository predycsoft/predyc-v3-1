import { Component, Input } from '@angular/core';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';

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
  ){}

  studentProfile: Profile

  ngOnInit() {
    this.studentProfile = this.profileService.getProfile(this.student.profile.id)
  }
  
}
