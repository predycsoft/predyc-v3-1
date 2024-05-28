import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, combineLatest, map, switchMap } from 'rxjs';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { Modulo } from 'projects/shared/models/module.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Curso } from 'projects/shared/models/course.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { ClassByStudent } from 'projects/shared/models/class-by-student.model';
import { IconService } from '../../../services/icon.service';
import { Clase } from 'projects/shared/models/course-class.model';
import { firestoreTimestampToNumberTimestamp } from 'projects/shared';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators } from '@angular/forms';


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
    public icon: IconService,
    private afs: AngularFirestore,
    private modalService: NgbModal,
    @Inject(MAT_DIALOG_DATA) public data: {
      userEmail:string,
      userPhotoUrl:string,
      instructorNombre: string,
      instructorRef: DocumentReference<any>,
      userName: string,
      userUid: string,
      courseRef: DocumentReference<Curso>,
      courseTitle: string,
      coursePhoto: string,
      courseByStudentRef: DocumentReference<CourseByStudent>,
      isActive: boolean
      courseDuration:number
    },
  ) { }


  userEmail: string;
  userPhotoUrl: string;
  instructorNombre: string
  instructorRef: DocumentReference<any>
  userName: string
  userUid: string
  courseRef: DocumentReference<Curso>
  courseTitle: string
  coursePhoto: string
  courseByStudentRef: DocumentReference<CourseByStudent>
  isActive: boolean
  courseDuration:number

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  modules: Modulo[]
  completedClasses: ClassByStudent[]

  displayedColumns: string[] = [
    "module",
    "completed",
    "completedClasses",
    "actions",
  ];

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 6
  totalLength: number
  classesAll = []

  coursebyStudentData;


  ngOnInit() {

    this.userEmail = this.data.userEmail;
    this.userPhotoUrl = this.data.userPhotoUrl;

    this.instructorNombre= this.data.instructorNombre;
    this.instructorRef = this.data.instructorRef;
    this.userName = this.data.userName; this.userUid = this.data.userUid 
    this.courseRef = this.data.courseRef ; this.courseTitle = this.data.courseTitle; this.coursePhoto = this.data.coursePhoto; this.courseDuration = this.data.courseDuration
    this.courseByStudentRef = this.data.courseByStudentRef; this.isActive = this.data.isActive

    console.log('DatosRevisar',this.userUid,this.data.courseRef.id)

    this.courseService.getCourseActivitiesTry$(this.data.courseRef.id,this.userUid).subscribe(activityTry => {

      console.log('DatosRevisar activityTry',activityTry)

    })


    this.courseService.getCoursesByStudentWithRef$(this.courseByStudentRef).subscribe(course => {

      console.log('course',course)
      this.coursebyStudentData = course[0]

    })

    this.combinedServicesSubscription = combineLatest(
      [ 
        this.moduleService.getModules$(this.courseRef.id), 
        this.courseService.getClassesByStudentThrougCoursesByStudent$(this.courseByStudentRef)
      ]
    ).pipe(
      switchMap(([modules, completedClasses]) => {
        const allClassIds = modules.flatMap(module => module.clasesRef.map(ref => ref.id));
        return this.courseService.getClassesByIds$(allClassIds).pipe(
          map((classes) => [modules, completedClasses, classes] as [Modulo[], ClassByStudent[], Clase[]])
        );
      })
    ).subscribe(([modules, completedClasses, courseClasses]) => {
      this.modules = modules
      this.completedClasses = completedClasses
      this.classesAll = []
      console.log('completedClasses',completedClasses)
      const modulesInList: any[] = modules.map(module => {
        let completedClassesInsidemodule = 0
        module.clasesRef.forEach(classRef => {
          if (this.completedClasses.find(x => x.classRef.id === classRef.id)) { //check if works comparing refs
            completedClassesInsidemodule ++
          }
        });

        let classesInModule = courseClasses
        .filter(cls => module.clasesRef.some(ref => ref.id === cls.id))
        .map(cls => {
          const completedClass = this.completedClasses.find(completed => completed.classRef.id === cls.id);
          return {
            titulo: cls.titulo,
            isCompleted: !!completedClass,
            dateEnd: completedClass ? firestoreTimestampToNumberTimestamp(completedClass.dateEnd) : null,
            review:completedClass?.review ? completedClass?.review  :null,
            duracion: cls.duracion,
            id: cls.id
          };
        });

        let classesModule = []

        module.clasesRef.forEach(classRef => {
          let clase = classesInModule.find(x=>x.id == classRef.id)
          if(clase){
            classesModule.push(clase)
            this.classesAll.push(clase)
          }
        });


        return {
          ... module,
          completedClassesInsidemodule,
          classes: classesModule
        }
      })
      console.log("modulesInList", modulesInList)
      console.log('classes',this.classesAll)
      modulesInList.sort((a,b) => a.numero - b.numero)
      this.dataSource.data = modulesInList
      this.totalLength = modulesInList.length;
    })
  }

  salir(){
    this.matDialogRef.close(false)
  }


  async removeClase(cls){

    console.log('classesRevisar',cls)

    const classByStudentRef = await this.courseService.enrollClassUser(this.userUid, cls, this.courseByStudentRef);
    
    
    if (classByStudentRef) {

      //await this.courseService.updateClassRemove(classByStudentRef.id)
      const modulesInList = this.dataSource.data
  
      let classes = [];
      modulesInList.forEach((module) => {
        module.classes.forEach((clase) => {
          classes.push(clase);
        });
      });


      classes.find(x=>x.id == cls.id).isCompleted = false;

      console.log('classesRevisar',classes)

      
      let completedClasses = classes.filter((x) => x.isCompleted);
      //completedClasses.push(cls) // current class
  
      let progressTime = 0;
      completedClasses.forEach((clase) => {
        progressTime += clase.duracion;
      });

      let progreso = (completedClasses.length * 90) / classes.length;
      console.log("progreso", progreso) 
			console.log("classesCompleted", completedClasses) 
			console.log("classes.length", classes.length) 

      await this.courseService.updateCourseCompletionStatusTESTRemove(classByStudentRef.id, this.courseByStudentRef.id, progreso, progressTime, this.courseDuration, false);

  
  
    } else {
      console.error("error")
    }

    

  }

  async classReady(cls) {

    // cls: {
    //   titulo: cls.titulo,
    //   isCompleted: !!completedClass,
    //   dateEnd: completedClass ? firestoreTimestampToNumberTimestamp(completedClass.dateEnd) : null,
    //   duracion: cls.duracion,
    //   id: cls.id
    // };
    

    const classByStudentRef = await this.courseService.enrollClassUser(this.userUid, cls, this.courseByStudentRef);

    if (classByStudentRef) {
      const modulesInList = this.dataSource.data
  
      let classes = [];
      modulesInList.forEach((module) => {
        module.classes.forEach((clase) => {
          classes.push(clase);
        });
      });
      
      let completedClasses = classes.filter((x) => x.isCompleted);
      completedClasses.push(cls) // current class
  
      let progressTime = 0;
      completedClasses.forEach((clase) => {
        progressTime += clase.duracion;
      });

      let progreso = (completedClasses.length * 90) / classes.length;
      console.log("progreso", progreso) 
			console.log("classesCompleted", completedClasses) 
			console.log("classes.length", classes.length) 
  
  
      await this.courseService.updateCourseCompletionStatusTEST(classByStudentRef.id, this.courseByStudentRef.id, progreso, progressTime, this.courseDuration, false);
    } else {
      console.error("error")
    }

	}

  currentModal

  formCertificado: FormGroup;
  showError = false;

  async saveCertificate(){
    this.showError = false;

    if(this.formCertificado.valid){
      const formValues = this.formCertificado.value;
      const fecha = new Date(formValues.fecha); // Convertir la fecha a un objeto Date
      const score = formValues.calificacion

      console.log(this.instructorRef)

      const certificado = {
        usuarioId: this.userUid,
        usuarioEmail: this.userEmail,
        usuarioNombre: this.userName,
        cursoId: this.courseRef.id,
        cursoTitulo: this.courseTitle,
        instructorId: this.instructorRef.id,
        instructorNombre: this.instructorNombre,
        puntaje: score,
        completedAdmin: true,
        usuarioFoto: this.userPhotoUrl ? this.userPhotoUrl : null,
        date: fecha
      };
      await this.afs.collection("coursesByStudent").doc(this.courseByStudentRef.id)
      .update({
        finalScore: score,
        progress:100,
        courseDuration:this.data.courseDuration,
        courseTime:this.data.courseDuration,
        dateEnd: fecha,
        progressTime:this.data.courseDuration
      });
      await this.courseService.saveCertificate(certificado)
      this.currentModal.close()
    }
    else{
      this.showError = true;
    }


  }

  getTodayDate(): string {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return `${year}-${month}-${day}`;
  }
  maxDate: string;


  generarCertificado(createCertificate){


    this.maxDate = this.getTodayDate();

    this.matDialogRef.close(false)
    this.showError = false;


    this.formCertificado = new FormGroup({
      fecha: new FormControl(null, Validators.required),
      calificacion: new FormControl(null, Validators.required),
    })


    this.currentModal = this.modalService.open(createCertificate, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
    });
    
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }
}
