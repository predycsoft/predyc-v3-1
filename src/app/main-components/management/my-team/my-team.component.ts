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
  styleUrls: ['./my-team.component.css']
})
export class MyTeamComponent {
  constructor(
    public icon: IconService,
    private loaderService: LoaderService,
    private userService: UserService
  ){}

  studentSelected = false

  users: User[]
  pageSize: number = 10
  sortBy: string = 'default'
  async ngOnInit() {
    const users = this.userService.getUsers(this.pageSize, this.sortBy)
  }

  applyFilter(event: Event) {
    
  }

}
