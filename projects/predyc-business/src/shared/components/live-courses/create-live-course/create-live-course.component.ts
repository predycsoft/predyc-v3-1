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
import { ModuleService } from '../../../services/module.service';
import { CourseClassService } from '../../../services/course-class.service';
import { ActivityClassesService } from '../../../services/activity-classes.service';
import { AuthService } from '../../../services/auth.service';
import { InstructorsService } from '../../../services/instructors.service';
import { AlertsService } from '../../../services/alerts.service';
import { Curso } from 'projects/shared/models/course.model';
import { Modulo } from 'projects/shared/models/module.model';
import { Activity, Question, QuestionType } from 'projects/shared/models/activity-classes.model';
import { Observable, Subscription, combineLatest, filter, finalize, firstValueFrom, map, startWith, switchMap, take, tap } from 'rxjs';
import { AbstractControl, FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Clase } from 'projects/shared/models/course-class.model';
import { MatTabChangeEvent } from '@angular/material/tabs';
import Swal from 'sweetalert2';
import { Category } from 'projects/shared/models/category.model';
import { Skill } from 'projects/shared/models/skill.model';
import VimeoPlayer from '@vimeo/player';
import { VimeoComponent } from '../../vimeo/vimeo.component';
import { LiveCourse, LiveCourseJson, LiveCourseTemplate, LiveCourseTemplateJson } from 'projects/shared/models/live-course.model';
import { Session, SessionJson, SessionTemplate, SessionTemplateJson } from 'projects/shared/models/session.model';
import { LiveCourseService } from '../../../services/live-course.service';

interface LiveCourseData extends LiveCourseTemplateJson {
  sessions: SessionData[],
  meetingLink: string,
  identifierText: string,
  emailLastDate: any,
  addClassMode: boolean,
  isInvalid: boolean,
  InvalidMessages: string[],

}

interface SessionData extends SessionTemplateJson {
  date: any,
  dateFormatted: string,
  weeksToKeep: number,
  vimeoId1: number,
  vimeoId2: string,
  sessionTemplateRef: DocumentReference,
  addClassMode: boolean,
  isInvalid: boolean,
  expanded: boolean,
  type: string,
  editarTitulo: boolean,
  tituloTMP: string,
  videoUpload: any,
  uploading: any,
  deleted: boolean,
  activity: any,
  HTMLcontent: any,
}

@Component({
  selector: 'app-create-live-course',
  templateUrl: './create-live-course.component.html',
  // templateUrl: './temporary.html',
  styleUrls: ['./create-live-course.component.css']
})
export class CreateLiveCourseComponent {

  constructor(
    public icon: IconService,
    public router: Router,
    private storage: AngularFireStorage,
    private modalService: NgbModal,
    private uploadControl: VimeoUploadService,
    private afs: AngularFirestore,
    private dialog: DialogService,
    public sanitizer: DomSanitizer,
    private enterpriseService: EnterpriseService,
    public categoryService : CategoryService,
    public skillService: SkillService,
    public moduleService: ModuleService,
    public courseClassService: CourseClassService,
    public activityClassesService:ActivityClassesService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private instructorsService:InstructorsService,
    private alertService: AlertsService,
    private liveCourseService: LiveCourseService,

  ) { }

  @ViewChild('endCourseModal') endCourseModal: ElementRef;
  @ViewChild('modalCrearInstructor') modalCrearInstructorContent: TemplateRef<any>;
  @ViewChild('modalCrearPilar') modalCrearPilarContent: TemplateRef<any>;
  @ViewChildren('inputRef') inputElements: QueryList<ElementRef>;
  @ViewChildren('inputRefModulo') inputElementsModulo: QueryList<ElementRef>;

  activeStep = 1;
  steps = ['Información del curso','Clases','Examen'];
  durations = [
    { value: (60*2), label: '2 hrs' },
    { value: (60*3), label: '3 hrs' },
    { value: (60*4), label: '4 hrs' },
    { value: (60*5), label: '5 hrs' },
    { value: (60*6), label: '6 hrs' },
    { value: (60*7), label: '7 hrs' },
    { value: (60*8), label: '8 hrs' }
  ];

  mode: "create" | "edit-base" | "edit" // "edit" for live course sessions sons edition
  liveCourseTemplateId = this.route.snapshot.paramMap.get("idCurso")
  liveCourseId = this.route.snapshot.paramMap.get("idLiveCourseSon")

  initDataSubscription: Subscription

  textModulo = 'Crear nuevo curso'

  liveCourseData: LiveCourseData
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

  selectedSession;
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

  comepetenciaValid= true

  modalCrearSkill;
  formNewSkill: FormGroup
  showErrorSkill = false;
  savingSkill = false

  studentEmails: string[] = []

  async ngOnInit(): Promise<void> {

    if (this.liveCourseId) this.mode = "edit"
    else if (!this.liveCourseId && this.liveCourseTemplateId) this.mode = "edit-base"
    else this.mode = "create"

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
    ]).subscribe(async ([enterprise, instructores, user]) => {
      if (enterprise && instructores && user) {
        this.empresa = enterprise
        this.instructores = instructores
        this.user = user
        await this.inicializarformNewCourse();
      }
    })

  }

  async inicializarformNewCourse () {
    // CREATE
    if (this.mode == 'create') {
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
          identifierText: new FormControl(''),
          instructor: new FormControl(null, Validators.required),
          vimeoFolderId: new FormControl(null),
          proximamente: new FormControl(false),

        })
        this.initializeLiveCourseAsLiveCourseData()
        this.initSkills();
      }, 2000);

    }
    // EDIT TEMPLATES
    else if (this.mode === "edit-base") {

      if (this.initDataSubscription) this.initDataSubscription.unsubscribe()
      this.initDataSubscription = this.liveCourseService.getLiveCourseTemplateWithSessionsTemplateById$(this.liveCourseTemplateId).pipe(take(1)).subscribe(liveCourseData => {
        this.setForm(liveCourseData)
      })
    }
    // EDIT LIVE COURSE AND SESSIONS
    else if (this.mode === "edit") {

      if (this.initDataSubscription) this.initDataSubscription.unsubscribe()
      this.initDataSubscription = this.liveCourseService.getLiveCourseWithSessionsById$(this.liveCourseId).pipe(take(1)).subscribe(liveCourseData => {
      
        this.setForm(liveCourseData)

      })

    }

  }

  initializeLiveCourseAsLiveCourseData(): void {
    this.liveCourseData = {
        id: '',
        companyName: '',
        title: '',
        photoUrl: '',
        meetingLink: '',
        identifierText: '',
        emailLastDate: null,
        description: '',
        instructorRef: {} as DocumentReference,
        proximamente: false,
        skillsRef: [],
        duration: 0,
        vimeoFolderId: '',
        sessions: [],
        addClassMode: false,
        isInvalid: false,
        InvalidMessages: []
    };
  }
  
  initializeSessionAsSessionData(): SessionData {
    return {
        id: '',
        title: '',
        dateFormatted: "",
        date: null,
        liveCourseTemplateRef: {} as DocumentReference,
        sessionTemplateRef: {} as DocumentReference,
        duration: 0,
        vimeoId1: 0,
        vimeoId2: '',
        files: [],
        addClassMode: false,
        isInvalid: false,
        expanded: false,
        type: '',
        editarTitulo: false,
        tituloTMP: '',
        videoUpload: null,
        uploading: null,
        deleted: false,
        activity: null,
        HTMLcontent: null,
        weeksToKeep: 2,
        orderNumber: null,
    };
  }

  setForm(data) {
    console.log("liveCourseData in onInit()", data)

    if (this.mode === "edit-base") {
      this.liveCourseData = {
        ...data.liveCourseTemplate,
        sessions: data.sessionsTemplates.map(session => ({
          ...session,
          dateFormatted: this.convertTimestampToDatetimeLocalString(session.date),
          addClassMode: false,
          isInvalid: false,
          expanded: false,
          type: null,
          editarTitulo: false,
          tituloTMP: null,
          videoUpload: null,
          uploading: null,
          deleted: false,
          activity: null,
          HTMLcontent: null,
        })),
        addClassMode: false,
        isInvalid: false,
        InvalidMessages: []
      };
    }
    else if (this.mode === "edit") {
      this.liveCourseData = {
        ...data.liveCourse,
        sessions: data.sessions.map(session => ({
          ...session,
          dateFormatted: this.convertTimestampToDatetimeLocalString(session.date),
          addClassMode: false,
          isInvalid: false,
          expanded: false,
          type: null,
          editarTitulo: false,
          tituloTMP: null,
          videoUpload: null,
          uploading: null,
          deleted: false,
          activity: null,
          HTMLcontent: null,
        })),
        addClassMode: false,
        isInvalid: false,
        InvalidMessages: []
      };
    }



    // let enterpriseREf = this.enterpriseService.getEnterpriseRef()
    // if(!this.user.isSystemUser && !(curso.enterpriseRef.id == enterpriseREf.id)){
    //   this.router.navigate(["management/courses"])
    // }

    // console.log('datos cursos',curso)
    let instructor = this.instructores.find(x=> x.id == this.liveCourseData.instructorRef.id)
    this.instructoresForm.patchValue(instructor)

    this.formNewCourse = new FormGroup({
      id: new FormControl(this.liveCourseData.id, Validators.required),
      vimeoFolderId: new FormControl(this.liveCourseData.vimeoFolderId),
      title: new FormControl(this.liveCourseData.title, Validators.required),
      description: new FormControl(this.liveCourseData.description, Validators.required),
      photoUrl: new FormControl(this.liveCourseData.photoUrl, Validators.required),
      instructorRef: new FormControl(this.liveCourseData.instructorRef),
      skills: new FormControl(this.liveCourseData.skillsRef, Validators.required),
      skillsRef: new FormControl(this.liveCourseData.skillsRef),
      meetingLink: new FormControl(this.liveCourseData.meetingLink),
      identifierText: new FormControl(this.liveCourseData.identifierText),
      instructor: new FormControl(instructor.nombre, Validators.required),
      resumen_instructor: new FormControl(instructor.resumen, Validators.required),
      imagen_instructor: new FormControl(instructor.foto, Validators.required),
      proximamente: new FormControl(this.liveCourseData.proximamente),

    });

    //this.formNewCourse.get('resumen_instructor').disable();
    this.initSkills();
    if (this.mode === "edit") {
      // this.pillarsForm = new FormControl({ value: '', disabled: true }); // disabled inside initSkills()
      this.instructoresForm = new FormControl(instructor);
    }

    // this.activityClassesService.getActivityAndQuestionsForCourse(this.liveCourseTemplateId, true).pipe(filter(activities=>activities!=null),take(1)).subscribe(activities => {
    //   console.log('activities clases', activities);
    //   this.activitiesCourse = activities;
    //   this.modulos.forEach(module => {
    //     let clases = module['clases'];
    //     clases.forEach(clase => {
    //       if (clase.tipo == 'actividad' || clase.tipo == 'corazones') {
    //         //console.log('activities clases clase', clase);
    //         let activity = activities.find(activity => activity.claseRef.id == clase.id);
    //         console.log('activities clases activity', activity);
    //         clase.activity = activity;
    //       }
    //     });
    //   });
    // });

  }


  initSkills() {
    this.categoryService.getCategoriesObservable().pipe().subscribe(category => {
      // console.log('category from service', category);
      this.skillService.getSkillsObservable().pipe().subscribe(skill => {
        // console.log('skill from service', skill);
        this.allskills = skill;
        skill.map(skillIn => {
          delete skillIn['selected']
        });

        this.categoriasArray = this.anidarCompetenciasInicial(category, skill)
        // console.log('categoriasArray', this.categoriasArray,this.liveCourseData)
        if (!this.skillsInit) {
          if (this.mode !== 'create') {
            //console.log('liveCourseData edit', this.liveCourseData)
            this.textModulo = 'Editar curso'
            let skillsProfile = this.liveCourseData.skillsRef;
            this.skillsCurso = this.getCursoSkills()
            skillsProfile.forEach(skillIn => {
              let skillSelect = skill.find(skillSelectIn => skillSelectIn.id == skillIn.id)
              if (skillSelect) {
                skillSelect['selected'] = true;
              }
            });

            if (this.liveCourseData) {
              let pilar
              let skillId = this.liveCourseData.skillsRef[0]?.id
              if (skillId) {
                pilar = this.categoriasArray.find(x=>x.competencias.find(y=>y.id == skillId))
              }
              else if (this.pillarsForm.value['id']) {
                pilar = this.categoriasArray.find(x=>x.id == this.pillarsForm.value['id'])
              }
              // console.log('pilar',pilar)
              // this.pillarsForm.patchValue(pilar)
              this.pillarsForm = new FormControl(pilar); 
              // console.log('pilar',this.pillarsForm.value['name'])
            }
            this.getExamCourse(this.liveCourseData.id);
          }
          else {
            let pilar
            if (this.pillarsForm.value['id']) {
              pilar = this.categoriasArray.find(x=>x.id == this.pillarsForm.value['id'])
              this.pillarsForm.patchValue(pilar)
            }
          }
          this.skillsInit = true
        }
      });
    });
  }

  convertTimestampToDatetimeLocalString(timestamp: any): string {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
  
    // Get the local time components
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
  
    // Format the local datetime string in the format required by input[type="datetime-local"]
    return `${year}-${month}-${day}T${hours}:${minutes}`;
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

  getExamCourse(idCourse: string) {
    // console.log('idCourse search activity', idCourse);
    const liveCourseType = this.mode === "edit-base" ? "liveCourseTemplate" : "liveCourse"
    this.activityClassesService.getActivityCoruse(idCourse, liveCourseType).pipe(filter(data=>data!=null),take(1)).subscribe(data => {
      if (data) {
        // console.log('Activity:', data);
        //console.log('Questions:', data.questions);
        data.questions.forEach(question => {
          // //console.log('preguntas posibles test',question)
          question.competencias = question.skills
        });
        this.examen = data;
        // console.log('examen data edit',this.examen)
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
  
  getCursoSkills() {
    // console.log("this.allskills", this.allskills)
    // console.log("this.formNewCourse.get('skills')?.value", this.formNewCourse.get('skills')?.value)

    let skillArray = [];
    
    this.formNewCourse.get("skills")?.value.forEach(skill => {
      let datail = this.allskills.find(x=>x.id == skill.id)
      skillArray.push(datail)
    });

    return skillArray
  }

  async removeSkill(skill: any){
    console.log("this.liveCourseData.skillsRef", this.liveCourseData.skillsRef)
    console.log("skill", skill)
    if (this.liveCourseData?.skillsRef) {
      this.liveCourseData.skillsRef = this.liveCourseData.skillsRef.filter(x=> x.id != skill.id)
      console.log('this.liveCourseData.skillsRef after delete',this.liveCourseData.skillsRef)
      this.skillsCurso = this.getCursoSkills();
      // this.liveCourseData.skillsRef = this.tmpSkillRefArray
      this.formNewCourse.get("skills").patchValue(this.liveCourseData.skillsRef);
    }
    else{
      console.log('this.skillsCurso',this.skillsCurso)
      this.skillsCurso = this.skillsCurso.filter(x=> x.id != skill.id)
      let skillsRef = []
      for(let skill of this.skillsCurso){
        let skillRef = this.afs.collection<any>('skill').doc(skill.id).ref;
        skillsRef.push(skillRef)
      }
      this.formNewCourse.get("skills").patchValue(skillsRef);

    }

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

  changePillar(newPillar) {

    if (this.liveCourseData?.skillsRef[0]?.id) {
      let pilar = this.categoriasArray.find(x=>x.competencias.find(y=>y.id == this.liveCourseData?.skillsRef[0]?.id))
      //this.pillarsForm.patchValue(pilar)
      if(pilar.id != newPillar.id){
        this.liveCourseData.skillsRef = [];
        this.skillsCurso= [];
        // this.formNewCourse.get('skills').reset();
        this.formNewCourse.get('skills').setValue([]);
      }
    }

  }

  createPillar(){
    this.savingPillar = false;
    this.pillarsForm.patchValue('')

    this.liveCourseData?.skillsRef ? this.liveCourseData.skillsRef = [] : null;
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
    // this.formNewCourse.get("resumen_instructor").patchValue(instructor.resumen);
    // this.formNewCourse.get("imagen_instructor").patchValue(instructor.foto);

  }

  changeBorrador(event: Event) {
    // Accede a la propiedad 'checked' del checkbox
    const isChecked = (event.target as HTMLInputElement).checked;
  
    // Actualiza el valor del campo 'proximamente' en el formulario con el nuevo estado
    this.formNewCourse.get('proximamente').setValue(isChecked);

    if (this.liveCourseData) {
      this.liveCourseData.proximamente = isChecked
    }
  
    // Opcionalmente, imprime si el checkbox quedó marcado o no
    console.log('El checkbox Borrador está:', isChecked ? 'marcado (true)' : 'desmarcado (false)');
  }

  openModal(content,size='lg'){

    this.tmpSkillRefArray = []
    this.tmpSkillArray = []

    this.liveCourseData?.skillsRef?.forEach(element => {
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

  createInstructor() {

    this.formNewCourse.get("instructorRef").patchValue(null);
    // this.formNewCourse.get("instructor").patchValue(null);
    // this.formNewCourse.get("resumen_instructor").patchValue(null);
    // this.formNewCourse.get("imagen_instructor").patchValue(null);

    this.openModalinstructor();

  }

  addSkill() {
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

  async saveNewPillar() {
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

    let enterpriseRef = this.enterpriseService.getEnterpriseRef()
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

  removeSkillTmp(skill) {
    let skillsTmpAdd = this.formNewPillar.get('skills')?.value
    skillsTmpAdd = skillsTmpAdd.filter(x=>x!=skill)
    this.formNewPillar.get("skills").patchValue(skillsTmpAdd);

    // this.liveCourseData.skillsRef = this.liveCourseData.skillsRef.filter(x=> x.id != skill.id)
    // this.skillsCurso = this.getCursoSkills();
    // this.liveCourseData.skillsRef = this.tmpSkillRefArray
    // this.formNewCourse.get("skills").patchValue(this.liveCourseData.skillsRef);
  }

  parseDateString(date: string): Date {
    date = date.replace("T", "-");
    let parts = date.split("-");
    let timeParts = parts[3].split(":");

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(
      +parts[0],
      +parts[1] - 1,
      +parts[2],
      +timeParts[0],
      +timeParts[1]
    ); // Note: months are 0-based
  }
  





  async saveDraftPre() {
    // if (this.mode !== "edit") {
      // this.liveCourseData.title = this.formNewCourse.value.title
      let checkStatus = await this.checkAllInfo();
  
      if(!checkStatus && this.formNewCourse.valid) {
        Swal.fire({
          title: "Revisar datos",
          text:"Existen problemas en el curso, ¿desea continuar?, se guardará como borrador",
          icon: "info",
          showCancelButton: true,
          confirmButtonText: "Guardar",
          confirmButtonColor: 'var(--blue-5)',
        }).then((result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed && this.formNewCourse.valid) {
            this.formNewCourse.get("proximamente").patchValue(true);
            if (this.liveCourseData) this.liveCourseData.proximamente = true // Save as "borrador"
            this.saveDraft()
          }
        });
      }
      else if (this.formNewCourse.valid){
        this.saveDraft()
      }
      else if(!this.formNewCourse.valid){
        Swal.fire({
          title:'Datos faltantes!',
          text:`Por favor verifique los datos del curso para poder guardarlo`,
          icon:'warning',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    // }
  }







  async checkAllInfo(){
    this.showErrorCurso = false;
    let valid = true;
    // console.log('formNewCourse',this.formNewCourse)
    // console.log('liveCourseData',this.liveCourseData)
    if (!this.formNewCourse.valid) valid = false;
    else {
      // console.log('datos formulario',this.formNewCourse.value)
      if (this.liveCourseData.id) {
        this.updateLiveCourseWithFormInfo()
        // this.liveCourseData = this.formNewCourse.value;
        // this.liveCourseData.instructorNombre = this.liveCourseData.instructor
      }
      else {
        let id = await this.afs.collection<LiveCourse>(LiveCourse.collection).doc().ref.id;
        // let newCurso = new LiveCourse;
        // let newCurso: any = {};
        this.formNewCourse.get("id").patchValue(id);
        // newCurso = this.formNewCourse.value;
        // this.liveCourseData = newCurso
        this.updateLiveCourseWithFormInfo()
      }
    }
    
    if (!this.validarModulosSessions()) valid = false;
    
    this.updateTriggeQuestionsExam++;

    await new Promise(resolve => setTimeout(resolve, 30));

    // test ValidationComponent. check later ...
    if(this.validExam == null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0){
      valid = false
      this.updateTriggeQuestionsExam++;
    }
    else {
      let questions = structuredClone(this.validExam.value.questions)
      questions.forEach(question => {
        if(!question.typeFormated){
          question.typeFormated = this.getTypeQuestion(question.type)
          if(question.type == 'complete'){
            this.showDisplayText(question)
          }
        }
      });
      // console.log('revisar',this.examen,questions)
      if(this.examen){
        this.examen.questions = questions
      }
      else{
        let exam = new Activity();
        exam.questions = questions
        exam.type = 'test'
        exam.title = `Questionario Final: ${this.liveCourseData.title}`
        exam.updatedAt = new Date().getTime()
        exam.createdAt = new Date().getTime()
        this.examen = exam;
      }

      // console.log('examen',this.examen)
      //this.openModal(this.endCourseModal)
    }
    
    if (!valid) this.showErrorCurso = true

    return valid
    
  }

  updateLiveCourseWithFormInfo(): void {
    const formValues = this.formNewCourse.value;
    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== undefined && formValues[key] !== null) {
        (this.liveCourseData as any)[key] = formValues[key];
      }
    });
    // console.log('Updated liveCourseData:', this.liveCourseData);
  }

  validarModulosSessions(){
    let valid = true;
    this.isInvalidCases= false;
    this.invalidMessages = [];

    // this.liveCourseData === modulo
    if (!this.liveCourseData.title) {
      this.liveCourseData['isInvalid'] = true;
      valid = false;
      this.liveCourseData['InvalidMessages'].push('El curso debe tener título');
    }

    if (this.liveCourseData.sessions.length == 0) {
      this.liveCourseData['isInvalid'] = true;
      valid = false;
      this.liveCourseData['InvalidMessages'].push('El curso debe contener al menos una sesión');
    }

    else{
      let sessions = this.liveCourseData.sessions;
      let classIndex= 0
      sessions.forEach(session => {
        classIndex++
        // console.log('session',session)
        session['InvalidMessages'] = [];
        session['isInvalid'] = false;
        
        if (session.title=='') {
          this.liveCourseData['isInvalid'] = true;
          session['isInvalid'] = true;
          valid = false;
          this.liveCourseData['InvalidMessages'].push(`Una de tus sesiones no tiene título`);
          session['InvalidMessages'].push('La sesión debe tener título');
        }

        if (session.duration == 0) {
          this.liveCourseData['isInvalid'] = true;
          session['isInvalid'] = true;
          valid = false;
          this.liveCourseData['InvalidMessages'].push(`La sesión ${session.title} no tiene duración`);
          session['InvalidMessages'].push('La sesión debe tener duración');
        }

        // CHECK
        // if (session.type == 'video'){
        //   if(session.vimeoId1 == 0 || !session.vimeoId1){
        //     this.liveCourseData['isInvalid'] = true;
        //     session['isInvalid'] = true;
        //     valid = false;
        //     this.liveCourseData['InvalidMessages'].push(`La sesión ${(session.type)} ${session.title} no tiene video cargado`);
        //     session['InvalidMessages'].push('La sesión debe tener el video cargado');
        //   }
        // }


        // CHECK
        // else if (session.type =='lectura'){
        //   if(session.files.length == 0){
        //     this.liveCourseData['isInvalid'] = true;
        //     session['isInvalid'] = true;
        //     valid = false;
        //     this.liveCourseData['InvalidMessages'].push(`La sesión ${(session.type)} ${session.title} no tiene archivo cargado`);
        //     session['InvalidMessages'].push('La sesión debe tener el archivo de la lectura');
        //   }

        // }

        // CHECK
        // else if (session.type == 'actividad' && !session?.activity?.autoGenerated){ // activity ???
        //   //console.log(clase['activity'].isInvalid)

        //   if(session['activity'].isInvalid){
        //     this.liveCourseData['isInvalid'] = true;
        //     session['isInvalid'] = true;
        //     valid = false;
        //     this.liveCourseData['InvalidMessages'].push('El curso tiene sesiones invalidas');
        //     session['InvalidMessages'].push('La actividad tiene la estructura incompleta');
        //   }
        // }


        session['InvalidMessages'] = [...new Set(session['InvalidMessages'])];
        this.liveCourseData['InvalidMessages'] = [...new Set(this.liveCourseData['InvalidMessages'])];

      });
    }

    //console.log('modulos',this.modulos)

    return valid;

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

  async saveDraft(){
    //console.log('----- save borrador ------')

    this.savingCourse = true;

    Swal.fire({
      title: 'Generando curso...',
      text: 'Por favor, espera.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    });

    let duration = this.getDurationModuleCourse()
    this.liveCourseData.duration = duration

    // Save Live course
    if (this.liveCourseData) {

      if (this.liveCourseData['skills']) {
        this.liveCourseData.skillsRef = this.liveCourseData['skills']
        delete this.liveCourseData['skills'];
      }

      console.log('this.liveCourseData',this.liveCourseData)

      let formatedLiveCourseData: LiveCourse | LiveCourseTemplate

      if (this.mode === "edit") {
        formatedLiveCourseData = this.LiveCourseDataModelToLiveCourse(this.liveCourseData)
        console.log("formatedLiveCourseData", formatedLiveCourseData)
        await this.liveCourseService.saveLiveCourse(formatedLiveCourseData as LiveCourse)
      }
      else {
        formatedLiveCourseData = this.LiveCourseDataModelToLiveCourseTemplate(this.liveCourseData)
        console.log("formatedLiveCourseData as template", formatedLiveCourseData)
        await this.liveCourseService.saveLiveCourseTemplate(formatedLiveCourseData as LiveCourseTemplate)
      }
    }
    
    // For "exameness" ... check later
    if (this.examen) {
      let courseRef = null
      if (this.mode === "edit") courseRef = this.liveCourseService.getLiveCourseRefById(this.liveCourseData.id)
      else courseRef = this.liveCourseService.getLiveCourseTemplateRefById(this.liveCourseData.id)

      let activityClass = new Activity
      // console.log('this.activityClass',activityClass)
      let questions: Question[]= []
      questions = structuredClone(this.examen.questions);
      let auxCoursesRef = this.examen.coursesRef
      this.examen.coursesRef = null
      // console.log('this.examen',this.examen)


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

      this.examen.coursesRef = auxCoursesRef
      activityClass.coursesRef = [courseRef];
      activityClass.type = Activity.TYPE_TEST;
  
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

      // console.log('questionsClasses',questionsClasses)

      if(questionsIds.length>0){
        //remove not present questions
        await this.activityClassesService.removeQuestions(questionsIds,activityClass.id)
      }

      if(questionsClasses.length>0){
        //existen preguntan en los examenes con refrencias de clases y se debe generar la actividad
        if(this.modulos.length>0){

          //let validModules = this.modulos.filter(moduleCheck => !moduleCheck['isInvalid'])
          let validModules = this.modulos;

          for (let modulo of validModules){
            let clases = modulo['clases'];
            const clasesNoOuNoAutoGenerated = clases.filter(clase => !clase?.activity?.autoGenerated);
            const clasesAutoGenerated = clases.filter(clase => clase?.activity?.autoGenerated);
            modulo['clases'] = [...clasesNoOuNoAutoGenerated, ...clasesAutoGenerated];
            clases = modulo['clases'];
            console.log('ClasesModulo',clases)
            let classOfQuestion = clases.find(x => x.id == questionsClasses.find(y=>y.classId == x.id)?.classId)
            if(classOfQuestion){
              console.log('classeOfQuestion',classOfQuestion)
              let activityClassArray = clases.filter(x=>x.tipo == 'actividad' && x?.activity?.autoGenerated)
              if(activityClassArray.length>0){
                let activityClass = activityClassArray[0];
                activityClass['edited'] = true;
                activityClass['deleted'] = false

                console.log('update activityauto')
                let preguntasFiltradas = questionsClasses.filter(question => 
                  clases.some(clase => clase.id === question.classId)
                );
                activityClass.titulo = `${modulo.titulo}`
                activityClass.activity.questions = preguntasFiltradas
                let duracion = 0
                if(preguntasFiltradas.length>=20){
                  duracion = 20
                }
                else{
                  duracion = preguntasFiltradas.length
                }
                activityClass.duracion = duracion
                activityClass.activity.duration = duracion
                activityClass.activity.autoGenerated = true;
                activityClass.activity.title = `${modulo.titulo}`
                console.log('activityClassAuto',activityClass)
                
              }
              else{
                let preguntasFiltradas = questionsClasses.filter(question => 
                  clases.some(clase => clase.id === question.classId)
                );
                let clase = new Clase;
                console.log('Create activityauto')
                clase.duracion = preguntasFiltradas.length
                clase.titulo = `${modulo.titulo}`
                clase.tipo = 'actividad';
                clase['edited'] = true
                clase['deleted'] = false
                clase['modulo'];
                clase.id = await this.afs.collection<Clase>(Clase.collection).doc().ref.id;
                clase['modulo'] = modulo.numero;
                let numero = this.obtenerNumeroMasGrandeModulo(modulo);
                clase['numero'] = numero;
                clase.date = numero;
                let actividad = new Activity();
                actividad.questions = preguntasFiltradas
                actividad.title = `${modulo.titulo}`
                actividad.autoGenerated = true;
                actividad['isInvalid'] = true;
                clase['activity'] = actividad;
                clase['expanded'] = false;
                clases.push(clase);
              }
            }
            else{
              let activityClassArray = clases.filter(x=>x.tipo == 'actividad' && x?.activity?.autoGenerated)
              console.log('activityClassArrayDelete',activityClassArray)
              if(activityClassArray.length>0){
                let clase = activityClassArray[0]
                clase['deleted'] = true
                clase['edited'] = false
                let classDelete = {
                  claseInId:clase.id,
                  cursoId:this.liveCourseData.id,
                  moduloInId:modulo.id,
                  activityId:clase?.activity?.id

                }
                this.deletedClasses.push(classDelete)
                clases = clases.filter(clase => clase.id != classDelete.claseInId );

              }
              
            }
          }
        }
      }
      else{ // ninguna pregunta esta asociada a clases (borrar todas las actividades automaticas)
        if(this.modulos.length>0){
          //let validModules = this.modulos.filter(moduleCheck => !moduleCheck['isInvalid'])
          let validModules = this.modulos
          for (let modulo of validModules){
            let clases = modulo['clases'];
            let activityClassArray = clases.filter(x=>x.tipo == 'actividad' && x?.activity?.autoGenerated)
            if(activityClassArray.length>0){
              let clase = activityClassArray[0]
              clase['deleted'] = true
              clase['edited'] = false
              let classDelete = {
                claseInId:clase.id,
                cursoId:this.liveCourseData.id,
                moduloInId:modulo.id,
                activityId:clase?.activity?.id
              }
              this.deletedClasses.push(classDelete)
              clases = clases.filter(clase => clase.id != classDelete.claseInId );
              console.log('clasesAfterDelete',clases)

            }
          }
        }

      }
    }

    // Remove sessions ... check later
    if(this.deletedClasses.length > 0){
      for (let clase of this.deletedClasses){
        console.log('deletedClasses',clase)
        // await this.courseClassService.deleteClassAndReference(clase.claseInId,this.liveCourseData.id,clase.moduloInId,clase?.activityId);
        if(clase.vimeoId1){
          // this.uploadControl.deleteVideo(clase.vimeoId1).subscribe(respuesta => {
          //   console.log('respuesta.respuesta')
          // })
        }
      }
    }  

    // Save sessions (and activities ... check later)
    if(this.liveCourseData.sessions.length > 0) {
      let arrayClasesRef = [];
      for (let i = 0; i < this.liveCourseData.sessions.length; i++) {
        try {
          let clase = this.liveCourseData.sessions[i]; //session
          if (clase['edited']) {
            // Save session
            // console.log('sesion',clase)
            let localeSession: SessionData = this.initializeSessionAsSessionData()
            localeSession.HTMLcontent = clase.HTMLcontent ? clase.HTMLcontent : null;
            localeSession.files = clase.files.map(archivo => ({
              id: archivo.id,
              nombre: archivo.nombre,
              size: archivo.size,
              type: archivo.type,
              url: archivo.url
            }));
            localeSession.duration = clase.duration;
            localeSession.id = clase.id;
            localeSession.type = clase.type;
            localeSession.orderNumber = i+1;
            localeSession.title = clase.tituloTMP ? clase.tituloTMP: clase.title;
            localeSession.liveCourseTemplateRef = this.liveCourseService.getLiveCourseTemplateRefById(this.liveCourseData.id)
            // localeSession.sessionTemplateRef = this.liveCourseService.getSessionTemplateRefById(this.liveCourseData.id)
            localeSession.sessionTemplateRef = null

            if (this.mode === "edit") await this.liveCourseService.saveSession(this.SessionDataModelToLiveCourseSession(localeSession));
            else await this.liveCourseService.saveSessionTemplate(this.SessionDataModelToLiveCourseSessionTemplate(localeSession));

            // const sessionTemplateToSave: SessionTemplate = this.SessionDataModelToLiveCourseSessionTemplate(localeSession)
            // console.log("sessionTemplateToSave", sessionTemplateToSave)
            // await this.liveCourseService.saveSessionTemplate(sessionTemplateToSave);

            
            let refClass = this.liveCourseService.getSessionTemplateRefById(localeSession.id)
            let courseRef = this.afs.collection<Curso>(Curso.collection).doc(this.liveCourseData.id).ref;
            arrayClasesRef.push(refClass);
            // console.log('activityClass',clase)

            // save activity ... check later
            if (clase.activity) {
              // let activityClass = clase.activity
              // activityClass.description = null
              // let questions: Question[]= []
              // activityClass.enterpriseRef = null
              // questions = structuredClone(clase.activity.questions);
              // // activityClass.enterpriseRef = this.liveCourseData.enterpriseRef as DocumentReference<Enterprise>
              // activityClass.enterpriseRef = null
              // if(this.user.isSystemUser){
              //   activityClass.enterpriseRef = null
              // }
              // activityClass.claseRef = refClass;
              // activityClass.coursesRef = [courseRef];
              // activityClass.type = Activity.TYPE_REGULAR;
              // activityClass.activityCorazon = false
              // if(clase.type == 'corazones'){
              //   activityClass.activityCorazon = true
              // }

              // if(!activityClass['recursosBase64'] ){
              //   activityClass['recursosBase64'] = null
              // }
              // let actividadTmp = new Activity
              // actividadTmp.autoGenerated = activityClass?.autoGenerated
              // actividadTmp.activityCorazon = activityClass?.activityCorazon
              // actividadTmp.claseRef = activityClass?.claseRef
              // actividadTmp.coursesRef = activityClass?.coursesRef
              // actividadTmp.createdAt = activityClass?.createdAt
              // actividadTmp.description = activityClass?.description
              // actividadTmp.duration = activityClass?.duration
              // actividadTmp.enterpriseRef = activityClass?.enterpriseRef
              // actividadTmp.files = activityClass?.files
              // actividadTmp.id = activityClass?.id
              // actividadTmp.title= activityClass?.title
              // actividadTmp.type = activityClass?.type
              // actividadTmp.updatedAt = activityClass?.updatedAt

              // console.log('activityClassEdit',actividadTmp)


              // await this.activityClassesService.saveActivity(actividadTmp);
              // clase.activity.id = actividadTmp.id;
              // console.log('questionsActivityEdit',questions)
              // let questionsIds = [];

              // for (let pregunta of questions){
              //   // localeSession.skillsRef = arrayRefSkills;
              //   delete pregunta['typeFormated'];
              //   delete pregunta['competencias_tmp'];
              //   delete pregunta['competencias'];
              //   delete pregunta['isInvalid'];
              //   delete pregunta['InvalidMessages'];
              //   delete pregunta['expanded_categorias'];
              //   delete pregunta['expanded'];
              //   delete pregunta['uploading_file_progress'];
              //   delete pregunta['uploading'];
              //   console.log('save pregunta revisar',pregunta,clase.activity.id)
              //   await this.activityClassesService.saveQuestion(pregunta,clase.activity.id)
              //   questionsIds.push(pregunta.id)
              // }
              // if(questionsIds.length>0){
              //   await this.activityClassesService.removeQuestions(questionsIds,activityClass.id)
              // }
            }
          }
          else {
            // Delete sessions (it doesnt do anything at the end)
            let findDeleted = this.deletedClasses.find(x=>x.claseInId == clase.id)
            // console.log('claseRevisar',clase,findDeleted)
            if(!findDeleted && !clase['deleted']){
              let refClass = this.liveCourseService.getSessionTemplateRefById(clase.id)
              arrayClasesRef.push(refClass);
            }

          }
        } catch (error) {
          console.error('Error processing clase', error);
        }
      }

      this.deletedClasses = []

    }

    if (this.mode === "edit") {
      await this.liveCourseService.updateLiveCourseMeetingLinkAndIdentifierText(this.liveCourseId, this.formNewCourse.value.meetingLink, this.formNewCourse.value.identifierText)
      for (let session of this.liveCourseData.sessions) {
        const date = session.dateFormatted ? this.parseDateString(session.dateFormatted) : null
        const sessionSonDataToUpdate = {
          date: date,
          weeksToKeep: session.weeksToKeep,
          files: session.files,
          vimeoId1: session.vimeoId1,
          vimeoId2:  session.vimeoId2
        }
        await this.liveCourseService.updateSessionData(session.id, sessionSonDataToUpdate)
      }
    }


    // await this.afs.collection(LiveCourse.collection).doc(this.liveCourseData.id).update({
    //   duration: duration
    // })

    Swal.close();
    this.savingCourse = false;
    this.alertService.succesAlert("El curso en vivo se ha guardado exitosamente")


    if(this.mode == 'create'){
      this.router.navigate([`management/live/${this.liveCourseData.id}`])
    }


  }

  LiveCourseDataModelToLiveCourseTemplate(liveCourseData: LiveCourseData) {
    return new LiveCourseTemplate(
      liveCourseData.id,
      liveCourseData.companyName,
      liveCourseData.title,
      liveCourseData.photoUrl,
      liveCourseData.description,
      liveCourseData.instructorRef,
      liveCourseData.proximamente,
      liveCourseData.skillsRef,
      liveCourseData.duration,
      liveCourseData.vimeoFolderId
    );
  }

  LiveCourseDataModelToLiveCourse(liveCourseData: LiveCourseData) {
    return new LiveCourse(
      liveCourseData.companyName,
      liveCourseData.description,
      liveCourseData.duration,
      liveCourseData.emailLastDate,
      liveCourseData.id,
      liveCourseData.identifierText,
      liveCourseData.instructorRef,
      this.liveCourseService.getLiveCourseTemplateRefById(this.liveCourseTemplateId),
      liveCourseData.meetingLink,
      liveCourseData.photoUrl,
      liveCourseData.proximamente,
      liveCourseData.skillsRef,
      liveCourseData.title,
      liveCourseData.vimeoFolderId
    );
  }

  SessionDataModelToLiveCourseSessionTemplate(sessionData: SessionData) {
    return new SessionTemplate(
      sessionData.id,
      sessionData.title,
      sessionData.liveCourseTemplateRef,
      sessionData.duration,
      sessionData.files,
      sessionData.orderNumber,
    );
  }

  SessionDataModelToLiveCourseSession(sessionData: SessionData) {
    return new Session(
      sessionData.date,
      sessionData.duration,
      sessionData.files,
      sessionData.id,
      this.liveCourseService.getLiveCourseRefById(this.liveCourseId),
      sessionData.orderNumber,
      sessionData.title,
      null,
      sessionData.vimeoId1,
      sessionData.vimeoId2,
      sessionData.weeksToKeep,
    );
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
    //       if(this.liveCourseData){
    //         this.liveCourseData = this.formNewCourse.value;
    //         this.liveCourseData.instructorNombre = this.liveCourseData.instructor
    //       }
    //       else{
    //         let id = await this.afs.collection<Curso>(Curso.collection).doc().ref.id;
    //         let newCurso = new Curso;
    //         this.formNewCourse.get("id").patchValue(id);
    //         newCurso = this.formNewCourse.value;
    //         this.liveCourseData = newCurso
    //         this.liveCourseData.instructorNombre = this.liveCourseData.instructor
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
    //           exam.title = `Questionario Final: ${this.liveCourseData.title}`
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

  uploadCourseImage(event, tipo, newInstructor = false){
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      // Swal.fire({
      //   title:'Borrado!',
      //   text:`Debe seleccionar una imagen`,
      //   icon:'warning',
      //   confirmButtonColor: 'var(--blue-5)',
      // })
      return;
    }
    const file = event.target.files[0];

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (_event) => {
      //this.deleteQuestionImage(pregunta);

      // Check image dimensions
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        // console.log(`Image dimensions: ${width}x${height}`);

        // if (width !== 500 || height !== 500) {
        if (width !== height) {
          Swal.fire({
            title:'Error!',
            text:`Debe seleccionar una imagen de dimensiones 1:1`,
            icon:'warning',
            confirmButtonColor: 'var(--blue-5)',
          })
          return;
        } 
  
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

  closeOtherSessions(openedSession: any): void {
    // Recorrer todas las clases en el módulo.
    for (const session of this.liveCourseData.sessions) {
        // Si la clase es la que se abrió, establecer expanded en true.
        // De lo contrario, establecer en false.
        if (session === openedSession) {
            session.expanded = true;
        } else {
            session.expanded = false;
        }
    }
  }

  getIconSession(sessionType: string){
    if (sessionType == 'lectura'){
      return 'catelog'
    }
    else if (sessionType == 'actividad'){
      return 'chess'
    }
    else if (sessionType == 'corazones'){
      return 'favorite'
    }
    else if(sessionType == 'video'){
      return 'videoChat'
    }

    return "catelog";
  }

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

  getSelectedCategoriasCompetenciasSession(){
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

  quitarVideoSession(session: SessionData){
    session.vimeoId1 = null
    session.vimeoId2 = null
    session.videoUpload = false
  }

  addSession(tipo) {
    let clases = []
    if (this.liveCourseData.sessions && this.liveCourseData.sessions.length > 0) clases = this.liveCourseData.sessions
    
    // let clase = new Clase;
    let clase: any = {} // should be created by a class with the corresponding fields
    clase.type = tipo;
    clase.files = [];
    clase['edited'] = true
    clase['duration'] = 120
    //clase.id = Date.now().toString();
    clase.id = this.afs.collection<Session>(Session.collection).doc().ref.id;

    // clase['modulo'] = moduloIn.numero;
    // let numero = this.obtenerNumeroMasGrandeModulo(moduloIn);
    // clase['numero'] = numero;
    // clase.date = numero;

    if(clase.tipo == 'lectura'){
      clase.HTMLcontent ='<h4><font face="Arial">Sesi&#243;n de lectura.</font></h4><h6><font face="Arial">&#161;Asegurate de descargar los archivos adjuntos!</font></h6><p><font face="Arial">Encu&#233;ntralos en la secci&#243;n de material descargable</font></p>'
      // clase.duracion = 10
    }

    if(clase.tipo == 'actividad' || clase.tipo ==  'corazones'){
      let actividad = new Activity();
      //actividad.id = Date.now().toString();
      actividad.title = clase.title;
      //this.actividades.push(actividad);
      //console.log('actividades', this.actividades)
      actividad['isInvalid'] = true;
      clase['activity'] = actividad;
    }

    //console.log(numero);
    clase['expanded'] = false;

    clases.push(clase);
    this.liveCourseData.sessions = clases

    //console.log(clases);

  }

  hideOtherQuestion(questionIn){

    //console.log(questionIn);
    //console.log(this.selectedSession.activity.questions)

    this.selectedSession.activity.questions.map(question => {
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
        this.selectedSession.activity.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
        Swal.fire({
          title:'Borrado!',
          text:`La pregunta fue borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  } 

  async borrarSession(session){
    let sessions = this.liveCourseData.sessions

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar sesión ${session.title ? session.title : 'Sin título'}</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar sesión`,
      cancelButtonText:'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {

        sessions = sessions.filter(clase => clase.id != session.id );
        this.liveCourseData.sessions = sessions;
        session['deleted'] = true

        let classDelete = {
          claseInId: session.id,
          cursoId: this.liveCourseTemplateId,
          // moduloInId: moduloIn.id,
          // activityId: claseIn?.activity?.id
        }

        this.deletedClasses.push(classDelete)
        await this.liveCourseService.deleteSession(session.id);
        Swal.fire({
          title:'Borrado!',
          text:`La sesión ${session.title? session.title: 'Sin título'} fue borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })

  }

  editarTituloSession(index: number) {
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

  async onFileSelected(event, session: SessionData, local = false, adicional = false, tipo= null, isBaseSession: boolean) {
    // console.log("event", event)
    // console.log("session", session)

    session['uploading'] = true;
    session['edited'] = true;

    if(session.type == 'video'){
      session['videoUpload'] = 0;
    }

    let file;

    if (!local) {
      file = event.target.files[0];
    }
    else {
      file = event[0];
    }

    if (file) {
      let fileBaseName = file.name.split('.').slice(0, -1).join('.');
      let fileExtension = file.name.split('.').pop();

      let base64content

      if (session.type != 'video'){
        base64content = await this.fileToBase64(file);
      }
      else{
        base64content = URL.createObjectURL(file);
      }


      if (session.type == 'lectura' || adicional) {
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
        if (tipo == 'archivoActividad') {
          adicional = false;
          this.viewFileActivity= false;
          this.selectedSession.activity['recursosBase64'] = fileInfo?fileInfo:null;
        }

        if (isBaseSession) {
          if (!adicional && session.files.length > 0) session.files[0] = fileInfo;
          else session.files = session.files.concat(fileInfo);
        }
        else {
          if (!adicional && session.files.length > 0) session.files[0] = fileInfo;
          else session.files = session.files.concat(fileInfo);
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
              session['uploading'] = false;
              //console.log(`File URL: ${url}`);
              fileInfo.url = url;
              //session.archivos = session.archivos.concat(fileInfo);
              //console.log('session',session);
              if(tipo == 'archivoActividad') {
                this.formNuevaActividadGeneral.get('recursos').patchValue(newName);
              }
            });
          })
        ).subscribe();
      }
      else if(session.type == 'video') {
        let nombre =  fileBaseName+'.'+fileExtension;
        session['base64Video'] = base64content
        session['videoFileName'] = nombre;
        //console.log(this.selectedSession)
        this.uploadVideo(file,session, false);

      }
      else if(session.type == 'actividad') {
        if(tipo == 'videoActividad'){
          let nombre =  fileBaseName+'.'+fileExtension;
          session['base64Video'] = base64content
          session['videoFileName'] = nombre;
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

    this.selectedSession = clase

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

  saveCompetenciasSession(close = true){
    //console.log('this.competenciasSelectedClase',this.competenciasSelectedClase)
    //this.selectedSession.competencias = this.competenciasSelectedClase;
    let arrayCompetencias = [];
    this.competenciasSelectedClase.forEach(categoria => {
      let selected = categoria.competencias.filter(competencia => competencia.selected);
      arrayCompetencias = [...arrayCompetencias, ...selected];
    });
    //console.log(arrayCompetencias);

    this.selectedSession.competencias = arrayCompetencias;

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
      if(!this.selectedSession?.vimeoId2){
        videoURL =
        'https://player.vimeo.com/video/' +
        this.selectedSession.vimeoId1 +
        '?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479';
      }
      else{
        videoURL =
        'https://player.vimeo.com/video/' +
        this.selectedSession.vimeoId1 + '?h='+this.selectedSession.vimeoId2+'&amp'
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

    let idVimeo = this.selectedSession.vimeoId1; // El ID básico del video
    let videoParam; // Este será el parámetro que pasaremos a loadVideo

    if (this.selectedSession.vimeoId2) {
      // Si vimeoId2 existe, construye la URL completa
      videoParam = `https://player.vimeo.com/video/${this.selectedSession.vimeoId1}?h=${this.selectedSession.vimeoId2}`;
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

    // this.selectedSession = clase
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
    //   let activity : Activity = this.selectedSession.activity

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

  trackBySession(index: number, clase: any): string {
    return clase.id; // Suponiendo que cada clase tiene un id único.
  }

  getDurationModuleCourse(){
    let duracion = 0
    
    if (this.liveCourseData && this.liveCourseData.sessions && this.liveCourseData.sessions.length > 0) {
      this.liveCourseData.sessions.forEach(session => {
        duracion += session.duration ? session.duration : 0 
      });
    }
    this.liveCourseData.duration = duracion
    return duracion
  }

  borrarArchivo(session: SessionData, archivo){
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
        console.log(session,archivo)
        session.files = session.files.filter(x=>x.url != archivo.url)
        session['edited'] = true; // Marca la clase como editada
      }
    });

  }

  deleteFileClass(clase){

    clase.archivos = []
  }

  uploadVideo(videoFile, session: SessionData, local = false, origen = null, intentosActuales = 0, maxIntentos = 2) {

    if (!videoFile) {
      console.log('No video file selected');
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

    let videoDescription =  `Sesión: ${session.title.trim()} - Instructor:  ${this.formNewCourse.get('instructor').value}`.trim();

    let instructorText = `Instructor: ${this.formNewCourse.get('instructor').value}`.trim();
    let baseText = `Sesión: - ${instructorText.trim()}`;
    let maxLength = 127;
    
    // Calcula el espacio disponible para el título de la clase, restando 3 para los puntos suspensivos
    let availableLengthForTitle = maxLength - baseText.length - 3; // Reserva espacio para los puntos suspensivos
    
    // Asegúrate de que el título de la clase no haga que el nombre total del video exceda el límite máximo
    let trimmedClassTitle = session.title.trim();
    if ((`Sesión: ${session.title.trim()} - ${instructorText.trim()}`).length > maxLength) {
      // Recorta el título de la clase y agrega puntos suspensivos al final
      trimmedClassTitle = trimmedClassTitle.substring(0, availableLengthForTitle) + '...';
    }
    
    // let videoName = `Sesión: ${trimmedClassTitle} - ${instructorText}`;
    let videoName = `Sesión: ${trimmedClassTitle}`;

    // console.log(videoName,videoName.length)
    
    // Verifica de nuevo para asegurarte de que el nombre completo esté dentro del límite
    if (videoName.length > maxLength) {
      console.error("El nombre del video aún excede la longitud máxima permitida después del ajuste.");
    }

    session['videoUpload'] = 0;

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

      if(session.type == 'video'){
        session.duration = Math.ceil(duration/60);
      }

      // You can proceed with your Vimeo upload logic here
      // Your logic to use duration.
      
      // Important to revoke the URL after its use to release the reference
      URL.revokeObjectURL(url);
    }, { once: true }); // Use the once option to ensure that the event listener is invoked only once.
    
    // Load the video metadata manually
    video.load();
  

    // Crea el video en Vimeo
    //session['uploading'] = true;
    const fileSizeInBytes = file.size;

    this.uploadControl.createVideo(videoName, videoDescription, fileSizeInBytes).subscribe({
      next : response =>{
        // Una vez creado el video, sube el archivo
        this.uploadControl.uploadVideo(file, response.upload.upload_link).subscribe({
          // Maneja las notificaciones de progreso
          next: progress => {
            //console.log('uplading video',progress)
            session['videoUpload'] = progress-1
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
                  this.uploadVideo(videoFile, session, local, origen, intentosActuales + 1, maxIntentos);            
                }
              });
            } else {
              // Llegaste al máximo de intentos, maneja el error definitivamente
              session['uploading'] = false;
              session['videoUpload'] = 0;
              console.log('Maximo de intentos alcanzado. Mostrando mensaje de error.');
              this.dialog.dialogAlerta("Hubo un error");
              // Lógica para manejar el error después de los reintentos
            }
          },
          // Maneja las notificaciones de completado
          complete: () => {
            //console.log('Upload successful');
            //session['uploading'] = false;
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
                    // if(this.liveCourseData?.vimeoFolderId){
                    //   this.liveCourseData.vimeoFolderId = subProjectId;
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
                        this.liveCourseData.vimeoFolderId = subProjectId; // Guarda el ID del subproyecto para el curso
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
                        session['videoUpload'] = 100;
                        //console.log(`Video`,videoData);
                        let link = videoData.link;
                        link = link.split('/');
                        //console.log(link);
                        session.vimeoId1 = link[3];
                        session.vimeoId2 = link[4];
                        session['uploading'] = false;
                        if(origen == 'actividad'){
                          this.formNuevaActividadGeneral.get('video').patchValue(link[3]);
                        }
                        //URL.revokeObjectURL(this.videoSrc);
                        //this.videoFile=null;
                        //session['videoUpload'] =0;
                        //this.videoSrc=null;
                        //session['videoUpload'] = false;
                      },
                    error: (error) => {
                      this.dialog.dialogAlerta("Hubo un error")
                      //console.log(error?.error?.error);
                      //URL.revokeObjectURL(this.videoSrc);
                      //this.videoFile=null;
                      session['videoUpload'] =0;
                      //this.videoSrc=null;
                      session['videoUpload'] = false;

                    }
                  })
                },
                // error: (error)=>{
                //   this.dialog.dialogAlerta("Hubo un error");
                //   //console.log(error?.error?.error);
                //   //URL.revokeObjectURL(this.videoSrc);
                //   //this.videoFile=null;
                //   session['videoUpload'] =0;
                //   //this.videoSrc=null;
                //   session['uploading'] = false;
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
                        this.uploadVideo(videoFile, session, local, origen, intentosActuales + 1, maxIntentos);            
                      }
                    });
                  } else {
                    // Llegaste al máximo de intentos, maneja el error definitivamente
                    session['uploading'] = false;
                    session['videoUpload'] = 0;
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
      //   session['videoUpload'] =0;
      //   //this.videoSrc=null;
      //   session['uploading'] = false;
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
              this.uploadVideo(videoFile, session, local, origen, intentosActuales + 1, maxIntentos);            
            }
          });
        } else {
          // Llegaste al máximo de intentos, maneja el error definitivamente
          session['uploading'] = false;
          session['videoUpload'] = 0;
          console.log('Maximo de intentos alcanzado. Mostrando mensaje de error.');
          this.dialog.dialogAlerta("Hubo un error");
          // Lógica para manejar el error después de los reintentos
        }
      },
    })
  }

  async updateFolderVimeoEmpresa(idFolder, folderUri) {
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

  advanceTabActividad() {

    this.updateTriggeQuestions=0;

    this.showErrorActividad = false;
    let valid = true

    this.validActividad ==null 

    //console.log('tab actividad',this.activeStepActividad);

    if(this.activeStepActividad == 1){
      //console.log(this.formNuevaActividadBasica)
      if(this.formNuevaActividadBasica.valid){
        this.selectedSession.titulo = this.formNuevaActividadBasica.value.titulo;
        this.selectedSession.activity.title =  this.formNuevaActividadBasica.value.titulo;
        this.selectedSession.activity.description =  this.formNuevaActividadBasica.value.descripcion;
        this.selectedSession.activity.duration = this.formNuevaActividadBasica.value.duracion;
        this.selectedSession.duracion = this.formNuevaActividadBasica.value.duracion;
      }
      else{
        this.showErrorActividad = true;
        valid = false
      }

    }
    if(this.activeStepActividad == 99){
      //console.log(this.formNuevaActividadGeneral)
      if(this.formNuevaActividadGeneral.valid){
        this.selectedSession.activity.instructions =  this.formNuevaActividadGeneral.value.instrucciones;
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
          this.selectedSession.activity.questions = questions
          this.modalActivity.close();
          Swal.fire({
            icon: 'success',
            title: '¡Éxito!',
            text: 'Actividad cambiada exitosamente'
          }); 

          console.log('this.selectedSession.activity',this.selectedSession.activity)
          
        }

        if (valid){
          if(this.validateActivity()){
            this.selectedSession.activity['isInvalid'] = false;
          }
          this.showErrorActividad = false;
          this.activeStepActividad = this.activeStepActividad+1
          //console.log(this.selectedSession)
        }
        else{
          this.selectedSession.activity['isInvalid'] = true;
        }
        
      }, 10);
    }
    else{
      if (valid){
        if(this.validateActivity()){
          this.selectedSession.activity['isInvalid'] = false;
        }
        this.showErrorActividad = false;
        this.activeStepActividad = this.activeStepActividad+1
        //console.log(this.selectedSession)
      }
      else{
        this.selectedSession.activity['isInvalid'] = true;
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

  saveCompetenciasActividad(){
    let preguntas = this.selectedSession.activity.questions;
    
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
      //console.log(this.selectedSession,this.competenciasSelectedClase)
      this.getSelectedCategoriasCompetenciasSession();
      if(this.competenciasSelectedClase.length>0){
        this.saveCompetenciasSession(false);
        //console.log('revisar',this.selectedSession.competencias,this.selectedSession.activity.questions);
        this.selectedSession.activity.questions.forEach(question => {
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

  saveNewSkills() {

    console.log('this.tmpSkillRefArray',this.tmpSkillRefArray)
    
    if(this.liveCourseData){
      this.liveCourseData.skillsRef = this.tmpSkillRefArray
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
          if(this.liveCourseData){
            this.liveCourseData.skillsRef = this.tmpSkillRefArray
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
        if(this.liveCourseData){
          this.liveCourseData.skillsRef = this.tmpSkillRefArray
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

  verVideoVimeo(session: SessionData): NgbModalRef {

    const modalRef = this.modalService.open(VimeoComponent, {
      animation: true,
      centered: true,
      size: 'lg',
    })
    modalRef.componentInstance.clase = session;
    return modalRef

  }

  confirmarTitulo(modulo: any) {
    modulo['editarTitulo'] = false;
    modulo.title = modulo['tituloTMP'];
  }

  confirmSessionTitleAndDuration(session) {
    session['editarTitulo'] = false;
    session.title = session['tituloTMP'];
    session['edited'] = true;

    console.log("session after title edit", session)
    console.log("this.liveCourseData.sessions", this.liveCourseData.sessions)
  }

  onUserEmailsChanged(emails: string[]): void {
    // console.log("emails in parent", emails)
    this.studentEmails = emails;
  }

  ngOnDestroy() {
    if (this.initDataSubscription) this.initDataSubscription.unsubscribe()
  }

}
