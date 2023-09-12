import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';

@Component({
  selector: 'app-my-team',
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.css']
})
export class MyTeamComponent {
  constructor(
    public icon: IconService,
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
