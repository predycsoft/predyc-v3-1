import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { EnterpriseService } from './enterprise.service';
import { Subscription } from '../models/subscription.model';
import { License } from '../models/license.model';
import { User } from '../models/user.model';
import { UserService } from './user.service';
import { firstValueFrom, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private userService: UserService,

  ) { }

  async createUserSubscription(license: License, licenseRef: DocumentReference, userId: string) {
    let subscription = new Subscription
      
    subscription.canceledAt = null
    subscription.changedAt = null
    subscription.couponRef = license.couponRef
    subscription.createdAt = Date.now() 
    subscription.createdAtOrigin = Date.now() 
    subscription.currency = "usd"
    subscription.currentError = null
    subscription.currentPeriodEnd = license.currentPeriodEnd
    subscription.currentPeriodStart = Date.now()
    subscription.customer = userId
    subscription.endedAt = null
    subscription.enterpriseRef = this.enterpriseService.getEnterpriseRef()
    subscription.id = 'PRE_' + + new Date() + userId
    subscription.idAtOrigin = 'PRE_' + +new Date() + userId
    subscription.interval = 1
    subscription.licenseRef = licenseRef
    subscription.nextPaymentAmount = null
    subscription.nextPaymentDate = null 
    subscription.trialEndedAt = null 
    subscription.trialStartedAt = null 
    subscription.userRef = this.userService.getUserRefById(userId)
    subscription.origin = "Predyc"
    subscription.priceRef = license.priceRef
    subscription.startedAt = Date.now()
    subscription.status = "active"

    console.log('subscription', subscription)

    let subscritionJson = subscription.toJson()
    await this.afs.collection(Subscription.collection).doc(subscription.id).set(subscritionJson);
    console.log("Suscripcion creada para:", userId)

    await this.afs.collection(User.collection).doc(userId).set(
      {
        status: "active" 
      },{ merge: true }
    );
    console.log("status del usuario establecido en active")
 
  }

  async removeUserSubscription(userId: string,licenses) {
    console.log('rotar',userId,licenses)
    try {
      const snapshots = await firstValueFrom(this.afs.collection<Subscription>(Subscription.collection, ref => 
        ref
        .where('userRef', '==', this.afs.doc<User>(`${User.collection}/${userId}`).ref)
        .where('status', '==', 'active')
      ).get());

      // console.log('snapshots.docs', snapshots.docs)
      const subscriptionsData = snapshots.docs.map(docSnapshot => docSnapshot.data() as Subscription);
      if (subscriptionsData.length > 0) {
        let subscription = subscriptionsData[0]
        let  licenseRef = subscription.licenseRef // para guardar que hay rotaciones esperando
        const docSnapshot = await licenseRef.get();
        let license = licenses.find(licenseData=>licenseData.rotationsWaitingCount+1<=(licenseData.rotations-licenseData.rotationsUsed) && (licenseData.status == 'active'))
        if(license){
        console.log('rotar',license)
          licenseRef = this.afs.doc<License>(`${License.collection}/${license.id}`).ref
          let rotationsWaitingCount = license.rotationsWaitingCount+1
          let quantityUsed = license.quantityUsed-1
          license.rotationsWaitingCount =rotationsWaitingCount
          license.quantityUsed =quantityUsed
          console.log('rotar cambios',rotationsWaitingCount,quantityUsed)
          await licenseRef.update({
            rotationsWaitingCount: rotationsWaitingCount,
            quantityUsed:quantityUsed
          });
        }
        else{
          if (docSnapshot.exists) {
            const licenseData = docSnapshot.data();
            await licenseRef.update({
              failedRotationCount: licenseData.failedRotationCount + 1,
            });
          }
        }

        await this.afs.collection(Subscription.collection).doc(subscription.id).set({
          canceledAt: Date.now(), 
          endedAt: Date.now(),
          status: "canceled" 
        }, { merge: true });
  
        await this.afs.collection(User.collection).doc(userId).set({
          status: "canceled" 
        }, { merge: true });
  
        console.log("Suscripción cancelada:", userId, subscription.id);
        
      } 
      else {
        console.log("No se encontraron suscripciones activas.");
      }
  
    } catch (error) {
      console.error("Error al eliminar suscripciones: ", error);
    }
  }

}


