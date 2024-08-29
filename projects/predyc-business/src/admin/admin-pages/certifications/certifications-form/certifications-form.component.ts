import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Activity, Question } from 'projects/shared';
import { Observable, finalize, take } from 'rxjs';
import Swal from 'sweetalert2';
import { Chart } from "chart.js";
import { AngularFireStorage } from '@angular/fire/compat/storage';



@Component({
  selector: 'app-certifications-form',
  templateUrl: './certifications-form.component.html',
  styleUrls: ['./certifications-form.component.css']
})
export class CertificationsFormComponent {

  certificationId = this.route.snapshot.paramMap.get('id');

  constructor(
    public icon: IconService,
    public sanitizer: DomSanitizer,
    private route: ActivatedRoute,
    public activityClassesService:ActivityClassesService,
    private alertService: AlertsService,
    public router: Router,
    private storage: AngularFireStorage,

  ){}

  mode
  results = []
  averageScores = []
  showErrorCertification = false;
  formNewCertification: FormGroup;
  metaDescriptionMaxLength = 141
  keyWordsMaxLength = 100

  ngOnInit(): void {

    if(this.certificationId){ 
      this.mode = 'edit'
      this.activityClassesService.getActivityById(this.certificationId).pipe(take(1)).subscribe((actividad)=>{
        console.log('actividad',actividad);
        this.examen = actividad;
      })
    }
    else{
      this.mode = 'new'
      // alert('Modo crear')

    }
    if(!this.examen){
      let exam = new Activity();
      exam.type = 'certification'
      exam.title = `Prueba Validación`
      exam.updatedAt = new Date().getTime()
      exam.createdAt = new Date().getTime()
      this.questionsFormated = true
      this.examen = exam;
    }
    this.formatExamQuestions();
    this.inicializarformNewCourse()

  }


  async inicializarformNewCourse() {
    if (this.mode == "new") {
      setTimeout(() => {
        this.formNewCertification = new FormGroup({
          id: new FormControl(null),
          titulo: new FormControl(null, Validators.required),
          // resumen: new FormControl(null, Validators.required),
          descripcion: new FormControl(null, Validators.required),
          metaDescripcion: new FormControl(null),
          KeyWords: new FormControl(null),
          // objetivos: this.fb.array([], this.objetivosValidator(1)),
          nivel: new FormControl(null, Validators.required),
          //categoria: new FormControl(null, Validators.required),
          idioma: new FormControl(null, Validators.required),
          // contenido: new FormControl(null, Validators.required),
          imagen: new FormControl(null, Validators.required),
          customUrl: new FormControl(""),
        });
      }, 1);
    } else {

    }
  }

  uploadingImgCurso
  fileNameImgCurso
  uploadProgress$: Observable<number>;
  uploading_file_progressImgCurso = 0;
  imagenesCurso = ["../../../assets/images/cursos/placeholder1.jpg", "../../../assets/images/cursos/placeholder2.jpg", "../../../assets/images/cursos/placeholder3.jpg", "../../../assets/images/cursos/placeholder4.jpg"];


  uploadCourseImage(event, tipo, newInstructor = false) {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      Swal.fire({
        title: "Borrado!",
        text: `Debe seleccionar una imagen`,
        icon: "warning",
        confirmButtonColor: "var(--blue-5)",
      });
      return;
    }
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (_event) => {
      //this.deleteQuestionImage(pregunta);

      if (file) {

        this.uploadingImgCurso = true;
        
        let fileBaseName = file.name.split(".").slice(0, -1).join(".");
        let fileExtension = file.name.split(".").pop();

        let nombre = fileBaseName + "." + fileExtension;
        this.fileNameImgCurso = nombre;

        //console.log(nombre)

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;

        let nombreCurso = this.examen.title ? this.examen.title : "Temporal";

        let filePath;

        filePath = `Tests_Certifications/${nombreCurso}/${newName}`;


        const task = this.storage.upload(filePath, file);

        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);

        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();

        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe((progress) => {
          this.uploading_file_progressImgCurso = Math.floor(progress);
        });

        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task
          .snapshotChanges()
          .pipe(
            finalize(() => {
              // Obtén la URL de descarga del archivo.
              fileRef.getDownloadURL().subscribe((url) => {
                this.uploadingImgCurso = false;
                this.formNewCertification.get("imagen").patchValue(url);
                this.imagenesCurso.unshift(url);
                //console.log(`File URL: ${url}`);
              });
            })
          )
          .subscribe();
      }
    };
  }

  onTabChange(event: MatTabChangeEvent) {
    this.currentTab = 'Contenido del Curso'
    if (event.tab.textLabel === 'Preguntas') {
      this.currentTab = 'Preguntas'
      console.log('El tab Preguntas fue seleccionado');

      if(!this.examen){
        let exam = new Activity();
        exam.type = 'test'
        exam.title = `Questionario`
        exam.updatedAt = new Date().getTime()
        exam.createdAt = new Date().getTime()
        this.questionsFormated = true
        this.examen = exam;
      }
      this.formatExamQuestions();
    }
    else if(event.tab.textLabel === 'Estadísticas'){
      this.chartSetup()
    }
  }

  makeChart = 0
  chartSetup(){
    this.makeChart++;
  }

  currentTab
  examen
  validExam
  updateTriggeQuestionsExam = 0
  questionsFormated

  formatExamQuestions(){

    console.log('formatExamQuestions',this.validExam)

    setTimeout(() => {
      this.updateTriggeQuestionsExam++;
      setTimeout(() => {
        if(this.validExam ==null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0){
          this.updateTriggeQuestionsExam++;
          console.log('formatExamQuestions invalid',this.validExam.controls.questions)
          let formArray: FormArray = this.validExam.get('questions') as FormArray;
          // let preguntasValidas = formArray.controls.filter(control => control.status === 'VALID');
          let preguntasValidas = formArray.controls;
          console.log('preguntasValidas', preguntasValidas);
          let valoresPreguntasValidas = preguntasValidas.map(pregunta => {
            // Return an object that includes all values from the control and the validation status
            return {
              ...pregunta.value,
              valida: pregunta.valid
            };
          });
          console.log('valoresPreguntasValidas', valoresPreguntasValidas);

          if(valoresPreguntasValidas.length>0){

            let questions = structuredClone(valoresPreguntasValidas)
            questions.forEach(question => {
              if(!question.typeFormated){
                question.typeFormated = this.getTypeQuestion(question.type)
                if(question.type == 'complete'){
                  this.showDisplayText(question)
                }
              }
            });
            if(this.examen){
              this.examen.questions = questions
              this.questionsFormated = true
            }
          }
        }
        else{
          let questions = structuredClone(this.validExam.value.questions)
          questions.forEach(question => {
            if(!question.typeFormated){
              question.typeFormated = this.getTypeQuestion(question.type)
              if(question.type == 'complete'){
                this.showDisplayText(question)
              }
            }
          });
          console.log('revisar',this.examen,questions)
          if(this.examen){
            this.examen.questions = questions
            this.questionsFormated = true
          }
        }
      }, 30);
    }, 20);

  }

  getTypeQuestion(type){

    const TYPE_CALCULATED: string = 'calculated';
    const TYPE_MATCHING: string = 'matching';
    const TYPE_NUMERIC: string = 'numeric';
    const TYPE_MULTIPLE_CHOICE: string = 'multiple_choice';
    const TYPE_SINGLE_CHOICE: string = 'single_choice';
    const TYPE_SHORT_ANSWER: string = 'short-answer';
    const TYPE_COMPLETE: string = 'complete';
    const TYPE_TRUE_OR_FALSE: string = 'true-false';

    let typeToInfoDict = {
      [TYPE_MULTIPLE_CHOICE]: {
        value: TYPE_MULTIPLE_CHOICE,
        displayName: 'Opción Múltiple',
        tooltipInfo:
          'Configure una serie de opciones para una pregunta - una o mas respuestas pueden ser correctas',
        createInstructions: '',
        solveInstructions:
          'Seleccione una o mas opciones como correctas del listado de opciones',
      },
      [TYPE_SINGLE_CHOICE]: {
        value: TYPE_SINGLE_CHOICE,
        displayName: 'Opción Simple',
        tooltipInfo:
          'Configure una serie de opciones para una pregunta - solo una respuesta puede ser correcta',
        createInstructions: '',
        solveInstructions:
          'Seleccione la opción correcta del listado de opciones',
      },
      [TYPE_COMPLETE]: {
        value: TYPE_COMPLETE,
        displayName: 'Completar',
        tooltipInfo:
          'Configure una pregunta cuyo texto pueda ser completado a partir de las opciones provistas para cada marcador de referencia - cada marcador debe tener una única respuesta correcta',
        createInstructions:
          'Ingrese cada marcador como una palabra de referencia encerrada entre corchetes ([]).<br/>Ejemplo: El presidente [nombreDelPresidente] nacio en [paisDeNacimiento]',
        solveInstructions:
          'Complete el texto utilizando los selectores proporcionados para dar sentido a la frase',
      },
      [TYPE_TRUE_OR_FALSE]: {
        value: TYPE_TRUE_OR_FALSE,
        displayName: 'Verdadero o Falso',
        tooltipInfo:
          'Configure una pregunta cuya respuesta sea verdadero o falso',
        createInstructions:
          'Marque las opciones que sean verdaderas y deje en blanco las que sean falsas',
        solveInstructions:
          'Clasifique las siguientes afirmaciones como verdadera o falsa',
      }
    }

    let typeComplete = typeToInfoDict[type]
    return typeComplete
  }

  showDisplayText(question:Question) {
    question['render'] = this.sanitizer.bypassSecurityTrustHtml(
      this.getDisplayText(question)
    );
  }

  @ViewChild('input') inputElementRef: ElementRef;
  @ViewChild('mirror') mirrorElementRef: ElementRef;


  adjustInputWidth(element) {
    if (this.mirrorElementRef && this.inputElementRef) {
      const mirrorEl = this.mirrorElementRef.nativeElement;
      mirrorEl.textContent = element.value || element.placeholder;
      element.style.width = `${mirrorEl.offsetWidth}px`;
    }
  }

  getDisplayText(question): string {
    let displayText = question.text;
    const placeholders = this.getPlaceholders(question);
    for (const placeholder of placeholders) {
      const options = question.options.filter(
        (question) => question.placeholder == placeholder
      );
      let optionsHtml =
        '<option disabled selected value> -- Selecciona una opcion -- </option>';
      for (const option of options) {
        optionsHtml += `<option value="${option.text}">${option.text}</option>`;
      }
      const placeholderHtml = `<select class="">${optionsHtml}</select>`;
      displayText = displayText.replace(`[${placeholder}]`, placeholderHtml);
    }
    return displayText;
  }

  getPlaceholders(question): string[] {
    let placeholders = [];
    let matches = question.text.matchAll(/\[([^\[\]]*)\]/g);
    for (let match of matches) {
      placeholders.push(match[1]);
    }
    return placeholders;
  }

  async saveDraftPre(){
    if(this.examen){

      Swal.fire({
        title: 'Generando evaluación...',
        text: 'Por favor, espera.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      });


      let courseRef = null
      let activityClass = new Activity
      console.log('this.activityClass',activityClass)
      let questions: Question[]= []
      questions = structuredClone(this.examen.questions);
      console.log('this.examen',this.examen)
      let auxCoursesRef = this.examen.coursesRef
      this.examen.coursesRef = null
      console.log('this.examen',this.examen)

      activityClass.activityCorazon = this.examen.activityCorazon
      activityClass.claseRef = this.examen.claseRef
      activityClass.coursesRef = this.examen.coursesRef
      activityClass.createdAt = this.examen.createdAt
      activityClass.description = this.examen.description
      activityClass.duration = this.examen.duration
      activityClass.enterpriseRef = this.examen.enterpriseRef
      activityClass.files = this.examen.files
      activityClass.id = this.examen.id
      activityClass.title= this.examen.title
      activityClass.type = this.examen.type
      activityClass.updatedAt = this.examen.updatedAt
      activityClass.enterpriseRef = null

      this.examen.coursesRef = null
      activityClass.coursesRef = null
      activityClass.type = Activity.TYPE_TEST_CERTIFICATIONS;
  
      //console.log('activityExamen',activityClass)
      await this.activityClassesService.saveActivity(activityClass);

      let questionsIds = [];
      let questionsClasses = [];

      this.examen.id = activityClass.id
      for (let pregunta of questions){
        delete pregunta['competencias_tmp'];
        delete pregunta['competencias'];
        delete pregunta['isInvalid'];
        delete pregunta['InvalidMessages'];
        delete pregunta['expanded_categorias'];
        delete pregunta['expanded'];
        delete pregunta['uploading_file_progress'];
        delete pregunta['uploading'];
        await this.activityClassesService.saveQuestion(pregunta,activityClass.id)
        questionsIds.push(pregunta.id)
        if(pregunta.classId){
          questionsClasses.push(pregunta)
        }
      }
      console.log('questionsClasses',questionsClasses)
      if(questionsIds.length>0){
        //remove not present questions
        await this.activityClassesService.removeQuestions(questionsIds,activityClass.id)
      }


      Swal.close();
      this.alertService.succesAlert("la Evaluación se ha guardado exitosamente")

      if(this.mode == 'new'){
        this.router.navigate([`admin/certifications/form/${this.examen.id}`])
      }
      
  



    }


  }





}
