import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
import { EnterpriseService } from './enterprise.service';
import { Subscription, SubscriptionJson } from 'projects/shared/models/subscription.model';
import { License } from 'projects/shared/models/license.model';
import { User } from 'projects/shared/models/user.model';
import { UserService } from './user.service';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private userService: UserService,

  ) { }

  getUserSubscriptions$(userRef: DocumentReference<User>): Observable<Subscription[]> {
    return this.afs.collection<Subscription>(Subscription.collection, ref =>
      ref.where('userRef', '==', userRef)
    ).valueChanges()
  }

  async getUserSubscriptions(userRef: DocumentReference<User>): Promise<Subscription[]> {
    return firstValueFrom(this.afs.collection<Subscription>(Subscription.collection, ref =>
      ref.where('userRef', '==', userRef).orderBy('createdAt', 'desc')
    ).valueChanges())
  }

  getSubscriptions$(): Observable<Subscription[]> {
    return this.afs.collection<Subscription>(Subscription.collection).valueChanges()
  }
  
  async createUserSubscriptionByLicense(license: License, licenseRef: DocumentReference, userId: string) {
    let subscription = new Subscription
      
    subscription.canceledAt = null
    subscription.changedAt = null
    subscription.createdAt = Date.now() 
    subscription.currency = "usd"
    subscription.currentError = null
    subscription.currentPeriodEnd = license.currentPeriodEnd
    subscription.currentPeriodStart = Date.now()
    subscription.endedAt = null
    subscription.enterpriseRef = this.enterpriseService.getEnterpriseRef()
    subscription.id = 'PRE_' + + new Date() + userId
    subscription.licenseRef = licenseRef
    subscription.nextPaymentAmount = null
    subscription.nextPaymentDate = null 
    subscription.userRef = this.userService.getUserRefById(userId)
    subscription.productRef = license.productRef
    subscription.startedAt = Date.now()
    subscription.status = Subscription.STATUS_ACTIVE

    console.log('subscription', subscription)

    let subscritionJson = subscription.toJson()
    await this.afs.collection(Subscription.collection).doc(subscription.id).set(subscritionJson);
    console.log("Suscripcion creada para:", userId)

    await this.afs.collection(User.collection).doc(userId).set(
      {
        status: Subscription.STATUS_ACTIVE
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
        .where('status', '==', Subscription.STATUS_ACTIVE)
      ).get());

      // console.log('snapshots.docs', snapshots.docs)
      const subscriptionsData = snapshots.docs.map(docSnapshot => docSnapshot.data() as Subscription);
      if (subscriptionsData.length > 0) {
        let subscription = subscriptionsData[0]
        let  licenseRef = subscription.licenseRef // para guardar que hay rotaciones esperando
        const docSnapshot = await licenseRef.get();
        let license = licenses.find(licenseData=>licenseData.rotationsWaitingCount+1<=(licenseData.rotations-licenseData.rotationsUsed) && (licenseData.status == Subscription.STATUS_ACTIVE))
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
            console.log('no rotar',license)
            const licenseData = docSnapshot.data();
            await licenseRef.update({
              failedRotationCount: licenseData.failedRotationCount + 1,
            });
          }
        }

        await this.afs.collection(Subscription.collection).doc(subscription.id).set({
          canceledAt: Date.now(), 
          endedAt: Date.now(),
          status: Subscription.STATUS_INACTIVE 
        }, { merge: true });
  
        await this.afs.collection(User.collection).doc(userId).set({
          status: Subscription.STATUS_INACTIVE 
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

  async saveSubscription(subscription: SubscriptionJson): Promise<void> {
    return await this.afs.collection(Subscription.collection).doc(subscription.id).set(subscription, { merge: true });
  }

}


