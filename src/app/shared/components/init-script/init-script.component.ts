import { Component } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';
import { UserService } from '../../services/user.service';
import { Enterprise } from '../../models/enterprise.model';
import { User } from '../../models/user.model';

import { enterpriseData } from 'src/assets/data/enterprise.data'
import { usersData } from 'src/assets/data/users.data'
import { notificationsData } from 'src/assets/data/notifications.data'
import { Notification } from '../../models/notification.model';
import { NotificationService } from '../../services/notification.service';
import { Coupon } from '../../models/coupon.model';
import { couponsData } from 'src/assets/data/coupon.data';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { productsData } from 'src/assets/data/product.data';
import { Product } from '../../models/product.model';
import { Price } from '../../models/price.model';
import { pricesData } from 'src/assets/data/price.data';
import { License } from '../../models/license.model';
import { licensesData } from 'src/assets/data/license.data';

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
    private userService: UserService
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
    for (let price of prices) {
      let priceRef = this.afs.collection<Price>("price").doc(price.id).ref;
      pricesRef.push(priceRef)
      await priceRef.set({...price.toJson()}, { merge: true });
    }
    console.log(`Finished Creating Products`)

    // Create License
    console.log('********* Creating Licenses *********')
    const license: License = License.fromJson(licensesData)
    const licenseRef = this.afs.collection<License>("license").doc(license.id).ref;
    await licenseRef.set({...license.toJson()}, {merge: true})
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

    // Create skills

    // Create categories

    // Create coursesClasses and courses

    // Create notifications
    // this.enterpriseService.loadEnterpriseData()
    // await this.userService.loadUsers()
    // await this.userService.whenUsersLoaded()
    // const enterpriseRef = this.enterpriseService.getEnterpriseRef()
    // const users = await firstValueFrom(this.userService.getUsersObservable())
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
