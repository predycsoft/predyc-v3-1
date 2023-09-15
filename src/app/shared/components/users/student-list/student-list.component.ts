import { DataSource, SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { IconService } from '../../../../shared/services/icon.service';
import { UserService } from '../../../../shared/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { Observable } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { LoaderService } from 'src/app/shared/services/loader.service';

interface UserInfo {
  displayName: string,
  status: string,
  department: string,
  profile: string,
  ratingPoints: number,
  totalCourses: number,
  completedCourses: number,
  inProgressCourses: number,
}

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
  selection!: SelectionModel<User>

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @Output() onSelectStudentEvent = new EventEmitter<User>()
  @Output() onDeleteStudentEvent = new EventEmitter<User>()

  constructor(
    private userService: UserService,
    public icon: IconService,
    private loaderService: LoaderService,
  ) {}

  async ngOnInit() {
    const initialSelection: User[] = [];
    const allowMultiSelect = true;
    this.selection = new SelectionModel<User>(
      allowMultiSelect, initialSelection
    );
    this.dataSource = new UserDataSource(this.userService, this.paginator, this.sort);
  }

  onSelectUser(user: User) {
    this.onSelectStudentEvent.emit(user)
  }

  onDeleteUser(user: User) {
    this.onDeleteStudentEvent.emit(user)
  }

  // applyFilter(event: Event) {
  //   const filterValue = (event.target as HTMLInputElement).value;
  //   this.dataSource.filter = filterValue.trim().toLowerCase();

  //   if (this.dataSource.paginator) {
  //     this.dataSource.paginator.firstPage();
  //   }
  // }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    // const numSelected = this.selection.selected.length;
    // const numRows = this.dataSource.data.length;
    // return numSelected == numRows;
    return false
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    // this.isAllSelected() ?
    //     this.selection.clear() :
    //     this.dataSource.data.forEach(row => this.selection.select(row));
  }
}

class UserDataSource extends DataSource<User> {

  constructor(
    private userService: UserService,
    private paginator: MatPaginator,
    private sort: MatSort
  ) {
    super();
    this.userService = userService
  }

  connect(): Observable<User[]> {
    return this.userService.users$;
  }

  disconnect() {

  }
}
