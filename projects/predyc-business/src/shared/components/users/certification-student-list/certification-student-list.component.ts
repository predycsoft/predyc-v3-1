import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { combineLatest, filter, forkJoin, map, merge, mergeMap, Observable, of, Subscription, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { Curso } from 'projects/shared/models/course.model';
import { Department } from 'projects/shared/models/department.model';
import { Profile } from 'projects/shared/models/profile.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { DepartmentService } from 'projects/predyc-business/src/shared/services/department.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';

interface User {
  displayName: string,
  profile: string,
  department: string,
  targetHours: number,
  ratingPoints: number,
  uid: string,
  photoUrl: string,
}

@Component({
  selector: 'app-certification-student-list',
  templateUrl: './certification-student-list.component.html',
  styleUrls: ['./certification-student-list.component.css']
})
export class CertificationStudentListComponent {

  displayedColumns: string[] = [
    'displayName',
    'department',
    'ratingPoints',
  ];

  dataSource = new MatTableDataSource<User>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() onStudentSelected = new EventEmitter<User>()

  @Input() resultadosExamen: any = []


  queryParamsSubscription: Subscription
  profilesSubscription: Subscription
  userServiceSubscription: Subscription
  pageSize: number = 200
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

    console.log('resultadosExamen',this.resultadosExamen)

    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
  
    this.userServiceSubscription = this.userService.getUsers$(searchTerm, profileFilter, null).pipe(
      switchMap(users => {
        const userCourseObservables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid);
          return this.courseService.getActiveCoursesByStudent$(userRef).pipe(
            map(courses => ({ user, courses }))
          );
        });
        return combineLatest(userCourseObservables);
      }),
      switchMap(userCourses => {
        const userTestObservables = userCourses.map(userCourse => {
          return this.profileService.getDiagnosticTestForUserPromise(userCourse.user).then(test => {
            return { ...userCourse, test }; // Agregar el examen a cada usuario
          });
        });
        return Promise.all(userTestObservables);
      })
    ).subscribe(response => {
      const users = response.map(({user, courses, test}) => {
        const profile = this.profiles.find(profile => profile?.id === user.profile?.id);
        const profileName = profile ? profile.name : '';
        let hours = 0;
        let targetHours = 0;
        courses.forEach(course => {
          hours += course?.progressTime ? course.progressTime : 0;
          const courseJson = this.courses.find(item => item.id === course.courseRef.id);
          if (courseJson) {
            targetHours += courseJson.duracion / 60;
          }
        });
        return {
          displayName: user.displayName,
          department: this.departments.find(department => department.id === user.departmentRef?.id)?.name,
          targetHours,
          profile: profileName,
          ratingPoints: this.getTestResult(user),
          uid: user.uid,
          photoUrl: user.photoUrl,
          test // Agregar aquí los datos del examen del usuario
        };
      });
      this.paginator.pageIndex = page - 1;

      users.sort(
        (a, b) => b.ratingPoints - a.ratingPoints
      );
      this.dataSource.data = users;
      this.totalLength = response.length;
      console.log('users',users);

    });
  }

  getTestResult(user){
    let result = this.resultadosExamen.find(x=>x.userRef.id == user.uid)

    console.log('result',result)

    if(!result) {
      return null
    }
    return result.score+0.1

  }
  

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  onSelectUser(user: User) {

    console.log('user',user)

    if (this.enableNavigateToUser && user.profile && user.targetHours>0) {
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
