import { Component, ViewChild } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-validation-list',
  templateUrl: './validation-list.component.html',
  styleUrls: ['./validation-list.component.css']
})
export class ValidationListComponent {

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public icon: IconService
  ) {}
}

// class ActivityDataSource extends DataSource<Activity> {

//   // private pageIndex: number = 0;
//   // private previousPageIndex: number = 0;
//   // private selectedFilter: string = 'all'

//   // private currentNotifications: Notification[]
//   // private previousPageNotification: Notification

//   // constructor(
//   //   private userService: UserService,
//   //   private notificationService: NotificationService,
//   //   private enterpriseService: EnterpriseService,
//   //   private paginator: MatPaginator,
//   //   private pageSize: number,
//   //   private enablePagination: boolean
//   // ) {
//   //   super();

//   //   if (this.enablePagination) {
//   //     this.paginator.pageSize = this.pageSize
//   //     this.paginator.page.subscribe(eventObj => {
//   //       this.pageIndex = eventObj.pageIndex
//   //       this.previousPageIndex = eventObj.previousPageIndex
//   //       this.getNotifications()
//   //     });
//   //   }

//   //   this.getNotifications()
//   // }

//   // getNotifications() {
//   //   let queryObj: {
//   //     pageSize: number
//   //     startAt?: Notification
//   //     startAfter?: Notification
//   //     typeFilter?: typeof Notification.TYPE_ACTIVITY |
//   //                 typeof Notification.TYPE_ALERT |
//   //                 typeof Notification.TYPE_REQUEST |
//   //                 typeof Notification.ARCHIVED 
//   //   } = {
//   //     pageSize: this.pageSize,
//   //   }
//   //   if (this.selectedFilter !== 'all') {
//   //     queryObj.typeFilter = this.selectedFilter
//   //   }
//   //   if (this.pageIndex == 0) {
//   //     // first page
//   //   } else if (this.pageIndex > this.previousPageIndex) {
//   //     // next page
//   //     queryObj.startAfter = this.currentNotifications[this.currentNotifications.length - 1]
//   //     this.previousPageNotification = this.currentNotifications[0]
//   //   } else {
//   //     // previous page
//   //     queryObj.startAt = this.previousPageNotification
//   //   }
//   //   this.notificationService.getNotifications(queryObj)
//   // }
  
//   // connect(): Observable<Validation[]> {

//   //   return combineLatest([this.notificationService.notifications$, this.enterpriseService.enterprise$]).pipe(
//   //     map(([notifications, _]) => {
//   //       // update paginator length
//   //       if (this.enablePagination) {
//   //         this.paginator.length = this.notificationService.getNotificationsLengthByFilter(this.selectedFilter)
//   //       }

//   //       this.currentNotifications = [...notifications]
  
//   //       // Pagination
//   //       return notifications.map(notification => {
//   //         const notificationUser = this.userService.getUser(notification.userRef.id)
//   //         notification.user = notificationUser
//   //         return notification
//   //       });
//   //     }),
//   //     catchError(error => {
//   //       console.error('Error occurred:', error);
//   //       return of([]);  // Return an empty array as a fallback.
//   //     })
//   //   );
    
//   // }

//   // setFilter(filter: string) {
//   //   this.selectedFilter = filter
//   //   if (this.enablePagination) {
//   //     this.pageIndex = 0
//   //     this.previousPageIndex = 0
//   //     this.paginator.firstPage();
//   //   }
//   //   this.getNotifications()
//   // }

//   // disconnect() {}

// }
