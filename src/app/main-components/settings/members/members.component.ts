import { DataSource } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, map, merge, of } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { SearchInputService } from 'src/app/shared/services/search-input.service';
import { UserService } from 'src/app/shared/services/user.service';
import { orderByValueAndDirection } from 'src/app/shared/utils';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent {

  displayedColumns: string[] = [
    'displayName',
    'email',
    'status',
    'createdDate',
    'lastEdited',
    'actions',
    'delete',
  ];

  dataSource!: UserDataSource;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  searchSubscription: Subscription
  
  constructor(
    private userService: UserService,
    public icon: IconService,
    private searchInputService: SearchInputService,
    ) {}

  ngAfterViewInit() {
    this.dataSource = new UserDataSource(
      this.userService.users$,
      this.paginator,
      this.sort,
    );
  }

  ngOnInit() {
    this.searchSubscription = this.searchInputService.dataObservable$.subscribe(
      filter => this.dataSource.setFilter(filter)
    )
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe()
  }

  onDeleteUser(user: User) {
    this.userService.delete(user)
  }

  transformUserToAdmin(user: User) {
    this.userService.transformUserToAdmin(user)
  }

  transformUserToStudent(user: User) {
    this.userService.transformUserToStudent(user)
  }

}

class UserDataSource extends DataSource<User> {

  public data: User[]
  private dataSubject = new BehaviorSubject<User[]>([]);
  private filterSubject = new BehaviorSubject<string>('');
  private paginatorSubject = new Subject<void>();
  private sortSubject = new Subject<void>();
  private userSubscription: Subscription;

  constructor(
    private users$: Observable<User[]>,
    private paginator: MatPaginator,
    private sort: MatSort,
  ) {
    super();
    this.paginator.pageSize = 10
    this.paginator.page.subscribe(() => this.paginatorSubject.next());
    this.sort.sortChange.subscribe(() => this.sortSubject.next());
    this.userSubscription = this.users$.subscribe(users => {
      this.data = users
      this.dataSubject.next(users);
    });
  }
  
  connect(): Observable<User[]> {

    return merge(this.users$, this.filterSubject, this.paginatorSubject, this.sortSubject).pipe(
      map(() => {
        // Filtering
        let users = this.dataSubject.value
        let filteredUsers = users.filter(user => {
          const searchStr = (user.name as string + user.email as string).toLowerCase();
          return searchStr.indexOf(this.filterSubject.value.toLowerCase()) !== -1;
        });

        this.paginator.length = filteredUsers.length
  
        // Sorting
        if (this.sort.active && this.sort.direction !== '') {
          filteredUsers = filteredUsers.sort((a, b) => {
            const isAsc = this.sort.direction === 'asc';
            switch (this.sort.active) {
              case 'displayName': return orderByValueAndDirection(a.displayName as string, b.displayName as string, isAsc);
              // case 'status': return this.utilsService.compare(a.status as string, b.status as string, isAsc);
              // case 'departament': return 0
              // case 'profile': return 0
              // case 'ratingPoints': return 0
              // case 'performance': return 0
              // Add more fields to sort by as needed.
              default: return 0;
            }
          });
        }
  
        // Pagination
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
        return filteredUsers.splice(startIndex, this.paginator.pageSize);
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
    this.userSubscription.unsubscribe();
  }
}
