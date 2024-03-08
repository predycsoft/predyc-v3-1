import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { BehaviorSubject, firstValueFrom, Observable, Subscription } from 'rxjs';
import { Notification } from 'projects/shared/models/notification.model';
import { EnterpriseService } from './enterprise.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();
  private notificationsLoadedSubject = new BehaviorSubject<boolean>(false)
  public notificationsLoaded$ = this.notificationsLoadedSubject.asObservable()

  notificationCollectionSubscription: Subscription

  constructor(
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded && !this.notificationsLoadedSubject.value) {
        this.notificationsLoadedSubject.next(true)
      }
    })
  }

  async addNotification(notification: Notification): Promise<void> {
    const ref = this.afs.collection<Notification>(Notification.collection).doc().ref;
    await ref.set({...notification.toJson(), id: ref.id}, { merge: true });
    notification.id = ref.id;
  }

  getNotifications$(): Observable<Notification[]> {
    return this.afs.collection<Notification>(Notification.collection).valueChanges()
  }

  getNotifications() {
    return this.afs.collection<Notification>(Notification.collection).valueChanges().subscribe(notifications => {
      console.log("New notifications", notifications)
      this.notificationsSubject.next(notifications)
    })
  }

  async deleteNotification(notificationId: string) {
    await this.afs.collection<Notification>(Notification.collection).doc(notificationId).delete()
  }
  

  // Old versions

  // getNotifications$(queryObj: {
  //   pageSize: number
  //   startAt?: Notification
  //   startAfter?: Notification
  //   typeFilter?: typeof Notification.TYPE_EVENT |
  //               typeof Notification.TYPE_ALERT |
  //               typeof Notification.ARCHIVED
  // }): Observable<Notification[]> {
  //   return this.afs.collection<Notification>(Notification.collection, ref => {
  //     let query: CollectionReference | Query = ref;
  //       query = query.where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
  //       if (queryObj.typeFilter) {
  //         console.log(`Filter has been set as ${queryObj.typeFilter}`)
  //         if (queryObj.typeFilter === 'archived') {
  //           query = query.where('readByAdmin', '==', true)
  //         } else {
  //           query = query.where('type', '==', queryObj.typeFilter).where('readByAdmin', '==', false)
  //         }
  //       } else {
  //         query = query.where('readByAdmin', '==', false)
  //       }
  //       query = query.orderBy('date', 'desc')
  //       if (queryObj.startAt) {
  //         query = query.startAt(queryObj.startAt.date)
  //       } else if (queryObj.startAfter) {
  //         query = query.startAfter(queryObj.startAfter.date)
  //       }
  //       return query.limit(queryObj.pageSize)
  //   }).valueChanges()
  // }


  // public getNotifications(queryObj: {
  //   pageSize: number
  //   startAt?: Notification
  //   startAfter?: Notification
  //   typeFilter?: typeof Notification.TYPE_EVENT |
  //               typeof Notification.TYPE_ALERT |
  //               typeof Notification.ARCHIVED
  // }) {
  //   // console.log("queryObj", queryObj)
  //   if (this.notificationCollectionSubscription) {
  //     console.log("Has to unsubscribe before")
  //     this.notificationCollectionSubscription.unsubscribe();
  //   }
  //   this.notificationCollectionSubscription = this.afs.collection<Notification>(Notification.collection, ref => {
  //       let query: CollectionReference | Query = ref;
  //       query = query.where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
  //       if (queryObj.typeFilter) {
  //         console.log(`Filter has been set as ${queryObj.typeFilter}`)
  //         if (queryObj.typeFilter === 'archived') {
  //           query = query.where('readByAdmin', '==', true)
  //         } else {
  //           query = query.where('type', '==', queryObj.typeFilter).where('readByAdmin', '==', false)
  //         }
  //       } else {
  //         query = query.where('readByAdmin', '==', false)
  //       }
  //       query = query.orderBy('date', 'desc')
  //       if (queryObj.startAt) {
  //         query = query.startAt(queryObj.startAt.date)
  //       } else if (queryObj.startAfter) {
  //         query = query.startAfter(queryObj.startAfter.date)
  //       }
  //       return query.limit(queryObj.pageSize)
  //     }
  //   ).valueChanges().subscribe(notifications => {
  //     console.log("New notifications", notifications)
  //     this.notificationsSubject.next(notifications)
  //   })
  // }



}
