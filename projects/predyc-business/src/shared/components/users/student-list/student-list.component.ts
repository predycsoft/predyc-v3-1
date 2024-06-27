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
import { EnterpriseService } from '../../../services/enterprise.service';

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
    'ultActivity',
    'ratingPoints',
    'rhythm',
  ];

  dataSource = new MatTableDataSource<User>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() onStudentSelected = new EventEmitter<User>()

  @Output() studentsOnList = new EventEmitter<User[]>()

  @Input() origen: string = 'enterprise'
  @Input() enterpriseRef: any = null



  queryParamsSubscription: Subscription
  profilesSubscription: Subscription
  userServiceSubscription: Subscription
  pageSize: number = 100
  totalLength: number
  profiles: Profile[] = []
  departments: Department[] = []
  courses: Curso[] = []
  first = true
  profilefilter;
  profilefilterOld;
  enterprise
  examenInicial = true

  constructor(
    private activatedRoute: ActivatedRoute,
    private departmentService: DepartmentService,
    public icon: IconService,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
    private courseService: CourseService,
    private _snackBar: MatSnackBar,
    private enterpriseService: EnterpriseService,
  ) {}

  ngOnInit() {

    this.enterpriseService.enterpriseLoaded$.subscribe(async isLoaded => {
      if (isLoaded) {
        let enterpriseRef
        if (this.origen == 'admin'){
          enterpriseRef = this.enterpriseRef
          this.enterprise = await this.enterpriseService.getEnterpriseByIdPromise(enterpriseRef.id)
        }else{
          enterpriseRef = this.enterpriseService.getEnterpriseRef();
          this.enterprise = this.enterpriseService.getEnterprise();
        }
        console.log('this.enterprise',this.enterprise,enterpriseRef)
        if(this.enterprise.examenInicial  === undefined || this.enterprise?.examenInicial){
          this.examenInicial = true
        }
        else{
          this.examenInicial = false
        }
        this.first = true
        this.profileService.loadProfiles()
        this.profilesSubscription = combineLatest([this.profileService.getProfiles$(enterpriseRef), this.departmentService.getDepartments$(enterpriseRef), this.courseService.getCourses$(enterpriseRef)]).subscribe(([profiles, departments, courses]) => {
            this.profiles = profiles
            this.departments = departments.sort((a, b) => a.name.localeCompare(b.name));        
            console.log('departments',departments)
            this.courses = courses
            this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
              let sortOrder = []
              const page = Number(params['page']) || 1;
              const profileFilter = params['profile'] || '';
              this.profilefilter = profileFilter
              const searchTerm = params['search'] || '';
              const departmentFilter = params['iddepartment'] || '';
              const ritmoFilter = params['ritmo'] || '';
              const filtroUltimaActividad = params['ultActivity'] || '';
              const sortUltimaActividad = params['sortUltimaActividad'] || '';
              const sortRitmo = params['sortRitmo'] || '';
              const sortRatingPoints = params['sortRatingPoints'] || '';
              const sortDepartamento =  params['sortDepartamento'] || '';
              const sortDatesPlan =  params['sortDatesPlan'] || '';
              const sortHoras =  params['sortHoras'] || '';
              const sortNombre = params['sortNombre'] || '';
              const statusFilter = params['status'] || '';

              this.ritmoFilter = ritmoFilter
              this.filtroDepartamento = departmentFilter
              this.filtroUltimaActividad = filtroUltimaActividad
              this.sortUltimaActividad = sortUltimaActividad
              this.sortRitmo = sortRitmo
              this.sortRatingPoints = sortRatingPoints
              this.sortDatesPlan = sortDatesPlan
              this.sortDepartamento = sortDepartamento
              this.sortHoras = sortHoras
              this.sortNombre = sortNombre
              this.statusFilter = statusFilter

              // Obtener el orden de los sorts desde los parámetros de la URL
              const urlParams = new URLSearchParams(window.location.search);
              urlParams.forEach((value, key) => {
                if (key === 'sortUltimaActividad' || key === 'sortRitmo' || key === 'sortRatingPoints' || key ==='sortDepartamento' || key ==='sortDatesPlan' || key === 'sortHoras' || key === 'sortNombre') {
                  sortOrder.push({ key, value });
                }
              sortOrder = sortOrder.reverse();

              });
              if(this.first){
                this.performSearch(searchTerm, page, profileFilter,departmentFilter,ritmoFilter,filtroUltimaActividad,statusFilter,sortOrder);
              }
              else{
                this.performSearchLocal(searchTerm, page, profileFilter,departmentFilter,ritmoFilter,filtroUltimaActividad,statusFilter,sortOrder);
              }
            })
        })
        
      }
    })

  }

  appySort(sortOrder,users){


    if(sortOrder.length>0){


      sortOrder.forEach(sort => {

        console.log('sort',sort)

        if(sort.key === 'sortNombre'){

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.displayName.localeCompare(b.displayName));
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.displayName.localeCompare(a.displayName));
          }

        }

        if(sort.key === 'sortHoras'){

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.targetHours - b.targetHours);
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.targetHours - a.targetHours);
          }

        }

        if(sort.key === 'sortDatesPlan'){

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.dataEndPlan - b.dataEndPlan);
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.dataEndPlan - a.dataEndPlan);
          }

        }

        if (sort.key === 'sortDepartamento') {

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.department.localeCompare(b.department));
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.department.localeCompare(a.department));
          }
          
        }

        if (sort.key === 'sortRatingPoints') {
          if (sort.value === 'up') {
            users = users.sort((a, b) => a.ratingPoints - b.ratingPoints);
          } else if (sort.value === 'down') {
            users = users.sort((a, b) => b.ratingPoints - a.ratingPoints);
          }
        }

        if(sort.key == 'sortRitmo'){

          if(sort.value == 'up'){

            const activityOrder = ['low','medium','high','no iniciado','no plan'];
            users = users.sort((a, b) => {
      
              // Si las fechas son iguales, ordenar por estado de actividad
              const activityStatusA = a.rhythm || '';
              const activityStatusB = b.rhythm || '';
          
              const activityIndexA = activityOrder.indexOf(activityStatusA);
              const activityIndexB = activityOrder.indexOf(activityStatusB);
          
              // Compara el índice de los estados de actividad en el orden invertido
              if (activityIndexA !== -1 && activityIndexB !== -1) {
                return activityIndexA - activityIndexB;
              }
          
              // Si uno de los estados no está en el array, moverlo al final
              if (activityIndexA === -1 && activityIndexB !== -1) {
                return 1;
              }
              if (activityIndexA !== -1 && activityIndexB === -1) {
                return -1;
              }
          
              return 0; // Si ambos no están en el array, se consideran iguales en esta dimensión
            });

          }
          else if(sort.value == 'down'){
            const activityOrder = ['high','medium','low','no iniciado','no plan'];
            users = users.sort((a, b) => {
      
              // Si las fechas son iguales, ordenar por estado de actividad
              const activityStatusA = a.rhythm || '';
              const activityStatusB = b.rhythm || '';
          
              const activityIndexA = activityOrder.indexOf(activityStatusA);
              const activityIndexB = activityOrder.indexOf(activityStatusB);
          
              // Compara el índice de los estados de actividad en el orden invertido
              if (activityIndexA !== -1 && activityIndexB !== -1) {
                return activityIndexA - activityIndexB;
              }
          
              // Si uno de los estados no está en el array, moverlo al final
              if (activityIndexA === -1 && activityIndexB !== -1) {
                return 1;
              }
              if (activityIndexA !== -1 && activityIndexB === -1) {
                return -1;
              }
          
              return 0; // Si ambos no están en el array, se consideran iguales en esta dimensión
            });

          }

        }
        if(sort.key == 'sortUltimaActividad'){

          if(sort.value == 'up'){

            const activityOrder = ['Sin inicio sesión', 'Sin diagnóstico completado', 'Sin clases vistas'];
            users = users.sort((a, b) => {
              const activityStatusA = a.activityStatusText || '';
              const activityStatusB = b.activityStatusText || '';
          
              // Compara el índice de los estados de actividad
              const activityIndexA = activityOrder.indexOf(activityStatusA);
              const activityIndexB = activityOrder.indexOf(activityStatusB);
          
              // Si ambos estados de actividad están en el array, ordenar por índice
              if (activityIndexA !== -1 && activityIndexB !== -1) {
                return activityIndexA - activityIndexB;
              }
          
              // Si uno de los estados no está en el array, moverlo al final
              if (activityIndexA === -1 && activityIndexB !== -1) {
                return 1;
              }
              if (activityIndexA !== -1 && activityIndexB === -1) {
                return -1;
              }
          
              // Si ambos estados de actividad no están en el array, ordenar por fecha de actividad descendente
              const dateA = a.lastActivityDate || 0;
              const dateB = b.lastActivityDate || 0;
          
              return dateA - dateB;
            });

          }
          else if(sort.value == 'down'){

            const activityOrder = ['Sin clases vistas', 'Sin diagnóstico completado', 'Sin inicio sesión'];
    
            users = users.sort((a, b) => {
              const dateA = a.lastActivityDate || 0;
              const dateB = b.lastActivityDate || 0;
          
              // Primero ordenar por fecha de actividad descendente
              if (dateA !== dateB) {
                return dateB - dateA;
              }
          
              // Si las fechas son iguales, ordenar por estado de actividad
              const activityStatusA = a.activityStatusText || '';
              const activityStatusB = b.activityStatusText || '';
          
              const activityIndexA = activityOrder.indexOf(activityStatusA);
              const activityIndexB = activityOrder.indexOf(activityStatusB);
          
              // Compara el índice de los estados de actividad en el orden invertido
              if (activityIndexA !== -1 && activityIndexB !== -1) {
                return activityIndexA - activityIndexB;
              }
          
              // Si uno de los estados no está en el array, moverlo al final
              if (activityIndexA === -1 && activityIndexB !== -1) {
                return 1;
              }
              if (activityIndexA !== -1 && activityIndexB === -1) {
                return -1;
              }
          
              return 0; // Si ambos no están en el array, se consideran iguales en esta dimensión
            });

          }
        }

      });

    }

  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearchLocal(searchTerm: string, page: number, profileFilter: string,departmentFilter: string,ritmoFilter: string,filtroUltimaActividad:string,statusFilter:string,sortOrder) {

    let users = structuredClone(this.allusers);
    console.log('usersFilterLocal',users,profileFilter)

    
    if(profileFilter){
      users = users.filter(x=>x.idProfile == profileFilter)
    }

    if(ritmoFilter){
      if(ritmoFilter == 'sin diagnóstico'){
        users = users.filter(user=> user.rhythm === 'no iniciado' && user.test.length==0)
      }
      else{
        users = users.filter(x=>x.rhythm == ritmoFilter)

      }
    }
    if(departmentFilter){
      users = users.filter(x=>x['idDepartment'] == departmentFilter)
    }

    if(filtroUltimaActividad){

      if (filtroUltimaActividad == 'Sin inicio y sin diagnóstico') {
        const activityOrder = ['Sin inicio sesión', 'Sin diagnóstico completado'];
        users = users.filter(x => activityOrder.includes(x.activityStatusText));
      }

      else if (filtroUltimaActividad == 'Sin inicio y sin clases vistas') {
        const activityOrder = ['Sin inicio sesión', 'Sin clases vistas'];
        users = users.filter(x => activityOrder.includes(x.activityStatusText));
      }

      else if (filtroUltimaActividad == 'Sin inicio, sin diagnóstico y sin clases vistas') {
        const activityOrder = ['Sin inicio sesión', 'Sin diagnóstico completado', 'Sin clases vistas'];
        users = users.filter(x => activityOrder.includes(x.activityStatusText));
      }
      else if(filtroUltimaActividad =='Entre 15 y 30 días'){
        users = users.filter(x=>x.groupedLastActivityRange == filtroUltimaActividad)
      }

      else if(filtroUltimaActividad =='Menos de 15 días' || filtroUltimaActividad =='Más de 30 días'){
        users = users.filter(x=>x.groupedLastActivity == filtroUltimaActividad)

      }
      else if(filtroUltimaActividad =='Menos de 30 días'){
        users = users.filter(x=>x.groupedLastActivity == filtroUltimaActividad || x.groupedLastActivity == 'Menos de 15 días' )

      }
      else{
        users = users.filter(x=>x.activityStatusText == filtroUltimaActividad)

      }
    }

    if(statusFilter && statusFilter!='all'){
      users = users.filter(x=>x.status == statusFilter)
    }

    if (searchTerm) {
      const normalizedSearchTerm = this.removeAccents(searchTerm.toLocaleLowerCase());
      console.log('normalizedSearchTerm',normalizedSearchTerm)

    
      users = users.filter(x => {
        const normalizedMail = this.removeAccents(String(x.mail).toLocaleLowerCase());
        const normalizedDisplayName = this.removeAccents(String(x.displayName).toLocaleLowerCase());
        const normalizedDepartment = this.removeAccents(String(x.department).toLocaleLowerCase());
        const normalizedProfile = this.removeAccents(String(x.profile).toLocaleLowerCase());
        const normalizedLastActivity = this.removeAccents(String(x.activityStatusText).toLocaleLowerCase());
    
        return normalizedMail.includes(normalizedSearchTerm) ||
               normalizedDisplayName.includes(normalizedSearchTerm) ||
               normalizedDepartment.includes(normalizedSearchTerm) ||
               normalizedLastActivity.includes(normalizedSearchTerm) ||
               normalizedProfile.includes(normalizedSearchTerm);
      });
    }

    //sorts

    this.appySort(sortOrder,users)

    console.log('usersFilterLocalReady',users)

    this.paginator.pageIndex = page - 1;
    this.dataSource.data = users;
    this.totalLength = users.length;
    this.studentsOnList.emit(users)
    this.first = false

  }

  removeDuplicates(strings: string[]): string[] {
    return strings.filter((item, index) => strings.indexOf(item) === index);
  }

  performSearch(searchTerm: string, page: number, profileFilter: string,departmentFilter: string,ritmoFilter: string,filtroUltimaActividad:string,statusFilter :string,sortOrder) {


    this.paginator.pageIndex = page - 1;
    this.dataSource.data = [];
    this.totalLength = 0;
    this.studentsOnList.emit(null)


    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
  
    this.userServiceSubscription = this.userService.getUsers$(null, null, null, this.origen == 'admin' ? this.enterpriseRef : null).pipe(
      switchMap(users => {
        const userCourseObservables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid);
          return this.courseService.getAllCoursesByStudent$(userRef).pipe(
            map(courses => ({ user, courses }))
          );
        });
        return combineLatest(userCourseObservables);
      }),
      switchMap(userCourses => {
        const userTestObservables = userCourses.map(userCourse => {
          return this.profileService.getDiagnosticTestForUserPromise(userCourse.user).then(testIn => {
            return { ...userCourse, testIn }; // Agregar el examen a cada usuario
          });
        });
        return Promise.all(userTestObservables);
      })
    ).subscribe(response => {
      let actStatus = ['Sin inicio sesión']
      let groupedLastActivityArray = ['Más de 30 días']
      let users = response.map(({user, courses, testIn}) => {
        let test = testIn.map(test => {
          return {score:test.score,id:test.id}
        });
        const profile = this.profiles.find(profile => profile?.id === user.profile?.id);
        const profileName = profile ? profile.name : '';
        let hours = 0;
        let targetHours = 0;

        let extraHours = 0;
        let extraTargetHours = 0;

        let cursosPlan = courses.filter(x=>x?.active && !x?.isExtraCourse && x?.dateStartPlan && x?.dateEndPlan)
        let coursesExtra = courses.filter(x=>!x?.active)

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

        cursosPlan.forEach(course => {
          hours += course?.progressTime ? course.progressTime : 0;
          const courseJson = this.courses.find(item => item.id === course.courseRef.id);
          if (courseJson) {
            targetHours += courseJson.duracion / 60;
            course.courseTime = courseJson.duracion
          }
        });

        coursesExtra.forEach(course => {
          extraHours += course?.progressTime ? course.progressTime : 0;
          const courseJson = this.courses.find(item => item.id === course.courseRef.id);
          if (courseJson) {
            extraTargetHours += courseJson.duracion / 60;
            course.courseTime = courseJson.duracion
          }
        });

        let progreso = -1

        if(targetHours){
          progreso = ((hours/60)*100)/targetHours
          targetHours = Math.round(targetHours)
        }

        let dateLastActivity = null
        let lastActivityText: string;

        let groupedLastActivity = null

        let groupedLastActivityRange = null


        // Determinar el estado de la actividad
        let activityStatus = 'Sin inicio sesión';
        if (user['lastActivityDate']?.seconds) {
          let date = new Date(user['lastActivityDate'].seconds * 1000);
          date.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00.000
          activityStatus = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
          dateLastActivity = date.getTime();
        
          // Crear la variable de texto para indicar hace cuánto fue la última actividad
          let today = new Date();
          today.setHours(0, 0, 0, 0);
          let diffTime = Math.abs(today.getTime() - date.getTime());
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Diferencia en días

          if(diffDays >= 15 && diffDays <= 30){
            groupedLastActivityRange ='Entre 15 y 30 días'
          }

          if(diffDays < 15){
            groupedLastActivity ='Menos de 15 días'
          }
          else if(diffDays <= 30){
            groupedLastActivity ='Menos de 30 días'
          }
          else{
            groupedLastActivity ='Más de 30 días'
          }
        
          if (diffDays === 0) {
            lastActivityText = 'Hoy';
          } else if (diffDays <= 30) {
            if(diffDays == 1){
              lastActivityText = `Hace 1 día`;
            }
            else{
              lastActivityText = `Hace ${diffDays} días`;
            }
          } else {
            lastActivityText = 'Más de 30 días';
          }
        } else if (!user['lastActivityDate']?.seconds && this.examenInicial && test.length === 0 && user['lastViewDate']) {
          activityStatus = 'Sin diagnóstico completado';
          //groupedLastActivity ='Más de 30 días'
          actStatus.push(activityStatus)
        } else if (!user['lastActivityDate']?.seconds && this.examenInicial && test.length > 0) {
          activityStatus = 'Sin clases vistas';
          //groupedLastActivity ='Más de 30 días'
          actStatus.push(activityStatus)
        }  
        //console.log('cursos revisar',courses)      
        if(groupedLastActivityRange){
          groupedLastActivityArray.push(groupedLastActivityRange)

        }
        if(groupedLastActivity) groupedLastActivityArray.push(groupedLastActivity)

        console.log('RevisarDatosUser',user,groupedLastActivity)

        return {
          displayName: user.displayName,
          department: this.departments.find(department => department.id === user.departmentRef?.id)?.name ? this.departments.find(department => department.id === user.departmentRef?.id)?.name : '',
          idDepartment: user.departmentRef?.id,
          idProfile:user.profile?.id,
          hours,
          groupedLastActivityRange:groupedLastActivityRange,
          lastActivityText,
          mail:user.email,
          groupedLastActivity:groupedLastActivity,
          activityStatusText:activityStatus,
          phone:user.phoneNumber,
          targetHours,
          dataStarPlan:startDay,
          lastActivity: user['lastActivity']?user['lastActivity']:null,
          lastActivityDate: dateLastActivity,
          dataEndPlan:endDay,
          profile: profileName,
          dateLastLogin:user['dateLastLogin']?user['dateLastLogin']['seconds']*1000:null,
          lastViewDate:user['lastViewDate']?user['lastViewDate']['seconds']*1000:null,
          //ratingPoints: this.userService.getRatingPointsFromStudyPlan(courses, this.courses),
          ratingPoints: Math.round(progreso),
          rhythm:user.status =='active'? this.userService.getPerformanceWithDetails(courses):'SinLicencia',
          uid: user.uid,
          status:user.status =='active'? 'active':'inactive',
          photoUrl: user.photoUrl,
          extraHours,
          role:user.role,
          extraTargetHours,
          extraCoursesCount:coursesExtra.length,
          extraCoursesCompletedCount:coursesExtra.filter(x=>x.progress >= 100).length,
          test // Agregar aquí los datos del examen del usuario
        };
        
      });

      const arrayactStatus = this.removeDuplicates(actStatus);
      this.actStatus = arrayactStatus
      if(this.examenInicial){
        groupedLastActivityArray.push('Sin inicio y sin diagnóstico')
        groupedLastActivityArray.push('Sin inicio, sin diagnóstico y sin clases vistas')
      }
      else{
        // groupedLastActivityArray.push('Sin inicio y sin diagnóstico')
        groupedLastActivityArray.push('Sin inicio y sin clases vistas')
      }

      console.log('groupedLastActivityArray',groupedLastActivityArray)
      const groupedLastActivityArrayUnique = this.removeDuplicates(groupedLastActivityArray);
      this.actStatusDaus = groupedLastActivityArrayUnique


      let idsDepartments = []

      users.forEach(user => {
        if(user.idDepartment && !idsDepartments.find(x=> x == user.idDepartment)){
          idsDepartments.push(user.idDepartment)
        }
      });

      let departments = []

      this.departments.forEach(department => {

        let departmentFind = idsDepartments.find(x=> x ==  department.id)
        if(departmentFind){
          departments.push(department)
        }
      });
      this.departments = departments
      
      this.allusers = structuredClone(users)
      

      if(profileFilter){
        users = users.filter(x=>x.idProfile == profileFilter)
      }

      if(filtroUltimaActividad){

        if (filtroUltimaActividad == 'Sin inicio y sin diagnóstico') {
          const activityOrder = ['Sin inicio sesión', 'Sin diagnóstico completado'];
          users = users.filter(x => activityOrder.includes(x.activityStatusText));
        }

        else if (filtroUltimaActividad == 'Sin inicio y sin clases vistas') {
          const activityOrder = ['Sin inicio sesión', 'Sin clases vistas'];
          users = users.filter(x => activityOrder.includes(x.activityStatusText));
        }

        else if (filtroUltimaActividad == 'Sin inicio, sin diagnóstico y sin clases vistas') {
          const activityOrder = ['Sin inicio sesión', 'Sin diagnóstico completado', 'Sin clases vistas'];
          users = users.filter(x => activityOrder.includes(x.activityStatusText));
        }
        else if(filtroUltimaActividad =='Entre 15 y 30 días'){
          users = users.filter(x=>x.groupedLastActivityRange == filtroUltimaActividad)
        }
        else if(filtroUltimaActividad =='Menos de 15 días' || filtroUltimaActividad =='Más de 30 días'){
          users = users.filter(x=>x.groupedLastActivity == filtroUltimaActividad)
  
        }
        else if(filtroUltimaActividad =='Menos de 30 días'){
          users = users.filter(x=>x.groupedLastActivity == filtroUltimaActividad || x.groupedLastActivity == 'Menos de 15 días' )
  
        }
        else{
          users = users.filter(x=>x.activityStatusText == filtroUltimaActividad)
  
        }
      }

      if(statusFilter && statusFilter!='all'){
        users = users.filter(x=>x.status == statusFilter)
      }
  
  
      if(ritmoFilter){
        if(ritmoFilter == 'sin diagnóstico'){
          users = users.filter(user=> user.rhythm === 'no iniciado' && user.test.length==0)
        }
        else{
          users = users.filter(x=>x.rhythm == ritmoFilter)
  
        }
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
          const normalizedLastActivity = this.removeAccents(String(x.activityStatusText).toLocaleLowerCase());


          return normalizedMail.includes(normalizedSearchTerm) ||
                 normalizedDisplayName.includes(normalizedSearchTerm) ||
                 normalizedDepartment.includes(normalizedSearchTerm) ||
                 normalizedLastActivity.includes(normalizedSearchTerm) ||
                 normalizedProfile.includes(normalizedSearchTerm);
        });
      }

      this.appySort(sortOrder,users)
  
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = users;
      this.totalLength = users.length;
      this.studentsOnList.emit(users)
      this.first = false


      // console.log(users);
    });
  }
  actStatus
  actStatusDaus
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

    if(this.origen !='admin'){
      if (this.enableNavigateToUser && user.profile && user.targetHours>0) {
        this.router.navigate([`management/students/${user.uid}`])
      } else {
        this.onStudentSelected.emit(user)
      }
    }
    else{
      this.router.navigate([`admin/students/${user.uid}`])
    }

  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe()
    if (this.profilesSubscription) this.profilesSubscription.unsubscribe()
  }


    statusFilter = ''
    ritmoFilter = ''
    filtroDepartamento = ''
    filtroUltimaActividad=''
    sortUltimaActividad=''
    sortRitmo=''
    sortRatingPoints = ''
    sortDepartamento = ''
    sortDatesPlan=''
    sortHoras = ''
    sortNombre = ''



    cleanDepartments(){

      this.search('sortDepartamento','')
      setTimeout(() => {
        this.search('iddepartment','')
      }, 10);

    }



    clearUltActividad(){

      this.search('sortUltimaActividad','')
      setTimeout(() => {
        this.search('ultActivity','')
      }, 10);

    }


    clearRitmo(){

      this.search('sortRitmo','')
      setTimeout(() => {
        this.search('ritmo','')
      }, 10);

    }



    search(filed: string, search: string) {
      this.router.navigate([], {
        queryParams: { [filed]: search ? search : null, page: 1 },
        queryParamsHandling: 'merge'
      });
    }





}
