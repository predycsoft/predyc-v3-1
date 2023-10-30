import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ProfileService } from 'src/app/shared/services/profile.service';

@Component({
  selector: 'app-my-team',
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.css'],
})
export class MyTeamComponent {
  constructor(
    public icon: IconService,
    private userService: UserService,
    private enterpriseService: EnterpriseService,
    private route: ActivatedRoute,
    private profileService: ProfileService,

  ){}

  studentSelected: User | null = null

  users$: Observable<User[]> = this.userService.users$

  // ?sortBy=Deparment&pageSize=25&page=2&name=searchText

  ngOnInit() {
    this.route.fragment.subscribe((fragment: string) => {
      if (fragment === 'createNewStudent') {
          this.createNewStudent();
      }
    });

  }

  createNewStudent() {
    this.studentSelected = User.getEnterpriseStudentUser(this.enterpriseService.getEnterpriseRef())
  }

  async onStudentSaveHandler(student: User) {
    try {
      if (student.uid) {
        await this.userService.editUser(student)
      } else {
        await this.userService.addUser(student)
      }
    } catch (error) {
      console.log(error)
    }
  }

}
