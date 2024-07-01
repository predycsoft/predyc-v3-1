import { Component, TemplateRef, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreateInstructorComponent } from 'projects/predyc-business/src/shared/components/instructors/create-instructor/create-instructor.component';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { InstructorsService } from 'projects/predyc-business/src/shared/services/instructors.service';
import { RoyaltiesService } from 'projects/predyc-business/src/shared/services/royalties.service';
import { Subscription, combineLatest, filter, take } from 'rxjs';
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
    private afs: AngularFirestore,
    private alertService: AlertsService,
    private courseService:CourseService,
    private royaltiesService:RoyaltiesService,



  ) 
  {

  }


  currentPeriod = null
  newPeriodoForm: FormGroup;
  courseServiceSubscription:Subscription

  courses
  classes
  instructors 

  ngOnInit(): void {
    this.royalties = null

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


    this.royaltiesService.getRoyalties$().subscribe((tableRoyalties)=>{

      console.log('tableRoyalties',tableRoyalties)
    
      this.royalties = tableRoyalties;

      // Ordenar por dateSaved de más reciente a más antiguo
      this.royalties = tableRoyalties.sort((a, b) => {
        return b.dateSaved.seconds - a.dateSaved.seconds;
      });
      if(this.royalties?.length>0){
        this.currentPeriod = this.royalties[0].id
        this.datosPeriodo = this.royalties[0]
      }
      else{
        //this.crearNuevoPeriodo(this.modalPeriodo)
      }
    })
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.tab.textLabel === 'Gestionar instructores') {

    }
    else if(event.tab.textLabel === 'Regalias'){

      console.log('this.royalties',this.royalties)
      if(!this.royalties || this.royalties?.length==0){
        this.crearNuevoPeriodo(this.modalPeriodo)
      }

    }
  }

  royalties = null

  @ViewChild('modalPeriodo') modalPeriodo: TemplateRef<any>;


  periodChange(event){
    const idRoyalties = event.value
    let datosRoyalties = this.royalties.find(x=>x.id == idRoyalties)

    if(datosRoyalties){
      this.datosPeriodo = datosRoyalties
    }
    else{
      this.crearNuevoPeriodo(this.modalPeriodo)
    }


  }

  createInstructor(){
    this.openCreateInstructorrModal(null)

  }
  displayErrors = false
  importData = false;

  async onSubmit(){
    this.displayErrors = false
    if(this.importData){
      this.importData = false;
      if(this.newPeriodoForm.valid){
        let totalPredyc = 0
        let totalInstructores = 0
        let totalTime = 0

        let datos = this.periodDatamported.map(instructorPre => {
          console.log(instructorPre)
          let cursosProceced = instructorPre.cursos.map(curso => {
            return {
              factorVisualizacion: curso.fvTot,
              montoInstructor: curso.instUSD,
              montoPredyc: curso.predycUSD,
              montoTotal: curso.totUSD,
              name: curso.titulo,
              tiempoVistoMinutes:curso.hrsTot*60
            }
          });
          totalPredyc+=instructorPre.predycUSD
          totalInstructores+=instructorPre.instUSD
          totalTime+=(instructorPre.hrsTot*60)

          return {
            cursos:cursosProceced,
            factorVisualizacion:instructorPre.fvTot,
            id:this.instructors.find(x=>this.removeAccents(x.nombre.toLowerCase()) == this.removeAccents(instructorPre.nombre.toLowerCase()))?.id,
            montoInstructor:instructorPre.instUSD,
            montoPredyc:instructorPre.predycUSD,
            montoTotal:instructorPre.totUSD,
            nombre:instructorPre.nombre,
            porcentaje:instructorPre.reg,
            tiempoTotalMinutes:instructorPre.hrsTot*60
          }
        });

        let valores =  this.newPeriodoForm.value
        let datosFinal = {
          borrador:true,
          ...valores,
          totalPredyc:totalPredyc,
          totalInstructores:totalInstructores,
          tiempoPeriodoMinutes:totalTime,
          instructores:datos
        }

        console.log('datosFinal',datosFinal)

        this.datosPeriodo = datosFinal
        this.modalPeriodoCreate.close()

        
       
      }
      else{
        this.displayErrors = true
      }
    }
    else{
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
  
        const completedClassesPrev = await this.courseService.getCompletedClassesByDateRange(startDate,endDate);
  
        console.log('completedClasses',completedClassesPrev)
        //removeDuplicates
  
        const completedClasses = this.removeDuplicates(completedClassesPrev)
  
        console.log('completedClassesSinDuplicados',completedClasses)
  
  
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
  
        this.instructors.forEach(instructor => {
  
          let classesInPeriod = completedClasses.filter(x=>x.clase.instructorRef.id == instructor.id)
          let datosClases = classesInPeriod.map(clase => {
            return clase.clase
          });
          instructor.datosClases = datosClases.length>0 ? datosClases : []
          let tiempoInstructor = 0
          datosClases.forEach(clasesVistas => {
            tiempoInstructor+=clasesVistas.duracion
          });
          let FactorVisualizacion = tiempoInstructor*100/totalTime;
  
          instructor.tiempoTotal = tiempoInstructor
          instructor.factorVisualizacion = FactorVisualizacion
  
          const montoTotal = (FactorVisualizacion/100)*valores.amount
  
          instructor.montoTotal=montoTotal
          // instructor.montoInstructor=montoTotal*(instructor.porcentaje/100)
          // instructor.montoPredyc=montoTotal*(1-(instructor.porcentaje/100))
  
          // totalPredyc += instructor.montoPredyc
          // totalInstructores += instructor.montoInstructor
  
  
          instructor.classInPeriod = classesInPeriod
          let idCursosVistos = instructor.datosClases.map(clase => {
            return clase.idCurso
          });
          idCursosVistos = [...new Set(idCursosVistos)];
          instructor.idCursosVistos = idCursosVistos.length>0 ? idCursosVistos : []
          let cursosWithTime = []
          let montoInstructor =0
          let montoPredyc =0
          idCursosVistos.forEach(idCurso => {
            let datosCurso = this.courses.find(x=>x.id == idCurso)
            let clases = this.classes.filter(x=>x.idCurso == idCurso)
            let tiempoCurso = 0
            let clasesVistasArray = []
            clases.forEach(clase => {
              let clasesVistas = classesInPeriod.filter(x=>x.classRef.id == clase.id )
              clasesVistasArray = clasesVistasArray.concat(clasesVistas)
              tiempoCurso+= (clase.duracion*clasesVistas.length)
            });
            let FactorVisualizacion = tiempoCurso*100/totalTime; 
            const montoTotal = (FactorVisualizacion/100)*valores.amount
  
            //let duplicados = this.findDuplicates(clasesVistasArray)
            let curso = {
              name:datosCurso.titulo,
              tiempoVistoMinutes:tiempoCurso,
              factorVisualizacion:FactorVisualizacion,
              //clasesVistas:clasesVistasArray,
              //clasesVistasDuplicate:duplicados,
              montoTotal:montoTotal,
              porcentajeInstructor:datosCurso.porcentajeInstructor,
              montoInstructor:(montoTotal*((datosCurso.porcentajeInstructor ?datosCurso.porcentajeInstructor : instructor.porcentaje))/100),
              montoPredyc:(montoTotal*(1-((datosCurso.porcentajeInstructor ?datosCurso.porcentajeInstructor : instructor.porcentaje)/100)))
            }
            montoInstructor+=curso.montoInstructor
            montoPredyc+=curso.montoPredyc
            cursosWithTime.push(curso)
          });

          instructor.montoInstructor=montoInstructor
          instructor.montoPredyc= montoPredyc

          totalPredyc += instructor.montoPredyc
          totalInstructores += instructor.montoInstructor

          instructor.cursosWithTime = cursosWithTime;
  
        });
  
        let instuctorWithData = this.instructors.filter(x=>x.factorVisualizacion>0)
        let instructoresFinal =  instuctorWithData.map(inst => {
          return {
            id:inst.id,
            nombre:inst.nombre,
            cursos:inst.cursosWithTime,
            factorVisualizacion:inst.factorVisualizacion,
            tiempoTotalMinutes:inst.tiempoTotal,
            porcentaje:inst.porcentaje,
            montoTotal:(inst.montoTotal),
            montoInstructor:(inst.montoInstructor),
            montoPredyc:(inst.montoPredyc),
          }
        });
        let datos = {
          borrador:true,
          ...valores,
          totalPredyc:totalPredyc,
          totalInstructores:totalInstructores,
          tiempoPeriodoMinutes:totalTime,
          instructores:instructoresFinal
        }
        console.log('datos',datos)
        this.datosPeriodo = datos
        Swal.close();
        this.modalPeriodoCreate.close()
  
        console.log('valores',valores)
      }
      else{
        this.displayErrors = true
      }
    }
    
  }

  datosPeriodo = null;


  removeDuplicates(completedClasses: any[]): any[] {
    let seen = new Set<string>();
    let uniqueClasses: any[] = [];
  
    completedClasses.forEach(claseVista => {
      let pairKey = `${claseVista.classRef.id}-${claseVista.userRef.id}`;
  
      if (!seen.has(pairKey)) {
        seen.add(pairKey);
        uniqueClasses.push(claseVista);
      }
    });
  
    return uniqueClasses;
  }

// Función para encontrar duplicados
findDuplicates(clasesVistasArray: any[]): any[] {
  let pairCount = new Map<string, any>();
  let duplicates: any[] = [];

  clasesVistasArray.forEach(claseVista => {
    let pairKey = `${claseVista.classRef.id}-${claseVista.userRef.id}`;

    if (pairCount.has(pairKey)) {
      pairCount.get(pairKey)!.count += 1;
      pairCount.get(pairKey)!.items.push(claseVista);
    } else {
      pairCount.set(pairKey, { count: 1, items: [claseVista] });
    }
  });

  pairCount.forEach((value, key) => {
    if (value.count > 1) {
      duplicates.push(value);
    }
  });

  return duplicates;
}


  crearNuevoPeriodo(modal){

    this.displayErrors = false


    this.newPeriodoForm = this.fb.group({
      name: [null, [Validators.required]],
      startDate: [null, [Validators.required]],
      endDate: [null, [Validators.required]],
      amount: [null, [Validators.required]],
    });

    this.modalPeriodoCreate= this.modalService.open(modal, {
      animation: true,
      centered: true,
      backdrop: 'static',
    })

  }

  modalPeriodoCreate
  

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

  async savePeriod(){

    try{
      if(!this.datosPeriodo.id){
        this.datosPeriodo.id = await this.afs.collection<any>('royalties').doc().ref.id;
      }
      await this.royaltiesService.saveRoyalties(this.datosPeriodo)
      console.log('datosPeriodo',this.datosPeriodo)
      this.alertService.succesAlert("El período se ha guardado exitosamente")
    }
    catch{
      this.alertService.errorAlert("Error al guardar el período")
    }
  }

  periodDatamported = null

  onFileSelected(event: Event): void {
    this.periodDatamported = null
    const input = event.target as HTMLInputElement;
  
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      console.log('Selected file:', file);
  
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const fileContent = e.target?.result as string;
          const jsonData = JSON.parse(fileContent);
          if (Array.isArray(jsonData)) {
            //console.log('Parsed JSON data:', jsonData);
            this.periodDatamported = jsonData
          } else {
            console.error('The file content is not an array of objects.');
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    }
  }

  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  


}
