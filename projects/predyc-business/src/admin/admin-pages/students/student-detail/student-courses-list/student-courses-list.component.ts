import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { User } from 'projects/shared/models/user.model';
import { Curso } from 'projects/shared/models/course.model';
import { Subscription } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CourseByStudent, CourseByStudentJson } from 'projects/shared/models/course-by-student.model';
import { firestoreTimestampToNumberTimestamp } from 'shared';

interface CourseInfo extends CourseByStudentJson {
  coursePhoto: string
  courseTitle: string
}

@Component({
  selector: 'app-student-courses-list',
  templateUrl: './student-courses-list.component.html',
  styleUrls: ['./student-courses-list.component.css']
})
export class StudentCoursesListComponent {

  constructor(
    private courseService: CourseService,

  ){}

  @Input() userRef: DocumentReference<User>
  @Output() totalLengthChange: EventEmitter<number> = new EventEmitter<number>();

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  displayedColumns: string[] = [
    "courseTitle",
    "dateStart",
    "dateEnd",
    "progress",
    "finalScore"
  ];

  dataSource = new MatTableDataSource<CourseInfo>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 6
  totalLength: number


  ngOnInit() {
    this.courseService.getCoursesByStudent$(this.userRef).subscribe(async coursesByStudent => {
      // Convert each courseByStudent into a promise that resolves to courseData
      const coursesDataPromises = coursesByStudent.map(async (courseByStundet: CourseByStudent) => {
        const courseData: Curso = await this.courseService.getCourseById(courseByStundet.courseRef.id);
  
        return {
          ...courseByStundet,
          dateStart: firestoreTimestampToNumberTimestamp(courseByStundet.dateStart),
          dateEnd: firestoreTimestampToNumberTimestamp(courseByStundet.dateEnd),
          coursePhoto: courseData.foto,
          courseTitle: courseData.titulo,
        };
      });
  
      const coursesData = await Promise.all(coursesDataPromises);
      // console.log("coursesData", coursesData)
      this.dataSource.data = coursesData;
      this.totalLength = coursesData.length;
      this.totalLengthChange.emit(this.totalLength);

  
    });
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
