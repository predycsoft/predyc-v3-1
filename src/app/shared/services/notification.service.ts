import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, CollectionReference, Query } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Notification } from 'src/app/shared/models/notification.model';
import { EnterpriseService } from './enterprise.service';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {}

  ngOnInit() {}

  async addNotification(newNotification: Notification): Promise<void> {
    try {
      await this.afs.collection(Notification.collection).doc(newNotification.id).set(newNotification);
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
    this.afs.collection<Notification>(Notification.collection, ref => {
        let query: CollectionReference | Query = ref;
        query = query.where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
        if (queryObj.typeFilter) {
          query = query.where('type', '==', queryObj.typeFilter)
        }
        if (queryObj.startAt) {
          query = query.startAt(queryObj.startAt)
        } else if (queryObj.startAfter) {
          query = query.startAfter(queryObj.startAfter)
        }
        return query.limit(queryObj.pageSize).orderBy('date', 'desc')
      }
    ).valueChanges().subscribe(notifications => {
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
      // switch (filter) {
      //   case Notification.TYPE_ACTIVITY:
      //     // do something
      //     length = this.enterpriseService.getEnterprise().totalActivityNotifications
      //     break;
      //   case Notification.TYPE_ALERT:
      //     // do something
      //     length = this.enterpriseService.getEnterprise().totalAlertNotifications
      //     break;
      //   case Notification.TYPE_REQUEST:
      //     // do something
      //     length = this.enterpriseService.getEnterprise().totalRequestNotifications
      //     break;
      //   default:
      //     length = this.enterpriseService.getEnterprise().totalActivityNotifications
      //              + this.enterpriseService.getEnterprise().totalAlertNotifications
      //              + this.enterpriseService.getEnterprise().totalRequestNotifications
      //     break;
      // }
      return length
  }
}
