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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateInstructorComponent } from '../create-instructor/create-instructor.component';

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
    'porcentaje',
    'courses',
    'liveCourses',
    'user',
    'firma'
  ];

  dataSource = new MatTableDataSource<User>(); // Replace 'any' with your data type;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  @Output() instructosOnList = new EventEmitter<any[]>()

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
    private liveCourseService:LiveCourseService,
    private modalService: NgbModal,
  ) {}

  instructores;


  openCreateInstructorrModal(instructor: any | null) {
    console.log('instructor',instructor)
    const modalRef = this.modalService.open(CreateInstructorComponent, {
      animation: true,
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false 
    })
    modalRef.componentInstance.instructorToEdit = instructor;
    modalRef.result.then(async result => {
      console.log(result)
      await this.instructorsService.addInstructor(result)
      //this.save(result)
    }).catch(error => {
      console.log(error)
    })
  }



  ngOnInit() {

    // this.loadInstructor()

  }

  loadInstructor(){
    this.first = true
    this.dataSource.paginator = this.paginator;

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
        if(! curso['instructorId']){
          curso['instructorId'] = curso.instructorRef.id
        }
        delete curso.instructorRef
        delete curso.enterpriseRef
        delete curso.skillsRef
      });
      cursosEnVivo.forEach(curso => {
        if(! curso['instructorId']){
          curso['instructorId'] = curso.instructorRef.id
        }
        delete curso['diplomadoLiveRef']
        delete curso.instructorRef
        delete curso.skillsRef
        delete curso.liveCourseTemplateRef
      });
      instructores = instructores.map(instructor => {
        return{
          nombre: instructor.nombre,
          porcentaje:instructor.porcentaje ? instructor.porcentaje: 0 ,
          firma:instructor.firma,
          id:instructor.id,
          email:instructor.email,
          enterpriseId:instructor.enterpriseRef?.id ? instructor.enterpriseRef.id: null ,
          uid:instructor.userRef?.id ? instructor.userRef.id: null ,
          resumen:instructor.resumen,
          descripcion:instructor.descripcion,
          foto:instructor.foto,
          courses:cursos.filter(x=>x['instructorId']== instructor.id),
          liveCourses:cursosEnVivo.filter(x=>x['instructorId'] == instructor.id)
        }
      });
      console.log('instructores',instructores)
      this.instructores = structuredClone(instructores)
      this.instructosOnList.emit(instructores)
    
      instructores = instructores.filter((x) => {
        if (!searchTerm || searchTerm === "") return true;
        return (this.removeAccents(x.nombre.toLocaleLowerCase()).includes(this.removeAccents(searchTerm.toLocaleLowerCase()))
        );
      })

      this.paginator.pageIndex = page - 1;
      this.dataSource.data = instructores;
      this.totalLength = instructores.length;
      this.first = false

          
    })

    this.instructorsService.getInstructorsObservable().pipe().subscribe((instructores) => {

    });


  }

  

  performSearchLocal(searchTerm: string, page: number,sortOrder?) {

    let instructores = structuredClone(this.instructores);

    instructores = instructores.filter((x) => {
      if (!searchTerm || searchTerm === "") return true;
      return (this.removeAccents(x.nombre.toLocaleLowerCase()).includes(this.removeAccents(searchTerm.toLocaleLowerCase()))
      );
    })

    this.paginator.pageIndex = page - 1; // Update the paginator's page index
    this.dataSource.data = instructores; // Assuming the data is in 'items'
    this.totalLength = instructores.length; // Assuming total length is returned
    this.first = false



    
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;

    this.loadInstructor()

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
