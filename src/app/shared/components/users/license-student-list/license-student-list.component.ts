import { SelectionModel } from '@angular/cdk/collections';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Profile } from 'src/app/shared/models/profile.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';

interface LicenseListUser {
  displayName: string,
  profile: string,
  status: string
}

@Component({
  selector: 'app-license-student-list',
  templateUrl: './license-student-list.component.html',
  styleUrls: ['./license-student-list.component.css']
})
export class LicenseStudentListComponent {
  displayedColumns: string[] = [
    'checkbox',
    'displayName',
    'profile',
    'status',
  ];

  dataSource = new MatTableDataSource<LicenseListUser>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() onStudentSelected = new EventEmitter<LicenseListUser>()

  queryParamsSubscription: Subscription
  profilesSubscription: Subscription
  userServiceSubscription: Subscription
  pageSize: number = 7
  totalLength: number
  profiles: Profile[] = []

  initialSelection: LicenseListUser[] = [];
  allowMultiSelect = true;
  selection: SelectionModel<LicenseListUser> = new SelectionModel<LicenseListUser>(
    this.allowMultiSelect, this.initialSelection
  );

  constructor(
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.profileService.loadProfiles()
    this.profilesSubscription = this.profileService.getProfilesObservable().subscribe(profiles => {
      if (profiles) {
        this.profiles = profiles
        this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
          const page = Number(params['page']) || 1;
          const searchTerm = params['search'] || '';
          const profileFilter = '';
          this.performSearch(searchTerm, page, profileFilter);
        })
      }
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm: string, page: number, statusFilter: string) {
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe()
    }
    this.userServiceSubscription = this.userService.getUsers$(searchTerm, statusFilter).subscribe(
      response => {
        console.log("response", response)
        const users: LicenseListUser[] = response.map(item => {
          // Seting profile
          const profile = this.profiles.find(profile => {
            if(item.profile) {
              return profile.id === item.profile.id
            }
            return false
          })
          let profileName = ''
          if (profile) { profileName = profile.name }
          // Seting satus. Calculation pending
          const options = ['Activo', 'Inactivo', 'Pendiente'];
          const randomIndex = Math.floor(Math.random() * options.length);

          const user = {
            displayName: item.displayName,
            profile: profileName,
            status: options[randomIndex], //Calculation pending
            uid: item.uid
          }
          return user
        })
        this.paginator.pageIndex = page - 1; // Update the paginator's page index
        this.dataSource.data = users; // Assuming the data is in 'items'
        // // this.paginator.length = response.count; // Assuming total length is returned
        this.totalLength = response.length; // Assuming total length is returned
      }
    );
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  onSelectUser(user: LicenseListUser) {
    this.onStudentSelected.emit(user)
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
    this.queryParamsSubscription.unsubscribe()
    this.userServiceSubscription.unsubscribe()
    this.profilesSubscription.unsubscribe()
  }
}