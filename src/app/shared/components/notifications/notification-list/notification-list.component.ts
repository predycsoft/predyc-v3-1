import { DataSource } from '@angular/cdk/collections';
import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, catchError, combineLatest, firstValueFrom, map, merge, Observable, of, Subscription } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Notification } from 'src/app/shared/models/notification.model';
import { UserService } from 'src/app/shared/services/user.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent {

  @Input() enablePagination: boolean = true
  @Input() pageSize: number = 10

  displayedColumns: string[] = [
    'content',
    'date',
    'action',
    'check',
  ]
  dataSource!: NotificationDataSource;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedFilter: string = 'all'

  combinedObservableSubscription: Subscription

  clickedNotifications: { [id: string]: boolean } = {};

  constructor(
    public icon: IconService,
    private userService: UserService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private notificationService: NotificationService
  ) {}

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
          this.paginator,
          this.pageSize
        );
      }
    })
  }

  applyFilter(filter: string) {
    if (filter === this.selectedFilter) {
      return
    }
    this.selectedFilter = filter
    this.dataSource.setFilter(filter)
  }

  ngOnDestroy() {
    this.
    combinedObservableSubscription.unsubscribe();
  }

  
  async setRead(notification: Notification) {
    this.notificationService.setNotificationReadByAdmin(notification)
    console.log("notification read")    
    console.log(notification)   
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
    // COMO MOSTRAR ALERTA EN CASO DE ERROR? HACERLO DENTRO DE LA CLOUD FUNCTION?
    console.log("Email enviado")
  }

}

class NotificationDataSource extends DataSource<Notification> {

  private dataSubject = new BehaviorSubject<Notification[]>([]);
  // private filterSubject = new BehaviorSubject<string>('');
  private notificationSubscription: Subscription;

  private selectedFilter: string = 'all'

  private currentNotifications: Notification[]
  private previousPageNotification: Notification

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private paginator: MatPaginator,
    private pageSize: number
  ) {
    super();
    this.paginator.pageSize = this.pageSize
    this.notificationSubscription = this.notificationService.notifications$.subscribe(notifications => {
      this.dataSubject.next(notifications);
    });
    // this.filterSubject.subscribe(filter => {
    //   // this.notifications
    // })
    this.paginator.page.subscribe(eventObj => {
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
      if (eventObj.pageIndex == 0) {
        // first page
      } else if (eventObj.pageIndex > eventObj.previousPageIndex) {
        // next page
        queryObj.startAfter = this.currentNotifications[this.currentNotifications.length - 1]
        this.previousPageNotification = this.currentNotifications[0]
      } else {
        // previous page
        queryObj.startAt = this.previousPageNotification
      }
      console.log("queryObj inside datasource", queryObj)
      this.getNotifications(queryObj)
    });

    this.getNotifications({pageSize: this.pageSize})
  }

  getNotifications(queryObj: {
    pageSize: number
    startAt?: Notification
    startAfter?: Notification
    typeFilter?: typeof Notification.TYPE_ACTIVITY |
                typeof Notification.TYPE_ALERT |
                typeof Notification.TYPE_REQUEST |
                typeof Notification.ARCHIVED
  }) {
    this.notificationService.getNotifications(queryObj)
  }
  
  connect(): Observable<Notification[]> {

    return this.notificationService.notifications$.pipe(
      map(notifications => {
        // this.lastNotification = notifications[notifications.length - 1]
        // if (this.paginator.pageIndex !== 0) {
          //   this.firstNotification = notifications[0]
          // }
        // update paginator length
        this.paginator.length = this.notificationService.getNotificationsLengthByFilter(this.selectedFilter)

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
    this.paginator.firstPage();
    this.paginator.page.emit({
      pageIndex: this.paginator.pageIndex,
      pageSize: this.paginator.pageSize,
      length: this.paginator.length
    });
  }

  disconnect() {
    this.notificationSubscription.unsubscribe();
  }
}