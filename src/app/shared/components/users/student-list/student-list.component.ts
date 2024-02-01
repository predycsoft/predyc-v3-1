import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { IconService } from '../../../../shared/services/icon.service';
import { UserService } from '../../../../shared/services/user.service';
import { combineLatest, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Profile } from 'src/app/shared/models/profile.model';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { Department } from 'src/app/shared/models/department.model';

interface User {
  displayName: string,
  profile: string,
  department: string,
  hours: number,
  ratingPoints: number,
  rhythm: string
  uid: string,
  photoUrl: string,
}

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent {

  displayedColumns: string[] = [
    'displayName',
    'department',
    'hours',
    'ratingPoints',
    'rhythm',
  ];

  dataSource = new MatTableDataSource<User>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() onStudentSelected = new EventEmitter<User>()

  queryParamsSubscription: Subscription
  profilesSubscription: Subscription
  userServiceSubscription: Subscription
  pageSize: number = 25
  totalLength: number
  profiles: Profile[] = []
  departments: Department[] = []

  constructor(
    private activatedRoute: ActivatedRoute,
    private departmentService: DepartmentService,
    public icon: IconService,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.profileService.loadProfiles()
    
    this.profilesSubscription = combineLatest([this.profileService.getProfilesObservable(), this.departmentService.getDepartments$()]).subscribe(([profiles, departments]) => {
        this.profiles = profiles
        this.departments = departments
        this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
          const page = Number(params['page']) || 1;
          const searchTerm = params['search'] || '';
          const profileFilter = params['profile'] || '';
          this.performSearch(searchTerm, page, profileFilter);
        })
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm: string, page: number, profileFilter: string) {
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe()
    }
    this.userServiceSubscription = this.userService.getUsers$(searchTerm, profileFilter, null).subscribe(
      response => {
        const users: User[] = response.map(item => {
          const profile = this.profiles.find(profile => {
            if(item.profile) {
              return profile.id === item.profile.id
            }
            return false
          })
          let profileName = ''
          if (profile) {
            profileName = profile.name
          }
          // --------------------- Setting status. Calculation pending. DELETE IT
          const options = ['high', 'medium', 'low', 'no plan'];
          const randomIndex = Math.floor(Math.random() * options.length);
          const department = this.departments.find(department => department.id === item.departmentRef?.id)
          // --------------------- 
          const user = {
            displayName: item.displayName,
            department: department?.name ? department.name : '',
            hours: 0, // Calculation pending
            profile: profileName,
            ratingPoints: item.ratingPoints,
            rhythm: options[randomIndex], // Calculation pending
            uid: item.uid,
            photoUrl: item.photoUrl,
          }
          console.log(user)
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

  onSelectUser(user: User) {
    this.onStudentSelected.emit(user)
  }

  ngOnDestroy() {
    this.queryParamsSubscription.unsubscribe()
    this.userServiceSubscription.unsubscribe()
    this.profilesSubscription.unsubscribe()
  }
}
