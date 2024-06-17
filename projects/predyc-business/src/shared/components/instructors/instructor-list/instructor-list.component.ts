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
  selector: 'app-instructor-list',
  templateUrl: './instructor-list.component.html',
  styleUrls: ['./instructor-list.component.css']
})
export class InstructorListComponent {

  displayedColumns: string[] = [
    'displayName',
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
    public icon: IconService,
    private router: Router,
    private _snackBar: MatSnackBar,
  ) {}

  ngOnInit() {



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
  }



    search(filed: string, search: string) {
      this.router.navigate([], {
        queryParams: { [filed]: search ? search : null, page: 1 },
        queryParamsHandling: 'merge'
      });
    }





}
