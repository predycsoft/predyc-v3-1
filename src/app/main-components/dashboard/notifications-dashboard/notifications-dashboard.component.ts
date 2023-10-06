import { DataSource } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription, combineLatest, map, catchError, of, firstValueFrom, Observable } from 'rxjs';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from 'src/app/shared/services/user.service';
import { Notification } from 'src/app/shared/models/notification.model';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { AlertsService } from 'src/app/shared/services/alerts.service';

@Component({
  selector: 'app-notifications-dashboard',
  templateUrl: './notifications-dashboard.component.html',
  styleUrls: ['./notifications-dashboard.component.css']
})
export class NotificationsDashboardComponent {

  constructor(
    public icon: IconService,
    private notificationService: NotificationService,
    private userService: UserService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private enterpriseService: EnterpriseService,
  ){}

  @ViewChild(MatPaginator) paginator: MatPaginator;
  enablePagination: boolean = false
  pageSize: number = 10

  selectedFilter: string = 'all'
  tabNotificaciones = 0
  alerts = []
  notifications = []
  empresa: Enterprise = null
  combinedObservableSubscription: Subscription
  dataSource!: NotificationDataSource;

  clickedNotifications: { [id: string]: boolean } = {};

  displayedColumns: string[] = [
    'content',
    'action',
    'check',
  ]

  ngAfterViewInit() {
    this.combinedObservableSubscription = combineLatest([this.userService.usersLoaded$, this.notificationService.notificationsLoaded$]).pipe(
      map(([usersLoaded, notificationsLoaded]) => {
        return usersLoaded && notificationsLoaded
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    ).subscribe(isLoaded => {
      if (isLoaded) {
        this.dataSource = new NotificationDataSource(
          this.userService,
          this.notificationService,
          this.enterpriseService,
          this.paginator,
          this.pageSize,
          this.enablePagination
        );
      }
    })
  }

  ngOnDestroy() {
    this.combinedObservableSubscription.unsubscribe();
  }

  applyFilter(filter: string) {
    if (filter === this.selectedFilter) {
      return
    }
    this.tabNotificaciones = filter === "all" ? 0 : 1
    this.selectedFilter = filter
    this.dataSource.setFilter(filter)
  }

  async setRead(notification: Notification) {
    this.notificationService.setNotificationReadByAdmin(notification)
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
    else if (notification.type === Notification.TYPE_REQUEST) {
      subject = "Solicitud de acceso"
      text = `${user.displayName} ${notification.message}`
    }
    try {
      await firstValueFrom(this.fireFunctions.httpsCallable('sendMail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        text: text,
      }));    
      if (notification.type === Notification.TYPE_ALERT) {
        this.alertService.succesAlert('Has notificado al usuario exitosamente.')
      }
      else if (notification.type === Notification.TYPE_REQUEST) {
        this.alertService.succesAlert('Has contactado a predyc exitosamente.')
      }    
      console.log("Email enviado")
    } catch (error) {
      console.log("error", error)
      this.alertService.errorAlert("")
    }

  }

}


class NotificationDataSource extends DataSource<Notification> {

  private pageIndex: number = 0;
  private previousPageIndex: number = 0;
  private selectedFilter: string = 'all'

  private currentNotifications: Notification[]
  private previousPageNotification: Notification

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private enterpriseService: EnterpriseService,
    private paginator: MatPaginator,
    private pageSize: number,
    private enablePagination: boolean
  ) {
    super();
    this.getNotifications()
  }

  getNotifications() {
    let queryObj: {
      pageSize: number
      startAt?: Notification
      startAfter?: Notification
      typeFilter?: typeof Notification.TYPE_ACTIVITY |
                  typeof Notification.TYPE_ALERT |
                  typeof Notification.TYPE_REQUEST |
                  typeof Notification.ARCHIVED 
    } = {
      pageSize: this.pageSize,
    }
    if (this.selectedFilter !== 'all') {
      queryObj.typeFilter = this.selectedFilter
    }
    if (this.pageIndex == 0) {
      // first page
    } else if (this.pageIndex > this.previousPageIndex) {
      // next page
      queryObj.startAfter = this.currentNotifications[this.currentNotifications.length - 1]
      this.previousPageNotification = this.currentNotifications[0]
    } else {
      // previous page
      queryObj.startAt = this.previousPageNotification
    }
    this.notificationService.getNotifications(queryObj)
  }
  
  connect(): Observable<Notification[]> {

    return combineLatest([this.notificationService.notifications$, this.enterpriseService.enterprise$]).pipe(
      map(([notifications, _]) => {
        // update paginator length
        if (this.enablePagination) {
          this.paginator.length = this.notificationService.getNotificationsLengthByFilter(this.selectedFilter)
        }

        this.currentNotifications = [...notifications]
  
        // Pagination
        return notifications.map(notification => {
          const notificationUser = this.userService.getUser(notification.userRef.id)
          notification.user = notificationUser
          return notification
        });
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    );
    
  }

  setFilter(filter: string) {
    this.selectedFilter = filter
    if (this.enablePagination) {
      this.pageIndex = 0
      this.previousPageIndex = 0
      this.paginator.firstPage();
    }
    this.getNotifications()
  }

  disconnect() {}
}
