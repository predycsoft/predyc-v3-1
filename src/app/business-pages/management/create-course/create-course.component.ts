import { Component, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { IconService } from 'src/shared/services/icon.service';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Curso } from "src/shared/models/course.model"
import { Modulo } from "src/shared/models/module.model"
import { Clase } from "src/shared/models/course-class.model"

import { AngularFireStorage } from '@angular/fire/compat/storage';
import Swal from 'sweetalert2';
import { Observable, Subject, finalize, firstValueFrom, switchMap, tap, filter, take, first, startWith, map } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFirestore,DocumentReference } from '@angular/fire/compat/firestore';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Activity, Question, QuestionOption } from 'src/shared/models/activity-classes.model';
//import * as competencias from '../../../../assets/data/competencias.json';
import { DialogService } from 'src/shared/services/dialog.service';
import { VimeoUploadService } from 'src/shared/services/vimeo-upload.service';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { CategoryService } from 'src/shared/services/category.service';
import { SkillService } from 'src/shared/services/skill.service';
import { Category } from 'src/shared/models/category.model';
import { Skill } from 'src/shared/models/skill.model';
import { CourseService } from 'src/shared/services/course.service';
import { User } from 'src/shared/models/user.model';
import { category } from '../courses/courses.component';
import { ModuleService } from 'src/shared/services/module.service';
import { CourseClassService } from 'src/shared/services/course-class.service';
import { ActivityClassesService } from 'src/shared/services/activity-classes.service';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { compareByString } from 'src/shared/utils';
import { QuestionsComponent } from 'src/shared/components/questions/questions.component';
import { AuthService } from 'src/shared/services/auth.service';
import { InstructorsService } from 'src/shared/services/instructors.service';


interface Categoria {
  id: number;
  name: string;
}

interface Competencia {
  id: number;
  name: string;
  selected: boolean;
  categoriaId: number;
}

@Component({
  selector: 'app-create-course',
  templateUrl: './create-course.component.html',
  styleUrls: ['./create-course.component.css']
})
export class CreateCourseComponent {

  constructor(
    public icon: IconService,
    public router: Router,
    private storage: AngularFireStorage,
    // //private service: GeneralService,
    private modalService: NgbModal,
    private uploadControl: VimeoUploadService,
    private afs: AngularFirestore,
    private dialog: DialogService,
    public sanitizer: DomSanitizer,
    private enterpriseService: EnterpriseService,
    public categoryService : CategoryService,
    public skillService: SkillService,
    public courseService: CourseService,
    public moduleService: ModuleService,
    public courseClassService: CourseClassService,
    public activityClassesService:ActivityClassesService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private instructorsService:InstructorsService

  ) { }

  activeStep = 1;
  steps = [
    'Información del curso',
    'Competencias',
    'Clases',
    'Examen',
    'Vista previa examen',
    //'Resumen'
  ];

  mode = this.route.snapshot.paramMap.get("mode")

  idCurso = this.route.snapshot.paramMap.get("idCurso")
  curso : Curso;
  modulos : Modulo[] = [];
  activitiesCourse;
  examen : Activity;
  categoriasArray;
  competenciasArray
  competenciasEmpresa = []
  competenciasSelected;
  empresa;
  instructores =  []
  filteredinstructores: Observable<any[]>;

  instructoresForm = new FormControl('');



  currentModal;
  @ViewChild('endCourseModal') endCourseModal: ElementRef;

  formNewCourse: FormGroup;
  formNewInstructor: FormGroup;

  getOptionText(option){
    let name = option.nombre
    return (name);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.instructores.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  user


  async ngOnInit(): Promise<void> {
    //console.log(this.competenciasArray)

    this.instructorsService.getInstructorsObservable().subscribe(instructores=> {
      console.log('instructores',instructores)
      this.instructores = instructores
    })

    this.filteredinstructores = this.instructoresForm.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );



    this.authService.user$.pipe(filter(user=>user !=null),take(1)).subscribe(user=> {
      console.log('user',user)
      this.user = user
      if (!user?.isSystemUser) {
        this.router.navigate(["management/courses"])
      }
    })

    this.inicializarformNewCourse();
  
    this.enterpriseService.enterprise$.pipe(filter(enterprise=>enterprise!=null),take(1)).subscribe(enterprise => {
      if (enterprise) {
        this.empresa = enterprise
      }
    })
  }

  getExamCourse(idCourse){
    //console.log('idCourse search activity', idCourse);
    this.activityClassesService.getActivityCoruse(idCourse).pipe(filter(data=>data!=null),take(1))
      .subscribe(data => {
        if (data) {
          ////console.log('Activity:', data);
          ////console.log('Questions:', data.questions);
          data.questions.forEach(question => {
           // //console.log('preguntas posibles test',question)
            question.competencias = question.skills
          });
          this.examen = data;
         // //console.log('examen data edit',this.examen)
        }
      });
  }

  anidarCompetenciasInicial(categorias: any[], competencias: any[]): any[] {
    return categorias.map(categoria => {
      let skills = competencias
        .filter(comp => comp.category.id === categoria.id)
        .map(skill => {
          // Por cada skill, retornamos un nuevo objeto sin la propiedad category,
          // pero añadimos la propiedad categoryId con el valor de category.id
          const { category, ...rest } = skill;
          return {
            ...rest,
            categoriaId: category.id
          };
        });
  
      return {
        ...categoria,
        competencias: skills
      };
    });
  }

  obtenerCompetenciasAlAzar(n: number): Competencia[] {
    // Aplanamos la estructura para obtener todas las competencias en un solo arreglo
    const todasLasCompetencias = this.categoriasArray.flatMap(categoria => categoria.competencias);
  
    // Barajamos (shuffle) el arreglo
    for (let i = todasLasCompetencias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todasLasCompetencias[i], todasLasCompetencias[j]] = [todasLasCompetencias[j], todasLasCompetencias[i]]; // Intercambio
    }
  
    // Tomamos las primeras 'n' competencias del arreglo barajado
    return todasLasCompetencias.slice(0, n);
  }

  getSelectedCategoriasCompetencias(){
    let respuesta = [];
    //console.log(this.categoriasArray)

    this.categoriasArray.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected)     
      if(selected.length>0){
        let obj = {
          categoria : {name:categoria.name, id:categoria.id},
          competencias : selected,
          expanded: true
        }
        respuesta.push(obj)
      }
    });

    //this.updateCompetenciasClases(competencia)
    this.competenciasSelected = respuesta;
    //console.log('this.competenciasSelected',this.competenciasSelected)
  }

  initSkills(){
    this.categoryService.getCategoriesObservable().pipe(filter(category=>category!=null),take(1)).subscribe(category => {
      //console.log('category from service', category);
      this.skillService.getSkillsObservable().pipe(filter(skill=>skill!=null),take(1)).subscribe(skill => {
        //console.log('skill from service', skill);
        skill.map(skillIn => {
          delete skillIn['selected']
        });
        if(this.mode == 'edit'){
          //console.log('curso edit', this.curso)
          let skillsProfile = this.curso.skillsRef;
          skillsProfile.forEach(skillIn => {
            let skillSelect = skill.find(skillSelectIn => skillSelectIn.id == skillIn.id)
            if (skillSelect) {
              skillSelect['selected'] = true;
            }
          });
        }
        //console.log('skill from service', skill);
        this.categoriasArray = this.anidarCompetenciasInicial(category, skill)
        //console.log('categoriasArray', this.categoriasArray)
        this.competenciasEmpresa = this.obtenerCompetenciasAlAzar(5);
  
        if(this.mode == 'edit'){
          this.getSelectedCategoriasCompetencias();
          this.getExamCourse(this.curso.id);
        }
      });
    });
  }
  

  async inicializarformNewCourse () {
    let id;
    if(this.mode == 'create') {
      id = await this.afs.collection<Curso>(Curso.collection).doc().ref.id;
      this.formNewCourse = new FormGroup({
        id: new FormControl(id, Validators.required),
        titulo: new FormControl(null, Validators.required),
        // resumen: new FormControl(null, Validators.required),
        descripcion: new FormControl(null, Validators.required),
        nivel: new FormControl(null, Validators.required),
        //categoria: new FormControl(null, Validators.required),
        idioma: new FormControl(null, Validators.required),
        // contenido: new FormControl(null, Validators.required),
        instructorRef: new FormControl(null),
        instructor: new FormControl(null, Validators.required),
        resumen_instructor: new FormControl(null, Validators.required),
        
        imagen: new FormControl(null, Validators.required),
        imagen_instructor: new FormControl(null, Validators.required),
      })
      this.initSkills();
    }
    else {
      this.courseService.getCoursesObservable().pipe(filter(courses=>courses.length>0),take(1)).subscribe(courses => {
        console.log('cursos', courses);
        let curso = courses.find(course => course.id == this.idCurso);
        //console.log('curso edit', curso);
        this.curso = curso;
        curso['modules'].sort((a, b) => a.numero - b.numero);
        this.modulos = curso['modules'];

        console.log('datos cursos',curso)
        
        let instructor = this.instructores.find(x=> x.id == curso.instructorRef.id)

        this.instructoresForm.patchValue(instructor)

        // resumen_instructor
        // imagen_instructor

        this.formNewCourse = new FormGroup({
          id: new FormControl(curso.id, Validators.required),
          titulo: new FormControl(curso.titulo, Validators.required),
          // resumen: new FormControl(curso.resumen, Validators.required),
          descripcion: new FormControl(curso.descripcion, Validators.required),
          nivel: new FormControl(curso.nivel, Validators.required),
          idioma: new FormControl(curso.idioma, Validators.required),
          // contenido: new FormControl(curso.contenido, Validators.required),
          instructorRef: new FormControl(curso.instructorRef),
          instructor: new FormControl(instructor.nombre, Validators.required),
          resumen_instructor: new FormControl(instructor.resumen, Validators.required),
          imagen: new FormControl(curso.imagen, Validators.required),
          imagen_instructor: new FormControl(instructor.foto, Validators.required),
        });

        //this.formNewCourse.get('resumen_instructor').disable();

      
        this.initSkills(); // Asegúrate de que initSkills también maneje las suscripciones correctamente
      
        this.activityClassesService.getActivityAndQuestionsForCourse(this.idCurso).pipe(filter(activities=>activities!=null),take(1)).subscribe(activities => {
          //console.log('activities clases', activities);
          this.activitiesCourse = activities;
          this.modulos.forEach(module => {
            let clases = module['clases'];
            clases.forEach(clase => {
              if (clase.tipo == 'actividad' || clase.tipo == 'corazones') {
                //console.log('activities clases clase', clase);
                let activity = activities.find(activity => activity.claseRef.id == clase.id);
                //console.log('activities clases activity', activity);
                clase.activity = activity;
              }
            });
          });
        });
      });
      
    }
  }

  async setInstructor(instructor){

    let instructorRef = await this.afs.collection<any>('instructor').doc(instructor.id).ref;
    this.formNewCourse.get("instructorRef").patchValue(instructorRef);
    this.formNewCourse.get("instructor").patchValue(instructor.nombre);
    this.formNewCourse.get("resumen_instructor").patchValue(instructor.resumen);
    this.formNewCourse.get("imagen_instructor").patchValue(instructor.foto);

  }

  openModal(content){
    this.currentModal = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'lg'
    });
  }

  modalInstructor
  @ViewChild('modalCrearInstructor') modalCrearInstructorContent: TemplateRef<any>;
  showErrorInstructor = false


  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) {
        // Considera un correo vacío como válido. Usa Validators.required para requerir un valor.
        return null;
      }
  
      // Esta es una expresión regular básica para validación de correos electrónicos.
      // Puedes ajustarla según tus necesidades específicas.
      const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
      const isValid = regex.test(value);
  
      return isValid ? null : { emailInvalid: true };
    };
  }

  openModalinstructor() {

    this.showErrorInstructor = false


    this.formNewInstructor = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      resumen: new FormControl(null, Validators.required),
      foto: new FormControl(null, Validators.required),
    })

    this.modalInstructor =  this.modalService.open(this.modalCrearInstructorContent, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'lg'
    });
    



  }



  createInstructor(){

    this.formNewCourse.get("instructorRef").patchValue(null);
    this.formNewCourse.get("instructor").patchValue(null);
    this.formNewCourse.get("resumen_instructor").patchValue(null);
    this.formNewCourse.get("imagen_instructor").patchValue(null);

    this.openModalinstructor();

  }

  async saveDraft(){
    //console.log('----- save borrador ------');

  if(this.curso){
    //console.log('datos curso',this.curso)
    let enterpriseRef =this.enterpriseService.getEnterpriseRef()
    //this.curso.enterpriseRef = enterpriseRef;
    this.curso.enterpriseRef = null;
    this.courseService.saveCourse(this.curso)


  }
  if(this.competenciasSelected?.length>0){
    //console.log('datos competencias curso',this.competenciasSelected);
    let skills = [];
    for (const category of this.competenciasSelected) {
      for (const skill of category.competencias) {
        //console.log(skill.id);
        let skillRef = await this.afs.collection<Skill>(Skill.collection).doc(skill.id).ref;
        skills.push(skillRef);
      }
    }
    this.curso.skillsRef=skills;
    await this.courseService.saveCourse(this.curso)
    this.courseRef = await this.afs.collection<Curso>(Curso.collection).doc(this.curso.id).ref;

  }
  if(this.modulos.length>0){
    //console.log('datos modulos',this.modulos);
    let validModules = this.modulos.filter(moduleCheck => !moduleCheck['isInvalid'])
    //console.log('validModules save',validModules);
    validModules.forEach(async modulo => {
      ////console.log('modulo clase borrador add/edit',modulo)

      let arrayClasesRef = [];
      const clases = modulo['clases'];
      for (let i = 0; i < clases.length; i++) {
        try {
          let clase = clases[i];
          //console.log('clase borrador add/edit',clase)
          let claseLocal = new Clase;
          claseLocal.HTMLcontent = clase.HTMLcontent;
          claseLocal.archivos = clase.archivos.map(archivo => ({ // Usando map aquí para transformar la estructura del archivo.
            id: archivo.id,
            nombre: archivo.nombre,
            size: archivo.size,
            type: archivo.type,
            url: archivo.url
          }));
          claseLocal.descripcion = clase.descripcion;
          claseLocal.duracion = clase.duracion;
          claseLocal.id = clase.id;
          claseLocal.vimeoId1 = clase.vimeoId1;
          claseLocal.vimeoId2 = clase.vimeoId2;
          claseLocal.skillsRef = clase.skillsRef;
          claseLocal.tipo = clase.tipo;
          claseLocal.titulo = clase.titulo;
          claseLocal.vigente = clase.vigente;
          
          const arrayRefSkills = (clase.competencias?.map(skillClase => this.curso.skillsRef.find(skill => skill.id == skillClase.id)).filter(Boolean) ) || [];
          claseLocal.skillsRef = arrayRefSkills;
          //console.log('claseLocal', claseLocal);
          await this.courseClassService.saveClass(claseLocal);
          let refClass = await this.afs.collection<Clase>(Clase.collection).doc(claseLocal.id).ref;
          let courseRef = await this.afs.collection<Curso>(Curso.collection).doc(this.curso.id).ref;
          //console.log('refClass', refClass);
          arrayClasesRef.push(refClass);

          //console.log('clase.activity',clase.activity)

          if(clase.activity){

            let activityClass = clase.activity
            let questions: Question[]= []
            questions = structuredClone(clase.activity.questions);
            //activityClass.enterpriseRef = this.curso.enterpriseRef as DocumentReference<Enterprise>
            activityClass.enterpriseRef = null
            activityClass.claseRef = refClass;
            activityClass.coursesRef = [courseRef];
            activityClass.type = Activity.TYPE_REGULAR;
            activityClass.activityCorazon = false
            if(clase.tipo == 'corazones'){
              activityClass.activityCorazon = true
            }

            let questionsDelete = activityClass['questions']
            let recursosBase64Delete =activityClass['recursosBase64'] 

            delete activityClass['questions'];
            delete activityClass['recursosBase64'] 
            //console.log('activityClass',activityClass)
            

            await this.activityClassesService.saveActivity(activityClass);

            activityClass['questions'] = questionsDelete
            activityClass['recursosBase64'] = recursosBase64Delete

            clase.activity.id = activityClass.id;


            questions.forEach(pregunta => {
              //const arrayRefSkills = (pregunta['competencias']?.map(skillClase => this.curso.skillsRef.find(skill => skill.id == skillClase.id)).filter(Boolean) ) || [];
              claseLocal.skillsRef = arrayRefSkills;
              //console.log('refSkills', arrayRefSkills)
              //pregunta.skills= arrayRefSkills;
              delete pregunta['typeFormated'];
              delete pregunta['competencias_tmp'];
              delete pregunta['competencias'];
              delete pregunta['isInvalid'];
              delete pregunta['InvalidMessages'];
              delete pregunta['expanded_categorias'];
              delete pregunta['expanded'];
              delete pregunta['uploading_file_progress'];
              delete pregunta['uploading'];
              this.activityClassesService.saveQuestion(pregunta,activityClass.id)
            });
          }
        } catch (error) {
          console.error('Error processing clase', error);
        }
      }
      
      //console.log('arrayClasesRef',arrayClasesRef)

      //let id = Date.now().toString();

      let idRef = await this.afs.collection<Modulo>(Modulo.collection).doc().ref.id;

      //moduleService
      let module = new Modulo;
      module.clasesRef = null
      module.duracion = modulo.duracion;
      module.id = modulo.id;
      module.numero = modulo.numero;
      module.titulo = modulo.titulo;
      module.clasesRef = arrayClasesRef;
      
      if(!modulo.id){
        module.id = idRef;
        modulo.id = idRef
      }
      //console.log('module save', module)
      this.moduleService.saveModulo(module, this.curso.id)
    });

  }

  if(this.examen){
    let courseRef = await this.afs.collection<Curso>(Curso.collection).doc(this.curso.id).ref;
    let activityClass = new Activity
    let questions: Question[]= []
    questions = structuredClone(this.examen.questions);
    activityClass = structuredClone(this.examen) as Activity;
    activityClass.enterpriseRef = this.curso.enterpriseRef as DocumentReference<Enterprise>
    activityClass.coursesRef = [courseRef];
    activityClass.type = Activity.TYPE_TEST;
    activityClass.questions=[];
    delete activityClass.questions

    //console.log('activityExamen',activityClass)
    await this.activityClassesService.saveActivity(activityClass);
    this.examen.id = activityClass.id

    questions.forEach(pregunta => {

      delete pregunta['competencias_tmp'];
      delete pregunta['competencias'];
      delete pregunta['isInvalid'];
      delete pregunta['InvalidMessages'];
      delete pregunta['expanded_categorias'];
      delete pregunta['expanded'];
      delete pregunta['uploading_file_progress'];
      delete pregunta['uploading'];
      this.activityClassesService.saveQuestion(pregunta,activityClass.id)
    });
  }
  }

  previousTab(){
    if (this.activeStep > 1) {
      this.activeStep--
    } else {
      this.router.navigate(["management/courses"])
    }
  }


  // advanceTab(){

  //   this.showErrorCusro = false;
  //   this.mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  //   this.comepetenciaValid= true


  //   let valid = true;
  //   //console.log('tab general',this.activeStep);
  //   if(this.activeStep == 1){
  //     //console.log(this.formNuevoCurso)
  //     if(!this.formNuevoCurso.valid){
  //       valid = false;
  //     }
  //     else{
  //       //console.log('datos curso',this.formNuevoCurso.value)
  //       if(this.curso){
  //         this.curso = this.formNuevoCurso.value;
  //       }
  //       else{
  //         let newCurso = new Curso;
  //         newCurso = this.formNuevoCurso.value;
  //         this.curso = newCurso
  //       }
  //       //console.log('this.curso',this.curso)
  //     }
  //   }
  //   if(this.activeStep == 2){
  //     this.getSelectedCategoriasCompetencias()
  //     //console.log(this.competenciasSelected);
  //     if(!this.competenciasSelected || this.competenciasSelected?.length==0){
  //       valid = false;
  //       this.mensageCompetencias = "Por favor seleccione una competencia";
  //       this.comepetenciaValid = false;
  //     }
  //   }
  //   if(this.activeStep == 3){
  //     if(!this.validarModulosClases()){
  //       valid = false;
  //     }
  //   }
  //   if(this.activeStep == 4){
  //     if(!this.validatePreguntasExamen()){
  //       valid = false;
  //     }
  //     else{
  //       this.closeAllModulos();
  //     }
  //   }


  //   valid = true; // comentar luego de probar
  //   if(valid){
  //     this.activeStep = this.activeStep+1
  //   }
  //   else{
  //     this.showErrorCusro = true;
  //   }

  // }

  avanceTab(){

    this.updateTriggeQuestionsExam=0;

    if (this.activeStep < 6) {
      this.showErrorCurso = false;
      // this.mensageCompetencias = "Selecciona una competencia para asignarla al curso";
      // this.comepetenciaValid= true

      let valid = true;
    
      if(this.activeStep == 1){
        //console.log(this.formNewCourse)
        if(!this.formNewCourse.valid){
          valid = false;
        }
        else{
          console.log('datos curso',this.formNewCourse.value)
          if(this.curso){
            this.curso = this.formNewCourse.value;
            this.curso.instructorNombre = this.curso.instructor
          }
          else{
            let newCurso = new Curso;
            newCurso = this.formNewCourse.value;
            this.curso = newCurso
            this.curso.instructorNombre = this.curso.instructor
          }
          //console.log('this.curso',this.curso)
        }
      }
      if(this.activeStep == 2){
        this.getSelectedCategoriasCompetencias()
        //console.log(this.competenciasSelected);
        if(!this.competenciasSelected || this.competenciasSelected?.length==0){
          valid = false;
          this.mensageCompetencias = "Por favor seleccione una competencia";
          this.comepetenciaValid = false;
        }
      }

      if(this.activeStep == 3){

        // if(!this.validarModulosClases()){
        //   valid = false;
        // }
      }

      if(this.activeStep == 4){
        this.updateTriggeQuestionsExam++;
          if(this.validExam ==null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0){
            valid = false
            this.updateTriggeQuestionsExam++;
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
            }
            else{
              let exam = new Activity();
              exam.questions = questions
              exam.type = 'test'
              exam.title = `Questionario Final: ${this.curso.titulo}`
              exam.updatedAt = new Date().getTime()
              exam.createdAt = new Date().getTime()
              this.examen = exam;
            }

          }
      }

      //valid = true; // comentar luego de probar
    
      if(valid) {
        this.activeStep++
      }
      else {
        this.showErrorCurso = true;
      }
    } else {
      this.openModal(this.endCourseModal)
    }
  }

  uploadingImgCurso = false;
  uploadingImgInstuctor = false;
  fileNameImgCurso = ''
  fileNameImgInstuctor = ''
  uploading_file_progressImgCurso = 0
  uploading_file_progressImgInstuctor = 0
  uploadProgress$: Observable<number>

  imagenesCurso = [
    "../../../assets/images/cursos/placeholder1.jpg",
    "../../../assets/images/cursos/placeholder2.jpg",
    "../../../assets/images/cursos/placeholder3.jpg",
    "../../../assets/images/cursos/placeholder4.jpg",
  ];

  avatarInstructor = [
    "../../../assets/images/cursos/avatar1.svg",
    "../../../assets/images/cursos/avatar2.svg",
    "../../../assets/images/cursos/avatar3.svg",
    "../../../assets/images/cursos/avatar4.svg",
  ];

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const base64content = event.target.result.split(',')[1];
        resolve(base64content);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }

  uploadCourseImage(event,tipo,newInstructor = false){
    if (!event.target.files[0] || event.target.files[0].length === 0) {

      Swal.fire({
        title:'Borrado!',
        text:`Debe seleccionar una imagen`,
        icon:'warning',
        confirmButtonColor: 'var(--blue-5)',
      })
      return;
    }
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (_event) => {
      //this.deleteQuestionImage(pregunta);

      if (file) {
        if(tipo == 'instructor'){
          this.uploadingImgInstuctor = true;
        }
        else{
          this.uploadingImgCurso = true;
        }
        let fileBaseName = file.name.split('.').slice(0, -1).join('.');
        let fileExtension = file.name.split('.').pop();

        let nombre = fileBaseName+'.'+fileExtension;
        if(tipo == 'instructor'){
          this.fileNameImgInstuctor = nombre
        }
        else{
          this.fileNameImgCurso = nombre
        }
        //console.log(nombre)

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        let nombreCurso = this.formNewCourse.get('titulo').value?  this.formNewCourse.get('titulo').value : 'Temporal';
        let nombreinstructor = this.formNewCourse.get('instructor').value?  this.formNewCourse.get('instructor').value : 'Temporal';

        let filePath;

        if(tipo == 'instructor'){
          filePath = `Clientes/${this.empresa.name}/Instructor/${nombreinstructor}/${newName}`;
        }
        else{
          filePath = `Clientes/${this.empresa.name}/Cursos/${nombreCurso}/Imagen/${newName}`;
        }
  
        const task = this.storage.upload(filePath, file);
  
        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);
  
        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();
  
        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe(progress => {
          //console.log(progress);
          if(tipo == 'instructor'){
            this.uploading_file_progressImgInstuctor = Math.floor(progress) ;
          }
          else{
            this.uploading_file_progressImgCurso = Math.floor(progress) ;
          }
        });
  
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              if(tipo == 'instructor'){
                this.uploadingImgInstuctor = false;
                if(!newInstructor){
                  this.formNewCourse.get('imagen_instructor').patchValue(url);
                  this.avatarInstructor.unshift(url);
                }
                else{
                  this.formNewInstructor.get('foto').patchValue(url);
                }

              }
              else{
                this.uploadingImgCurso = false;
                this.formNewCourse.get('imagen').patchValue(url);
                this.imagenesCurso.unshift(url)

              }
              //console.log(`File URL: ${url}`);
            });
          })
        ).subscribe();
      }

    };
  }

  async crearInstructor(){

    this.showErrorInstructor = false;

    console.log(this.formNewInstructor)

    if (!this.formNewInstructor.valid){
      this.showErrorInstructor = true;
    }
    else{

      let instructor = this.formNewInstructor.value
      instructor.ultimaEdicion = new Date
      instructor.ultimoEditor = this.user.uid
      await this.instructorsService.addInstructor(instructor)
      console.log(instructor);

    
    }

  }

  seleccionarImagenCurso(imagen){
    this.formNewCourse.get('imagen').patchValue(imagen);
  }

  seleccionarImagenInstructor(imagen){
    this.formNewCourse.get('imagen_instructor').patchValue(imagen);
  }

  tituloModuloTMP = '';
  tituloclaseTMP = '';

  onModuleTitleChange(event){
    this.tituloModuloTMP = event.value;
    this.tituloclaseTMP = event.value;
  }

  deleteModule(modulo){

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar módulo ${modulo.numero} - ${modulo.titulo? modulo.titulo: 'Sin título'}</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar módulo`,
      cancelButtonText:'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        let numero = modulo.numero;
        this.modulos = this.modulos.filter ( modulo => modulo.numero != numero);
        this.modulos.forEach(modulo =>{
          if(modulo.numero > numero){
            modulo.numero--;
          }
        })

        await this.moduleService.deleteModulo(modulo.id,this.curso.id)

        Swal.fire({
          title:'Borrado!',
          text:`El módulo ${modulo.numero} - ${modulo.titulo? modulo.titulo: 'Sin título'} fué borrado`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }

  totalClases=0;
  
  hideModuleClasses( modulo): void {
    for (const clase of modulo.clases) {
      clase.expanded = false;
      this.totalClases++;
    }
  }

  hideOtherModules(moduloIn){
    this.modulos.map( modulo => {
      if(moduloIn.numero != modulo.numero)
      modulo['expanded'] = false;
      this.hideModuleClasses(modulo);
    })
  }

  closeOtherClasesModulo(openedClase: Clase, modulo): void {
    // Recorrer todas las clases en el módulo.
    for (const clase of modulo.clases) {
        // Si la clase es la que se abrió, establecer expanded en true.
        // De lo contrario, establecer en false.
        if (clase === openedClase) {
            clase.expanded = true;
        } else {
            clase.expanded = false;
        }
    }
  }

  getIconClase(clase){
    if (clase == 'lectura'){
      return 'catelog'
    }
    else if (clase == 'actividad'){
      return 'chess'
    }
    else if (clase == 'corazones'){
      return 'favorite'
    }
    else if(clase == 'video'){
      return 'videoChat'
    }

    return "catelog";
  }

  getnumerClassTipo(moduloIn, claseIn) {
    let modulo = this.modulos.find(modulo=>modulo.numero == moduloIn.numero );
    let clases = modulo['clases'].filter( clase => clase.tipo == claseIn.tipo);
    let valor = clases.findIndex( clase => clase.id == claseIn.id);
    return valor+1
  }

  formNuevaActividadBasica: FormGroup;
  formNuevaActividadGeneral: FormGroup;
//   formNuevaComptencia: FormGroup;
//   questionTypesIn = QuestionType;

  courseRef;

//   questionTypes: Array<QuestionType> = QuestionType.TYPES.sort((a, b) =>
//     compareByString(a.displayName, b.displayName)
//   );

  actividades : Activity[] = [];
//   public zoom = '100%';

  private access_token = "73f2eb055ec905e9a48175cd3c87b6af" // token  de vimeo
//   file_name = "assets/videos/test-video.mp4"
//   //859408918?h=6e44212c1a&amp nuevo formato de id en vimeo

//   panelOpenState = false;

  stepsActividad = [
    'Información básica',
    'Instrucciones generales de la actividad',
    'Preguntas',
    'Previsualización de preguntas',
  ];

  stepsCompetencias = [
    'Clase',
    'Estructura Actividad',
  ];

  onPanelTitleClick(event: Event){
      event.stopPropagation();
  }

  activeStepActividad = 1;
  activeStepCompetencias = 1;


  competenciasSelectedClase = [];

  getSelectedCategoriasCompetenciasClase(){//estoy aqui
    let respuesta = [];
    //console.log(this.competenciasSelectedClase)

    this.competenciasSelectedClase.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected)
      if(selected.length>0){
        //console.log('categoria revisar',categoria)
        let categoriaR;
        if(categoria.categoria){
          categoriaR = categoria.categoria
        }
        else{
          categoriaR={
            id:categoria.id,
            name:categoria.name,
            expanded:false
          }
        }
        let obj = {
          categoria : categoriaR,
          competencias : selected,
          expanded: true
        }
        respuesta.push(obj)
      }
    });

    //console.log(respuesta)
    this.competenciasSelectedClase = respuesta;
    this.competenciasSelectedClaseFormated = this.formatSkills(respuesta);

  }
  competenciasSelectedClaseFormated

  isOverflowRequired(): boolean {
    const container = document.querySelector('.contenedor-chips-selected');
    return container.scrollHeight > container.clientHeight;
  }

  anidarCompetencias(categorias: any[], competencias: any[]): any[] {
    return categorias.map(categoria => {
      let skills = competencias.filter(comp =>comp.categoriaId  === categoria.id)
      //console.log('skills procesado',skills);
      return {
        ...categoria,
        competencias: skills
      };
    });
  }

//   categoriesObservable
//   skillsObservable

//   addClassMode = false;
  obtenerNumeroMasGrande(): number {
    return this.modulos.reduce((maximoActual, modulo) => {
        const maximoModulo = modulo['clases'].reduce((maximoClase, clase) => {
            return Math.max(maximoClase, clase.numero);
        }, -0);

        return Math.max(maximoActual, maximoModulo);
    }, -0);
  }

  obtenerNumeroMasGrandeModulo(moduloIn): number {


    let respuesta = moduloIn?.clases?.length>0 ? moduloIn?.clases?.length:0;
    //console.log('obtenerNumeroMasGrandeModulo',moduloIn.clases.length, respuesta)

    return respuesta
 
  }


  async addClase(tipo,moduloIn){

    let modulo = this.modulos.find(modulo => modulo.numero == moduloIn.numero)
    ////console.log('modulo',modulo);
    let clases = modulo['clases'];
    let clase = new Clase;
    clase.tipo = tipo;
    clase['modulo'];
    //clase.id = Date.now().toString();
    clase.id = await this.afs.collection<Clase>(Clase.collection).doc().ref.id;
    clase['modulo'] = moduloIn.numero;

    let numero = this.obtenerNumeroMasGrandeModulo(moduloIn);
    clase['numero'] = numero;
    clase.date = numero;

    if(clase.tipo == 'lectura'){
      clase.HTMLcontent ='<h4><font face="Arial">Sesi&#243;n de lectura.</font></h4><h6><font face="Arial">&#161;Asegurate de descargar los archivos adjuntos!</font></h6><p><font face="Arial">Encu&#233;ntralos en la secci&#243;n de material descargable</font></p>'
    }

    if(clase.tipo == 'actividad' || clase.tipo ==  'corazones'){
      let actividad = new Activity();
      //actividad.id = Date.now().toString();
      actividad.title = clase.titulo;
      //this.actividades.push(actividad);
      //console.log('actividades', this.actividades)
      actividad['isInvalid'] = true;
      clase['activity'] = actividad;
    }

    //console.log(numero);
    clase['expanded'] = false;

    clases.push(clase);

    //console.log(clases);

  }

  hideOtherQuestion(questionIn){

    //console.log(questionIn);
    //console.log(this.selectedClase.activity.questions)

    this.selectedClase.activity.questions.map(question => {
      if(questionIn.id != question.id)
      question['expanded'] = false;
    })

  }



  borrarPregunta(pregunta,index){
    //console.log(pregunta,index);

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar pregunta ${index+ 1 }</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar pregunta`,
      cancelButtonText:'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteQuestionImage(pregunta);
        this.selectedClase.activity.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
        Swal.fire({
          title:'Borrado!',
          text:`La pregunta fué borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }

//   async crearPreguntaActividad(){

//     let id = await this.afs.collection<Question>(Question.collection).doc().ref.id;
//     let pregunta = new Question;
//     pregunta.id = id;
//     this.hideOtherQuestion(pregunta);
//     pregunta['expanded'] = true;
//     pregunta['competencias'] = [];
//     let activity : Activity = this.selectedClase.activity;
//     //console.log('activity',activity)
//     let questions = activity.questions;
//     //console.log('questions',questions);

//     questions.push(pregunta)

//   }

  addModulo(){
     
    //console.log(this.modulos);

    let number = 0;

    if(this.modulos.length>0){
      const objetoConMayorNumero = this.modulos.reduce((anterior, actual) => {
        return (anterior.numero > actual.numero) ? anterior : actual;
      });
      //console.log(objetoConMayorNumero);
      number = objetoConMayorNumero.numero;
    }
    number++;
    let modulo = new Modulo;
    modulo.numero = number;
    modulo['expanded'] = true;
    modulo['clases'] = [];
    let titulo = "";
    if (number == 1){
      titulo = 'Introducción'
    }
    modulo.titulo = titulo;

    this.modulos.map( modulo => {
      modulo['expanded'] = false;
    } )
    this.modulos.push(modulo);


  }

  borrarClase(moduloIn,claseIn){

    let modulo = this.modulos.find(modulo => modulo.numero == moduloIn.numero);
    let clases = modulo['clases'];

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar clase ${claseIn.numero} - ${claseIn.titulo? claseIn.titulo: 'Sin título'}</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar clase`,
      cancelButtonText:'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {

        clases = clases.filter(clase => clase.id != claseIn.id );
        modulo['clases'] = clases;

        this.courseClassService.deleteClassAndReference(claseIn.id,this.curso.id,moduloIn.id);
        
        Swal.fire({
          title:'Borrado!',
          text:`La clase ${claseIn.numero} - ${claseIn.titulo? claseIn.titulo: 'Sin título'} fué borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })

  }

  preventDefault(event: any) {
    const keyboardEvent = event as KeyboardEvent;
    keyboardEvent.stopPropagation();
  }

  getIconFileFormat(formato){
    
    if (formato == 'application/pdf'){
      return 'pdf'
    }
    else if (formato == 'actividad'){
      return 'chess'
    }
    else if (formato == 'corazones' ){
      return 'favorite'
    }
    else if(formato == 'video'){
      return 'videoChat'
    }

    return "catelog";
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
  }

  onDrop(event: DragEvent,tipo,clase,modulo) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
    const files = event.dataTransfer?.files;
  
    if (files && files.length > 0) {
      const imageFiles: File[] = this.filterFiles(files,tipo);
      if (imageFiles.length > 0) {

        //console.log(imageFiles);
        // logica de subida archivo como tal
        this.onFileSelected(imageFiles,clase,true,modulo)


      } else {
        //console.log('No se encontraron imágenes válidas.');
      }
    }
  }

  filterFiles(files: FileList, tipo: string): File[] {
    let tipoFile;

    if (tipo == 'video') {
        tipoFile = 'video/';
    } else if (tipo == 'lectura') {
        tipoFile = 'application/pdf';
    } else {
        return []; // Retorna un arreglo vacío si el tipo no es reconocido
    }

    const filteredFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file && file.type.startsWith(tipoFile)) {
            filteredFiles.push(file);
        }
    }
    return filteredFiles;
  }

  base64view;


  viewFileActivity = false;
  viewVideoActivity = false;


  async onFileSelected(event,clase,local = false,modulo,adicional = false,tipo= null) {
    clase['uploading'] = true;

    let file;
    if(!local){
      file = event.target.files[0];
    }
    else{
      file = event[0];
    }
    if (file) {
      let fileBaseName = file.name.split('.').slice(0, -1).join('.');
      let fileExtension = file.name.split('.').pop();

      const base64content = await this.fileToBase64(file);
      ////console.log('base64',base64content);  // Aquí tienes el contenido en base64

      if(clase.tipo == 'lectura' || adicional){
        let idFile = Date.now();
        let fileInfo = {
          id: idFile,
          nombre: fileBaseName+'.'+fileExtension,
          size: file.size,
          type: file.type,
          uploading : true,
          uploading_file_progress : 0,
          url: null,
          base64:base64content
        }
        //console.log('adicional',adicional)
        if(tipo == 'archivoActividad'){
          adicional = false;
          this.viewFileActivity= false;
          this.selectedClase.activity['recursosBase64'] = fileInfo;
        }

        if(!adicional && clase.archivos.length>0){
          clase.archivos[0] = fileInfo;

        }else{
          clase.archivos = clase.archivos.concat(fileInfo);
        }
  
        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        let nombreCurso = this.formNewCourse.get('titulo').value?  this.formNewCourse.get('titulo').value : 'Temporal';
  
        const filePath = `Clientes/${this.empresa.name}/Cursos/${nombreCurso}/${newName}`;
        const task = this.storage.upload(filePath, file);
  
        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);
  
        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();
  
        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe(progress => {
          //console.log(progress);
          fileInfo.uploading_file_progress = Math.floor(progress) ;
        });
  
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              //clase['uploading'] = false;
              //console.log(`File URL: ${url}`);
              fileInfo.url = url;
              //clase.archivos = clase.archivos.concat(fileInfo);
              //console.log('clase',clase);
              if(tipo == 'archivoActividad'){
                this.formNuevaActividadGeneral.get('recursos').patchValue(newName);
              }
            });
          })
        ).subscribe();
      }
      else if(clase.tipo == 'video'){
        let nombre =  fileBaseName+'.'+fileExtension;
        clase['base64Video'] = base64content
        clase['videoFileName'] = nombre;
        //console.log(this.selectedClase)
        this.uploadVideo(file,clase,false,modulo);

      }
      else if(clase.tipo == 'actividad'){
        if(tipo == 'videoActividad'){
          let nombre =  fileBaseName+'.'+fileExtension;
          clase['base64Video'] = base64content
          clase['videoFileName'] = nombre;
          this.viewVideoActivity = false
          this.uploadVideo(file,clase,false,modulo,'actividad');
        }
      }
    }
  }



  selectedClase;
  selectedModulo;
  fileViewTipe= null;
//   categoriaNuevaCompetencia;
  modalCompetenciaAsignar;

//   selectedPregunta;



//   openModalAsignarCompetenciaExamen(content,pregunta){

//     this.selectedPregunta = pregunta;

//     if(pregunta.competencias.length > 0){

//       this.competenciasSelectedClase=[]; //estoy aqui
//       let competenciasTotal = structuredClone(this.adjustSkills());
//       let competenciasTotalProcesdo=[]
//       let categorias=[];
//       competenciasTotal.forEach(categoria => {
//         let item = categoria.categoria;
//         item.expanded = true;
//         categorias.push(item)
//         categoria.competencias.forEach(competencia => {
//           competencia.selected = false;
//           competenciasTotalProcesdo.push(competencia)
//         });
//       });
//       ////console.log(competencias);
//       pregunta.competencias.forEach(competencia => {
//         //console.log(competencia)
//         let competenciaP = competenciasTotalProcesdo.find(competenciaeach => competenciaeach.id == competencia.id);
//         competenciaP.selected = true;
//       });

//       //console.log(competenciasTotalProcesdo);
      
//       let respueta  = this.anidarCompetencias(categorias,competenciasTotalProcesdo);
//       //console.log(respueta);
//       this.competenciasSelectedClase = respueta;
//     }
//     else{
//       this.competenciasSelectedClase = structuredClone(this.adjustSkills());
//       this.competenciasSelectedClase.forEach(categoria => {
//         categoria.competencias.forEach(competencia=> {
//           competencia.selected = false
//         });
//       });
//       //console.log(this.competenciasSelectedClase)
//     }

//     this.modalCompetenciaAsignar = this.modalCompetencia = this.modalService.open(content, {
//       ariaLabelledBy: 'modal-basic-title',
//       centered: true,
//       size:'lg'
//     });

//   }

//   saveCompetenciasPregunta(close = true){

//     //console.log('this.competenciasSelectedClase',this.competenciasSelectedClase)
//     //this.selectedClase.competencias = this.competenciasSelectedClase;
//     let arrayCompetencias = [];
//     this.competenciasSelectedClase.forEach(categoria => {
//       let selected = categoria.competencias.filter(competencia => competencia.selected);
//       arrayCompetencias = [...arrayCompetencias, ...selected];
//     });
//     //console.log(arrayCompetencias);

//     this.selectedPregunta.competencias = arrayCompetencias;

//     if(close){
//       this.modalCompetenciaAsignar.close()
//     }
    
//   }

  adjustSkills(){

    this.competenciasSelected.forEach(category => {
      category.competencias.forEach(competencia => {
        competencia.enterprise=null;
      });
    });

    return this.competenciasSelected
  }


  openModalAsignarCompetencia(content,clase){

    this.selectedClase = clase

    this.activeStepCompetencias = 1

    if(clase.competencias?.length > 0){

      this.competenciasSelectedClase=[]; //estoy aqui
      //console.log('this.competenciasSelected',this.competenciasSelected)
      let competenciasTotal = structuredClone(this.adjustSkills());
      let competenciasTotalProcesdo=[]
      let categorias=[];
      competenciasTotal.forEach(categoria => {
        let item = categoria.categoria;
        item.expanded = true;
        categorias.push(item)
        categoria.competencias.forEach(competencia => {
          competencia.selected = false;
          competenciasTotalProcesdo.push(competencia)
        });
      });
      ////console.log(competencias);
      clase.competencias.forEach(competencia => {
        //console.log(competencia)
        let competenciaP = competenciasTotalProcesdo.find(competenciaeach => competenciaeach.id == competencia.id);
        if(competenciaP){
          competenciaP.selected = true;
        }
      });

      //console.log(competenciasTotalProcesdo);
      
      let respueta  = this.anidarCompetencias(categorias,competenciasTotalProcesdo);
      //console.log(respueta);
      this.competenciasSelectedClase = respueta;
      this.competenciasSelectedClaseFormated = this.formatSkills(respueta);

    }
    else{
      //console.log('competenciasSelected',this.competenciasSelected)
      this.competenciasSelectedClase = structuredClone(this.adjustSkills());
      this.competenciasSelectedClase.forEach(categoria => {
        categoria.competencias.forEach(competencia=> {
          competencia.selected = false
        });
      });

      this.competenciasSelectedClaseFormated = this.formatSkills(this.competenciasSelectedClase);


      //console.log(this.competenciasSelectedClase)

    }
    this.modalCompetenciaAsignar = this.openModal(content)
  }

  saveCompetenciasClase(close = true){
    //console.log('this.competenciasSelectedClase',this.competenciasSelectedClase)
    //this.selectedClase.competencias = this.competenciasSelectedClase;
    let arrayCompetencias = [];
    this.competenciasSelectedClase.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected);
      arrayCompetencias = [...arrayCompetencias, ...selected];
    });
    //console.log(arrayCompetencias);

    this.selectedClase.competencias = arrayCompetencias;

    if(close){
      this.modalCompetenciaAsignar.close()
    }

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

  srsView


  seletFilePDF(archivo){

    if(archivo.base64){
      this.base64view = archivo.base64;
      this.srsView = null
    }
    else if (archivo.url){
      this.srsView = archivo.url
      this.base64view = null;
    }

    //console.log('this.base64view',this.base64view,'this.srsView',this.srsView)

  }

  structureActivity(content,clase,modulo,tipo = 'crear') {

    this.selectedClase = clase
    this.selectedModulo = modulo
    this.viewFileActivity = false

    this.activeStepActividad = 1;

    //this.inicializarFormNuevaActividad();

    if(clase.tipo == 'lectura'){
      //this.base64view = clase.archivos[0].base64;
      this.seletFilePDF(clase.archivos[0])
      this.fileViewTipe = 'pdf'

    }
    else if(clase.tipo == 'video'){
      this.base64view = clase['base64Video'];
      this.fileViewTipe = 'video'
    }
    else if(clase.tipo == 'actividad' ||clase.tipo == 'corazones' ){
      let activity : Activity = this.selectedClase.activity

      //console.log('clase',clase)

      this.formNuevaActividadBasica = new FormGroup({
        titulo: new FormControl(clase.titulo , Validators.required),
        //descripcion: new FormControl(activity?.description?activity.description : '', Validators.required),
        duracion: new FormControl(clase.duracion, Validators.required),
        recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null),
      });

      if(clase?.archivos[0]?.nombre){
        clase.archivos[0].uploading_file_progress = 100;

      }
      this.formNuevaActividadGeneral = new FormGroup({
        //instrucciones: new FormControl(activity?.description?activity.description : '', Validators.required),
        // video: new FormControl(clase.vimeoId1, [Validators.required, this.NotZeroValidator()]),
        video: new FormControl(clase.vimeoId1),
        recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null),
      });
    }

    if(tipo == 'crear'){
      this.modalService.open(content, {
        windowClass: 'custom-modal',
        ariaLabelledBy: 'modal-basic-title',
        size: 'lg',
        centered: true
      });
    }
    else{
      this.modalService.open(content, {
        ariaLabelledBy: 'modal-basic-title',
        centered: true,
        size:'lg'
      });
    }
  }

  NotZeroValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (value !== null && value !== undefined && value == 0) {
        return { notZero: true };
      }
      return null;
    };
  }

  trackByClase(index: number, clase: any): string {
    return clase.id; // Suponiendo que cada clase tiene un id único.
  }

//   closeAllModulos(){
//     this.totalClases=0;
//     this.modulos.forEach(modulo => {
//       this.closeAllClasesModulo(modulo)
//       modulo['expanded'] = false;
//     });

//   }


  uploadVideo(videoFile,clase,local = false,modulo,origen = null ) {

    if (!videoFile) {
      //console.log('No video file selected');
      return;
    }
    const file: File = videoFile;

     // Comprobar si el archivo es un video
     if (!file.type.startsWith('video/')) {
      console.error('No es un video');
      return;
  }

    // Supongamos que tienes el token de acceso almacenado en la variable `access_token`
    const access_token = this.access_token;

    let nombreCurso = this.formNewCourse.get('titulo').value?  this.formNewCourse.get('titulo').value : 'Temporal';
    
    //console.log('modulo video',modulo);
    //console.log('clase video',clase)

    let videoName =  `${nombreCurso} - Módulo ${modulo.titulo} (${modulo.numero}) - Clase ${clase.titulo} (${clase.numero})`
    let videoDescription =  videoName;

    clase['videoUpload'] = 0;

    // Create URL for the file
    const url = URL.createObjectURL(file);

    // Create a video element
    const video = document.createElement('video');

    // Error Handling: if there are any errors loading the video file
    video.addEventListener('error', (e) => {
      console.error('Error loading video file:', e);
    });

  // Set the source object of the video element to the object URL of the file
    video.src = url;
    
    // When metadata is loaded get the duration
    video.addEventListener('loadedmetadata', () => {
      const duration = video.duration;
      //console.log('Video Duration: ', duration);

      if(clase.tipo == 'video'){
        clase.duracion = Math.ceil(duration/60);
      }

      // You can proceed with your Vimeo upload logic here
      // Your logic to use duration.
      
      // Important to revoke the URL after its use to release the reference
      URL.revokeObjectURL(url);
    }, { once: true }); // Use the once option to ensure that the event listener is invoked only once.
    
    // Load the video metadata manually
    video.load();
  

    // Crea el video en Vimeo
    //clase['uploading'] = true;
    this.uploadControl.createVideo(videoName, videoDescription)
    .subscribe({
      next : response =>{
        // Una vez creado el video, sube el archivo
        this.uploadControl.uploadVideo(file, response.upload.upload_link)
        .subscribe({
          // Maneja las notificaciones de progreso
          next: progress => {
            //console.log('uplading video',progress)
            clase['videoUpload'] = progress-1
            //this.uploadPercent = progress;
          },
          // Maneja las notificaciones de error
          error: error => {
            clase['uploading'] = false;
            //console.log('Upload Error:', error);
            this.dialog.dialogAlerta("Hubo un error");
            //console.log(error?.error?.error);
            //this.videoFile=null;
            //URL.revokeObjectURL(this.videoSrc);
            clase['videoUpload'] = 0;
            //this.videoSrc=null;
          },
          // Maneja las notificaciones de completado
          complete: () => {
            //console.log('Upload successful');
            //clase['uploading'] = false;
            // Obtén todos los proyectos
            this.uploadControl.getProjects().subscribe(projects => {
              //console.log(this.empresa);
              // Busca un proyecto con el mismo nombre que el video
              // const project = projects.data.find(p => p.name === this.empresa.nombre);
              let projectOperation: Observable<any>;
              if (this.empresa.vimeoFolderId) { // si la empresa sitiene una carpeta
                // Si ya existe un proyecto con el nombre del video, agrega el video a él
                projectOperation = this.uploadControl.addVideoToProject(this.empresa.vimeoFolderId, response.uri);
              } else {
                //console.log('aqui')
                projectOperation = this.uploadControl.createProject(this.empresa.name).pipe(
                    tap(newProject => { 
                        // Aquí es donde actualizamos Firebase
                        const projectId = newProject.uri.split('/').pop();
                        //console.log('parent uri',newProject.uri)
                        this.updateFolderVimeoEmpresa(projectId,newProject.uri);
                    }),
                    switchMap(newProject => this.uploadControl.addVideoToProject(newProject.uri.split('/').pop(), response.uri))
                );
            }
              projectOperation.subscribe({
                complete: () => {
                  //console.log('Video added to Project successfully!');
                  //console.log(response.uri)
                  this.uploadControl.getVideoData(response.uri).subscribe({
                    next: videoData => {
                        //this.dialog.dialogExito();
                        clase['videoUpload'] = 100;
                        //console.log(`Video`,videoData);
                        let link = videoData.link;
                        link = link.split('/');
                        //console.log(link);
                        clase.vimeoId1=link[3];
                        clase.vimeoId2=link[4];
                        if(origen == 'actividad'){
                          this.formNuevaActividadGeneral.get('video').patchValue(link[3]);
                        }
                        //URL.revokeObjectURL(this.videoSrc);
                        //this.videoFile=null;
                        //clase['videoUpload'] =0;
                        //this.videoSrc=null;
                        //clase['videoUpload'] = false;
                      },
                    error: (error) => {
                      this.dialog.dialogAlerta("Hubo un error")
                      //console.log(error?.error?.error);
                      //URL.revokeObjectURL(this.videoSrc);
                      //this.videoFile=null;
                      clase['videoUpload'] =0;
                      //this.videoSrc=null;
                      clase['videoUpload'] = false;

                    }
                  })
                },
                error: (error)=>{
                  this.dialog.dialogAlerta("Hubo un error");
                  //console.log(error?.error?.error);
                  //URL.revokeObjectURL(this.videoSrc);
                  //this.videoFile=null;
                  clase['videoUpload'] =0;
                  //this.videoSrc=null;
                  clase['uploading'] = false;
                }
              })
            });
          }
        });
      },
      error: (error) => {
        this.dialog.dialogAlerta("Hubo un error")
        //console.log(error.error.error);
        //URL.revokeObjectURL(this.videoSrc);
        //this.videoFile=null;
        clase['videoUpload'] =0;
        //this.videoSrc=null;
        clase['uploading'] = false;
      }
    })
  }




//   // Funciones de vimeo

  async updateFolderVimeoEmpresa(idFolder,folderUri) {
    //console.log(idFolder);
    //console.log(this.empresa)
    await this.afs.collection("enterprise").doc(this.empresa.id).update({
      vimeoFolderId: idFolder,
      vimeoFolderUri: folderUri
    })
    this.empresa.vimeoFolderId = idFolder;

  }


//   createInstructions: SafeHtml;

//   onQuestionTypeChange(pregunta: Question,questionTypeValue: string): void {
//     //console.log(questionTypeValue,pregunta)
//     pregunta.type = QuestionType.TYPES.find(
//       (questionType) => questionType.value == questionTypeValue
//     );
//     // this.createInstructions = this.sanitizer.bypassSecurityTrustHtml(
//     //   pregunta.type.createInstructions
//     // );
//   }

//   questionInstruction(pregunta){

//     return this.sanitizer.bypassSecurityTrustHtml(
//       pregunta.type.createInstructions
//     );

//   }

//   uploadQuestionImage(event, pregunta: Question): void {
//     if (!event.target.files[0] || event.target.files[0].length === 0) {

//       Swal.fire({
//         title:'Borrado!',
//         text:`Debe seleccionar una imagen`,
//         icon:'warning',
//         confirmButtonColor: 'var(--blue-5)',
//       })
//       return;
//     }
//     const file = event.target.files[0];
//     if (file.type !== 'image/webp') {
//       Swal.fire({
//         title:'Borrado!',
//         text:`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`,
//         icon:'warning',
//         confirmButtonColor: 'var(--blue-5)',
//       })
//       return;
//     }

//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = async (_event) => {
//       //this.deleteQuestionImage(pregunta);

//       if (file) {
//         pregunta['uploading'] = true;
//         let fileBaseName = file.name.split('.').slice(0, -1).join('.');
//         let fileExtension = file.name.split('.').pop();
  
//         const base64content = await this.fileToBase64(file);

//         let nombre = fileBaseName+'.'+fileExtension;
//         pregunta['fileName'] = nombre
//         pregunta['imageHidden'] = false
//         //console.log(nombre)

//         // Reorganizar el nombre para que el timestamp esté antes de la extensión
//         let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
//         let nombreCurso = this.formNewCourse.get('titulo').value?  this.formNewCourse.get('titulo').value : 'Temporal';
  
//         const filePath = `Clientes/${this.empresa.name}/Cursos/${nombreCurso}/Activities/${newName}`;
//         const task = this.storage.upload(filePath, file);
  
//         // Crea una referencia a la ruta del archivo.
//         const fileRef = this.storage.ref(filePath);
  
//         // Obtener el progreso como un Observable
//         this.uploadProgress$ = task.percentageChanges();
  
//         // Suscríbete al Observable para actualizar tu componente de barra de progreso
//         this.uploadProgress$.subscribe(progress => {
//           //console.log(progress);
//           pregunta['uploading_file_progress'] = Math.floor(progress) ;
//         });
  
//         // Observa el progreso de la carga del archivo y haz algo cuando se complete.
//         task.snapshotChanges().pipe(
//           finalize(() => {
//             // Obtén la URL de descarga del archivo.
//             fileRef.getDownloadURL().subscribe(url => {
//               pregunta['uploading'] = false;
//               //console.log(`File URL: ${url}`);
//               pregunta.image = url;
//               //clase.archivos = clase.archivos.concat(fileInfo);
//               //console.log('pregunta',pregunta)
//             });
//           })
//         ).subscribe();
//       }

//     };
//   }

  deleteQuestionImage(question : Question,warnign = false): void {

    if (question.image){
      if(warnign){
        Swal.fire({
          title: `<span class=" gray-9 ft20">Borrar la imagen de la pregunta</span>`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: 'var(--red-5)',
          cancelButtonColor: 'var(--gray-4)',
          confirmButtonText: `Borrar imagen`,
          cancelButtonText:'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {

            firstValueFrom(
              this.storage.refFromURL(question.image).delete()
            ).catch((error) => console.log(error));
            question.image= '' ;
            question['uploading_file_progress']= 0
            
            Swal.fire({
              title:'Borrado!',
              text:`La imagen fué borrada`,
              icon:'success',
              confirmButtonColor: 'var(--blue-5)',
            })
          }
        })
      }
      else{
        firstValueFrom(
          this.storage.refFromURL(question.image).delete()
        ).catch((error) => console.log(error));
        question.image= '' ;
        question['uploading_file_progress']= 0

      }
    }

  }

//   parseQuestionText(pregunta: Question): void {

//     //console.log('pregunta',pregunta)

//     let existingPlaceholders = pregunta.getPlaceholders();
//     pregunta['placeHolders'] = existingPlaceholders;

//   }

//   addChoice(question: Question, placeholder: string = ''): void {
//     if (!question.options) {
//       question.options = [];
//     }
//     let newOption: QuestionOption = {
//       text: '',
//       isCorrect: false,
//       placeholder: placeholder,
//     };
//     question.options = [...question.options, newOption];
//     //console.log(question.options);
//   }

//   deleteOption(question: Question,optIndex: number): void {
//     question.options = question.options.filter(
//       (_, index) => index !== optIndex
//     );
//   }

//   // QuestionType Multiple Choice
//   toggleOptionValue(question : Question,optionIndex: number): void {
//     const placeholder = question.options[optionIndex].placeholder;
//     question.options[optionIndex].isCorrect = question.options[
//       optionIndex
//     ].isCorrect
//       ? false
//       : true;
//     if (
//       question.options[optionIndex].isCorrect &&
//       question.type.value === QuestionType.TYPE_COMPLETE_VALUE
//     ) {
//       question.options.forEach((option, index) => {
//         if (index != optionIndex && option.placeholder === placeholder) {
//           option.isCorrect = false;
//         }
//       });
//     }
//     //console.log(question.options);
//   }

  showDisplayText(question:Question) {
    question['render'] = this.sanitizer.bypassSecurityTrustHtml(
      this.getDisplayText(question)
    );
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

//   // QuestionType Single Choice
//   changeCorrectOption(question: Question,optionIndex: number): void {
//     const placeholder = question.options[optionIndex].placeholder;
//     //console.log(optionIndex);
//     //console.log(question.options)
//     question.options.forEach((option, index) => {
//       if (index == optionIndex && option.placeholder === placeholder) {
//         option.isCorrect = true;
//         question['correctOption']=optionIndex;
//       } else {
//         option.isCorrect = false;
//       }
//     });
//   }

  advanceTabActividad(){

    this.updateTriggeQuestions=0;

    this.showErrorActividad = false;
    let valid = true

    this.validActividad ==null 

    //console.log('tab actividad',this.activeStepActividad);

    if(this.activeStepActividad == 1){
      //console.log(this.formNuevaActividadBasica)
      if(this.formNuevaActividadBasica.valid){
        this.selectedClase.titulo = this.formNuevaActividadBasica.value.titulo;
        this.selectedClase.activity.title =  this.formNuevaActividadBasica.value.titulo;
        this.selectedClase.activity.description =  this.formNuevaActividadBasica.value.descripcion;
        this.selectedClase.activity.duration = this.formNuevaActividadBasica.value.duracion;
        this.selectedClase.duracion = this.formNuevaActividadBasica.value.duracion;
      }
      else{
        this.showErrorActividad = true;
        valid = false
      }

    }
    if(this.activeStepActividad == 2){
      //console.log(this.formNuevaActividadGeneral)
      if(this.formNuevaActividadGeneral.valid){
        this.selectedClase.activity.instructions =  this.formNuevaActividadGeneral.value.instrucciones;
      }
      else{
        this.showErrorActividad = true;
        valid = false
      }
    }
    //formNuevaActividadGeneral
    if(this.activeStepActividad == 3){
      this.updateTriggeQuestions++;
        //console.log('Form Data questionValid activeStepActividad: ',this.validActividad)
        if(this.validActividad ==null || !this.validActividad?.valid || this.validActividad.value?.questions?.length == 0){
          valid = false
          this.updateTriggeQuestions++;
        }
        else{
          let questions = structuredClone(this.validActividad.value.questions)
          questions.forEach(question => {
            if(!question.typeFormated){
              question.typeFormated = this.getTypeQuestion(question.type)
              if(question.type == 'complete'){
                this.showDisplayText(question)
              }
            }
          });
          //getTypeQuestion
          this.selectedClase.activity.questions = questions
        }
    }
    
    if (valid){
      if(this.validateActivity()){
        this.selectedClase.activity['isInvalid'] = false;
      }
      this.showErrorActividad = false;
      this.activeStepActividad = this.activeStepActividad+1
      //console.log(this.selectedClase)
    }
    else{
      this.selectedClase.activity['isInvalid'] = true;
    }
  }

  validateActivity(){

    if(this.formNuevaActividadBasica.valid && this.formNuevaActividadGeneral.valid && this.validatePreguntasActividad()){
      return true
    }
    return false;
  }

  updateTriggeQuestions = 0; // new property to trigger updates
  updateTriggeQuestionsExam = 0; // new property to trigger updates


  validatePreguntasActividad(){
    return true
  }

  validActividad
  validExam


  _validatePreguntasActividad(){

    //console.log(this.selectedClase.activity.questions);

    let preguntas = this.selectedClase.activity.questions;

    let valid = true;

    if(preguntas.length == 0){
      return false
    }
    
    // preguntas.forEach(pregunta => {

    //   //console.log('pregunta',pregunta)

    //   let pregunta_local = new Question;
    //   pregunta_local.id = pregunta.id
    //   pregunta_local.type = pregunta.type
    //   pregunta_local.options = pregunta.options
    //   pregunta_local.points = pregunta.points
    //   pregunta_local.skills = pregunta.skills
    //   pregunta_local.text = pregunta.text
    //   pregunta_local.image = pregunta.image

    //   let response: QuestionValidationResponse = pregunta_local.isValidForm();
    //   if (!response.result) {
    //     //console.log(response.messages)
    //     pregunta['isInvalid'] = true;
    //     pregunta['InvalidMessages'] = response.messages;
    //     valid = false;
    //   }
    //   else{
    //     if(pregunta.type.value == this.questionTypesIn.TYPE_COMPLETE_VALUE){
    //       this.showDisplayText(pregunta);
    //     }
    //     pregunta['isInvalid'] = false;
    //     pregunta['InvalidMessages'] = null;
    //   }
      
    // });

    return valid;

  }

  
//   crearPreguntaExamen(){

//     if(!this.examen){
//       this.examen = new Activity;
//       //this.examen.id = Date.now().toString();
//     }

//     let id =  this.afs.collection<Question>(Question.collection).doc().ref.id;

//     let pregunta = new Question;
//     pregunta.id = id;
//     this.hideOtherQuestionExamen(pregunta);
//     pregunta['expanded'] = true;
//     pregunta['competencias'] = [];
//     let activity : Activity = this.examen;
//     //console.log('activity',activity)
//     let questions = activity.questions;
//     //console.log('questions',questions);

//     questions.push(pregunta)

//   }

//   hideOtherQuestionExamen(questionIn){

//     this.examen.questions.map( question => {
//       if(questionIn.id != question.id)
//       question['expanded'] = false;
//     })

//   }

//   borrarPreguntaExamen(pregunta,index){
//     //console.log(pregunta,index);

//     Swal.fire({
//       title: `<span class=" gray-9 ft20">Borrar pregunta ${index+ 1 }</span>`,
//       icon: 'warning',
//       showCancelButton: true,
//       confirmButtonColor: 'var(--red-5)',
//       cancelButtonColor: 'var(--gray-4)',
//       confirmButtonText: `Borrar pregunta`,
//       cancelButtonText:'Cancelar'
//     }).then((result) => {
//       if (result.isConfirmed) {
//         this.deleteQuestionImage(pregunta);
//         this.examen.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
//         Swal.fire({
//           title:'Borrado!',
//           text:`La pregunta fué borrada`,
//           icon:'success',
//           confirmButtonColor: 'var(--blue-5)',
//         })
//       }
//     })
//   }

  showErrorActividad= false;
//   showErrorCompetencia = false
  isInvalidCases= false;
//   isInvaliExamen= false;
  invalidMessages = [];


//   validarModulosClases(){

//     let valid = true;
//     this.isInvalidCases= false;
//     this.invalidMessages = [];
//     if(this.modulos.length==0){
//       valid = false
//       this.isInvalidCases= true;
//       this.invalidMessages.push('El curso debe contener al menos un módulo');
//     }

//     this.modulos.forEach(modulo => {
//       modulo['InvalidMessages'] = [];
//       modulo['isInvalid'] = false;
//       if(modulo['clases'].length==0){
//         modulo['isInvalid'] = true;
//         valid = false;
//         modulo['InvalidMessages'].push('El módulo debe contener al menos una clase');
//       }
//       if(modulo.titulo==''){
//         modulo['isInvalid'] = true;
//         valid = false;
//         modulo['InvalidMessages'].push('El módulo debe tener título');
//       }
//       else{
//         let clases = modulo['clases'];
//         clases.forEach(clase => {
//           //console.log('clase',clase)
//           clase['InvalidMessages'] = [];
//           clase['isInvalid'] = false;

//           if(clase.titulo==''){
//             modulo['isInvalid'] = true;
//             clase['isInvalid'] = true;
//             valid = false;
//             modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
//             clase['InvalidMessages'].push('La clase debe tener título');
//           }

//           if(clase.duracion==0){
//             modulo['isInvalid'] = true;
//             clase['isInvalid'] = true;
//             valid = false;
//             modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
//             clase['InvalidMessages'].push('La clase debe tener duración');
//           }

//           if (clase.tipo == 'video'){
//             if(clase.vimeoId1==0){
//               modulo['isInvalid'] = true;
//               clase['isInvalid'] = true;
//               valid = false;
//               modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
//               clase['InvalidMessages'].push('La clase debe tener el video cargado');
//             }
//           }
//           else if (clase.tipo =='lectura'){

//             if(clase.archivos.length==0){
//               modulo['isInvalid'] = true;
//               clase['isInvalid'] = true;
//               valid = false;
//               modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
//               clase['InvalidMessages'].push('La clase debe tener el archivo de la lectura');
//             }

//           }
//           else if(clase.tipo == 'actividad'){

//             //console.log(clase['activity'].isInvalid)

//             if(clase['activity'].isInvalid){
//               modulo['isInvalid'] = true;
//               clase['isInvalid'] = true;
//               valid = false;
//               modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
//               clase['InvalidMessages'].push('La actividad tiene la estructura incompleta');
//             }
//           }
//           clase['InvalidMessages'] = [...new Set(clase['InvalidMessages'])];
//           modulo['InvalidMessages'] = [...new Set(modulo['InvalidMessages'])];

//         });
//       }
//     });

//     //console.log('modulos',this.modulos)

//     return valid;

//   }

  showErrorCurso = false;

  mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  comepetenciaValid= true


  saveCompetenciasActividad(){
    let preguntas = this.selectedClase.activity.questions;
    
    preguntas.forEach(pregunta => {
      let arrayCompetencias = []
      //console.log(pregunta);
      let competencias = pregunta.competencias_tmp;
      competencias.forEach(categoria => {
        let competenciasLocal = categoria.competencias.filter(competencia=> competencia.selected ==true)
        arrayCompetencias = [...arrayCompetencias, ...competenciasLocal];
      });
      pregunta.competencias = arrayCompetencias;
    });
    


    this.modalCompetenciaAsignar.close();
  }


  advanceTabCompetencia(){

    let valid = true;

    if(this.activeStepCompetencias == 1){
      //console.log(this.selectedClase,this.competenciasSelectedClase)
      this.getSelectedCategoriasCompetenciasClase();
      if(this.competenciasSelectedClase.length>0){
        this.saveCompetenciasClase(false);
        //console.log('revisar',this.selectedClase.competencias,this.selectedClase.activity.questions);
        this.selectedClase.activity.questions.forEach(question => {
          //console.log(question);
          if(question.competencias.length>0){
            //this.getSelectedCategoriasCompetenciasClase();
            question['competencias_tmp']=[];
            let competenciasTotal = structuredClone(this.competenciasSelectedClase);
            //console.log('competenciasSelectedClase',this.competenciasSelectedClase)
            let competenciasTotalProcesdo=[]
            let categorias=[];
            competenciasTotal.forEach(categoria => {
              //console.log('error',categoria)
              let item = categoria.categoria;
              //console.log('error',item)
              item['expanded'] = true;
              categorias.push(item)
              categoria.competencias.forEach(competencia => {
                competencia.selected = false;
                competenciasTotalProcesdo.push(competencia)
              });
            });
            ////console.log(competencias);
            question.competencias.forEach(competencia => {
              //console.log(competencia)
              let competenciaP = competenciasTotalProcesdo.find(competenciaeach => competenciaeach.id == competencia.id);
              if(competenciaP){
                competenciaP.selected = true;
              }
            });
      
            //console.log(competenciasTotalProcesdo);
            
            let respueta  = this.anidarCompetencias(categorias,competenciasTotalProcesdo);
            //console.log(respueta);
            question['competencias_tmp'] = respueta;
          }
          else{
            //this.getSelectedCategoriasCompetenciasClase();
            let preguntasCompetenciasTmp = structuredClone(this.competenciasSelectedClase);//estoy aqui
            preguntasCompetenciasTmp.forEach(categoria => {
              //console.log(categoria)
              categoria.expanded = true
              categoria.competencias.forEach(competencia => {
                competencia.selected = false;
              });
            });
            question['competencias_tmp']= preguntasCompetenciasTmp;
          }
        });
      }
      else{
        valid = false;
      }
    }

    if(valid){
      this.activeStepCompetencias++
    }
  }

//   validatePreguntasExamen(){

//     this.isInvaliExamen= false; 
//     this.invalidMessages = [];
//     let preguntas = this.examen?.questions;

//     let valid = true;
    
//     if(preguntas?.length == 0 || !preguntas){
//       this.isInvaliExamen= true;
//       this.invalidMessages.push('El examen debe contener al menos una pregunta');
//       return false
//     }
    
//     preguntas?.forEach(pregunta => {

//       //console.log('pregunta',pregunta)

//       let pregunta_local = new Question;

//       //console.log('pregunas examen',pregunta_local,pregunta)

//       pregunta_local.id = pregunta.id
//       pregunta_local.type = pregunta.type
//       pregunta_local.options = pregunta.options
//       pregunta_local.points = pregunta.points
//       pregunta_local.skills = pregunta.skills
//       pregunta_local.text = pregunta.text
//       pregunta_local.image = pregunta.image

//       let response: QuestionValidationResponse = pregunta_local.isValidForm();
//       if (!response.result) {
//         //console.log(response.messages)
//         pregunta['isInvalid'] = true;
//         pregunta['InvalidMessages'] = response.messages;
//         valid = false;
//       }
//       else{
//         if(pregunta.type.value == this.questionTypesIn.TYPE_COMPLETE_VALUE){
//           this.showDisplayText(pregunta);
//         }
//         pregunta['isInvalid'] = false;
//         pregunta['InvalidMessages'] = null;
//       }
      
//     });

//     return valid;

//   }

formatSkills(skills){

  skills = structuredClone(skills)

  let respuesta = []

  skills.forEach(category => {
    category.competencias.forEach(skill => {
      skill.categoryId = skill['categoriaId']
      delete skill['categoriaId']
      delete skill['enterprise']
      delete skill['selected']
      respuesta.push(skill)
    });
  });

  return respuesta
}

}
