import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';

@AfterOnInitResetLoading
@Component({
  selector: 'app-my-team',
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.css'],
})
export class MyTeamComponent {
  constructor(
    public icon: IconService,
    private loaderService: LoaderService,
    private userService: UserService
  ){}

  studentSelected: User | null = null

  users: User[]
  pageSize: number = 10
  sortBy: string = 'default'

  // ?sortBy=Deparment&pageSize=25&page=2&name=searchText
  async ngOnInit() {
    this.userService.getUsers(this.pageSize, this.sortBy)
  }

  createNewStudent() {
    this.studentSelected = User.getEnterpriseStudentUser('empresa1', 'Nombre de la empresa')
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
  onStudentDeleteHandler (student: User) {
    try {
      this.userService.delete(student)
    } catch (error) {
      
    }
  }

  addUser() {
    try {
      // await this.userService.addUser(user)
      // sweetAlert.success
    } catch (error) {
      // sweetAlert.error(error)
    }
  }

  applyFilter(event: Event) {
    
  }

}
