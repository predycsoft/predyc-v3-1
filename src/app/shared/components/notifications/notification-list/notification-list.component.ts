import { Component } from '@angular/core';
import { catchError, combineLatest, firstValueFrom, map, of, Subscription } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Notification } from 'src/app/shared/models/notification.model';
import { UserService } from 'src/app/shared/services/user.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';

interface NotificationGroup {
  subType: string;
  notifications: Notification[];
}
@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent {

  displayedColumns: string[] = [
    'content',
    'date',
    // 'action',
    'delete',
  ]

  selectedFilter: string = ''

  combinedObservableSubscription: Subscription

  clickedNotifications: { [id: string]: boolean } = {};

  allNotifications: Notification[]
  filteredNotifications: Notification[]
  groupedNotifications: NotificationGroup[] = []

  constructor(
    public icon: IconService,
    private userService: UserService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.combinedObservableSubscription = combineLatest(
      [
        this.notificationService.getNotifications$(),
        this.userService.usersLoaded$, 
        this.notificationService.notificationsLoaded$
      ]
    ).pipe(
      map(([notifications, usersLoaded, notificationsLoaded]) => {
        if (usersLoaded && notificationsLoaded) {
          console.log("Cargaron los users")
          return notifications
        }
        return [];
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    ).subscribe(notifications => {
      if (notifications.length > 0) {
        this.allNotifications = notifications.map((notification: Notification) => {
          const notificationUser = this.userService.getUser(notification.userRef.id)
          notification.user = notificationUser
          return notification
        });
        console.log("notifications", notifications)
        this.applyFilter(this.selectedFilter ? this.selectedFilter : "alert")
      }
    })
  }

  applyFilter(filter: string) {
    if (filter === this.selectedFilter) {
      return
    }
    this.updateDisplayedColumns(filter)
    this.selectedFilter = filter
    this.filteredNotifications = this.allNotifications.filter(notification => notification.type === this.selectedFilter)

    this.groupedNotifications = Object.entries(this.filteredNotifications.reduce((groups, notification) => {
      (groups[notification.subType] = groups[notification.subType] || []).push(notification);
      return groups;
    }, {})).map(([key, value]) => ({ subType: key, notifications: value as Notification[] }));

  }

  updateDisplayedColumns(filter: string) {
    this.displayedColumns = [
      'content',
      'date',
      'delete',
    ];
    if (filter === "alert") this.displayedColumns.splice(this.displayedColumns.length - 1, 0 ,'action')
}

  ngOnDestroy() {
    this.combinedObservableSubscription.unsubscribe();
  }

  async onDelete(notification: Notification) {
    await this.notificationService.deleteNotification(notification.id)
    this.alertService.succesAlert("Has eliminado la notificacion satisfactoriamente")
  }

  async sendMail(notification: Notification) {
    this.clickedNotifications[notification.id] = true;
    const user = this.userService.getUser(notification.userRef.id) as User
    let sender = "capacitacion@predyc.com"
    let recipients = [user.email]
    let subject = ""
    let text = ""

    if (notification.type === Notification.TYPE_ALERT) {
      subject = "Retraso en curso"
      text = `${user.displayName} ${notification.message}`
    }
    else if (notification.type === Notification.TYPE_EVENT) {
      subject = "Nuevo evento"
      text = `${user.displayName} ${notification.message}`
    }
    try {
      await firstValueFrom(this.fireFunctions.httpsCallable('sendMail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        text: text,
      }));    
      this.alertService.succesAlert('Has notificado al usuario exitosamente.')
      console.log("Email enviado")
    } catch (error) {
      console.log("error", error)
      this.alertService.errorAlert("")
    }

  }

  getSubTypeTextToDisplay(subType: string) {
    return Notification.subTypeToDisplayValueDict[subType]
  }

}
