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
import { firstValueFrom } from 'rxjs';
import { profilesData } from 'src/assets/data/profiles.data';
import { Profile } from '../../models/profile.model';
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
    private departmentService:DepartmentService,
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
      let couponRef = this.afs.collection<Coupon>(Coupon.collection).doc(coupon.id).ref;
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
      let productRef = this.afs.collection<Product>(Product.collection).doc(product.id).ref;
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
    let priceRef = this.afs.collection<Price>(Price.collection).doc(price.id).ref;
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

    // Create base enterprise
    console.log('********* Creating Enterprise *********')
    const enterprise: Enterprise = Enterprise.fromJson(enterpriseData)
    await this.enterpriseService.addEnterprise(enterprise)
    const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)
    console.log(`Finished Creating Enterprise`)

    // Create License
    console.log('********* Creating Licenses *********')
    const license: License = License.fromJson(licensesData)
    const licenseRef = this.afs.collection<License>(License.collection).doc(license.id).ref;
    const licensePriceRef = pricesRef[0] 
    const licensePriceValue = (await ((licensePriceRef as DocumentReference).get())).data() as Price
    const couponPriceRef = licensePriceValue.coupon
    await licenseRef.set(
      {
        ...license.toJson(),
        price: licensePriceRef,
        coupon: couponPriceRef,
        enterpriseRef: enterpriseRef
      }, {merge: true}
    )
    console.log(`Finished Creating License`)
  
    // Create admin and student users
    console.log('********* Creating Users *********')
    const users: User[] = usersData.map(user => {
      return User.fromJson({
        ...user,
        birthdate: Date.parse(user.birthdate),
        createdAt: Date.parse(user.createdAt),
        updatedAt: Date.parse(user.updatedAt),
        enterprise: enterpriseRef,
        performance: user.performance as 'no plan' | 'low' | 'medium' | 'high' | null
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
    // console.log("categories", categories)
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
      let departmentready = new Department(department.id, department.name, enterpriseRef)
      this.departmentService.addDepartment(departmentready)
    });
    console.log(`Finished Creating Departments`)

    // Create profiles
    console.log('********* Creating Profiles *********')
    await this.addProfiles()
    console.log(`Finished Creating Profiles`)
    // Create validation tests
    // console.log('********* Creating Validation Tests *********')
    // console.log(`Finished Creating Validation Tests`)
  }


  async addProfiles() {
    const departmentSnapshot = await firstValueFrom(this.afs.collection(Department.collection).get());
    const departmentRefs = departmentSnapshot.docs.map(doc => doc.ref);
    const skillSnapshot = await firstValueFrom(this.afs.collection(Skill.collection).get());
    const skillRefs = skillSnapshot.docs.map(doc => doc.ref);
    const userSnapshot = await firstValueFrom(this.afs.collection(User.collection).get());
    const userRefs = userSnapshot.docs.map(doc => doc.ref);
    const enterpriseSnapshot = await firstValueFrom(this.afs.collection(Enterprise.collection).get());
    const enterpriseRefs = enterpriseSnapshot.docs.map(doc => doc.ref);
    
    let departmentIndex = 0;
    let skillIndex = 0;
    let userIndex = 0;
    let enterpriseIndex = 0;
    
    for (const profile of profilesData) {
      const profileRef = this.afs.collection(Profile.collection).doc();
      const id = profileRef.ref.id;
  
      // Obtener las referencias correspondientes y avanzar los índices
      const currentDepartmentRef = departmentRefs[departmentIndex % departmentRefs.length];
      const currentSkillRef = skillRefs[skillIndex % skillRefs.length];
      const currentUserRef = userRefs[userIndex % userRefs.length];
      const currentEnterpriseRef = enterpriseRefs[enterpriseIndex % enterpriseRefs.length];

      await profileRef.set({
          ...profile,
          id: id,
          departmentRef: currentDepartmentRef,
          skillsRef: [currentSkillRef],
          usersRef: [currentUserRef],
          enterpriseRef: [currentEnterpriseRef],
      });
      console.log("id", id);
      // Incrementar los índices para el siguiente profile
      departmentIndex++;
      skillIndex++;
      userIndex++;
      enterpriseIndex++;
    }

  }

}
