import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { ActivatedRoute } from '@angular/router';

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
  ){}

  studentSelected: User | null = null

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

  onStudentSaveHandler(student: User) {
    try {
      if (student.uid) {
        this.userService.editUser(student)
      } else {
        this.userService.addUser(student)
      }
    } catch (error) {
      console.log(error)
    }
  }

}
