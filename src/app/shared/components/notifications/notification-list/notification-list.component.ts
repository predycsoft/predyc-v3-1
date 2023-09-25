import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, catchError, map, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from 'src/app/shared/services/user.service';
import { Notification } from 'src/app/shared/models/notification.model';

@Component({
  selector: 'app-notification-list',
  templateUrl: './notification-list.component.html',
  styleUrls: ['./notification-list.component.css']
})
export class NotificationListComponent {

  displayedColumns: string[] = [
    'content',
    'date',
    'action',
    'check',
  ]
  // dataSource!: NotificationDataSource;
  initialSelection: Notification[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<Notification> = new SelectionModel<Notification>(
    this.allowMultiSelect, this.initialSelection
  );

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    public icon: IconService,
  ) {}

}

class NotificationDataSource extends DataSource<Notification> {

  private dataSubject = new BehaviorSubject<Notification[]>([]);
  private filterSubject = new BehaviorSubject<string>('');
  private paginatorSubject = new Subject<void>();
  private notificationSubscription: Subscription;

  constructor(
    private notifications$: Observable<Notification[]>,
    private paginator: MatPaginator,
  ) {
    super();
    this.paginator.pageSize = 10
    this.paginator.page.subscribe(() => this.paginatorSubject.next());
  }
  
  connect(): Observable<Notification[]> {

    this.notificationSubscription = this.notifications$.subscribe(users => {
      this.dataSubject.next(users);
    });

    return merge(this.notifications$, this.filterSubject, this.paginatorSubject).pipe(
      map(() => {
        // Filtering
        let notifications = this.dataSubject.value
        let filteredNotifications = notifications.filter(notification => {
          const searchStr = (notification.type as string).toLowerCase();
          return searchStr.indexOf(this.filterSubject.value.toLowerCase()) !== -1;
        });

        this.paginator.length = filteredNotifications.length
  
        // Pagination
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
        return filteredNotifications.splice(startIndex, this.paginator.pageSize);
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    );
    
  }

  setFilter(filter: string) {
    this.filterSubject.next(filter)
    this.paginator.firstPage();
  }

  disconnect() {
    // this.userSubscription.unsubscribe();
  }
}