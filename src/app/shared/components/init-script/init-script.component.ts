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
import { Coupon } from '../../models/coupon.model';
import { couponsData } from 'src/assets/data/coupon.data';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { productsData } from 'src/assets/data/product.data';
import { Product } from '../../models/product.model';
import { Price } from '../../models/price.model';
import { pricesData } from 'src/assets/data/price.data';
import { License } from '../../models/license.model';
import { licensesData } from 'src/assets/data/license.data';
import { categoriesData } from 'src/assets/data/categories.data';
import { CategoryService } from '../../services/category.service';
import { skillsData } from 'src/assets/data/skills.data';
import { SkillService } from '../../services/skill.service';
import {deparmentsData} from 'src/assets/data/departments.data'
import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
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
    private afs: AngularFirestore,
    private userService: UserService,
    private categoryService: CategoryService,
    private skillService: SkillService,
    private departmentService:DepartmentService
  ) {}

  async ngOnInit() {}

  async initDatabase() {
    // Create Coupons
    console.log('********* Creating Coupons *********')
    const coupons: Coupon[] = couponsData.map(coupon => {
      return Coupon.fromJson(coupon)
    })
    let couponsRef = []
    for (let coupon of coupons ) {
      let couponRef = this.afs.collection<Coupon>("coupon").doc(coupon.id).ref;
      couponsRef.push(couponRef)
      await couponRef.set({...coupon.toJson()}, { merge: true });
    }
    console.log(`Finished Creating Coupons`)

    // Create Products
    console.log('********* Creating Products *********')
    const products: Product[] = productsData.map(product => {
      return Product.fromJson(product)
    })
    let productsRef = []
    for (let product of products) {
      let productRef = this.afs.collection<Product>("product").doc(product.id).ref;
      productsRef.push(productRef)
      await productRef.set({...product.toJson()}, { merge: true });
    }
    console.log(`Finished Creating Products`)

    // Create Prices
    console.log('********* Creating Prices *********')
    const prices: Price[] = pricesData.map(price => {
      return Price.fromJson(price)
    })
    let pricesRef = []

    for (let index = 0; index < prices.length; index++) {
    const price = prices[index];
    let priceRef = this.afs.collection<Price>("price").doc(price.id).ref;
    pricesRef.push(priceRef)
    let productRef = index <= productsRef.length - 1 ? productsRef[index] : productsRef[index - (productsRef.length)]
    await priceRef.set(
      {
        ...price.toJson(), 
        coupon: couponsRef[index],
        product: productRef
      }, { merge: true });
    }
    console.log(`Finished Creating Prices`)

    // Create License
    console.log('********* Creating Licenses *********')
    const license: License = License.fromJson(licensesData)
    const licenseRef = this.afs.collection<License>("license").doc(license.id).ref;
    const licensePriceRef = pricesRef[0] 
    const licensePriceValue = (await ((licensePriceRef as DocumentReference).get())).data() as Price
    const couponPriceRef = licensePriceValue.coupon
    await licenseRef.set(
      {
        ...license.toJson(),
        price: licensePriceRef,
        coupon: couponPriceRef,
      }, {merge: true}
    )
    console.log(`Finished Creating License`)

    // Create base enterprise
    console.log('********* Creating Enterprise *********')
    const enterprise: Enterprise = Enterprise.fromJson(enterpriseData)
    enterprise.license = licenseRef
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


    // Create Departments 
    console.log('********* Creating Departments *********')

    deparmentsData.forEach(department => {
      console.log(department)
      let departmentready = new Department(department.id,department.name)
      this.departmentService.addDepartment(departmentready)
      
    });
  }

}
