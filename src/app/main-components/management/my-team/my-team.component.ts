import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Profile } from 'src/app/shared/models/profile.model';

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
  users: User[] 
  profiles: Profile[]
  selectedProfileId: string = null;

  isListView = true

  // ?sortBy=Deparment&pageSize=25&page=2&name=searchText

  ngOnInit() {
    this.route.fragment.subscribe((fragment: string) => {
      if (fragment === 'createNewStudent') {
          this.createNewStudent();
      }
    });

    this.users$.subscribe(users => {if (users) this.users = users})
    this.profileService.getProfilesObservable().subscribe(profiles => {if (profiles) this.profiles = profiles})
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

  log() {
    console.log(this.selectedProfileId)
  }

}
