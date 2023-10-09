import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { IconService } from '../../../../shared/services/icon.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { BehaviorSubject, catchError, map, merge, Observable, of, Subject, Subscription } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { SearchInputService } from 'src/app/shared/services/search-input.service';
import { orderByValueAndDirection } from 'src/app/shared/utils';

@AfterOnInitResetLoading
@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent {
  displayedColumns: string[] = [
    'select',
    'displayName',
    'status',
    'departmentId',
    'profileId',
    'ratingPoints',
    'performance',
    // 'options',
  ];
  dataSource!: UserDataSource;

  initialSelection: User[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<User> = new SelectionModel<User>(
    this.allowMultiSelect, this.initialSelection
  );

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Input() usersListed: 'all' | 'usersWithoutProfile'
  @Input() enableNavigateToUser: boolean = true
  @Input() displayOptionsColumn: boolean = true
  @Output() onSelectStudentEvent = new EventEmitter<User>()
  @Output() selectedUsers = new EventEmitter<any[]>();
  @Input() initialSelectedUsers: any[] = [];


  searchSubscription: Subscription

  constructor(
    private userService: UserService,
    public icon: IconService,
    private loaderService: LoaderService,
    private searchInputService: SearchInputService
  ) {}

  ngAfterViewInit() {

    let usersObservable: Observable<User[]>;

    switch (this.usersListed) {
      case 'usersWithoutProfile':
        usersObservable = this.userService.usersWithoutProfile$;
        break;
      default:
        usersObservable = this.userService.users$;
        break;
    }

    this.dataSource = new UserDataSource(
      usersObservable,
      this.paginator,
      this.sort,
    );

    if (this.initialSelectedUsers && this.dataSource && this.initialSelectedUsers.length > 0) {
      //this.selection.clear();
      // Find and select the initial items
      console.log('initialSelectedUsers',this.initialSelectedUsers)
      this.initialSelectedUsers.forEach(item => {
        const matchingRow = this.dataSource.data.find(row => row.uid === item.uid);  // You can modify the comparison logic here
        console.log('matchingRow',matchingRow);
        if (matchingRow) {
          this.selection.select(matchingRow);
        }
      });
    }
  }

  ngOnInit() {
    if(this.displayOptionsColumn){
      this.displayedColumns.push('options')
    }
    this.searchSubscription = this.searchInputService.dataObservable$.subscribe(
      filter => this.dataSource.setFilter(filter)
    )

    this.selection.changed.subscribe(() => {
      this.selectedUsers.emit(this.selection.selected);
    });
  }

  onSelectUser(user: User) {
    this.onSelectStudentEvent.emit(user)
  }

  onDeleteUser(user: User) {
    this.userService.delete(user)
  }

  transformUserToAdmin(user: User) {
    this.userService.transformUserToAdmin(user)
  }

  applyFilter(filterValue: string) {
    this.dataSource.setFilter(filterValue.trim().toLowerCase());
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected == numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    this.isAllSelected() ?
        this.selection.clear() :
        this.dataSource.data.forEach(row => this.selection.select(row));
  }

  ngOnDestroy() {
    this.searchSubscription.unsubscribe()
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
    this.paginator.pageSize = 5
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
            console.log('this.sort.active')
            console.log(this.sort.active)
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
