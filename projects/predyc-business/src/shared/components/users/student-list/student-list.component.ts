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
import { MatSnackBar } from '@angular/material/snack-bar';

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
  mail: string,
  phone: string,
}

@Component({
  selector: 'app-student-list',
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent {

  displayedColumns: string[] = [
    'displayName',
    'contacto', 
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

  @Output() studentsOnList = new EventEmitter<User[]>()


  queryParamsSubscription: Subscription
  profilesSubscription: Subscription
  userServiceSubscription: Subscription
  pageSize: number = 16
  totalLength: number
  profiles: Profile[] = []
  departments: Department[] = []
  courses: Curso[] = []
  first = true
  profilefilter;
  profilefilterOld;

  constructor(
    private activatedRoute: ActivatedRoute,
    private departmentService: DepartmentService,
    public icon: IconService,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
    private courseService: CourseService,
    private _snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.first = true
    this.profileService.loadProfiles()
    
    this.profilesSubscription = combineLatest([this.profileService.getProfiles$(), this.departmentService.getDepartments$(), this.courseService.getCourses$()]).subscribe(([profiles, departments, courses]) => {
        this.profiles = profiles
        this.departments = departments.sort((a, b) => a.name.localeCompare(b.name));        
        console.log('departments',departments)
        this.courses = courses
        this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
          const page = Number(params['page']) || 1;
          const profileFilter = params['profile'] || '';
          this.profilefilter = profileFilter
          const searchTerm = params['search'] || '';
          const departmentFilter = params['iddepartment'] || '';
          const ritmoFilter = params['ritmo'] || '';
          this.ritmoFilter = ritmoFilter
          this.filtroDepartamento = departmentFilter
          if(this.first){
            this.performSearch(searchTerm, page, profileFilter,departmentFilter,ritmoFilter);
          }
          else{
            this.performSearchLocal(searchTerm, page, profileFilter,departmentFilter,ritmoFilter);
          }
        })
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearchLocal(searchTerm: string, page: number, profileFilter: string,departmentFilter: string,ritmoFilter: string) {

    let users = this.allusers;
    console.log('usersFilterLocal',users,profileFilter)


    
    if(profileFilter){
      users = users.filter(x=>x.idProfile == profileFilter)
    }

    if(ritmoFilter){
      users = users.filter(x=>x.rhythm == ritmoFilter)
    }
    if(departmentFilter){
      users = users.filter(x=>x['idDepartment'] == departmentFilter)
    }
    if (searchTerm) {
      const normalizedSearchTerm = this.removeAccents(searchTerm.toLocaleLowerCase());
    
      users = users.filter(x => {
        const normalizedMail = this.removeAccents(String(x.mail).toLocaleLowerCase());
        const normalizedDisplayName = this.removeAccents(String(x.displayName).toLocaleLowerCase());
        const normalizedDepartment = this.removeAccents(String(x.department).toLocaleLowerCase());
        const normalizedProfile = this.removeAccents(String(x.profile).toLocaleLowerCase());
    
        return normalizedMail.includes(normalizedSearchTerm) ||
               normalizedDisplayName.includes(normalizedSearchTerm) ||
               normalizedDepartment.includes(normalizedSearchTerm) ||
               normalizedProfile.includes(normalizedSearchTerm);
      });
    }

    console.log('usersFilterLocal',users)

    this.paginator.pageIndex = page - 1;
    this.dataSource.data = users;
    this.totalLength = users.length;
    this.studentsOnList.emit(users)
    this.first = false

  }
  

  performSearch(searchTerm: string, page: number, profileFilter: string,departmentFilter: string,ritmoFilter: string) {


    this.paginator.pageIndex = page - 1;
    this.dataSource.data = [];
    this.totalLength = 0;
    this.studentsOnList.emit(null)


    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
  
    this.userServiceSubscription = this.userService.getUsers$(null, null, null).pipe(
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
      let users = response.map(({user, courses, test}) => {
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
          start.push(curso.dateStartPlan.seconds*1000)
          end.push(curso.dateEndPlan.seconds*1000)
        });


        if(start.length>0 && end.length>0){
          startDay = Math.min(...start)
          endDay = Math.max(...end)
        }

        courses.forEach(course => {
          hours += course?.progressTime ? course.progressTime : 0;
          const courseJson = this.courses.find(item => item.id === course.courseRef.id);
          if (courseJson) {
            targetHours += courseJson.duracion / 60;
            course.courseTime = courseJson.duracion
          }
        });

        let progreso = -1

        if(targetHours){
          progreso = ((hours/60)*100)/targetHours
        }
        return {
          displayName: user.displayName,
          department: this.departments.find(department => department.id === user.departmentRef?.id)?.name,
          idDepartment: user.departmentRef?.id,
          idProfile:user.profile?.id,
          hours,
          mail:user.email,
          phone:user.phoneNumber,
          targetHours,
          dataStarPlan:startDay,
          dataEndPlan:endDay,
          profile: profileName,
          //ratingPoints: this.userService.getRatingPointsFromStudyPlan(courses, this.courses),
          ratingPoints: progreso,
          rhythm: this.userService.getPerformanceWithDetails(courses),
          uid: user.uid,
          photoUrl: user.photoUrl,
          test // Agregar aquí los datos del examen del usuario
        };
      });

      console.log('users',users)
      this.allusers = users

      if(profileFilter){
        users = users.filter(x=>x.idProfile == profileFilter)
      }
  
      if(ritmoFilter){
        users = users.filter(x=>x.rhythm == ritmoFilter)
      }
      if(departmentFilter){
        users = users.filter(x=>x.idDepartment == departmentFilter)
      }
      if (searchTerm) {
        const normalizedSearchTerm = this.removeAccents(searchTerm.toLocaleLowerCase());
      
        users = users.filter(x => {
          const normalizedMail = this.removeAccents(String(x.mail).toLocaleLowerCase());
          const normalizedDisplayName = this.removeAccents(String(x.displayName).toLocaleLowerCase());
          const normalizedDepartment = this.removeAccents(String(x.department).toLocaleLowerCase());
          const normalizedProfile = this.removeAccents(String(x.profile).toLocaleLowerCase());
      
          return normalizedMail.includes(normalizedSearchTerm) ||
                 normalizedDisplayName.includes(normalizedSearchTerm) ||
                 normalizedDepartment.includes(normalizedSearchTerm) ||
                 normalizedProfile.includes(normalizedSearchTerm);
        });
      }

      this.paginator.pageIndex = page - 1;
      this.dataSource.data = users;
      this.totalLength = users.length;
      this.studentsOnList.emit(users)
      this.first = false


      // console.log(users);
    });
  }
  allusers;
  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  copiarContacto(message: string = 'Correos copiados', texto,action: string = '') {
    navigator.clipboard.writeText(texto).then(() => {
      this._snackBar.open(message, action, {
        duration: 1000,
        panelClass: ['gray-snackbar'],
      });
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  }


  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  onSelectUser(user: User) {

    // console.log('user',user)

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

    ritmoFilter = ''
    filtroDepartamento = ''


    search(filed: string, search: string) {
      this.router.navigate([], {
        queryParams: { [filed]: search ? search : null, page: 1 },
        queryParamsHandling: 'merge'
      });
    }



}
