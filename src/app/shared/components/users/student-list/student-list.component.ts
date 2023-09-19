import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { IconService } from '../../../../shared/services/icon.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { combineLatest, map, Observable, Subscription } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';

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
    'options',
  ];
  dataSource!: UserDataSource;

  initialSelection: User[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<User> = new SelectionModel<User>(
    this.allowMultiSelect, this.initialSelection
  );

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() onSelectStudentEvent = new EventEmitter<User>()

  // pageSize: number = 5
  // sortBy: string = 'default'
  // currentPage: number = 0

  constructor(
    private userService: UserService,
    public icon: IconService,
    private loaderService: LoaderService,
  ) {}

  ngAfterViewInit() {
    this.dataSource = new UserDataSource(this.userService.getUsersObservable(), this.paginator, this.sort);
  }

  ngOnInit() {}

  onSelectUser(user: User) {
    this.onSelectStudentEvent.emit(user)
  }

  onDeleteUser(user: User) {
    this.userService.delete(user)
  }

  transformUserToAdmin(user: User) {
    this.userService.transformUserToAdmin(user)
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
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
}

class UserDataSource extends DataSource<User> {

  public data: User[]
  public filter: string = '';
  private userSubscription: Subscription

  constructor(
    private users$: Observable<User[]>,
    public paginator: MatPaginator,
    private sort: MatSort
  ) {
    super();
  }
  
  connect(): Observable<User[]> {
    this.userSubscription = this.users$.subscribe(users => {
      this.data = users;
    });
    // return combineLatest<[User[], PageEvent, Sort]>([
    //     this.users$,
    //     this.paginator.page,
    //     this.sort.sortChange
    //   ]).pipe(map(([users]) => {
    //     return users.filter(user => {
    //       if (this.filter != '' && this.filter !== null) {
    //         const searchStr = (user.name as string + user.email as string).toLowerCase();
    //         return searchStr.indexOf(this.filter.toLowerCase()) !== -1;
    //       }
    //       return true
    //     });
    //   }));
    return combineLatest([this.users$]).pipe(map(([users]) => users))
  }

  disconnect() {
    this.userSubscription.unsubscribe();
  }
}
