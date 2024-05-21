import { Component, ElementRef, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { IconService } from '../../../services/icon.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { VimeoUploadService } from '../../../services/vimeo-upload.service';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { DialogService } from '../../../services/dialog.service';
import { DomSanitizer } from '@angular/platform-browser';
import { EnterpriseService } from '../../../services/enterprise.service';
import { CategoryService } from '../../../services/category.service';
import { SkillService } from '../../../services/skill.service';
import { CourseService } from '../../../services/course.service';
import { ModuleService } from '../../../services/module.service';
import { CourseClassService } from '../../../services/course-class.service';
import { ActivityClassesService } from '../../../services/activity-classes.service';
import { AuthService } from '../../../services/auth.service';
import { InstructorsService } from '../../../services/instructors.service';
import { AlertsService } from '../../../services/alerts.service';
import { Curso } from 'projects/shared/models/course.model';
import { Modulo } from 'projects/shared/models/module.model';
import { Activity, Question, QuestionType } from 'projects/shared/models/activity-classes.model';
import { Observable, combineLatest, filter, finalize, firstValueFrom, map, startWith, switchMap, take, tap } from 'rxjs';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Clase } from 'projects/shared/models/course-class.model';
import { MatTabChangeEvent } from '@angular/material/tabs';
import Swal from 'sweetalert2';
import { Category } from 'projects/shared/models/category.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Skill } from 'projects/shared/models/skill.model';
import VimeoPlayer from '@vimeo/player';
import { VimeoComponent } from '../../vimeo/vimeo.component';

interface Competencia {
  id: number;
  name: string;
  selected: boolean;
  categoriaId: number;
}

@Component({
  selector: 'app-create-live-course',
  templateUrl: './create-live-course.component.html',
  styleUrls: ['./create-live-course.component.css']
})
export class CreateLiveCourseComponent {

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
    private instructorsService:InstructorsService,
    private alertService: AlertsService,

  ) { }

  @ViewChild('endCourseModal') endCourseModal: ElementRef;
  @ViewChild('modalCrearInstructor') modalCrearInstructorContent: TemplateRef<any>;
  @ViewChild('modalCrearPilar') modalCrearPilarContent: TemplateRef<any>;
  @ViewChildren('inputRef') inputElements: QueryList<ElementRef>;
  @ViewChildren('inputRefModulo') inputElementsModulo: QueryList<ElementRef>;

  activeStep = 1;
  steps = [
    'Información del curso',
    //'Competencias',
    'Clases',
    'Examen',
    //'Vista previa examen',
    //'Resumen'
  ];

  mode = this.route.snapshot.paramMap.get("mode")
  idCurso = this.route.snapshot.paramMap.get("idCurso")
  textModulo = 'Crear nuevo curso'

  curso : Curso;

  liveCourse: any = {}
  modulos : Modulo[] = [];


  activitiesCourse;
  examen : Activity;
  categoriasArray;
  competenciasSelected;
  empresa;
  user
  instructores =  []
  filteredinstructores: Observable<any[]>;

  filteredPillars: Observable<any[]>;

  instructoresForm = new FormControl('');
  pillarsForm = new FormControl('');

  currentModal;

  formNewCourse: FormGroup;
  formNewInstructor: FormGroup;

  allskills = [];
  skillsCurso = []

  skillsInit = false;

  tmpSkillRefArray=[];
  tmpSkillArray = [];

  modalInstructor
  
  showErrorInstructor = false

  showErrorPillar
  showErrorPillarSkill
  formNewPillar: FormGroup
  modalPillar

  savingPillar = false;

  savingCourse = false;

  questionsFormated = false

  currentTab = 'Contenido del Curso'

  activityAnswers: Array<any>;
  isSuccess: boolean = null;

  questionTypes = QuestionType;

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

  totalClases=0;

  formNuevaActividadBasica: FormGroup;
  formNuevaActividadGeneral: FormGroup;

  courseRef;
  actividades : Activity[] = [];

  stepsActividad = [
    'Información básica',
    // 'Instrucciones generales de la actividad',
    'Preguntas',
    // 'Previsualización de preguntas',
  ];

  stepsCompetencias = [
    'Clase',
    'Estructura Actividad',
  ];

  activeStepActividad = 1;
  activeStepCompetencias = 1;

  competenciasSelectedClase = [];

  competenciasSelectedClaseFormated

  deletedClasses = []

  base64view;
  viewFileActivity = false;
  viewVideoActivity = false;

  selectedClase;
  selectedModulo;
  fileViewTipe= null;
  modalCompetenciaAsignar;

  srsView

  modalActivity;

  videoReady = false
  safeUrl

  private player

  playing = false

  updateTriggeQuestions = 0;
  updateTriggeQuestionsExam = 0;

  validActividad
  validExam

  showErrorActividad= false;
  isInvalidCases= false;
  invalidMessages = [];

  showErrorCurso = false;

  mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  comepetenciaValid= true

  modalCrearSkill;
  formNewSkill: FormGroup
  showErrorSkill = false;
  savingSkill = false

  async ngOnInit(): Promise<void> {
    //console.log(this.competenciasArray)

    // console.log('mode on init',this.mode)

    this.filteredinstructores = this.instructoresForm.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    
    this.filteredPillars = this.pillarsForm.valueChanges.pipe(
      startWith(''),
      map(value => this._filterPillars(value || '')),
    );
    

    combineLatest([
      this.enterpriseService.enterprise$.pipe(filter(enterprise => enterprise != null), take(1)),
      this.instructorsService.getInstructorsObservable(),
      this.authService.user$.pipe(filter(user => user != null), take(1))
    ]).subscribe(([enterprise, instructores, user]) => {
      if (enterprise && instructores && user) {
        this.empresa = enterprise
        this.instructores = instructores
        this.user = user
        this.inicializarformNewCourse();
      }
    })

  }

  // AQUI
  async inicializarformNewCourse () {
    if(this.mode == 'create') {
      if(!this.user.isSystemUser && !this.empresa.permissions?.createCourses){
        this.router.navigate(["management/courses"])
      }
      setTimeout(() => {
        this.formNewCourse = new FormGroup({
          id: new FormControl(null),
          title: new FormControl(null, Validators.required),
          description: new FormControl(null, Validators.required),
          instructorRef: new FormControl(null),
          photoUrl: new FormControl(null, Validators.required),
          skills: new FormControl(null, Validators.required),
          skillsRef: new FormControl(null),
          meetingLink: new FormControl(''),
          // resumen: new FormControl(null, Validators.required),
          //categoria: new FormControl(null, Validators.required),
          // contenido: new FormControl(null, Validators.required),
          idioma: new FormControl(null, Validators.required),
          nivel: new FormControl(null, Validators.required),
          instructor: new FormControl(null, Validators.required),
          resumen_instructor: new FormControl(null, Validators.required),
          imagen_instructor: new FormControl(null, Validators.required),
          vimeoFolderId: new FormControl(null),
          proximamente: new FormControl(false),

        })
        this.initSkills();
      }, 2000);

    }
    // EDIT MODE
    else {
      // this.courseService.getCoursesObservable().pipe(filter(courses=>courses.length>0),take(1)).subscribe(courses => {
      //   // console.log('cursos', courses);
      //   let curso = courses.find(course => course.id == this.idCurso);
      //   // console.log('curso edit', curso,this.user.isSystemUser);
      //   let enterpriseREf = this.enterpriseService.getEnterpriseRef()
      //   if(!this.user.isSystemUser && !(curso.enterpriseRef.id == enterpriseREf.id)){
      //     this.router.navigate(["management/courses"])
      //   }
      //   this.curso = curso;
      //   curso['modules'].sort((a, b) => a.numero - b.numero);
      //   this.modulos = curso['modules'];

      //   // console.log('datos cursos',curso)
        
      //   let instructor = this.instructores.find(x=> x.id == curso.instructorRef.id)
      //   this.instructoresForm.patchValue(instructor)

      //   this.formNewCourse = new FormGroup({
      //     id: new FormControl(curso.id, Validators.required),
      //     vimeoFolderId: new FormControl(curso.vimeoFolderId),
      //     title: new FormControl(curso.title, Validators.required),
      //     description: new FormControl(curso.description, Validators.required),
      //     photoUrl: new FormControl(curso.photoUrl, Validators.required),
      //     instructorRef: new FormControl(curso.instructorRef),
      //     skills: new FormControl(curso.skillsRef, Validators.required),
      //     skillsRef: new FormControl(curso.skillsRef),
      //     meetingLink: new FormControl(curso.meetingLink),
      //     // resumen: new FormControl(curso.resumen, Validators.required),
      //     nivel: new FormControl(curso.nivel, Validators.required),
      //     idioma: new FormControl(curso.idioma, Validators.required),
      //     // contenido: new FormControl(curso.contenido, Validators.required),
      //     instructor: new FormControl(instructor.nombre, Validators.required),
      //     resumen_instructor: new FormControl(instructor.resumen, Validators.required),
      //     imagen_instructor: new FormControl(instructor.foto, Validators.required),
      //     proximamente: new FormControl(curso.proximamente),

      //   });

      //   //this.formNewCourse.get('resumen_instructor').disable();
      //   this.initSkills(); // Asegúrate de que initSkills también maneje las suscripciones correctamente
      //   this.activityClassesService.getActivityAndQuestionsForCourse(this.idCurso).pipe(filter(activities=>activities!=null),take(1)).subscribe(activities => {
      //     //console.log('activities clases', activities);
      //     this.activitiesCourse = activities;
      //     this.modulos.forEach(module => {
      //       let clases = module['clases'];
      //       clases.forEach(clase => {
      //         if (clase.tipo == 'actividad' || clase.tipo == 'corazones') {
      //           //console.log('activities clases clase', clase);
      //           let activity = activities.find(activity => activity.claseRef.id == clase.id);
      //           console.log('activities clases activity', activity);
      //           clase.activity = activity;
      //         }
      //       });
      //     });
      //   });
      // });
      
    }
  }

  getOptionText(option){
    let name = option.nombre
    return (name);
  }

  getOptionTextPillar(option){
    let name = option.name
    return (name);
  }

  private _filter(value: any): string[] {
    if(!value?.nombre){
      const filterValue = value.toLowerCase();
      return this.instructores.filter(option => option.nombre.toLowerCase().includes(filterValue));
    }
    const filterValue = value.nombre.toLowerCase();
    return this.instructores.filter(option => option.nombre.toLowerCase().includes(filterValue));
  }

  private _filterPillars(value: any): string[] {
    if(!value?.name){ 
      const filterValue = value.toLowerCase();
      return this.categoriasArray?.filter(option => option.name.toLowerCase().includes(filterValue));
    }
    const filterValue = value.name.toLowerCase();
    return this.categoriasArray?.filter(option => option.name.toLowerCase().includes(filterValue)); 
    

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
          console.log('examen data edit',this.examen)
          //this.formatExamQuestions();
        }
      });
  }

  anidarCompetenciasInicial(categorias: any[], competencias: any[]): any[] {

    // console.log('anidarCompetenciasInicial',categorias,competencias)
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
  
  getCursoSkills(){

    let skillArray = [];
    
    this.formNewCourse.get("skills")?.value.forEach(skill => {
      let datail = this.allskills.find(x=>x.id == skill.id)
      skillArray.push(datail)
    });

    return skillArray
  }

  async removeSkill(skill){

    if(this.curso?.skillsRef){
      this.curso.skillsRef = this.curso.skillsRef.filter(x=> x.id != skill.id)
      console.log('this.curso.skillsRef',this.curso.skillsRef)
      this.skillsCurso = this.getCursoSkills();
      //this.curso.skillsRef = this.tmpSkillRefArray
      this.formNewCourse.get("skills").patchValue(this.curso.skillsRef);
    }
    else{
      console.log('this.skillsCurso',this.skillsCurso)
      this.skillsCurso = this.skillsCurso.filter(x=> x.id != skill.id)
      let skillsRef = []
      for(let skill of this.skillsCurso){
        let skillRef = await this.afs.collection<any>('skill').doc(skill.id).ref;
        skillsRef.push(skillRef)
      }
      this.formNewCourse.get("skills").patchValue(skillsRef);

    }

  }

  initSkills(){
    this.categoryService.getCategoriesObservable().pipe().subscribe(category => {
      // console.log('category from service', category);
      this.skillService.getSkillsObservable().pipe().subscribe(skill => {
        // console.log('skill from service', skill);
        this.allskills = skill;
        skill.map(skillIn => {
          delete skillIn['selected']
        });

        this.categoriasArray = this.anidarCompetenciasInicial(category, skill)
        // console.log('categoriasArray', this.categoriasArray,this.curso)
        if(!this.skillsInit){
          if(this.mode == 'edit'){
            //console.log('curso edit', this.curso)
            this.textModulo = 'Editar curso'
            let skillsProfile = this.curso.skillsRef;
            this.skillsCurso = this.getCursoSkills()
            skillsProfile.forEach(skillIn => {
              let skillSelect = skill.find(skillSelectIn => skillSelectIn.id == skillIn.id)
              if (skillSelect) {
                skillSelect['selected'] = true;
              }
            });
          }
  
          if(this.mode == 'edit'){
            if(this.curso){
              let pilar
              let skillId = this.curso.skillsRef[0]?.id
              if(skillId){
                pilar = this.categoriasArray.find(x=>x.competencias.find(y=>y.id == skillId))
              }
              else if(this.pillarsForm.value['id']){
                pilar = this.categoriasArray.find(x=>x.id == this.pillarsForm.value['id'])
              }
              console.log('pilar',pilar)
              this.pillarsForm.patchValue(pilar)
              console.log('pilar',this.pillarsForm.value['name'])
            }
            this.getExamCourse(this.curso.id);
          }
          else{
            let pilar
            if(this.pillarsForm.value['id']){
              pilar = this.categoriasArray.find(x=>x.id == this.pillarsForm.value['id'])
              this.pillarsForm.patchValue(pilar)
            }
          }
          this.skillsInit = true
        }
      });
    });
  }

  courseHasSkill(skill){
    let skillFind = this.tmpSkillRefArray.find(x=>x.id == skill.id)
    if(skillFind){
      return true
    }
    return false
  }

  troggleSkill(skill){
    if(this.courseHasSkill(skill)){ // quitar
      this.tmpSkillRefArray = this.tmpSkillRefArray.filter(x=> x.id != skill.id)
      this.tmpSkillArray = this.tmpSkillArray.filter(x=> x.id != skill.id)
    }
    else{ //agregar (valar si tiene menos de 3 skills)
      if( this.tmpSkillRefArray.length<3){
        let skillRef = this.afs.collection<any>('skill').doc(skill.id).ref;
        this.tmpSkillRefArray.push(skillRef)
        this.tmpSkillArray.push(skill)
      }
      else{
        Swal.fire({
          text:`Ya posee la cantidad máxima de competencias permitidas (3).`,
          icon:'info',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    }
  }

  changePillar(newPillar){
    if(this.curso?.skillsRef[0]?.id){
      let pilar = this.categoriasArray.find(x=>x.competencias.find(y=>y.id == this.curso?.skillsRef[0]?.id))
      //this.pillarsForm.patchValue(pilar)
      if(pilar.id != newPillar.id){
        this.curso.skillsRef = [];
        this.skillsCurso= [];
      }
    }

  }

  createPillar(){
    this.savingPillar = false;
    this.pillarsForm.patchValue('')

    this.curso?.skillsRef ? this.curso.skillsRef = [] : null;
    this.skillsCurso= [];

    this.showErrorPillar = false
    this.showErrorPillarSkill = false

    this.formNewPillar = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      // skills: new FormControl([]),
      // skillTmp: new FormControl(null, Validators.required),
    })

    this.modalPillar =  this.modalService.open(this.modalCrearPilarContent, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'sm'
    });  
  }

  async setInstructor(instructor){

    let instructorRef = await this.afs.collection<any>('instructor').doc(instructor.id).ref;
    this.formNewCourse.get("instructorRef").patchValue(instructorRef);
    this.formNewCourse.get("instructor").patchValue(instructor.nombre);
    this.formNewCourse.get("resumen_instructor").patchValue(instructor.resumen);
    this.formNewCourse.get("imagen_instructor").patchValue(instructor.foto);

  }

  changeBorrador(event: Event) {
    // Accede a la propiedad 'checked' del checkbox
    const isChecked = (event.target as HTMLInputElement).checked;
  
    // Actualiza el valor del campo 'proximamente' en el formulario con el nuevo estado
    this.formNewCourse.get('proximamente').setValue(isChecked);

    if(this.curso){
      this.curso.proximamente = isChecked
    }
  
    // Opcionalmente, imprime si el checkbox quedó marcado o no
    console.log('El checkbox Borrador está:', isChecked ? 'marcado (true)' : 'desmarcado (false)');
  }

  openModal(content,size='lg'){

    this.tmpSkillRefArray = []
    this.tmpSkillArray = []

    this.curso?.skillsRef?.forEach(element => {
      this.tmpSkillRefArray.push(element)
    });
    
    this.skillsCurso?.forEach(element => {
      this.tmpSkillArray.push(element)
    });

    this.currentModal = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:size
    });
  }

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

  addSkill(){
    this.showErrorPillarSkill = false
    
    let skill = this.formNewPillar.get('skillTmp')?.value
    if(!skill){
      this.showErrorPillarSkill = true
    }
    else{
      let skillsTmpAdd = this.formNewPillar.get('skills')?.value
      if(!skillsTmpAdd.find(x=>x == skill)){ 
        skillsTmpAdd.push(skill)
        this.formNewPillar.get("skillTmp").patchValue('');
      }
      else{
        this.formNewPillar.get("skillTmp").patchValue('');
        this.showErrorPillarSkill = true
      }
    }
    

  }

  async saveNewPillar(){
    this.savingPillar = true;
    this.showErrorPillar = false
    this.showErrorPillarSkill = false

    let pillar =this.formNewPillar.get('nombre')?.value;
    //let skills = this.formNewPillar.get('skills')?.value;

    let pillarCheck = this.categoriasArray.find(x=> x.name == pillar)

    if(pillarCheck){
      this.showErrorPillar = true
      this.savingPillar = false;

      Swal.fire({
        title:'Info!',
        text:`Ya existe un pilar con este nombre`,
        icon:'info',
        confirmButtonColor: 'var(--blue-5)',
      })
      return
    }

    let enterpriseRef =this.enterpriseService.getEnterpriseRef()
    if(this.user.isSystemUser){
      enterpriseRef = null;
    }

    if(pillar){
      let category = new Category(null,pillar,enterpriseRef)
      await this.categoryService.addCategory(category)
      //let categoryRef = this.afs.collection<any>('category').doc(category.id).ref;
      // for(let skill of skills){
      //   let skillAdd = new Skill(null,skill,categoryRef,enterpriseRef)
      //   await this.skillService.addSkill(skillAdd)
      // }
      this.modalPillar.close()
      this.alertService.succesAlert("El pilar se ha guardado exitosamente")
      this.savingPillar = false;

    }
    else{
      this.savingPillar = false;
      this.showErrorPillar = true
      this.showErrorPillarSkill = true
    }

  }

  removeSkillTmp(skill){
    let skillsTmpAdd = this.formNewPillar.get('skills')?.value
    skillsTmpAdd = skillsTmpAdd.filter(x=>x!=skill)
    this.formNewPillar.get("skills").patchValue(skillsTmpAdd);

    // this.curso.skillsRef = this.curso.skillsRef.filter(x=> x.id != skill.id)
    // this.skillsCurso = this.getCursoSkills();
    // this.curso.skillsRef = this.tmpSkillRefArray
    // this.formNewCourse.get("skills").patchValue(this.curso.skillsRef);
  }
  
  async saveDraftPre(){
    
    // let checkStatus = await this.chackAllInfo();
    // if(!checkStatus && this.formNewCourse.valid){
    //   Swal.fire({
    //     title: "Revisar datos",
    //     text:"Existen problemas en el curso, ¿desea continuar?",
    //     icon: "info",
    //     showCancelButton: true,
    //     confirmButtonText: "Guardar",
    //     confirmButtonColor: 'var(--blue-5)',
    //   }).then((result) => {
    //     /* Read more about isConfirmed, isDenied below */
    //     if (result.isConfirmed && this.formNewCourse.valid) {
    //       this.formNewCourse.get("proximamente").patchValue(true);
    //       if(this.curso){
    //         this.curso.proximamente = true
    //       }
    //       this.saveDraft()
    //     }
    //   });
    // }
    // else if (this.formNewCourse.valid){
    //   this.saveDraft()
    // }
    // else if(!this.formNewCourse.valid){
    //   Swal.fire({
    //     title:'Datos faltantes!',
    //     text:`Por favor verifique los datos del curso para poder guardarlo`,
    //     icon:'warning',
    //     confirmButtonColor: 'var(--blue-5)',
    //   })
    // }
  }


  expandModulo(modulo){

    console.log(modulo)

    if(!modulo['expanded'] && modulo.title){
      modulo['expanded'] = true
    }
    else if(modulo['expanded']){
      modulo['expanded'] = !modulo['expanded']
    }
  }

  // AQUI
  async saveDraft(){
    // //console.log('----- save borrador ------')

    // this.savingCourse = true;

    // Swal.fire({
    //   title: 'Generando curso...',
    //   text: 'Por favor, espera.',
    //   allowOutsideClick: false,
    //   didOpen: () => {
    //     Swal.showLoading()
    //   }
    // });

    // if(this.formNewCourse.valid){

    //   console.log('this.curso',this.curso)
    //   if(this.curso){
    //     let enterpriseRef =this.enterpriseService.getEnterpriseRef()
    //     this.curso.enterpriseRef = enterpriseRef;
    //     if(this.user.isSystemUser){
    //       this.curso.enterpriseRef = null;
    //     }
    //     if(!this.curso.skillsRef && this.curso['skills']){
    //       this.curso.skillsRef = this.curso['skills']
    //       delete this.curso['skills'];
    //     }

    //     let duracion = this.getDurationModuleCourse()
    //     this.curso.duracion = duracion

    //     await this.courseService.saveCourse(this.curso)
    //   }
    
    //   if(this.examen){
    //     let courseRef = await this.afs.collection<Curso>(Curso.collection).doc(this.curso.id).ref;
    //     let activityClass = new Activity
    //     console.log('this.activityClass',activityClass)
    //     let questions: Question[]= []
    //     questions = structuredClone(this.examen.questions);
    //     console.log('this.examen',this.examen)
    //     let auxCoursesRef = this.examen.coursesRef
    //     this.examen.coursesRef = null
    //     console.log('this.examen',this.examen)


    //     activityClass.activityCorazon = this.examen.activityCorazon
    //     activityClass.claseRef = this.examen.claseRef
    //     activityClass.coursesRef = this.examen.coursesRef
    //     activityClass.createdAt = this.examen.createdAt
    //     activityClass.description = this.examen.description
    //     activityClass.duration = this.examen.duration
    //     activityClass.enterpriseRef = this.examen.enterpriseRef
    //     activityClass.files = this.examen.files
    //     activityClass.id = this.examen.id
    //     activityClass.title= this.examen.title
    //     activityClass.type = this.examen.type
    //     activityClass.updatedAt = this.examen.updatedAt
    //     activityClass.enterpriseRef = this.curso.enterpriseRef as DocumentReference<Enterprise>

    //     this.examen.coursesRef = auxCoursesRef
    //     activityClass.coursesRef = [courseRef];
    //     activityClass.type = Activity.TYPE_TEST;
    
    //     //console.log('activityExamen',activityClass)
    //     await this.activityClassesService.saveActivity(activityClass);

    //     let questionsIds = [];
    //     let questionsClasses = [];

    //     this.examen.id = activityClass.id
    //     for (let pregunta of questions){
    //       delete pregunta['competencias_tmp'];
    //       delete pregunta['competencias'];
    //       delete pregunta['isInvalid'];
    //       delete pregunta['InvalidMessages'];
    //       delete pregunta['expanded_categorias'];
    //       delete pregunta['expanded'];
    //       delete pregunta['uploading_file_progress'];
    //       delete pregunta['uploading'];
    //       await this.activityClassesService.saveQuestion(pregunta,activityClass.id)
    //       questionsIds.push(pregunta.id)
    //       if(pregunta.classId){
    //         questionsClasses.push(pregunta)
    //       }
    //     }

    //     console.log('questionsClasses',questionsClasses)

    //     if(questionsIds.length>0){
    //       //remove not present questions
    //       await this.activityClassesService.removeQuestions(questionsIds,activityClass.id)
    //     }

    //     if(questionsClasses.length>0){
    //       //existen preguntan en los examenes con refrencias de clases y se debe generar la actividad
    //       if(this.modulos.length>0){

    //         //let validModules = this.modulos.filter(moduleCheck => !moduleCheck['isInvalid'])
    //         let validModules = this.modulos;

    //         for (let modulo of validModules){
    //           let clases = modulo['clases'];
    //           const clasesNoOuNoAutoGenerated = clases.filter(clase => !clase?.activity?.autoGenerated);
    //           const clasesAutoGenerated = clases.filter(clase => clase?.activity?.autoGenerated);
    //           modulo['clases'] = [...clasesNoOuNoAutoGenerated, ...clasesAutoGenerated];
    //           clases = modulo['clases'];
    //           console.log('ClasesModulo',clases)
    //           let classOfQuestion = clases.find(x => x.id == questionsClasses.find(y=>y.classId == x.id)?.classId)
    //           if(classOfQuestion){
    //             console.log('classeOfQuestion',classOfQuestion)
    //             let activityClassArray = clases.filter(x=>x.tipo == 'actividad' && x?.activity?.autoGenerated)
    //             if(activityClassArray.length>0){
    //               let activityClass = activityClassArray[0];
    //               activityClass['edited'] = true;
    //               activityClass['deleted'] = false

    //               console.log('update activityauto')
    //               let preguntasFiltradas = questionsClasses.filter(question => 
    //                 clases.some(clase => clase.id === question.classId)
    //               );
    //               activityClass.titulo = `${modulo.title}`
    //               activityClass.activity.questions = preguntasFiltradas
    //               let duracion = 0
    //               if(preguntasFiltradas.length>=20){
    //                 duracion = 20
    //               }
    //               else{
    //                 duracion = preguntasFiltradas.length
    //               }
    //               activityClass.duracion = duracion
    //               activityClass.activity.duration = duracion
    //               activityClass.activity.autoGenerated = true;
    //               activityClass.activity.title = `${modulo.titulo}`
    //               console.log('activityClassAuto',activityClass)
                  
    //             }
    //             else{
    //               let preguntasFiltradas = questionsClasses.filter(question => 
    //                 clases.some(clase => clase.id === question.classId)
    //               );
    //               let clase = new Clase;
    //               console.log('Create activityauto')
    //               clase.duracion = preguntasFiltradas.length
    //               clase.titulo = `${modulo.title}`
    //               clase.tipo = 'actividad';
    //               clase['edited'] = true
    //               clase['deleted'] = false
    //               clase['modulo'];
    //               clase.id = await this.afs.collection<Clase>(Clase.collection).doc().ref.id;
    //               clase['modulo'] = modulo.numero;
    //               let numero = this.obtenerNumeroMasGrandeModulo(modulo);
    //               clase['numero'] = numero;
    //               clase.date = numero;
    //               let actividad = new Activity();
    //               actividad.questions = preguntasFiltradas
    //               actividad.title = `${modulo.title}`
    //               actividad.autoGenerated = true;
    //               actividad['isInvalid'] = true;
    //               clase['activity'] = actividad;
    //               clase['expanded'] = false;
    //               clases.push(clase);
    //             }
    //           }
    //           else{
    //             let activityClassArray = clases.filter(x=>x.tipo == 'actividad' && x?.activity?.autoGenerated)
    //             console.log('activityClassArrayDelete',activityClassArray)
    //             if(activityClassArray.length>0){
    //               let clase = activityClassArray[0]
    //               clase['deleted'] = true
    //               clase['edited'] = false
    //               let classDelete = {
    //                 claseInId:clase.id,
    //                 cursoId:this.curso.id,
    //                 moduloInId:modulo.id,
    //                 activityId:clase?.activity?.id

    //               }
    //               this.deletedClasses.push(classDelete)
    //               clases = clases.filter(clase => clase.id != classDelete.claseInId );

    //             }
                
    //           }
    //         }
    //       }
    //     }
    //     else{ // ninguna pregunta esta asociada a clases (borrar todas las actividades automaticas)
    //       if(this.modulos.length>0){
    //         //let validModules = this.modulos.filter(moduleCheck => !moduleCheck['isInvalid'])
    //         let validModules = this.modulos
    //         for (let modulo of validModules){
    //           let clases = modulo['clases'];
    //           let activityClassArray = clases.filter(x=>x.tipo == 'actividad' && x?.activity?.autoGenerated)
    //           if(activityClassArray.length>0){
    //             let clase = activityClassArray[0]
    //             clase['deleted'] = true
    //             clase['edited'] = false
    //             let classDelete = {
    //               claseInId:clase.id,
    //               cursoId:this.curso.id,
    //               moduloInId:modulo.id,
    //               activityId:clase?.activity?.id
    //             }
    //             this.deletedClasses.push(classDelete)
    //             clases = clases.filter(clase => clase.id != classDelete.claseInId );
    //             console.log('clasesAfterDelete',clases)

    //           }
    //         }
    //       }

    //     }
    //   }


    //   if(this.deletedClasses.length>0){
    //     for (let clase of this.deletedClasses){
    //       console.log('deletedClasses',clase)
    //       await this.courseClassService.deleteClassAndReference(clase.claseInId,this.curso.id,clase.moduloInId,clase?.activityId);
    //       if(clase.vimeoId1){
    //         // this.uploadControl.deleteVideo(clase.vimeoId1).subscribe(respuesta => {
    //         //   console.log('respuesta.respuesta')
    //         // })
    //       }
    //     }
    //   }  
    //   if(this.modulos.length>0){
    //     //console.log('datos modulos',this.modulos);
    //     //let validModules = this.modulos.filter(moduleCheck => !moduleCheck['isInvalid'])
    //     let validModules = this.modulos
    
    //     for (let modulo of validModules){
    //       ////console.log('modulo clase borrador add/edit',modulo)
    //       let arrayClasesRef = [];
    //       const clases = modulo['clases'];
    //       console.log('claseModuloSave',modulo,clases)
    //       for (let i = 0; i < clases.length; i++) {
    //         try {
    //           let clase = clases[i];            
    //           if(clase['edited']){
    //             console.log('clase borrador add/edit',clase)
    //             let claseLocal = new Clase;
    //             claseLocal.HTMLcontent = clase.HTMLcontent;
    //             claseLocal.archivos = clase.archivos.map(archivo => ({
    //               id: archivo.id,
    //               nombre: archivo.nombre,
    //               size: archivo.size,
    //               type: archivo.type,
    //               url: archivo.url
    //             }));
    //             claseLocal.descripcion = clase.descripcion;
    //             claseLocal.duracion = clase.duracion;
    //             claseLocal.id = clase.id;
    //             claseLocal.vimeoId1 = clase.vimeoId1;
    //             claseLocal.vimeoId2 = clase.vimeoId2;
    //             claseLocal.skillsRef = clase.skillsRef;
    //             claseLocal.tipo = clase.tipo;
    //             claseLocal.titulo = clase.titulo;
    //             claseLocal.vigente = clase.vigente;
    //             if(this.user.isSystemUser){
    //               claseLocal.enterpriseRef = null;
    //             }
    //             else{
    //               claseLocal.enterpriseRef = this.enterpriseService.getEnterpriseRef()
    //             }
                
    //             const arrayRefSkills = (clase.competencias?.map(skillClase => this.curso.skillsRef.find(skill => skill.id == skillClase.id)).filter(Boolean) ) || [];
    //             claseLocal.skillsRef = arrayRefSkills;
    //             await this.courseClassService.saveClass(claseLocal);
    //             let refClass = await this.afs.collection<Clase>(Clase.collection).doc(claseLocal.id).ref;
    //             let courseRef = await this.afs.collection<Curso>(Curso.collection).doc(this.curso.id).ref;
    //             arrayClasesRef.push(refClass);
    //             console.log('activityClass',clase)
    //             if(clase.activity){
    //               let activityClass = clase.activity
    //               activityClass.description = null
    //               let questions: Question[]= []
    //               activityClass.enterpriseRef = null
    //               questions = structuredClone(clase.activity.questions);
    //               activityClass.enterpriseRef = this.curso.enterpriseRef as DocumentReference<Enterprise>
    //               if(this.user.isSystemUser){
    //                 activityClass.enterpriseRef = null
    //               }
    //               activityClass.claseRef = refClass;
    //               activityClass.coursesRef = [courseRef];
    //               activityClass.type = Activity.TYPE_REGULAR;
    //               activityClass.activityCorazon = false
    //               if(clase.tipo == 'corazones'){
    //                 activityClass.activityCorazon = true
    //               }

    //               if(!activityClass['recursosBase64'] ){
    //                 activityClass['recursosBase64'] = null
    //               }
    //               let actividadTmp = new Activity
    //               actividadTmp.autoGenerated = activityClass?.autoGenerated
    //               actividadTmp.activityCorazon = activityClass?.activityCorazon
    //               actividadTmp.claseRef = activityClass?.claseRef
    //               actividadTmp.coursesRef = activityClass?.coursesRef
    //               actividadTmp.createdAt = activityClass?.createdAt
    //               actividadTmp.description = activityClass?.description
    //               actividadTmp.duration = activityClass?.duration
    //               actividadTmp.enterpriseRef = activityClass?.enterpriseRef
    //               actividadTmp.files = activityClass?.files
    //               actividadTmp.id = activityClass?.id
    //               actividadTmp.title= activityClass?.title
    //               actividadTmp.type = activityClass?.type
    //               actividadTmp.updatedAt = activityClass?.updatedAt

    //               console.log('activityClassEdit',actividadTmp)

    
    //               await this.activityClassesService.saveActivity(actividadTmp);
    //               clase.activity.id = actividadTmp.id;
    //               console.log('questionsActivityEdit',questions)
    //               let questionsIds = [];

    //               for (let pregunta of questions){
    //                 claseLocal.skillsRef = arrayRefSkills;
    //                 delete pregunta['typeFormated'];
    //                 delete pregunta['competencias_tmp'];
    //                 delete pregunta['competencias'];
    //                 delete pregunta['isInvalid'];
    //                 delete pregunta['InvalidMessages'];
    //                 delete pregunta['expanded_categorias'];
    //                 delete pregunta['expanded'];
    //                 delete pregunta['uploading_file_progress'];
    //                 delete pregunta['uploading'];
    //                 console.log('save pregunta revisar',pregunta,clase.activity.id)
    //                 await this.activityClassesService.saveQuestion(pregunta,clase.activity.id)
    //                 questionsIds.push(pregunta.id)
    //               }
    //               if(questionsIds.length>0){
    //                 await this.activityClassesService.removeQuestions(questionsIds,activityClass.id)
    //               }
    //             }
    //           }
    //           else{
    //             let findDeleted = this.deletedClasses.find(x=>x.claseInId == clase.id)
    //             console.log('claseRevisar',clase,findDeleted)
    //             if(!findDeleted && !clase['deleted']){
    //               let refClass = await this.afs.collection<Clase>(Clase.collection).doc(clase.id).ref;
    //               arrayClasesRef.push(refClass);
    //             }

    //           }
    //         } catch (error) {
    //           console.error('Error processing clase', error);
    //         }
    //       }

    //       this.deletedClasses = []

          
    //       //console.log('arrayClasesRef',arrayClasesRef)
    
    //       //let id = Date.now().toString();
    
    //       let idRef = await this.afs.collection<Modulo>(Modulo.collection).doc().ref.id;
    
    //       //moduleService
    //       let module = new Modulo;
    //       module.clasesRef = null
    //       module.duracion = modulo.duracion;
    //       module.id = modulo.id;
    //       module.numero = modulo.numero;
    //       module.title = modulo.title;
    //       module.clasesRef = arrayClasesRef;
    //       if(!modulo.id){
    //         module.id = idRef;
    //         modulo.id = idRef
    //       }
    //       //console.log('module save', module)
    //       await this.moduleService.saveModulo(module, this.curso.id)
    //     }
    //   }
    //   let duracion = this.getDurationModuleCourse()
    //   this.curso.duracion = duracion

    //   await this.afs.collection("course").doc(this.curso.id).update({
    //     duracion:duracion
    //   })

    //   Swal.close();
    //   this.savingCourse = false;
    //   this.alertService.succesAlert("El curso se ha guardado exitosamente")


    //   if(this.mode == 'create'){
    //     this.router.navigate([`management/create-course/edit/${this.curso.id}`])
    //   }



    // }
    // else{
    //   Swal.close();
    //   this.savingCourse = false;
    //   //this.alertService.succesAlert("El curso se ha guardado exitosamente")
    // }

  }

  previousTab(){
    if (this.activeStep > 1) {
      this.activeStep--
    } else {
      this.router.navigate(["management/courses"])
    }
  }

  async avanceTab(){

    // this.updateTriggeQuestionsExam=0;

    // if (this.activeStep < 6) {
    //   this.showErrorCurso = false;
    //   let valid = true;
    //   if(this.activeStep == 1){
    //     console.log(this.formNewCourse)
    //     if(!this.formNewCourse.valid){
    //       valid = false;
    //     }
    //     else{
    //       console.log('datos curso',this.formNewCourse.value)
    //       if(this.curso){
    //         this.curso = this.formNewCourse.value;
    //         this.curso.instructorNombre = this.curso.instructor
    //       }
    //       else{
    //         let id = await this.afs.collection<Curso>(Curso.collection).doc().ref.id;
    //         let newCurso = new Curso;
    //         this.formNewCourse.get("id").patchValue(id);
    //         newCurso = this.formNewCourse.value;
    //         this.curso = newCurso
    //         this.curso.instructorNombre = this.curso.instructor
    //       }
    //     }
    //   }

    //   if(this.activeStep == 2){

    //     if(!this.validarModulosClases()){
    //       valid = false;
    //     }
    //   }

    //   if(this.activeStep == 3){
    //     this.updateTriggeQuestionsExam++;
    //     setTimeout(() => {
    //       if(this.validExam ==null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0){
    //         valid = false
    //         this.updateTriggeQuestionsExam++;
    //       }
    //       else{
    //         let questions = structuredClone(this.validExam.value.questions)
    //         questions.forEach(question => {
    //           if(!question.typeFormated){
    //             question.typeFormated = this.getTypeQuestion(question.type)
    //             if(question.type == 'complete'){
    //               this.showDisplayText(question)
    //             }
    //           }
    //         });
    //         console.log('revisar',this.examen,questions)
    //         if(this.examen){
    //           this.examen.questions = questions
    //         }
    //         else{
    //           let exam = new Activity();
    //           exam.questions = questions
    //           exam.type = 'test'
    //           exam.title = `Questionario Final: ${this.curso.title}`
    //           exam.updatedAt = new Date().getTime()
    //           exam.createdAt = new Date().getTime()
    //           this.examen = exam;
    //         }

    //         console.log('examen',this.examen)
    //         this.openModal(this.endCourseModal)
    //       }
    //     }, 10);
    //   }
    //   else{
    //     if(valid) {
    //       this.activeStep++
    //     }
    //     else {
    //       this.showErrorCurso = true;
    //     }
    //   }
    
    // } else {
    //   this.openModal(this.endCourseModal)
    // }
  }

  onTabChange(event: MatTabChangeEvent) {
    this.currentTab = 'Contenido del Curso'
    if (event.tab.textLabel === 'Examen') {
      this.currentTab = 'Examen'
      console.log('El tab Examen fue seleccionado');

      if(!this.examen){
        let exam = new Activity();
        exam.type = 'test'
        exam.title = `Questionario Final: ${this.formNewCourse.get('title')?.value}`
        exam.updatedAt = new Date().getTime()
        exam.createdAt = new Date().getTime()
        this.questionsFormated = true
        this.examen = exam;
      }
      this.formatExamQuestions();
    }
  }

  checkAnswer(questionIndex: number, optionIndex: number): void {
    switch (this.examen.questions[questionIndex].type.value) {
      case QuestionType.TYPE_SINGLE_CHOICE_VALUE:
        {
          this.activityAnswers[questionIndex].answerItems.forEach(
            (answerItem, index) => {
              answerItem.answer = index === optionIndex;
            }
          );
        }
        break;
      case QuestionType.TYPE_MULTIPLE_CHOICE_VALUE:
        {
          this.activityAnswers[questionIndex].answerItems[optionIndex].answer =
            !this.activityAnswers[questionIndex].answerItems[optionIndex]
              .answer;
        }
        break;
      case QuestionType.TYPE_COMPLETE_VALUE:
        {
          this.activityAnswers[questionIndex].answerItems.forEach(
            (answerItem, index) => {
              answerItem.answer = index === optionIndex;
            }
          );
        }

        break;
      default:
        {
        }
        break;
    }
    //console.log(this.activityAnswers);
  }

  formatExamQuestions(){

    console.log('formatExamQuestions')

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
          let valoresPreguntasValidas = preguntasValidas.map(pregunta => pregunta.value);
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

  async chackAllInfo(){
    // this.showErrorCurso = false;
    // let valid = true;
    // console.log('formNewCourse',this.formNewCourse)
    // console.log(this.formNewCourse)
    // if(!this.formNewCourse.valid){
    //   valid = false;
    // }
    // else{
    //   console.log('datos curso',this.formNewCourse.value)
    //   if(this.curso){
    //     this.curso = this.formNewCourse.value;
    //     this.curso.instructorNombre = this.curso.instructor
    //   }
    //   else{
    //     let id = await this.afs.collection<Curso>(Curso.collection).doc().ref.id;
    //     let newCurso = new Curso;
    //     this.formNewCourse.get("id").patchValue(id);
    //     newCurso = this.formNewCourse.value;
    //     this.curso = newCurso
    //     this.curso.instructorNombre = this.curso.instructor
    //   }
    // }
    // if(!this.validarModulosClases()){
    //   valid = false;
    // }
    // this.updateTriggeQuestionsExam++;

    // await new Promise(resolve => setTimeout(resolve, 30));

    // if(this.validExam ==null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0){
    //   valid = false
    //   this.updateTriggeQuestionsExam++;
    // }
    // else{
    //   let questions = structuredClone(this.validExam.value.questions)
    //   questions.forEach(question => {
    //     if(!question.typeFormated){
    //       question.typeFormated = this.getTypeQuestion(question.type)
    //       if(question.type == 'complete'){
    //         this.showDisplayText(question)
    //       }
    //     }
    //   });
    //   console.log('revisar',this.examen,questions)
    //   if(this.examen){
    //     this.examen.questions = questions
    //   }
    //   else{
    //     let exam = new Activity();
    //     exam.questions = questions
    //     exam.type = 'test'
    //     exam.title = `Questionario Final: ${this.curso.title}`
    //     exam.updatedAt = new Date().getTime()
    //     exam.createdAt = new Date().getTime()
    //     this.examen = exam;
    //   }

    //   console.log('examen',this.examen)
    //   //this.openModal(this.endCourseModal)
    // }
    
    // if(valid) {
    //   return true
    // }
    // else {
    //   this.showErrorCurso = true;
    // }

    // return false
    
  }

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
  
        let nombreCurso = this.formNewCourse.get('title').value?  this.formNewCourse.get('title').value : 'Temporal';
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
                this.formNewCourse.get('photoUrl').patchValue(url);
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
      instructor.fechaCreacion = new Date
      instructor.ultimaEdicion = new Date
      instructor.ultimoEditor = this.user.uid
      let enterpriseRef =this.enterpriseService.getEnterpriseRef()
      if(this.user.isSystemUser){
        enterpriseRef = null;
      }
      instructor.enterpriseRef = enterpriseRef
      await this.instructorsService.addInstructor(instructor)
      console.log(instructor);

      this.alertService.succesAlert("El instructor se ha guardado exitosamente")
      this.instructoresForm.patchValue('')
      this.modalInstructor.close()


    
    }

  }

  seleccionarImagenCurso(imagen){
    this.formNewCourse.get('photoUrl').patchValue(imagen);
  }

  seleccionarImagenInstructor(imagen){
    this.formNewCourse.get('imagen_instructor').patchValue(imagen);
  }

  // AQUI
  deleteModule(modulo){

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar módulo ${modulo.numero} - ${modulo.title? modulo.title: 'Sin título'}</span>`,
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
          text:`El módulo ${modulo.numero} - ${modulo.title? modulo.title: 'Sin título'} fue borrado`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }
  
  hideModuleClasses( modulo): void {
    for (const clase of modulo.clases) {
      clase.expanded = false;
      this.totalClases++;
    }
  }

  // AQUI
  hideOtherModules(moduloIn){
    this.modulos.map( modulo => {
      if(moduloIn.numero != modulo.numero)
      modulo['expanded'] = false;
      this.hideModuleClasses(modulo);
    })
  }

  closeOtherClasesModulo(openedClase: Clase): void {
    // Recorrer todas las clases en el módulo.
    // for (const clase of modulo.clases) {
    //     // Si la clase es la que se abrió, establecer expanded en true.
    //     // De lo contrario, establecer en false.
    //     if (clase === openedClase) {
    //         clase.expanded = true;
    //     } else {
    //         clase.expanded = false;
    //     }
    // }
  }

  // AQUI
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
  // AQUI
  getnumerClassTipo(claseIn) {
    let valor = 0

    // let modulo = this.modulos.find(modulo=>modulo.numero == moduloIn.numero );
    // let clases = modulo['clases'].filter( clase => clase.tipo == claseIn.tipo);
    // valor = clases.findIndex( clase => clase.id == claseIn.id);
    return valor+1
  }

  onPanelTitleClick(event: Event){
    event.stopPropagation();
  }

  getSelectedCategoriasCompetenciasClase(){
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

  // AQUI
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

  quitarVideoClase(clase){
    clase.vimeoId1 = null
    clase.vimeoId2 = null
    clase.videoUpload = false
  }

  // AQUI
  async addSession(tipo){
    let clases = []
    if (this.liveCourse.sessions && this.liveCourse.sessions.length > 0) clases = this.liveCourse.sessions
    
    let clase = new Clase;
    clase.tipo = tipo;
    clase['edited'] = true
    clase['modulo'];
    //clase.id = Date.now().toString();
    clase.id = await this.afs.collection<Clase>(Clase.collection).doc().ref.id;

    // clase['modulo'] = moduloIn.numero;
    // let numero = this.obtenerNumeroMasGrandeModulo(moduloIn);
    // clase['numero'] = numero;
    // clase.date = numero;

    if(clase.tipo == 'lectura'){
      clase.HTMLcontent ='<h4><font face="Arial">Sesi&#243;n de lectura.</font></h4><h6><font face="Arial">&#161;Asegurate de descargar los archivos adjuntos!</font></h6><p><font face="Arial">Encu&#233;ntralos en la secci&#243;n de material descargable</font></p>'
      clase.duracion = 10
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
    this.liveCourse.sessions = clases

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
          text:`La pregunta fue borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }

  // AQUI
  borrarClase(claseIn){

    // let modulo = this.modulos.find(modulo => modulo.numero == moduloIn.numero);
    // let clases = modulo['clases'];

    // Swal.fire({
    //   title: `<span class=" gray-9 ft20">Borrar clase ${claseIn.numero} - ${claseIn.titulo? claseIn.titulo: 'Sin título'}</span>`,
    //   icon: 'warning',
    //   showCancelButton: true,
    //   confirmButtonColor: 'var(--red-5)',
    //   cancelButtonColor: 'var(--gray-4)',
    //   confirmButtonText: `Borrar clase`,
    //   cancelButtonText:'Cancelar'
    // }).then((result) => {
    //   if (result.isConfirmed) {

    //     clases = clases.filter(clase => clase.id != claseIn.id );
    //     modulo['clases'] = clases;
    //     claseIn['deleted'] = true

    //     let classDelete = {
    //       claseInId:claseIn.id,
    //       cursoId:this.curso.id,
    //       moduloInId:moduloIn.id,
    //       activityId:claseIn?.activity?.id
    //     }

    //     this.deletedClasses.push(classDelete)
    //     //this.courseClassService.deleteClassAndReference(claseIn.id,this.curso.id,moduloIn.id);
    //     Swal.fire({
    //       title:'Borrado!',
    //       text:`La clase ${claseIn.numero} - ${claseIn.titulo? claseIn.titulo: 'Sin título'} fue borrada`,
    //       icon:'success',
    //       confirmButtonColor: 'var(--blue-5)',
    //     })
    //   }
    // })

  }

  editarTituloClase(index: number) {
    // Configura el estado de edición como prefieras
    this.moverCursorAlFinal(index);
  }

  moverCursorAlFinal(index: number) {
    // Espera hasta que los cambios en la vista se apliquen
    setTimeout(() => {
      const inputElementsArray = this.inputElements.toArray();
      const inputElement = inputElementsArray[index]?.nativeElement;
      if (inputElement) {
        const longitudTexto = inputElement.value.length;
        inputElement.focus();
        inputElement.setSelectionRange(longitudTexto, longitudTexto);
      }
    });
  }

  editarTituloModulo(index: number) {
    // Configura el estado de edición como prefieras
    this.moverCursorAlFinalModulo(index);
  }

  moverCursorAlFinalModulo(index: number) {
    // Espera hasta que los cambios en la vista se apliquen
    setTimeout(() => {
      const inputElementsArray = this.inputElementsModulo.toArray();
      const inputElement = inputElementsArray[index]?.nativeElement;
      if (inputElement) {
        const longitudTexto = inputElement.value.length;
        inputElement.focus();
        inputElement.setSelectionRange(longitudTexto, longitudTexto);
      }
    });
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

  async descargarArchivo(archivo) {
    //console.log('pdf actual', this.srsView);
    try {
      const response = await fetch(archivo.url);
      const blob = await response.blob();
      // Extract the filename from the URL
      // Decode the URI and split by '/'
      const decodedUrl = decodeURIComponent(archivo.url);
      const parts = decodedUrl.split('/');
      // Extract the filename which is before the '?' character
      const filenamePart = parts.pop().split('?')[0];

      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filenamePart; // Use the original filename or a default

      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Remove the anchor element and revoke the object URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading the file:', error);
    }
    
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
  }

  onDrop(event: DragEvent, tipo, clase) {
    // event.preventDefault(); // Prevenir el comportamiento por defecto
    // const files = event.dataTransfer?.files;
  
    // if (files && files.length > 0) {
    //   const imageFiles: File[] = this.filterFiles(files);
    //   if (imageFiles.length > 0) {
    //     this.onFileSelected(imageFiles,clase,true,modulo,true)
    //   } else {
    //     //console.log('No se encontraron imágenes válidas.');
    //   }
    // }
  }

  filterFiles(files: FileList): File[] {
    // Define los tipos MIME para PDF y Excel
    const aceptedTypes = [
        'application/pdf', // PDF
        'application/vnd.ms-excel', // Excel (formato antiguo .xls)
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel (formato nuevo .xlsx)
    ];

    const filteredFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files.item(i);
        if (file && aceptedTypes.includes(file.type)) {
            filteredFiles.push(file);
        }
    }
    return filteredFiles;
  }

  async onFileSelected(event, clase, local = false, adicional = false, tipo= null) {
    clase['uploading'] = true;
    clase['edited'] = true;

    if(clase.tipo == 'video'){
      clase['videoUpload'] = 0;
    }
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

      let base64content

      if(clase.tipo != 'video'){
        base64content = await this.fileToBase64(file);
      }
      else{
        base64content = URL.createObjectURL(file);
      }


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
          this.selectedClase.activity['recursosBase64'] = fileInfo?fileInfo:null;
        }

        if(!adicional && clase.archivos.length>0){
          clase.archivos[0] = fileInfo;

        }else{
          clase.archivos = clase.archivos.concat(fileInfo);
        }
  
        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        let nombreCurso = this.formNewCourse.get('title').value?  this.formNewCourse.get('title').value : 'Temporal';
  
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
              clase['uploading'] = false;
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
        // this.uploadVideo(file,clase,false,modulo); DESCOMENTAR Y ARREGLAR

      }
      else if(clase.tipo == 'actividad'){
        if(tipo == 'videoActividad'){
          let nombre =  fileBaseName+'.'+fileExtension;
          clase['base64Video'] = base64content
          clase['videoFileName'] = nombre;
          this.viewVideoActivity = false
          // this.uploadVideo(file,clase,false,modulo,'actividad'); DESCOMENTAR Y ARREGLAR
        }
      }
    }
  }

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

      this.competenciasSelectedClase=[];
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

  initVideo(): void {
    if (!this.videoReady) {
      let videoURL;
      if(!this.selectedClase?.vimeoId2){
        videoURL =
        'https://player.vimeo.com/video/' +
        this.selectedClase.vimeoId1 +
        '?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';
      }
      else{
        videoURL =
        'https://player.vimeo.com/video/' +
        this.selectedClase.vimeoId1 + '?h='+this.selectedClase.vimeoId2+'&amp'
        '?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';
      }
      //console.log('videoURL',videoURL)
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL)
    } else {
      this.loadVideo()
    }
  }

  // Si ya el reproductor esta cargado por hubo una clase de video previa esta función solo cmabia el video
  loadVideo(): void {

    let idVimeo = this.selectedClase.vimeoId1; // El ID básico del video
    let videoParam; // Este será el parámetro que pasaremos a loadVideo

    if (this.selectedClase.vimeoId2) {
      // Si vimeoId2 existe, construye la URL completa
      videoParam = `https://player.vimeo.com/video/${this.selectedClase.vimeoId1}?h=${this.selectedClase.vimeoId2}`;
    } else {
      // Si no, solo usa el ID del video
      videoParam = idVimeo;
    }
    this.player
    .loadVideo(videoParam)
    .then(function (id) {   
      // the video successfully loaded
      this.initPlayer();
    })
    .catch(function (error) {
      switch (error.name) {
        case 'TypeError':
          // the id was not a number
          break;

        case 'PasswordError':
          // the video is password-protected and the viewer needs to enter the
          // password first
          break;

        case 'PrivacyError':
          // the video is password-protected or private
          break;

        default:
          // some other error occurred
          break;
      }
    });
  }

  timer(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async initPlayer()  {
    if(!this.videoReady){
      this.initVideo()
      this.videoReady = true
    } else {
      await this.timer(100)
      var iframe = document.querySelector('iframe');
      if(iframe){
        this.player = new VimeoPlayer(iframe, {
          autoplay: true,
        });
        if(this.player){
          let completedVideo = 0
          let tiempoVisto = 0
          let step = 0
          this.player.on('play', (data) => {
            completedVideo = 0;
            //console.log("play")
            this.playing = true
            //this.playClass();
          });
          this.player.on('pause', (data) => {
            this.playing = false
            //console.log("pause")
          });
          const tolerance = 0.01;

          this.player.on('timeupdate', (data) => {
            tiempoVisto += .250
            step += 1
            if(step  == 4){
              // //console.log("tiempo visto: "+tiempoVisto+"s")
              step = 0
            }
          });
        } else {
          //console.log("player not found")
        }
        
      } else {
        //console.log("iframe not found")
      }
    }
    
    
  }

  structureActivity(content, clase, tipo = 'crear') {

    // this.videoReady = false;
    // this.base64view = null

    // this.selectedClase = clase
    // this.selectedModulo = modulo
    // this.viewFileActivity = false

    // this.activeStepActividad = 1;
    // clase['edited'] = true

    // //this.inicializarFormNuevaActividad();

    // if(clase.tipo == 'lectura'){
    //   //this.base64view = clase.archivos[0].base64;
    //   this.seletFilePDF(clase.archivos[0])
    //   this.fileViewTipe = 'pdf'

    // }
    // else if(clase.tipo == 'video'){ // estoy aqui
    //   if(clase['base64Video']){
    //     this.base64view = clase['base64Video'];
    //   }
    //   else{
    //     this.initVideo();
    //   }
    //   this.fileViewTipe = 'video'
    // }
    // else if(clase.tipo == 'actividad' ||clase.tipo == 'corazones' ){
    //   let activity : Activity = this.selectedClase.activity

    //   //console.log('clase',clase)

    //   this.formNuevaActividadBasica = new FormGroup({
    //     titulo: new FormControl(clase.titulo , Validators.required),
    //     //descripcion: new FormControl(activity?.description?activity.description : '', Validators.required),
    //     duracion: new FormControl(clase.duracion, Validators.required),
    //     recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null),
    //   });

    //   if(clase?.archivos[0]?.nombre){
    //     clase.archivos[0].uploading_file_progress = 100;

    //   }
    //   this.formNuevaActividadGeneral = new FormGroup({
    //     //instrucciones: new FormControl(activity?.description?activity.description : '', Validators.required),
    //     // video: new FormControl(clase.vimeoId1, [Validators.required, this.NotZeroValidator()]),
    //     video: new FormControl(clase.vimeoId1),
    //     recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null),
    //   });
    // }

    // if(tipo == 'crear'){
    //   this.modalActivity = this.modalService.open(content, {
    //     windowClass: 'custom-modal',
    //     ariaLabelledBy: 'modal-basic-title',
    //     size: 'lg',
    //     centered: true
    //   });
    // }
    // else{
    //   this.modalActivity = this.modalService.open(content, {
    //     ariaLabelledBy: 'modal-basic-title',
    //     centered: true,
    //     size:'lg'
    //   });
    // }
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

  getDurationModule(module){

    let duracion = 0
    module.clases.forEach(clase => {
      duracion+=clase?.duracion? clase.duracion : 0 
    });
    return duracion
  }

  // AQUI
  getDurationModuleCourse(){

    let duracion = 0

    this.modulos.forEach(modulo => {
      duracion+=this.getDurationModule(modulo)
    });

    if(this.examen?.questions){
      let duracionExamen = this.examen?.questions.length<=20 ? 20 : this.examen?.questions.length>=60?60 :this.examen?.questions.length
      duracion+=duracionExamen
    }

    return duracion


  }

  borrarArchivo(clase,archivo){


    Swal.fire({
      title: "Advertencia",
      text:`¿Desea borrar el archivo ${archivo.nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Borrar",
      confirmButtonColor: 'var(--red-5)',
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        console.log(clase,archivo)
        clase.archivos = clase.archivos.filter(x=>x.url != archivo.url)
        clase['edited'] = true; // Marca la clase como editada
      }
    });

  }

  deleteFileClass(clase){

    clase.archivos = []
  }

  uploadVideo(videoFile, clase, local = false, modulo, origen = null, intentosActuales = 0, maxIntentos = 2) {

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

      let nombreCurso = this.formNewCourse.get('title').value?  this.formNewCourse.get('title').value : 'Temporal';
      
      //console.log('modulo video',modulo);
      //console.log('clase video',clase)

      let videoDescription =  `Clase: ${clase.titulo.trim()} - Instructor:  ${this.formNewCourse.get('instructor').value}`.trim();

      let instructorText = `Instructor: ${this.formNewCourse.get('instructor').value}`.trim();
      let baseText = `Clase: - ${instructorText.trim()}`;
      let maxLength = 127;
      
      // Calcula el espacio disponible para el título de la clase, restando 3 para los puntos suspensivos
      let availableLengthForTitle = maxLength - baseText.length - 3; // Reserva espacio para los puntos suspensivos
      
      // Asegúrate de que el título de la clase no haga que el nombre total del video exceda el límite máximo
      let trimmedClassTitle = clase.titulo.trim();
      if ((`Clase: ${clase.titulo.trim()} - ${instructorText.trim()}`).length > maxLength) {
          // Recorta el título de la clase y agrega puntos suspensivos al final
          trimmedClassTitle = trimmedClassTitle.substring(0, availableLengthForTitle) + '...';
      }
      
      let videoName = `Clase: ${trimmedClassTitle} - ${instructorText}`;

      console.log(videoName,videoName.length)
      
      // Verifica de nuevo para asegurarte de que el nombre completo esté dentro del límite
      if (videoName.length > maxLength) {
          console.error("El nombre del video aún excede la longitud máxima permitida después del ajuste.");
      }
      
    

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
      const fileSizeInBytes = file.size;

      this.uploadControl.createVideo(videoName, videoDescription,fileSizeInBytes)
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
              // Aquí manejas el error y decides si reintentar
              console.log(error)
              if (intentosActuales < maxIntentos) {
                console.log(`Intento ${intentosActuales + 1} fallido. Reintentando...`);
                Swal.fire({
                  title: "Advertencia",
                  text:"Ocurrio un error al subir el video, ¿desea reintentar?",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Reintentar",
                  confirmButtonColor: 'var(--blue-5)',
                }).then((result) => {
                  /* Read more about isConfirmed, isDenied below */
                  if (result.isConfirmed) {
                    // Incrementa el contador de intentos y llama de nuevo a la función
                    this.uploadVideo(videoFile, clase, local, modulo, origen, intentosActuales + 1, maxIntentos);            
                  }
                });
              } else {
                // Llegaste al máximo de intentos, maneja el error definitivamente
                clase['uploading'] = false;
                clase['videoUpload'] = 0;
                console.log('Maximo de intentos alcanzado. Mostrando mensaje de error.');
                this.dialog.dialogAlerta("Hubo un error");
                // Lógica para manejar el error después de los reintentos
              }
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
                if (this.empresa.vimeoFolderId) {

                  if(!this.formNewCourse.get('vimeoFolderId')?.value){
                  // Crear un subproyecto con un nombre temporal dentro del proyecto de la empresa
                  //alert('crear carpeta proyecto')
                  projectOperation = this.uploadControl.createSubProject(this.formNewCourse.get('title').value,this.empresa.vimeoFolderUri).pipe(
                    tap(newSubProject => {
                      //Actualizar Firebase con el ID del subproyecto si es necesario
                      const subProjectId = newSubProject.uri.split('/').pop();
                      //this.updateFolderVimeoCurso(subProjectId, newSubProject.uri); // Asumiendo que esto es lo que deseas hacer
                      console.log('crear carpeta curso',subProjectId)
                      // if(this.curso?.vimeoFolderId){
                      //   this.curso.vimeoFolderId = subProjectId;
                      // }
                      this.formNewCourse.get("vimeoFolderId").patchValue(subProjectId);
                    }),
                    // Luego de crear el subproyecto, agrega el video a él
                      switchMap(newSubProject => this.uploadControl.addVideoToProject(newSubProject.uri.split('/').pop(), response.uri))
                    );
                  }
                  else{
                    console.log('this.formNewCourse.get',this.formNewCourse.get('vimeoFolderId').value)
                    projectOperation= this.uploadControl.addVideoToProject(this.formNewCourse.get('vimeoFolderId').value, response.uri)
                  }
                } 
                else {
                  // projectOperation = this.uploadControl.createProject(this.empresa.name).pipe(
                  //     tap(newProject => { 
                  //         const projectId = newProject.uri.split('/').pop();
                  //         this.updateFolderVimeoEmpresa(projectId,newProject.uri);
                  //     }),
                  //     switchMap(newProject => this.uploadControl.addVideoToProject(newProject.uri.split('/').pop(), response.uri))
                  // );
                  projectOperation = this.uploadControl.createProject(this.empresa.name).pipe(
                    tap(newProject => {
                      // Aquí es donde actualizamos Firebase con la nueva carpeta de empresa
                      const projectId = newProject.uri.split('/').pop();
                      this.updateFolderVimeoEmpresa(projectId, newProject.uri);
                    }),
                    // Después de crear la carpeta de empresa, crea el subproyecto dentro de esta nueva carpeta
                    switchMap(newProject => 
                      this.uploadControl.createSubProject(this.formNewCourse.get('title').value, newProject.uri).pipe(
                        tap(newSubProject => {
                          // Actualizar Firebase con el ID del subproyecto si es necesario
                          const subProjectId = newSubProject.uri.split('/').pop();
                          // this.updateFolderVimeoCurso(subProjectId, newSubProject.uri);
                          this.curso.vimeoFolderId = subProjectId; // Guarda el ID del subproyecto para el curso
                        }),
                        // Luego de crear el subproyecto, agrega el video a él
                        switchMap(newSubProject => this.uploadControl.addVideoToProject(newSubProject.uri.split('/').pop(), response.uri))
                      )
                    )
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
                          clase['uploading'] = false;
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
                  // error: (error)=>{
                  //   this.dialog.dialogAlerta("Hubo un error");
                  //   //console.log(error?.error?.error);
                  //   //URL.revokeObjectURL(this.videoSrc);
                  //   //this.videoFile=null;
                  //   clase['videoUpload'] =0;
                  //   //this.videoSrc=null;
                  //   clase['uploading'] = false;
                  // }
                  error: error => {
                    // Aquí manejas el error y decides si reintentar
                    console.log(error)
                    if (intentosActuales < maxIntentos) {
                      console.log(`Intento ${intentosActuales + 1} fallido. Reintentando...`);
                      Swal.fire({
                        title: "Advertencia",
                        text:"Ocurrio un error al subir el video, ¿desea reintentar?",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Reintentar",
                        confirmButtonColor: 'var(--blue-5)',
                      }).then((result) => {
                        /* Read more about isConfirmed, isDenied below */
                        if (result.isConfirmed) {
                          // Incrementa el contador de intentos y llama de nuevo a la función
                          this.uploadVideo(videoFile, clase, local, modulo, origen, intentosActuales + 1, maxIntentos);            
                        }
                      });
                    } else {
                      // Llegaste al máximo de intentos, maneja el error definitivamente
                      clase['uploading'] = false;
                      clase['videoUpload'] = 0;
                      console.log('Maximo de intentos alcanzado. Mostrando mensaje de error.');
                      this.dialog.dialogAlerta("Hubo un error");
                      // Lógica para manejar el error después de los reintentos
                    }
                  }
                })
              });
            }
          });
        },
        // error: (error) => {
        //   this.dialog.dialogAlerta("Hubo un error")
        //   //console.log(error.error.error);
        //   //URL.revokeObjectURL(this.videoSrc);
        //   //this.videoFile=null;
        //   clase['videoUpload'] =0;
        //   //this.videoSrc=null;
        //   clase['uploading'] = false;
        // }
        error: error => {
          // Aquí manejas el error y decides si reintentar
          console.log(error)
          if (intentosActuales < maxIntentos) {
            console.log(`Intento ${intentosActuales + 1} fallido. Reintentando...`);
            Swal.fire({
              title: "Advertencia",
              text:"Ocurrio un error al subir el video, ¿desea reintentar?",
              icon: "warning",
              showCancelButton: true,
              confirmButtonText: "Guardar",
              confirmButtonColor: 'var(--blue-5)',
            }).then((result) => {
              /* Read more about isConfirmed, isDenied below */
              if (result.isConfirmed) {
                // Incrementa el contador de intentos y llama de nuevo a la función
                this.uploadVideo(videoFile, clase, local, modulo, origen, intentosActuales + 1, maxIntentos);            
              }
            });
          } else {
            // Llegaste al máximo de intentos, maneja el error definitivamente
            clase['uploading'] = false;
            clase['videoUpload'] = 0;
            console.log('Maximo de intentos alcanzado. Mostrando mensaje de error.');
            this.dialog.dialogAlerta("Hubo un error");
            // Lógica para manejar el error después de los reintentos
          }
        },
      })
  }

  async updateFolderVimeoEmpresa(idFolder,folderUri) {
    //console.log(idFolder);
    //console.log(this.empresa)
    await this.afs.collection("enterprise").doc(this.empresa.id).update({
      vimeoFolderId: idFolder,
      vimeoFolderUri: folderUri
    })
    this.empresa.vimeoFolderId = idFolder;

  }

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
              text:`La imagen fue borrada`,
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
    if(this.activeStepActividad == 99){
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
    if(this.activeStepActividad == 2){
      this.updateTriggeQuestions++;
      setTimeout(() => {
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
          this.modalActivity.close();
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Actividad cambiada exitosamente'
          }); 

          console.log('this.selectedClase.activity',this.selectedClase.activity)
          
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
        
      }, 10);
    }
    else{
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

    

  }

  validateActivity(){

    // if(this.formNuevaActividadBasica.valid && this.formNuevaActividadGeneral.valid && this.validatePreguntasActividad()){
    //   return true
    // }
    if(this.formNuevaActividadBasica.valid){
      return true
    }
    return false;
  }

  validatePreguntasActividad(){
    return true
  }
  
  titleCase(str: string): string {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }

  // AQUI
  validarModulosClases(){

    let valid = true;
    // this.isInvalidCases= false;
    // this.invalidMessages = [];
    // if(this.modulos.length==0){
    //   valid = false
    //   this.isInvalidCases= true;
    //   this.invalidMessages.push('El curso debe contener al menos un módulo');
    // }

    // this.modulos.forEach(modulo => {
    //   modulo['InvalidMessages'] = [];
    //   modulo['isInvalid'] = false;
    //   if(modulo['clases'].length==0){
    //     modulo['isInvalid'] = true;
    //     valid = false;
    //     modulo['InvalidMessages'].push('El módulo debe contener al menos una clase');
    //   }
    //   if(modulo.title==''){
    //     modulo['isInvalid'] = true;
    //     valid = false;
    //     modulo['InvalidMessages'].push('El módulo debe tener título');
    //   }
    //   else{
    //     let clases = modulo['clases'];
    //     let classIndex= 0
    //     clases.forEach(clase => {
    //       classIndex++
    //       console.log('clase',clase)
    //       clase['InvalidMessages'] = [];
    //       clase['isInvalid'] = false;
    //       // {{clase.tipo | titlecase }} {{getnumerClassTipo(modulo,clase)}}
    //       if(clase.titulo==''){
    //         modulo['isInvalid'] = true;
    //         clase['isInvalid'] = true;
    //         valid = false;
    //         modulo['InvalidMessages'].push(`La clase ${(clase.tipo)} ${this.getnumerClassTipo(modulo,clase)} no tiene título`);
    //         clase['InvalidMessages'].push('La clase debe tener título');
    //       }

    //       if(clase.duracion==0){
    //         modulo['isInvalid'] = true;
    //         clase['isInvalid'] = true;
    //         valid = false;
    //         modulo['InvalidMessages'].push(`La clase ${(clase.tipo)} ${this.getnumerClassTipo(modulo,clase)} ${clase.titulo} no tiene duración`);
    //         clase['InvalidMessages'].push('La clase debe tener duración');
    //       }

    //       if (clase.tipo == 'video'){
    //         if(clase.vimeoId1==0 || !clase.vimeoId1){
    //           modulo['isInvalid'] = true;
    //           clase['isInvalid'] = true;
    //           valid = false;
    //           modulo['InvalidMessages'].push(`La clase ${(clase.tipo)} ${this.getnumerClassTipo(modulo,clase)} ${clase.titulo} no tiene video cargado`);
    //           clase['InvalidMessages'].push('La clase debe tener el video cargado');
    //         }
    //       }
    //       else if (clase.tipo =='lectura'){

    //         if(clase.archivos.length==0){
    //           modulo['isInvalid'] = true;
    //           clase['isInvalid'] = true;
    //           valid = false;
    //           modulo['InvalidMessages'].push(`La clase ${(clase.tipo)} ${this.getnumerClassTipo(modulo,clase)} ${clase.titulo} no tiene archivo cargado`);
    //           clase['InvalidMessages'].push('La clase debe tener el archivo de la lectura');
    //         }

    //       }
    //       else if(clase.tipo == 'actividad' && !clase?.activity?.autoGenerated){

    //         //console.log(clase['activity'].isInvalid)

    //         if(clase['activity'].isInvalid){
    //           modulo['isInvalid'] = true;
    //           clase['isInvalid'] = true;
    //           valid = false;
    //           modulo['InvalidMessages'].push('El módulo tiene clases invalidas');
    //           clase['InvalidMessages'].push('La actividad tiene la estructura incompleta');
    //         }
    //       }
    //       clase['InvalidMessages'] = [...new Set(clase['InvalidMessages'])];
    //       modulo['InvalidMessages'] = [...new Set(modulo['InvalidMessages'])];

    //     });
    //   }
    // });

    // //console.log('modulos',this.modulos)

    return valid;

  }

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
            let preguntasCompetenciasTmp = structuredClone(this.competenciasSelectedClase);
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

  crearCompetencia(modal){
    this.  savingSkill = false;
    this.showErrorSkill = false;
    this.formNewSkill = new FormGroup({
      nombre: new FormControl(null, Validators.required),
    })

    this.modalCrearSkill = this.modalService.open(modal, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'sm'
    });
  }

  saveNewSkills(){

    console.log('this.tmpSkillRefArray',this.tmpSkillRefArray)
    
    if(this.curso){
      this.curso.skillsRef = this.tmpSkillRefArray
      this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
    }
    else{
      this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
    }
    this.skillsCurso =  this.tmpSkillArray
    this.modalService.dismissAll();
  }

  async saveNewSkill(){
    this.savingSkill = true
    //console.log(this.pillarsForm.value)
    this.showErrorSkill = false;
    if(this.formNewSkill.valid){

      this.tmpSkillRefArray = []
      this.skillsCurso = []

      let pilar = this.pillarsForm.value
      let competencias = pilar['competencias'] || []
      let competencia = competencias.find(x=>x.name.toLowerCase()==this.formNewSkill.get('nombre')?.value.toLowerCase().trim())

      let skills = this.formNewCourse.get("skills")?.value
      if(skills){
        this.tmpSkillRefArray = skills;
      }
      else{
        skills = []
      }
      if(competencia){ // duplicado asignar 
        console.log('duplicado asignar',competencia,pilar,skills)
        let SkillCheck = skills.find(x=> x.id == competencia.id)
        if(!SkillCheck){
          let skillRef = await this.afs.collection<Skill>(Skill.collection).doc(competencia.id).ref;
          this.tmpSkillRefArray.push(skillRef)
          if(this.curso){
            this.curso.skillsRef = this.tmpSkillRefArray
            this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
          }
          else{
            this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
          }
          this.skillsCurso = this.getCursoSkills();
          this.savingSkill = false
          this.modalCrearSkill.close()
        }
        else{
          this.skillsCurso = this.getCursoSkills();
          this.savingSkill = false
          this.modalCrearSkill.close()
        }
      }
      else{ // crear y asignar
        let categoryRef = this.afs.collection<any>('category').doc(pilar['id']).ref;
        let enterpriseRef =this.enterpriseService.getEnterpriseRef()
        if(this.user.isSystemUser){
          enterpriseRef = null;
        }
        let skillAdd = new Skill(null,this.formNewSkill.get('nombre')?.value,categoryRef,enterpriseRef)
        await this.skillService.addSkill(skillAdd)
        competencias.push(skillAdd)
        //this.pillarsForm.get("competencias").patchValue(competencias);
        let skillRef = await this.afs.collection<Skill>(Skill.collection).doc(skillAdd.id).ref;
        this.tmpSkillRefArray.push(skillRef)
        if(this.curso){
          this.curso.skillsRef = this.tmpSkillRefArray
          this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
        }
        else{
          this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
        }

        console.log('tmpSkillRefArray',this.tmpSkillRefArray)
        this.skillsCurso = this.getCursoSkills();
        this.savingSkill = false
        this.modalCrearSkill.close()

      }
    }
    else{
      this.showErrorSkill = true
    }

  }

  verVideoVimeo(clase): NgbModalRef {
    let openModal = false
    let isNewUser = false

    const modalRef = this.modalService.open(VimeoComponent, {
      animation: true,
      centered: true,
      size: 'lg',
    })
    modalRef.componentInstance.clase = clase;
    return modalRef

  }

  confirmarTitulo(modulo: any) {
    modulo['editarTitulo'] = false;
    modulo.title = modulo['tituloTMP'];
  }

  confirmarTituloClase(clase) {
    clase['editarTitulo'] = false;
    clase.titulo = clase['tituloTMP'];
    clase['edited'] = true; // Marca la clase como editada
    // Aquí puedes añadir cualquier otra lógica necesaria después de confirmar el título
  }

}
