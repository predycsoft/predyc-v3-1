import { Component } from '@angular/core';
import { catchError, combineLatest, firstValueFrom, map, of, Subscription } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Notification } from 'src/app/shared/models/notification.model';
import { UserService } from 'src/app/shared/services/user.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { ActivatedRoute, Router } from '@angular/router';

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

  queryParamsSubscription: Subscription

  constructor(
    public icon: IconService,
    private userService: UserService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private notificationService: NotificationService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {

    this.combinedObservableSubscription = combineLatest([this.notificationService.getNotifications$(), this.userService.users$]).subscribe(([notifications, users]) => {
      if (notifications.length > 0 && users.length > 0) {
        this.allNotifications = notifications.filter(notification => {
          return users.find(x => x.uid === notification.userRef.id) ? true : false // to prevent undefined users
        }).map((notification: Notification) => {

          const notificationUser = this.userService.getUser(notification.userRef.id)
          // const notificationUser = users.find(x => x.uid === notification.userRef.id)
          notification.user = notificationUser
          return notification
        });
        this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
          const statusFilter = params['type'] || Notification.TYPE_ALERT;        
          this.applyFilter(statusFilter)
        })
        // console.log("notifications", notifications)
      }
    })

  }

  applyFilter(filter: string) {
    this.router.navigate([], {
      queryParams: { type: filter },
      queryParamsHandling: 'merge'
    });
    this.updateDisplayedColumns(filter)
    this.selectedFilter = filter
    this.filteredNotifications = this.allNotifications.filter(notification => notification.type === this.selectedFilter)

    this.groupFilteredNotifications(this.filteredNotifications)

  }

  groupFilteredNotifications(filteredNotifications: Notification[]) {
    // Object of subtypes and corresponding notifications
    const groupedBySubType: {} = filteredNotifications.reduce((groups, notification) => {
      if (!groups[notification.subType]) { groups[notification.subType] = []; }
      groups[notification.subType].push(notification);
      return groups;
    }, {});

    // Object.entries converts the object into an array of keys and values [key, value]
    const entries = Object.entries(groupedBySubType);
    // console.log("entries", entries)

    // convert the array into the wanted structure 
    this.groupedNotifications = entries.map(([subType, notifications]) => ({
      subType: subType, 
      notifications: notifications as Notification[]
    }));
    console.log("this.groupedNotifications", this.groupedNotifications)
  }

  updateDisplayedColumns(filter: string) {
    this.displayedColumns = [ 'content', 'date', 'delete'];
    if (filter === Notification.TYPE_ALERT) this.displayedColumns.splice(this.displayedColumns.length - 1, 0 ,'action')
  }

  ngOnDestroy() {
    if (this.combinedObservableSubscription) this.combinedObservableSubscription.unsubscribe();
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

  async onDelete(notification: Notification) {
    await this.notificationService.deleteNotification(notification.id)
    this.alertService.succesAlert("Has eliminado la notificacion satisfactoriamente")
  }

  async sendMail(notification: Notification) {
    this.clickedNotifications[notification.id] = true;
    const user = this.userService.getUser(notification.userRef.id) as User
    let sender = "ventas@predyc.com"
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
