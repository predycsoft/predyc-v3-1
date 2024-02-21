import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { IconService } from 'src/shared/services/icon.service';
import { UserService } from 'src/shared/services/user.service';
import { combineLatest, filter, forkJoin, map, merge, mergeMap, Observable, of, Subscription, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Curso } from 'src/shared/models/course.model';
import { Department } from 'src/shared/models/department.model';
import { Profile } from 'src/shared/models/profile.model';
import { CourseService } from 'src/shared/services/course.service';
import { DepartmentService } from 'src/shared/services/department.service';
import { ProfileService } from 'src/shared/services/profile.service';

interface User {
  displayName: string,
  profile: string,
  department: string,
  hours: number,
  targetHours: number,
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
  pageSize: number = 8
  totalLength: number
  profiles: Profile[] = []
  departments: Department[] = []
  courses: Curso[] = []

  constructor(
    private activatedRoute: ActivatedRoute,
    private departmentService: DepartmentService,
    public icon: IconService,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
    private courseService: CourseService
  ) {}

  ngOnInit() {
    this.profileService.loadProfiles()
    
    this.profilesSubscription = combineLatest([this.profileService.getProfiles$(), this.departmentService.getDepartments$(), this.courseService.getCourses$()]).subscribe(([profiles, departments, courses]) => {
        this.profiles = profiles
        this.departments = departments
        this.courses = courses
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
    this.userServiceSubscription = this.userService.getUsers$(searchTerm, profileFilter, null).pipe(
      switchMap(users => {
        // For each user, query their active courses
        const observables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid)
          return this.courseService.getActiveCoursesByStudent$(userRef).pipe(
            map(courses => ({ user, courses })),
          );
        });
        return observables.length > 0 ? combineLatest(observables) : of([])
      })).subscribe(response => {
        console.log(response)
        const users: User[] = response.map(({user, courses}) => {
          const profile = this.profiles.find(profile => {
            if(user.profile) {
              return profile.id === user.profile.id
            }
            return false
          })
          let profileName = ''
          if (profile) {
            profileName = profile.name
          }
          let hours = 0
          let targetHours = 0
          courses.forEach(course => {
            hours += course?.progressTime ? course.progressTime : 0
            const courseJson = this.courses.find(item => item.id === course.courseRef.id)
            targetHours += (courseJson.duracion/60)
          })
          const userPerformance: "no plan" | "high" | "medium" | "low" = this.userService.getPerformanceWithDetails(courses);
          const department = this.departments.find(department => department.id === user.departmentRef?.id)
          const ratingPoints: number = this.userService.getRatingPointsFromStudyPlan(courses, this.courses);
          return {
            displayName: user.displayName,
            department: department?.name ? department.name : '',
            hours: hours, // Calculation pending
            targetHours: targetHours,
            profile: profileName,
            ratingPoints: ratingPoints,
            rhythm: userPerformance, // Calculation pending
            uid: user.uid,
            photoUrl: user.photoUrl,
          }
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
    if (this.enableNavigateToUser && user.profile) {
      this.router.navigate([`management/students/${user.uid}`])
    } else {
      this.onStudentSelected.emit(user)
    }
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe()
    if (this.profilesSubscription) this.profilesSubscription.unsubscribe()
  }
}
