import { Component, Input } from '@angular/core';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-student-info-form',
  templateUrl: './student-info-form.component.html',
  styleUrls: ['./student-info-form.component.css']
})
export class StudentInfoFormComponent {
  @Input() student: User
  @Input() studentProfile: Profile

  constructor(
    public icon: IconService,
    // private userService: UserService,
  ){}
}
