import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, combineLatest } from 'rxjs';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { Modulo } from 'projects/shared/models/module.model';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Curso } from 'projects/shared/models/course.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { ClassByStudent } from 'projects/shared/models/class-by-student.model';

@Component({
  selector: 'app-dialog-student-enrolled-course-detail',
  templateUrl: './dialog-student-enrolled-course-detail.component.html',
  styleUrls: ['./dialog-student-enrolled-course-detail.component.css']
})
export class DialogStudentEnrolledCourseDetailComponent {

  constructor(
    public matDialogRef: MatDialogRef<DialogStudentEnrolledCourseDetailComponent>, 
    private courseService: CourseService, 
    private moduleService: ModuleService, 
    @Inject(MAT_DIALOG_DATA) public data: {
      userName: string,
      courseRef: DocumentReference<Curso>,
      courseTitle: string,
      coursePhoto: string,
      courseByStudentRef: DocumentReference<CourseByStudent>,
      isActive: boolean
    },
  ) { }

  userName: string
  courseRef: DocumentReference<Curso>
  courseTitle: string
  coursePhoto: string
  courseByStudentRef: DocumentReference<CourseByStudent>
  isActive: boolean

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  modules: Modulo[]
  completedClasses: ClassByStudent[]

  displayedColumns: string[] = [
    "module",
    "completed",
    "completedClasses",
  ];

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 6
  totalLength: number


  ngOnInit() {
    this.userName = this.data.userName; 
    this.courseRef = this.data.courseRef ; this.courseTitle = this.data.courseTitle; this.coursePhoto = this.data.coursePhoto; this.courseByStudentRef = this.data.courseByStudentRef
    this.isActive = this.data.isActive

    this.combinedServicesSubscription = combineLatest(
      [ 
        this.moduleService.getModules$(this.courseRef.id), 
        this.courseService.getClassesByStudentThrougCoursesByStudent$(this.courseByStudentRef), 
      ]
    ).
    subscribe(([modules, completedClasses]) => {
      this.modules = modules
      this.completedClasses = completedClasses
      const modulesInList: any[] = modules.map(module => {
        const classesQty = module.clasesRef.length
        let completedClassesInsidemodule = 0
        module.clasesRef.forEach(classRef => {
          if (this.completedClasses.find(x => x.classRef.id === classRef.id)) { //check if works comparing refs
            completedClassesInsidemodule ++
          }
        });

        return {
          ... module,
          classesQty,
          completedClassesInsidemodule
        }
      })
      console.log("modulesInList", modulesInList)
      modulesInList.sort((a,b) => a.numero - b.numero)
      this.dataSource.data = modulesInList
      this.totalLength = modulesInList.length;

    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }
}
