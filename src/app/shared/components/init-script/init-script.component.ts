import { Component } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';
import { UserService } from '../../services/user.service';
import { Enterprise } from '../../models/enterprise.model';
import { User } from '../../models/user.model';

import { enterpriseData } from 'src/assets/data/enterprise'
import { usersData } from 'src/assets/data/users'
import { notificationsData } from 'src/assets/data/notifications'
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-init-script',
  templateUrl: './init-script.component.html',
  styleUrls: ['./init-script.component.css']
})
export class InitScriptComponent {

  constructor(
    private enterpriseService: EnterpriseService,
    private notificationService: NotificationService,
    private userService: UserService
  ) {}

  async ngOnInit() {}

  async initDatabase() {
    // Create base enterprise
    // console.log('********* Creating Enterprise *********')
    // const enterprise: Enterprise = Enterprise.fromJson(enterpriseJson)
    // await this.enterpriseService.addEnterprise(enterprise)
    // const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)
    // console.log(`Finished Creating Enterprise`)
  
    // Create Departments and profiles

    // Create admin and student users
    // console.log('********* Creating Users *********')
    // const users: User[] = Array.from(usersJson).map(user => {
    //   return User.fromJson({
    //     ...user,
    //     birthdate: Date.parse(user.birthdate),
    //     createdAt: Date.parse(user.createdAt),
    //     enterprise: enterpriseRef
    //   })
    // })
    // for (let user of users) {
    //   await this.userService.addUser(user)
    // }
    // console.log(`Finished Creating Users`)

    // Create skills

    // Create categories

    // Create coursesClasses and courses

    // Create notifications
    this.enterpriseService.loadEnterpriseData()
    await this.userService.loadUsers()
    await this.userService.whenUsersLoaded()
    const enterpriseRef = this.enterpriseService.getEnterpriseRef()
    const users = await firstValueFrom(this.userService.getUsersObservable())
    console.log('********* Creating Notifications *********')
    const notifications: Notification[] = notificationsData.map(notification => {
      const randomUser = users[Math.floor(Math.random()*users.length)];
      const userRef = this.userService.getUserRefById(randomUser.uid)
      console.log("userRef", userRef)
      console.log("enterpriseRef", enterpriseRef)
      console.log("notification", Notification.fromJson({
        ...notification,
        readByUser: notification.readByUser,
        userRef: userRef,
        enterpriseRef: enterpriseRef
      }))
      return Notification.fromJson({
        ...notification,
        readByUser: notification.readByUser,
        userRef: userRef,
        enterpriseRef: enterpriseRef
      })
    })
    console.log("notifications", notifications)


    for (let notification of notifications) {
      await this.notificationService.addNotification(notification)
    }
    console.log(`Finished Creating Notification`)

  }
}
