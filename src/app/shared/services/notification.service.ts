import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { UtilsService } from './utils.service';
import { AlertsService } from './alerts.service';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Notification } from 'src/app/shared/models/notification.model';


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private utilsService: UtilsService,
    // private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) {}


  private notifications: Notification[] = []
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  async addNotification(newNotification: Notification): Promise<void> {
    try {
      try {
        await this.afs.collection('notifications').doc(newNotification.id).set(newNotification);
        console.log("Notification added succesfully")
      } catch (error) {
        console.log(error)
        throw error
      }
      this.notifications.push(newNotification)
      this.notificationsSubject.next(this.notifications)
      this.alertService.succesAlert('Has agregado una nueva notificacion exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async getNotifications(pageSize: number, sort: string): Promise<void> {
    const notifications = await firstValueFrom(this.afs.collection<Notification>('notifications').valueChanges())
    this.notifications = notifications
    this.notificationsSubject.next(this.notifications)
  }
}
