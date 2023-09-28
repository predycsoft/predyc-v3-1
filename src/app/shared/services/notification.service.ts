import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { BehaviorSubject, firstValueFrom, Subscription } from 'rxjs';
import { Notification } from 'src/app/shared/models/notification.model';
import { EnterpriseService } from './enterprise.service';


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
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.notificationsLoadedSubject.next(true)
      }
    })
  }

  async addNotification(notification: Notification): Promise<void> {
    try {
      const ref = this.afs.collection<Notification>(Notification.collection).doc().ref;
      await ref.set({...notification.toJson(), id: ref.id}, { merge: true });
      notification.id = ref.id;
      console.log("Notification added succesfully")
      this.alertService.succesAlert('Has agregado una nueva notificacion exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  public getNotifications(queryObj: {
    pageSize: number
    startAt?: Notification
    startAfter?: Notification
    typeFilter?: typeof Notification.TYPE_ACTIVITY |
                typeof Notification.TYPE_ALERT |
                typeof Notification.TYPE_REQUEST
  }) {
    console.log("queryObj", queryObj)
    if (this.notificationCollectionSubscription) {
      console.log("Has to unsubscribe before")
      this.notificationCollectionSubscription.unsubscribe();
    }
    this.notificationCollectionSubscription = this.afs.collection<Notification>(Notification.collection, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
        if (queryObj.typeFilter) {
          console.log(`Filter has been set as ${queryObj.typeFilter}`)
          query = query.where('type', '==', queryObj.typeFilter)
        }
        query = query.orderBy('date', 'desc')
        if (queryObj.startAt) {
          query = query.startAt(queryObj.startAt.date)
        } else if (queryObj.startAfter) {
          query = query.startAfter(queryObj.startAfter.date)
        }
        return query.limit(queryObj.pageSize)
      }
    ).valueChanges().subscribe(notifications => {
      console.log("New notifications", notifications)
      this.notificationsSubject.next(notifications)
    })
  }

  public getNotificationsLengthByFilter(
    filter: typeof Notification.TYPE_ACTIVITY |
            typeof Notification.TYPE_ALERT |
            typeof Notification.TYPE_REQUEST |
            'all'
    ): number {
      let length = 0
      const enterprise = this.enterpriseService.getEnterprise()
      switch (filter) {
        case Notification.TYPE_ACTIVITY:
          // do something
          length = enterprise.totalActivityNotifications
          break;
        case Notification.TYPE_ALERT:
          // do something
          length = enterprise.totalAlertNotifications
          break;
        case Notification.TYPE_REQUEST:
          // do something
          length = enterprise.totalRequestNotifications
          break;
        default:
          length = enterprise.totalActivityNotifications
                   + enterprise.totalAlertNotifications
                   + enterprise.totalRequestNotifications
          break;
      }
      return length
  }
}
