import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateInstrcutorComponent } from 'projects/predyc-business/src/shared/components/instructors/create-instructor/create-instructor.component';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { Subscription, filter, take } from 'rxjs';
import Swal from "sweetalert2";

@Component({
  selector: 'app-instructors',
  templateUrl: './instructors.component.html',
  styleUrls: ['./instructors.component.css']
})
export class InstructorsComponent {


  constructor(
    public icon: IconService,
    private modalService: NgbModal,
    private instructorsService: InstructorsService,
    private fb: FormBuilder,
    private courseService:CourseService

  ) 
  {

  }


  currentPeriod = null
  newPeriodoForm: FormGroup;
  courseServiceSubscription:Subscription

  courses
  classes
  instrcutors 

  ngOnInit(): void {

    this.courseServiceSubscription = this.courseService.getCoursesObservable().pipe(filter((course) => course.length > 0),take(1)).subscribe((courses) => {
      let classes = []
      courses.forEach(course => {
        let classesCourse = []
        course['modules'].forEach(modulo => {

          modulo.clases.forEach(clase => {
            clase.idCurso = course.id
          });


          classes = classes.concat(modulo.clases);
          classesCourse = classes.concat(modulo.clases);
        });
        course['classes'] = classesCourse;
      });
      this.classes = classes
      this.courses = courses;
      console.log("this.courses", this.courses);
    });

    this.currentPeriod = null
  }

  createInstructor(){
    this.openCreateInstructorrModal(null)

  }
  displayErrors = false

  async onSubmit(){
    this.displayErrors = false

    if(this.newPeriodoForm.valid){

      Swal.fire({
        title: "Obteniendo datos...",
        text: "Por favor, espera.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let totalPredyc = 0;
      let totalInstructores = 0;

      let valores =  this.newPeriodoForm.value
      let startDate = new Date(valores.startDate)
      let endDate = new Date(valores.endDate)

      const completedClasses = await this.courseService.getCompletedClassesByDateRange(startDate,endDate);
      let totalTime = 0;
      completedClasses.forEach(completedClass => {
        let classe = this.classes.find(x=>x.id == completedClass.classRef.id)
        if(!classe.instructorRef){
          let curso = this.courses.find(x=>x.id == classe.idCurso)
          classe.instructorRef = curso.instructorRef
        }
        // console.log('classe',classe)
        completedClass.clase = classe
        totalTime+= classe.duracion
      });

      this.instrcutors.forEach(instructor => {

        let classesInPeriod = completedClasses.filter(x=>x.clase.instructorRef.id == instructor.id)
        let datosClases = classesInPeriod.map(clase => {
          return clase.clase
        });
        instructor.datosClases = datosClases.length>0 ? datosClases : []
        let tiempoInstrcutor = 0
        datosClases.forEach(clasesVistas => {
          tiempoInstrcutor+=clasesVistas.duracion
        });
        let FactorVisualizacion = tiempoInstrcutor*100/totalTime;

        instructor.tiempoTotal = tiempoInstrcutor
        instructor.factorVisualizacion = FactorVisualizacion

        const montoTotal = (FactorVisualizacion/100)*valores.amount

        instructor.montoTotal=montoTotal
        instructor.montoInstructor=montoTotal*(instructor.porcentaje/100)
        instructor.montoPredyc=montoTotal*(1-(instructor.porcentaje/100))

        totalPredyc += instructor.montoPredyc
        totalInstructores += instructor.montoInstructor


        instructor.classInPeriod = classesInPeriod
        let idCursosVistos = instructor.datosClases.map(clase => {
          return clase.idCurso
        });
        idCursosVistos = [...new Set(idCursosVistos)];
        instructor.idCursosVistos = idCursosVistos.length>0 ? idCursosVistos : []
        let cursosWithTime = []
        idCursosVistos.forEach(idCurso => {
          let datosCurso = this.courses.find(x=>x.id == idCurso)
          let clases = this.classes.filter(x=>x.idCurso == idCurso)
          let tiempoCurso = 0
          clases.forEach(clase => {
            let clasesVistas = classesInPeriod.filter(x=>x.classRef.id == clase.id )
            tiempoCurso+= (clase.duracion*clasesVistas.length)
          });
          let FactorVisualizacion = tiempoCurso*100/totalTime; 
          const montoTotal = (FactorVisualizacion/100)*valores.amount
          let curso = {
            name:datosCurso.titulo,
            tiempoVistoMinutes:tiempoCurso,
            factorVisualizacion:FactorVisualizacion.toFixed(2),
            montoTotal:montoTotal.toFixed(2),
            montoInstructor:(montoTotal*(instructor.porcentaje)/100).toFixed(2),
            montoPredyc:(montoTotal*(1-(instructor.porcentaje/100))).toFixed(2)
          }
          cursosWithTime.push(curso)
        });
        instructor.cursosWithTime = cursosWithTime;

      });

      let instuctorWithData = this.instrcutors.filter(x=>x.factorVisualizacion>0)
      let instructoresFinal =  instuctorWithData.map(inst => {
        return {
          id:inst.id,
          nombre:inst.nombre,
          cursos:inst.cursosWithTime,
          factorVisualizacion:inst.factorVisualizacion.toFixed(2),
          tiempoTotalMinutes:inst.tiempoTotal,
          porcentaje:inst.porcentaje,
          montoTotal:(inst.montoTotal).toFixed(2),
          montoInstructor:(inst.montoInstructor).toFixed(2),
          montoPredyc:(inst.montoPredyc).toFixed(2),
        }
      });
      let datos = {
        ...valores,
        totalPredyc:totalPredyc.toFixed(2),
        totalInstructores:totalInstructores.toFixed(2),
        tiempoPeriodoMinutes:totalTime,
        instructores:instructoresFinal
      }
      console.log('datos',datos)

      Swal.close();

    }
    else{
      this.displayErrors = true

    }
  }

  datosPeriodo = null;
  
  crearNuevoPeriodo(modal){

    this.displayErrors = false


    this.newPeriodoForm = this.fb.group({
      name: [null, [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      amount: [null, [Validators.required]],
    });

    const modalRef = this.modalService.open(modal, {
      animation: true,
      centered: true,
      backdrop: 'static',
    })

    modalRef.result.then(async result => {
      console.log(result)
    }).catch(error => {
      console.log(error)
    })

  }
  

  openCreateInstructorrModal(instructor: any | null) {
    console.log('instructor',instructor)
    const modalRef = this.modalService.open(CreateInstrcutorComponent, {
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


}
