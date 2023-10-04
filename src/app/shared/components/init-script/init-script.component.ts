import { Component } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';
import { UserService } from '../../services/user.service';
import { Enterprise } from '../../models/enterprise.model';
import { User } from '../../models/user.model';
import { Category } from '../../models/category.model'
import { Skill } from '../../models/skill.model';

import { enterpriseData } from 'src/assets/data/enterprise.data'
import { usersData } from 'src/assets/data/users.data'
import { notificationsData } from 'src/assets/data/notifications.data'
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { categoriesData } from 'src/assets/data/categories.data';
import { CategoryService } from '../../services/category.service';
import { skillsData } from 'src/assets/data/skills.data';
import { SkillService } from '../../services/skill.service';
// import { coursesData } from 'src/assets/data/courses.data'

@Component({
  selector: 'app-init-script',
  templateUrl: './init-script.component.html',
  styleUrls: ['./init-script.component.css']
})
export class InitScriptComponent {

  constructor(
    private enterpriseService: EnterpriseService,
    private notificationService: NotificationService,
    private userService: UserService,
    private categoryService: CategoryService,
    private skillService: SkillService
  ) {}

  async ngOnInit() {}

  async initDatabase() {
    // Create base enterprise
    console.log('********* Creating Enterprise *********')
    const enterprise: Enterprise = Enterprise.fromJson(enterpriseData)
    await this.enterpriseService.addEnterprise(enterprise)
    const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)
    console.log(`Finished Creating Enterprise`)
  
    // Create Departments and profiles

    // Create admin and student users
    console.log('********* Creating Users *********')
    const users: User[] = usersData.map(user => {
      return User.fromJson({
        ...user,
        birthdate: Date.parse(user.birthdate),
        createdAt: Date.parse(user.createdAt),
        updatedAt: Date.parse(user.updatedAt),
        enterprise: enterpriseRef
      })
    })
    for (let user of users) {
      await this.userService.addUser(user)
    }
    console.log(`Finished Creating Users`)

    // Create categories
    console.log('********* Creating Categories *********')
    const categories: Category[] = categoriesData.map(category => {
      return Category.fromJson({
        ...category,
        enterprise: enterpriseRef
      })
    })
    console.log("categories", categories)
    for (let category of categories) {
      await this.categoryService.addCategory(category)
    }
    console.log(`Finished Creating Categories`)

    // Create skills
    console.log('********* Creating Skills *********')
    const skills: Skill[] = skillsData.map(skill => {
      const randomCategory = categories[Math.floor(Math.random()*categories.length)];
      const categoryRef = this.categoryService.getCategoryRefById(randomCategory.id)
      return Skill.fromJson({
        ...skill,
        category: categoryRef,
        enterprise: enterpriseRef,
      })
    })
    for (let skill of skills) {
      await this.skillService.addSkill(skill)
    }
    console.log(`Finished Creating Skills`)
  
    // Create coursesClasses and courses

    // Create notifications 
    console.log('********* Creating Notifications *********')
    const notifications: Notification[] = notificationsData.map(notification => {
      const randomUser = users[Math.floor(Math.random()*users.length)];
      const userRef = this.userService.getUserRefById(randomUser.uid)
      return Notification.fromJson({
        ...notification,
        readByUser: notification.readByUser,
        userRef: userRef,
        enterpriseRef: enterpriseRef
      })
    })

    for (let notification of notifications) {
      await this.notificationService.addNotification(notification)
    }
    console.log(`Finished Creating Notification`)
  }

}
