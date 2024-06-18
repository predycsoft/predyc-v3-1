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
import { InstructorsService } from '../../../services/instructors.service';
import { LiveCourseService } from '../../../services/live-course.service';

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
  selector: 'app-instructor-list',
  templateUrl: './instructor-list.component.html',
  styleUrls: ['./instructor-list.component.css']
})
export class InstructorListComponent {

  displayedColumns: string[] = [
    'displayName',
    'courses',
    'liveCourses'

  ];

  dataSource = new MatTableDataSource<User>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() onStudentSelected = new EventEmitter<User>()

  @Output() studentsOnList = new EventEmitter<User[]>()

  @Input() origen: string = 'enterprise'
  @Input() enterpriseRef: any = null



  queryParamsSubscription: Subscription
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
    public icon: IconService,
    private router: Router,
    private instructorsService: InstructorsService,
    private _snackBar: MatSnackBar,
    private enterpriseService: EnterpriseService,
    private courseService: CourseService,
    private liveCourseService:LiveCourseService
  ) {}

  instructores;


  ngOnInit() {

    this.first = true

    this.enterpriseService.enterpriseLoaded$.subscribe(async isLoaded => {
      if (isLoaded) {


        this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
          let sortOrder = []
          const page = Number(params['page']) || 1;
          const searchTerm = params['search'] || '';
    
          if(this.first){
            this.performSearch(searchTerm,page)
          }
          else{
            this.performSearchLocal(searchTerm,page)
    
          }
        })


      }
      
    })





  }

  instructorsSubscription: Subscription


  performSearch(searchTerm: string, page: number,sortOrder?) {

    this.paginator.pageIndex = page - 1;
    this.dataSource.data = [];
    this.totalLength = 0;


    this.instructorsSubscription = combineLatest([this.instructorsService.getInstructorsObservable(),this.courseService.getCourses$(),this.liveCourseService.getAllLiveCourses$()]).subscribe(([instructores,cursos,cursosEnVivo]) => {
      
      cursos.forEach(curso => {
        curso['instructorId'] = curso.instructorRef.id
        delete curso.instructorRef
        delete curso.enterpriseRef
        delete curso.skillsRef
      });
      cursosEnVivo.forEach(curso => {
        curso['instructorId'] = curso.instructorRef.id
        delete curso.instructorRef
        delete curso.skillsRef
      });
      instructores = instructores.map(instructor => {
        return{
          nombre: instructor.nombre,
          foto:instructor.foto,
          courses:cursos.filter(x=>x['instructorId']== instructor.id),
          liveCourses:cursosEnVivo.filter(x=>x['instructorId'] == instructor.id)
        }
      });
      this.instructores = structuredClone(instructores)

      console.log('instructores',instructores)

      this.paginator.pageIndex = page - 1;
      this.dataSource.data = instructores;
      this.totalLength = instructores.length;
      this.first = false

          
    })

    this.instructorsService.getInstructorsObservable().pipe().subscribe((instructores) => {

    });


  }

  performSearchLocal(searchTerm: string, page: number,sortOrder?) {

    
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
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



  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.instructorsSubscription) this.instructorsSubscription.unsubscribe()
  }



    search(filed: string, search: string) {
      this.router.navigate([], {
        queryParams: { [filed]: search ? search : null, page: 1 },
        queryParamsHandling: 'merge'
      });
    }





}
