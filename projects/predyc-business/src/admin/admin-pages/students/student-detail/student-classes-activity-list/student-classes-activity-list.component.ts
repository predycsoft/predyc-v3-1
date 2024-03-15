import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ClassByStudent } from 'projects/functions/dist/shared/models/class-by-student.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { ClassByStudentJson } from 'projects/shared/models/class-by-student.model';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { User } from 'projects/shared/models/user.model';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared/utils';
import { Subscription, combineLatest } from 'rxjs';


interface ClassByStudentInfo extends ClassByStudentJson {

}

@Component({
  selector: 'app-student-classes-activity-list',
  templateUrl: './student-classes-activity-list.component.html',
  styleUrls: ['./student-classes-activity-list.component.css']
})
export class StudentClassesActivityListComponent {
  constructor(
    private courseService: CourseService,

  ){}

  @Input() userRef: DocumentReference<User>
  @Output() totalLengthChange: EventEmitter<number> = new EventEmitter<number>();

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  displayedColumns: string[] = [
    "courseTitle",
    "classTitle",
    "classType",
    "classDateStart",
    "isCompleted",
    "duration",
  ];

  dataSource = new MatTableDataSource<ClassByStudentInfo>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 6
  totalLength: number
  classesByStudent: ClassByStudent[]
  coursesByStudent: CourseByStudent[]


  ngOnInit() {

    this.combinedServicesSubscription = combineLatest(
      [
        this.courseService.getAllClassesByStudent$(this.userRef),
        this.courseService.getCoursesByStudent$(this.userRef)
      ]
    ).subscribe(([classesByStudent, coursesByStudent]) => {
      this.classesByStudent = classesByStudent
      this.coursesByStudent = coursesByStudent

      this.getTableData()
    })

  }

  async getTableData() {
    const dataToShowPromise: any = this.classesByStudent.map(async (classByStudent: ClassByStudent) => {
      const classInfo = await this.courseService.getClass(classByStudent.classRef.id)
      const courseByStudentInfo = this.coursesByStudent.find(x => x.id === classByStudent.coursesByStudentRef.id)
      const courseInfo = await this.courseService.getCourseById(courseByStudentInfo.courseRef.id)
      
      const classDateStart = firestoreTimestampToNumberTimestamp(classByStudent.dateStart)
      const classDateEnd = firestoreTimestampToNumberTimestamp(classByStudent.dateEnd)

      return {
        courseTitle: courseInfo.titulo,
        coursePhoto: courseInfo.foto,
        classTitle: classInfo.titulo,
        classDateStart,
        classDateEnd,
        classType: classInfo.tipo,
        isCompleted: classByStudent.completed,
        durationMinutes: classByStudent.completed ? (classDateEnd - classDateStart) / (1000*60) : null,
      }
    })

    const dataToShow = await Promise.all(dataToShowPromise);

    dataToShow.sort((a, b) => b.classDateStart - a.classDateStart)

    console.log("dataToShow", dataToShow)

    this.dataSource.data = dataToShow;
    this.totalLength = dataToShow.length;
    this.totalLengthChange.emit(this.totalLength);
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }
  
  ngOnDestroy() {
    if (this.combinedServicesSubscription) this.combinedServicesSubscription.unsubscribe()
    if (this.subscriptionsSubscription) this.subscriptionsSubscription.unsubscribe()
  }
}
