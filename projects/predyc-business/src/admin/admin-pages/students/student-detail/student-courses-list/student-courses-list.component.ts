import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { User } from "projects/shared/models/user.model";
import { Curso } from "projects/shared/models/course.model";
import { Subscription } from "rxjs";
import { MatTableDataSource } from "@angular/material/table";
import {
  CourseByStudent,
  CourseByStudentJson,
} from "projects/shared/models/course-by-student.model";
import { firestoreTimestampToNumberTimestamp } from "projects/shared/utils";
import { MatDialog } from "@angular/material/dialog";
import { DialogStudentEnrolledCourseDetailComponent } from "projects/predyc-business/src/shared/components/courses/dialog-student-enrolled-course-detail/dialog-student-enrolled-course-detail.component";

interface CourseInfo extends CourseByStudentJson {
  coursePhoto: string;
  courseTitle: string;
}

@Component({
  selector: "app-student-courses-list",
  templateUrl: "./student-courses-list.component.html",
  styleUrls: ["./student-courses-list.component.css"],
})
export class StudentCoursesListComponent {
  constructor(
    private courseService: CourseService,
    private dialog: MatDialog
  ) {}

  @Input() userRef: DocumentReference<User>;
  @Input() userName: string;

  @Input() userEmail: string;
  @Input() userPhotoUrl: string;


  combinedServicesSubscription: Subscription;
  subscriptionsSubscription: Subscription;

  displayedColumns: string[] = [
    "courseTitle",
    "isActive",
    "isExtraCourse",
    "dateStart",
    "dateEnd",
    "progress",
    "finalScore",
  ];

  dataSource = new MatTableDataSource<CourseInfo>();

  pageSize: number = 4;
  totalLength: number;

  ngOnInit() {
    this.courseService
      .getCoursesByStudent$(this.userRef)
      .subscribe(async (coursesByStudent) => {
        // console.log("coursesByStudent", coursesByStudent)
        // Convert each courseByStudent into a promise that resolves to courseData
        const coursesDataPromises = coursesByStudent.map(
          async (courseByStundet: CourseByStudent) => {
            // console.log("courseByStundet", courseByStundet)
            const courseData: Curso = await this.courseService.getCourseById(
              courseByStundet.courseRef.id
            );
            console.log('courseData',courseData,courseByStundet)
            return {
              ...courseByStundet,
              dateStart: firestoreTimestampToNumberTimestamp(courseByStundet.dateStart),
              dateEnd: firestoreTimestampToNumberTimestamp(courseByStundet.dateEnd),
              coursePhoto: courseData.imagen,
              hidden:courseByStundet['hidden']?courseByStundet['hidden']:false,
              courseTitle: courseData.titulo,
              instructorNombre: courseData.instructorNombre,
              instructorRef: courseData.instructorRef,
              courseId: courseData.id,
              courseByStudentId: courseByStundet.id,
              duracion: courseData.duracion
            };
          }
        );

        const coursesData = await Promise.all(coursesDataPromises);
        coursesData.sort(
          (a, b) => (b.active === true ? 1 : 0) - (a.active === true ? 1 : 0)
        );

        // console.log("coursesData", coursesData);
        this.dataSource.data = coursesData;
        this.totalLength = coursesData.length;
      });
  }

  openEnrolledCourseDetailDialog(courseData) {
    console.log('courseData',courseData)
    const dialogRef = this.dialog.open(
      DialogStudentEnrolledCourseDetailComponent,
      {
        data: {
          userEmail: this.userEmail,
          userPhotoUrl: this.userPhotoUrl,
          userName: this.userName,
          userUid: this.userRef.id,
          instructorRef:courseData.instructorRef,
          instructorNombre:courseData.instructorNombre,
          courseRef: courseData.courseRef,
          courseTitle: courseData.courseTitle,
          coursePhoto: courseData.coursePhoto,
          courseByStudentRef: this.courseService.getCourseByStudentRef(courseData.courseByStudentId),
          isActive: courseData.active,
          courseDuration: courseData.duracion
        },
      }
    );
  }

  async handleExtraCourseClick(event: Event, data: any, hidden:boolean) {
    event.stopPropagation();
    // Lógica para manejar el clic cuando el curso extracurricular está visible
    console.log('Curso extracurricular visible:', data,hidden);
    await this.courseService.hideShowCourseStudent(data.courseByStudentId,hidden)
  }

  ngOnDestroy() {
    if (this.combinedServicesSubscription)
      this.combinedServicesSubscription.unsubscribe();
    if (this.subscriptionsSubscription)
      this.subscriptionsSubscription.unsubscribe();
  }
}
