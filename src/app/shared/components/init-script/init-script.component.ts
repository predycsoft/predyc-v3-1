import { Component } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';
import { UserService } from '../../services/user.service';
import { Enterprise } from '../../models/enterprise.model';
import { User } from '../../models/user.model';

import * as enterpriseJson from 'src/assets/data/enterprise.json'
import * as usersJson from 'src/assets/data/users.json'

@Component({
  selector: 'app-init-script',
  templateUrl: './init-script.component.html',
  styleUrls: ['./init-script.component.css']
})
export class InitScriptComponent {

  constructor(
    private enterpriseService: EnterpriseService,
    private userService: UserService
  ) {}

  async initDatabase() {
    // Create base enterprise
    const enterprise: Enterprise = Enterprise.fromJson(enterpriseJson)
    await this.enterpriseService.addEnterprise(enterprise)
    const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)

    // Create Departments and profiles

    // Create admin and student users
    const users: User[] = usersJson.map(user => {
      return User.fromJson({
        ...user,
        birthdate: Date.parse(user.birthdate),
        createdAt: Date.parse(user.createdAt),
        enterprise: enterpriseRef
      })
    })
    for (let user of users) {
      await this.userService.addUser(user)
    }

    // Create coursesClasses and courses

    // Create notifications

  }
}
