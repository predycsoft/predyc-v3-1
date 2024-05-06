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
    'dates',
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
  pageSize: number = 16
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



        let cursosPlan = courses.filter(x=>x?.active && !x?.isExtraCourse && x?.dateStartPlan && x?.dateEndPlan)

        let start: number[] = []
        let end: number[] = []

        let startDay
        let endDay

        cursosPlan.forEach(curso => {
          console.log('arreglos fechas',curso,curso.dateStartPlan.seconds*1000,curso.dateEndPlan.seconds*1000)
          start.push(curso.dateStartPlan.seconds*1000)
          end.push(curso.dateEndPlan.seconds*1000)
        });


        if(start.length>0 && end.length>0){
          startDay = Math.min(...start)
          endDay = Math.max(...end)
        }

        console.log('cursosPlan',cursosPlan,startDay,endDay)

  
        courses.forEach(course => {
          hours += course?.progressTime ? course.progressTime : 0;
          const courseJson = this.courses.find(item => item.id === course.courseRef.id);
          if (courseJson) {
            targetHours += courseJson.duracion / 60;
            course.courseTime = courseJson.duracion
          }
        });
  
        return {
          displayName: user.displayName,
          department: this.departments.find(department => department.id === user.departmentRef?.id)?.name,
          hours,
          targetHours,
          dataStarPlan:startDay,
          dataEndPlan:endDay,
          profile: profileName,
          ratingPoints: this.userService.getRatingPointsFromStudyPlan(courses, this.courses),
          rhythm: this.userService.getPerformanceWithDetails(courses),
          uid: user.uid,
          photoUrl: user.photoUrl,
          test // Agregar aquí los datos del examen del usuario
        };
      });
  
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = users;
      this.totalLength = response.length;
      console.log(users);
    });
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
