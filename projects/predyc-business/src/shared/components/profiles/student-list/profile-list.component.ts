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
  selector: 'app-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.css']
})
export class ProfileListComponent {

  displayedColumns: string[] = [
    'displayName',
    'amountCourses',
    'amountStudents',
    'duracion'

  ];

  dataSource = new MatTableDataSource<any>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true



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
    private enterpriseService: EnterpriseService,
  ) {}

  ngOnInit() {

    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        console.log(enterpriseRef)
        this.enterprise = this.enterpriseService.getEnterprise();
        console.log('this.enterprise',this.enterprise)

        if(this.enterprise.examenInicial  === undefined || this.enterprise?.examenInicial){
          this.examenInicial = true
  
        }
        else{
          this.examenInicial = false
        }

        this.first = true
        this.profileService.loadProfiles()
        
        this.profilesSubscription = combineLatest([this.profileService.getProfiles$(),this.courseService.getCourses$()]).subscribe(([profiles,cursos]) => {
            this.profiles = profiles.filter(x=>!x.enterprise)
            this.courses = cursos
            console.log('perfiles',profiles)
            this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
              let sortOrder = []
              const page = Number(params['page']) || 1;
              const searchTerm = params['search'] || '';
              const sortNombre =  params['sortNombre'] || '';
              const sortHoras =  params['sortHoras'] || '';
              const sortStudents = params['sortStudents'] || '';
              const sortCourses = params['sortCourses'] || '';

              this.sortHoras = sortHoras
              this.sortStudents = sortStudents
              this.sortCourses = sortCourses
              this.sortNombre = sortNombre

              // Obtener el orden de los sorts desde los parámetros de la URL
              const urlParams = new URLSearchParams(window.location.search);
              urlParams.forEach((value, key) => {
                if (key === 'sortHoras' || key === 'sortStudents' || key === 'sortCourses' || key == 'sortNombre') {
                  sortOrder.push({ key, value });
                }
              sortOrder = sortOrder.reverse();
            })

                            
            if(this.first){
              this.performSearch(searchTerm, page,sortOrder);
            }
            else{
              this.performSearchLocal(searchTerm, page,sortOrder);
            }
        })
        
      })
    }
    })
  }


  

  sortHoras = ''
  sortStudents = ''
  sortCourses = ''
  sortNombre = ''


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  getFormattedDuration(duracion) {
    const hours = Math.floor(duracion / 60);
    const minutes = duracion % 60;
    return `${hours} hrs ${minutes} min`;
  }

  performSearchLocal(searchTerm: string, page: number,sortOrder) {

    let profiles = structuredClone(this.allProfiles);

    if (searchTerm) {
      const normalizedSearchTerm = this.removeAccents(searchTerm.toLocaleLowerCase());
    
      profiles = profiles.filter(x => {
        const displayName = this.removeAccents(String(x.displayName).toLocaleLowerCase());
        return displayName.includes(normalizedSearchTerm)
      });
    }

    //sorts

    this.appySort(sortOrder,profiles)



    this.paginator.pageIndex = page - 1;
    this.dataSource.data = profiles;
    this.totalLength = profiles.length;
    this.first = false

  }

  removeDuplicates(strings: string[]): string[] {
    return strings.filter((item, index) => strings.indexOf(item) === index);
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

        if(sort.key === 'sortCourses'){

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.amountCourses - b.amountCourses);
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.amountCourses - a.amountCourses);
          }

        }

        if(sort.key === 'sortStudents'){

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.amountStudents - b.amountStudents);
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.amountStudents - a.amountStudents);
          }

        }

        if(sort.key === 'sortHoras'){

          if (sort.value === 'up') {
            users = users.sort((a, b) => a.duracion - b.duracion);
          }
          if (sort.value === 'down') {
            users = users.sort((a, b) => b.duracion - a.duracion);
          }

        }




      });

    }

  }



  goToProfile(data){
    this.router.navigate(['/management/profiles/' + data.id])
  }

  performSearch(searchTerm: string, page: number,sortOrder) {


    this.paginator.pageIndex = page - 1;
    this.dataSource.data = [];
    this.totalLength = 0;

    // {{getDurationModuleCourse() | formatDuration}}


    this.userServiceSubscription = this.userService.getUsers$(null, null, null).subscribe( (usersIn)=> {

      let users = usersIn
      let profiles  = this.profiles.map((profile) => {
        let students = users.filter(x=>x?.profile?.id == profile.id)?.length
        let duracion = 0;
        let namesCursos = []

        profile.coursesRef.forEach(curso => {

          let cursoData = this.courses.find(x=>x.id == curso['courseRef']['id'])
          duracion+=cursoData.duracion
          let cursoLight = {
            titulo:cursoData.titulo,
            id:cursoData.id,
            duracion:cursoData.duracion
          }
          namesCursos.push(cursoLight)
        });

        return {
          id:profile.id,
          displayName: profile.name,
          amountCourses: profile.coursesRef.length,
          amountStudents : students,
          duracion : duracion,
          courses : namesCursos,
          duracionFormated : this.getFormattedDuration(duracion)

        };
      
      });
  
      this.allProfiles = structuredClone(profiles)
  
  
      if (searchTerm) {
        const normalizedSearchTerm = this.removeAccents(searchTerm.toLocaleLowerCase());
      
        profiles = profiles.filter(x => {
          const displayName = this.removeAccents(String(x.displayName).toLocaleLowerCase());
          return displayName.includes(normalizedSearchTerm)
        });
      }

      this.appySort(sortOrder,profiles)


      console.log(profiles)
  
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = profiles;
      this.totalLength = profiles.length;
      this.first = false

    })


 
  }
  actStatus
  allProfiles;



  





  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }



  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }


  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe()
    if (this.profilesSubscription) this.profilesSubscription.unsubscribe()
  }




    search(filed: string, search: string) {
      this.router.navigate([], {
        queryParams: { [filed]: search ? search : null, page: 1 },
        queryParamsHandling: 'merge'
      });
    }





}
