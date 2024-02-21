import { Component, ViewChild } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import { Notification } from 'src/shared/models/notification.model';
import { User } from 'src/shared/models/user.model';
import { AlertsService } from 'src/shared/services/alerts.service';
import { IconService } from 'src/shared/services/icon.service';
import { NotificationService } from 'src/shared/services/notification.service';
import { UserService } from 'src/shared/services/user.service';

interface NotificationItem {
  id: string
  user: {
    id: string
    displayName: string
    photoUrl: string
  },
  message: string
  date: number
  type: typeof Notification.TYPE_ALERT | typeof Notification.TYPE_EVENT
  readByAdmin
}

@Component({
  selector: 'app-notification-list2',
  templateUrl: './notification-list2.component.html',
  styleUrls: ['./notification-list2.component.css']
})
export class NotificationList2Component {

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertService: AlertsService,
    private fireFunctions: AngularFireFunctions,
    public icon: IconService,
    private notificationService: NotificationService,
    private router: Router,
    private userService: UserService,
  ) {}

  displayedColumns: string[] = [
    'content',
    'date',
    'action',
    'check',
  ]

  dataSource = new MatTableDataSource<NotificationItem>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  queryParamsSubscription: Subscription
  notificationServiceSubscription: Subscription

  selectedType: string = ''
  pageSize: number = 10
  totalLength: number
  clickedNotifications: { [id: string]: boolean } = {};

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const type = params['type'] || '';
      const page = Number(params['page']) || 1;
      this.selectedType = type
      // this.performSearch(page, type);
    })
  }

  // performSearch(page: number, type: string) {
  //   if (this.notificationServiceSubscription) {
  //     this.notificationServiceSubscription.unsubscribe()
  //   }
  //   let queryObj: {
  //     pageSize: number
  //     typeFilter?: typeof Notification.TYPE_EVENT |
  //                 typeof Notification.TYPE_ALERT
  //   } = {
  //     pageSize: this.pageSize,
  //   }
  //   if (this.selectedType !== '') {
  //     queryObj.typeFilter = this.selectedType
  //   }
  //   this.notificationServiceSubscription = this.notificationService.getNotifications$(queryObj).subscribe(
  //     response => {
  //       const notifications: NotificationItem[] = response.map(item => {
  //         const notification = {
  //           id: item.id,
  //           user: {
  //             id: '',
  //             displayName: 'Usuario prueba',
  //             photoUrl: '',
  //           },
  //           date: item.date,
  //           message: item.message,
  //           type: item.type,
  //           readByAdmin: item.readByAdmin
  //         }
  //         return notification
  //       })
  //       this.paginator.pageIndex = page - 1; // Update the paginator's page index
  //       this.dataSource.data = notifications; // Assuming the data is in 'items'
  //       // // this.paginator.length = response.count; // Assuming total length is returned
  //       this.totalLength = response.length; // Assuming total length is returned
  //     }
  //   );
  // }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  onTypeChange(type: string) {
    this.selectedType = type
    this.updateQueryParams()
  }

  updateQueryParams() {
    this.router.navigate([], {
      queryParams: { type: this.selectedType ? this.selectedType : null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  async setRead(notification: NotificationItem) {
    console.log("Set Read")
    // this.notificationService.setNotificationReadByAdmin(notification)
  }

  async sendMail(notification: NotificationItem) {
    // this.clickedNotifications[notification.id] = true;
    const user = this.userService.getUser(notification.user.id) as User
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

  ngOnDestroy() {
    this.notificationServiceSubscription.unsubscribe()
  }

}
