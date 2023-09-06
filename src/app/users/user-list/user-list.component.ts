import { SelectionModel } from '@angular/cdk/collections';
import { ThisReceiver } from '@angular/compiler';
import { Component, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { IconService } from 'src/app/services/icon.service';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/shared/user.model';

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

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent {
  displayedColumns: string[] = [
    'select',
    'displayName',
    'status',
    'departmentId',
    'profileId',
    'ratingPoints',
    'performance'
  ];
  dataSource!: MatTableDataSource<User>;
  selection!: SelectionModel<User>

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    public icon: IconService
  ) {}

  ngOnInit() {
    const users = this.userService.getUsers()
    // const deparments = this.deparmentService.getDeparments()
    // const profiles = this.profileService.getProfiles()
    // users.forEach(user => {
    //   return {

    //   }
    // })
    // Assign the data to the data source for the table to render
    this.dataSource = new MatTableDataSource(users);

    const initialSelection: User[] = [];
    const allowMultiSelect = true;
    this.selection = new SelectionModel<User>(
      allowMultiSelect, initialSelection
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
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
