import { DataSource } from '@angular/cdk/collections';
import { Component } from '@angular/core';
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
  
  enterprise: Enterprise
  enterpriseSubscription: Subscription
  totalNotifications: number

  pageSize: number = 9

  selectedFilter: string = 'all'
  tabNotificaciones = 0
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
          this.pageSize,
        );
      }
    })                  
  }

  ngOnInit() {
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.totalNotifications = enterprise.totalActivityNotifications + enterprise.totalAlertNotifications + enterprise.totalRequestNotifications 
      }
    })
  }

  ngOnDestroy() {
    this.combinedObservableSubscription.unsubscribe();
    this.enterpriseSubscription.unsubscribe()
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
    await this.notificationService.setNotificationReadByAdmin(notification)
    // this.calculateTotalNotifications()
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

  private selectedFilter: string = 'all'

  private currentNotifications: Notification[]

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private enterpriseService: EnterpriseService,
    private pageSize: number,
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
    this.notificationService.getNotifications(queryObj)
  }
  
  connect(): Observable<Notification[]> {

    return combineLatest([this.notificationService.notifications$, this.enterpriseService.enterprise$]).pipe(
      map(([notifications, _]) => {
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
    this.getNotifications()
  }

  disconnect() {}
}
