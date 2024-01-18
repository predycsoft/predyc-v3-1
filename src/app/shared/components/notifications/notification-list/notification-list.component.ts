import { DataSource } from '@angular/cdk/collections';
import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, catchError, combineLatest, firstValueFrom, map, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Notification } from 'src/app/shared/models/notification.model';
import { UserService } from 'src/app/shared/services/user.service';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent {

  // This is not being used
  @Input() enablePagination: boolean = true
  @Input() pageSize: number = 5

  displayedColumns: string[] = [
    'content',
    'date',
    'action',
    'check',
  ]
  dataSource!: NotificationDataSource;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  selectedFilter: string = 'alert'

  combinedObservableSubscription: Subscription

  clickedNotifications: { [id: string]: boolean } = {};

  constructor(
    public icon: IconService,
    private userService: UserService,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService,
    private notificationService: NotificationService,
    private enterpriseService: EnterpriseService
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
          this.enterpriseService,
          this.paginator,
          this.pageSize,
          this.enablePagination
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

}

class NotificationDataSource extends DataSource<Notification> {

  private pageIndex: number = 0;
  private selectedFilter: string = 'alert'
  

  constructor(
    private userService: UserService,
    private notificationService: NotificationService,
    private enterpriseService: EnterpriseService,
    private paginator: MatPaginator,
    private pageSize: number,
    private enablePagination: boolean
  ) {
    super();

    if (this.enablePagination) {
      this.paginator.pageSize = this.pageSize
      this.paginator.page.subscribe(eventObj => {
        this.pageIndex = eventObj.pageIndex
        this.getNotifications()
      });
    }

    this.getNotifications()
  }

  getNotifications() {
    this.notificationService.getNotifications()
  }
  
  connect(): Observable<Notification[]> {

    return combineLatest([this.notificationService.notifications$, this.enterpriseService.enterprise$]).pipe(
      map(([notifications, _]) => {
        console.log("all notifications", notifications)
        let currentNotifications = notifications.filter(notification => notification.type === this.selectedFilter)
        // update paginator length
        if (this.enablePagination) {
          this.paginator.length = currentNotifications.length
          const start = this.pageIndex * this.pageSize;
          const end = start + this.pageSize;
          currentNotifications = currentNotifications.slice(start, end) 
        }

        // Pagination
        return currentNotifications.map(notification => {
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
      this.paginator.firstPage();
    }
    this.getNotifications()
  }

  disconnect() {}
}