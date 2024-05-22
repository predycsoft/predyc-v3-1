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
import { Subscription, take } from "rxjs";
import { MatTableDataSource } from "@angular/material/table";
import {
  CourseByStudent,
  CourseByStudentJson,
} from "projects/shared/models/course-by-student.model";
import { firestoreTimestampToNumberTimestamp } from "projects/shared/utils";
import { MatDialog } from "@angular/material/dialog";
import { DialogStudentEnrolledCourseDetailComponent } from "projects/predyc-business/src/shared/components/courses/dialog-student-enrolled-course-detail/dialog-student-enrolled-course-detail.component";
import { DiplomadoService } from '../../../../../shared/services/diplomado.service';

interface CourseInfo extends CourseByStudentJson {
  coursePhoto: string;
  courseTitle: string;
}

@Component({
  selector: "app-student-diplomados-list",
  templateUrl: "./student-diplomados-list.component.html",
  styleUrls: ["./student-diplomados-list.component.css"],
})
export class StudentDiplomadosListComponent {
  constructor(
    private courseService: CourseService,
    private diplomadoService: DiplomadoService,
    private dialog: MatDialog
  ) {
  }

  @Input() userRef: DocumentReference<User>;
  @Input() userName: string;

  @Input() userEmail: string;
  @Input() userPhotoUrl: string;


  combinedServicesSubscription: Subscription;
  subscriptionsSubscription: Subscription;

  displayedColumns: string[] = [
    "courseTitle",
    "type",
    "dateStart",
    "dateEnd",
    "progress"
  ];

  dataSource = new MatTableDataSource<CourseInfo>();

  pageSize: number = 4;
  totalLength: number;

  getTypeFullName(type){

    if(type == 'diplomado'){
      return 'Diplomado'
    }
    else if(type == 'pack'){
      return 'Pack de cursos'
    }
    else{
      return 'Plan de capacitación'
    }

  }

  ngOnInit() {
    this.diplomadoService.getDiplomadoByStudent().pipe().subscribe((diplomados)=> {
      console.log('diplomados',diplomados)


      diplomados.forEach(diplomado => {
        let type = this.getTypeFullName(diplomado.type)
        diplomado.typeName = type
        this.diplomadoProgress(diplomado)
        diplomado.progress = diplomado.progreso
        let dateStartFormated = null
        let dateEndFormated = null

        if(diplomado.enrollDate){
          dateStartFormated = diplomado.enrollDate.seconds * 1000
          diplomado.dateStartFormated = dateStartFormated
        }

        if(diplomado.dateEnd){
          dateEndFormated = diplomado.dateEnd.seconds * 1000
          diplomado.dateEndFormated = dateEndFormated
        }


      });

      console.log("coursesData", diplomados);
      this.dataSource.data = diplomados;
      this.totalLength = diplomados.length;

    })


    this.courseService
      .getCoursesByStudent$(this.userRef)
      .subscribe(async (coursesByStudent) => {
        const coursesDataPromises = coursesByStudent.map(
          async (courseByStundet: CourseByStudent) => {
            const courseData: Curso = await this.courseService.getCourseById(
              courseByStundet.courseRef.id
            );
            console.log('courseData',courseData)
            return {
              ...courseByStundet,
              dateStart: firestoreTimestampToNumberTimestamp(courseByStundet.dateStart),
              dateEnd: firestoreTimestampToNumberTimestamp(courseByStundet.dateEnd),
              coursePhoto: courseData.imagen,
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


      });
  }


  diplomadoProgress(diplomado){

		let progress = 0
		diplomado.courses.forEach(curso => {
			if(curso?.studentCourse?.progress){
				progress+=curso?.studentCourse?.progress
			}
		});
		

		if (diplomado.questions){
			let validar = diplomado.courses.find(x=>x.type == 'activity')
			console.log('diploamdoConExamen',diplomado,progress)
			let progressExam = 0

			if (diplomado.activityScore>0){
				progressExam = 100
			}
			let studentCourse = {
				progress:progressExam,
				finalScore:diplomado.activityScore
			}
			let examen  = {
				type:'activity',
				studyPlanOrder:diplomado.courses.length+1,
				studentCourse:studentCourse,
				titulo:'Examen final'
			}

			if (!validar){
				diplomado.courses.push(examen)
			}

			if (progressExam == 100){
				diplomado.progreso = 100
			}
			else{
				let progresoPromedio = (progress/diplomado.courses.filter(x=>x.type != 'activity').length)*0.9
				diplomado.progreso = progresoPromedio
			}

			if(diplomado.progreso>=100){
				diplomado.completado = true
			}

		}
		else{
			let progresoPromedio = progress/diplomado.courses.length
			diplomado.progreso = progresoPromedio
			if(progresoPromedio>=100){
				diplomado.completado = true
				if(!diplomado.certificate)[
					//await this.generarCertificadoPrograma(diplomado)
				]
			}
		}


	}




  ngOnDestroy() {
    if (this.combinedServicesSubscription)
      this.combinedServicesSubscription.unsubscribe();
    if (this.subscriptionsSubscription)
      this.subscriptionsSubscription.unsubscribe();
  }
}
