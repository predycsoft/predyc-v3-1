import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { EnterpriseService } from './enterprise.service';
import { Subscription } from '../models/subscription.model';
import { License } from '../models/license.model';
import { User } from '../models/user.model';
import { Enterprise } from '../models/enterprise.model';
import { DialogService } from './dialog.service';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private dialogService: DialogService
  ) { }

  private enterpriseRef: DocumentReference = this.enterpriseService.getEnterpriseRef()

  async createUserSubscription(license: License, user: User) {
    let subscription = new Subscription
      
    subscription.canceledAt = null
    subscription.changedAt = null
    subscription.couponRef = license.coupon
    subscription.createdAt = Date.now() 
    subscription.createdAtOrigin = Date.now() 
    subscription.currency = "usd"
    subscription.currentError = null
    subscription.currentPeriodEnd = license.currentPeriodEnd
    subscription.endedAt = null
    subscription.id = 'PRE_' + +new Date()
    subscription.idAtOrigin = 'PRE_' + +new Date()  
    subscription.interval = 1
    subscription.nextPaymentAmount = null
    subscription.nextPaymentDate = null 
    subscription.trialEndedAt = null 
    subscription.trialStartedAt = null 
    subscription.userRef = this.userService.getUserRefById(user.uid)
    subscription.origin = "Predyc"
    subscription.priceRef = license.price
    subscription.startedAt = Date.now()
    subscription.status = "active"
    subscription.currentPeriodStart = Date.now()
    subscription.customer = user.uid
    subscription.enterpriseRef = this.enterpriseRef

    console.log('subscription', subscription)

    let subscritionJson = subscription.toJson()
    await this.afs.collection(Subscription.collection).doc(subscription.id).set(subscritionJson);

    // ----------- No guardar status como variable en coleccion de user?
    // user.status = subscription.status
    // this.afs.collection(User.collection).doc(user.uid).set(
    //   {
    //     status: "active" 
    //   },{ merge: true }
    // );
    // ------------------

 
  }
}
