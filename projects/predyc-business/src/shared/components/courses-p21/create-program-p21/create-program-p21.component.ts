import { Component, ElementRef, QueryList, TemplateRef, ViewChild, ViewChildren } from "@angular/core";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormArray, FormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { Curso, ObjetivoCurso } from "projects/shared/models/course.model";
import { Modulo } from "projects/shared/models/module.model";
import { Clase } from "projects/shared/models/course-class.model";

import { AngularFireStorage } from "@angular/fire/compat/storage";
import Swal from "sweetalert2";
import { Observable, Subject, finalize, firstValueFrom, switchMap, tap, filter, take, first, startWith, map, Subscription } from "rxjs";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { AngularFirestore, DocumentReference } from "@angular/fire/compat/firestore";

import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { Activity, Question, QuestionOption, QuestionType } from "projects/shared/models/activity-classes.model";
//import * as competencias from '../../../../assets/data/competencias.json';
import { DialogService } from "projects/predyc-business/src/shared/services/dialog.service";
import { VimeoUploadService } from "projects/predyc-business/src/shared/services/vimeo-upload.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { CategoryService } from "projects/predyc-business/src/shared/services/category.service";
import { SkillService } from "projects/predyc-business/src/shared/services/skill.service";
import { Category } from "projects/shared/models/category.model";
import { Skill } from "projects/shared/models/skill.model";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { ModuleService } from "projects/predyc-business/src/shared/services/module.service";
import { CourseClassService } from "projects/predyc-business/src/shared/services/course-class.service";
import { ActivityClassesService } from "projects/predyc-business/src/shared/services/activity-classes.service";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { AuthService } from "projects/predyc-business/src/shared/services/auth.service";
import { InstructorsService } from "projects/predyc-business/src/shared/services/instructors.service";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";

import { VimeoComponent } from "projects/predyc-business/src/shared/components/vimeo/vimeo.component";
import VimeoPlayer from "@vimeo/player";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { License, Product } from "shared";
import { LicenseService } from "projects/predyc-business/src/shared/services/license.service";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { PDFService } from '../../../../shared/services/pdf.service';

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
  selector: "app-create-program-p21",
  templateUrl: "./create-program-p21.component.html",
  styleUrls: ["./create-program-p21.component.css"],
})
export class CreateProgramP21Component {
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
    public categoryService: CategoryService,
    public skillService: SkillService,
    public courseService: CourseService,
    public moduleService: ModuleService,
    public courseClassService: CourseClassService,
    public activityClassesService: ActivityClassesService,
    private route: ActivatedRoute,
    private authService: AuthService,
    private instructorsService: InstructorsService,
    private alertService: AlertsService,
		private fb: FormBuilder,   
    public licenseService: LicenseService,
    private productService: ProductService,
    private PDFService: PDFService

  ) {}

  activeStep = 1;
  steps = [
    "Información del curso",
    //'Competencias',
    "Clases",
    "Examen",
    //'Vista previa examen',
    //'Resumen'
  ];

  mode = this.route.snapshot.paramMap.get("mode");
  textModulo = "Crear nuevo curso";

  idCurso = this.route.snapshot.paramMap.get("idPrograma");
  curso: Curso;
  modulos: Modulo[] = [];
  activitiesCourse;
  examen: Activity;
  categoriasArray;
  competenciasArray;
  competenciasEmpresa = [];
  competenciasSelected;
  empresa;
  instructores = [];
  //filteredinstructores: Observable<any[]>;

  filteredPillars: Observable<any[]>;

  //instructoresForm = new FormControl("");
  pillarsForm = new FormControl("");

  currentModal;
  @ViewChild("endCourseModal") endCourseModal: ElementRef;

  formNewCourse: FormGroup;
  formNewInstructor: FormGroup;

  metaDescriptionMaxLength = 141
  keyWordsMaxLength = 100

  getOptionText(option) {
    let name = option.nombre;
    return name;
  }

  getOptionTextPillar(option) {
    let name = option?.name;
    return name;
  }

  private _filter(value: any): string[] {
    if (!value?.nombre) {
      const filterValue = value.toLowerCase();
      return this.instructores.filter((option) => option.nombre.toLowerCase().includes(filterValue));
    }
    const filterValue = value.nombre.toLowerCase();
    return this.instructores.filter((option) => option.nombre.toLowerCase().includes(filterValue));
  }

  private _filterPillars(value: any): string[] {
    if (!value?.name) {
      const filterValue = value.toLowerCase();
      return this.categoriasArray?.filter((option) => option.name.toLowerCase().includes(filterValue));
    }
    const filterValue = value.name.toLowerCase();
    return this.categoriasArray?.filter((option) => option.name.toLowerCase().includes(filterValue));
  }
  user;

  async ngOnInit(): Promise<void> {
    //console.log(this.competenciasArray)

    // console.log("mode on init", this.mode);

    // this.filteredinstructores = this.instructoresForm.valueChanges.pipe(
    //   startWith(""),
    //   map((value) => this._filter(value || ""))
    // );

    this.filteredPillars = this.pillarsForm.valueChanges.pipe(
      startWith(""),
      map((value) => this._filterPillars(value || ""))
    );

    this.enterpriseService.enterprise$
      .pipe(
        filter((enterprise) => enterprise != null),
        take(1)
      )
      .subscribe((enterprise) => {
        // console.log("enterprise", enterprise);
        if (enterprise) {
          this.empresa = enterprise

          this.authService.user$
            .pipe(
              filter((user) => user != null),
              take(1)
            )
            .subscribe((user) => {
              // console.log("user", user);
              this.user = user;
              this.inicializarformNewCourse();

              this.instructorsService
              .getInstructorsObservable()
              .pipe()
              .subscribe((instructores) => {
                console.log("instructores", instructores);
                if(this.user.isSystemUser){
                  this.instructores = instructores; // estoy aqui
                }
                else{
                  this.instructores = instructores.filter(x=>x.enterpriseRef); // estoy aqui
                }
              });
              if(!user.isSystemUser){ // alterado por Arturo para buscar licencia activa de la empresa y no el usuario admin
                this.licensesSubscription = this.licenses$.subscribe(licenses => {
                  let licenseActive = licenses.find(x=>x.status == 'active')
                  console.log('licenseActive',licenseActive)
                  if(licenseActive){
                    this.productServiceSubscription = this.productService.getProductById$(licenseActive.productRef.id).subscribe(product => {
                      if (!product) return
                      this.product = product
                      this.inicializarformNewCourse();
                    })
                    
                  }
                })
              }
              else{
                this.inicializarformNewCourse();
              }
              // if (!user?.isSystemUser) {
              //   this.router.navigate(["management/courses"])
              // }
            });
        }
      });
  }
  licensesSubscription: Subscription;
  productServiceSubscription: Subscription
  licenses$: Observable<License[]> = this.licenseService.getCurrentEnterpriseLicenses$()
  product: Product


  anidarCompetenciasInicial(categorias: any[], competencias: any[]): any[] {
    console.log("anidarCompetenciasInicial", categorias, competencias);
    return categorias.map((categoria) => {
      let skills = competencias
        .filter((comp) => comp.category.id === categoria.id)
        .map((skill) => {
          // Por cada skill, retornamos un nuevo objeto sin la propiedad category,
          // pero añadimos la propiedad categoryId con el valor de category.id
          const { category, ...rest } = skill;
          return {
            ...rest,
            categoriaId: category.id,
          };
        });

      return {
        ...categoria,
        competencias: skills,
      };
    });
  }

  obtenerCompetenciasAlAzar(n: number): Competencia[] {
    // Aplanamos la estructura para obtener todas las competencias en un solo arreglo
    const todasLasCompetencias = this.categoriasArray.flatMap((categoria) => categoria.competencias);

    // Barajamos (shuffle) el arreglo
    for (let i = todasLasCompetencias.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [todasLasCompetencias[i], todasLasCompetencias[j]] = [todasLasCompetencias[j], todasLasCompetencias[i]]; // Intercambio
    }

    // Tomamos las primeras 'n' competencias del arreglo barajado
    return todasLasCompetencias.slice(0, n);
  }

  getSelectedCategoriasCompetencias() {
    let respuesta = [];
    //console.log(this.categoriasArray)

    this.categoriasArray.forEach((categoria) => {
      let selected = categoria.competencias.filter((competencia) => competencia.selected);
      if (selected.length > 0) {
        let obj = {
          categoria: { name: categoria.name, id: categoria.id },
          competencias: selected,
          expanded: true,
        };
        respuesta.push(obj);
      }
    });

    //this.updateCompetenciasClases(competencia)
    this.competenciasSelected = respuesta;
    //console.log('this.competenciasSelected',this.competenciasSelected)
  }

  allskills = [];
  skillsCurso = [];

  getCursoSkills() {
    let skillArray = [];

    this.formNewCourse.get("skills")?.value.forEach((skill) => {
      let datail = this.allskills.find((x) => x.id == skill.id);
      skillArray.push(datail);
    });

    return skillArray;
  }

  async removeSkill(skill) {
    if (this.curso?.skillsRef) {
      this.curso.skillsRef = this.curso.skillsRef.filter((x) => x.id != skill.id);
      console.log("this.curso.skillsRef", this.curso.skillsRef);
      this.skillsCurso = this.getCursoSkills();
      //this.curso.skillsRef = this.tmpSkillRefArray
      this.formNewCourse.get("skills").patchValue(this.curso.skillsRef);
    } else {
      console.log("this.skillsCurso", this.skillsCurso);
      this.skillsCurso = this.skillsCurso.filter((x) => x.id != skill.id);
      let skillsRef = [];
      for (let skill of this.skillsCurso) {
        let skillRef = await this.afs.collection<any>("skill").doc(skill.id).ref;
        skillsRef.push(skillRef);
      }
      this.formNewCourse.get("skills").patchValue(skillsRef);
    }
  }

  skillsInit = false;

  initSkills() {
    this.categoryService
      .getCategoriesObservable()
      .pipe(
          filter((category) => category && category.length > 0), // Verifica que el resultado no sea vacío
          take(1) // Toma el primer valor una vez que existe
        ).subscribe((category) => {
        // console.log("category from service", category);
        this.skillService
          .getSkillsObservable()
          .pipe(
              filter((skill) => skill && skill.length > 0), // Verifica que el resultado no sea vacío
              take(1) // Toma el primer valor una vez que existe
            ).subscribe((skill) => {
            // console.log("skill from service", skill);
            this.allskills = skill;
            skill.map((skillIn) => {
              delete skillIn["selected"];
            });

            this.categoriasArray = this.anidarCompetenciasInicial(category, skill);
            // console.log("categoriasArray", this.categoriasArray, this.curso);
            if (!this.skillsInit) {
              if (this.mode == "edit") {
                //console.log('curso edit', this.curso)
                this.textModulo = "Editar curso";
                let skillsProfile = this.curso.skillsRef;
                this.skillsCurso = this.getCursoSkills();
                skillsProfile.forEach((skillIn) => {
                  let skillSelect = skill.find((skillSelectIn) => skillSelectIn.id == skillIn.id);
                  if (skillSelect) {
                    skillSelect["selected"] = true;
                  }
                });
              }

              if (this.mode == "edit") {
                if (this.curso) {
                  let pilar;
                  let skillId = this.curso.skillsRef[0]?.id;
                  if (skillId) {
                    console.log('categoriasArray',this.categoriasArray)
                    pilar = this.categoriasArray.find((x) => x.competencias.find((y) => y.id == skillId));
                  } else if (this.pillarsForm.value["id"]) {
                    pilar = this.categoriasArray.find((x) => x.id == this.pillarsForm.value["id"]);
                  }
                  console.log("pilarPatch", pilar,this.curso.skillsRef);
                  this.pillarsForm.patchValue(pilar);
                }
                // this.getExamCourse(this.curso.id);
              } else {
                let pilar;
                if (this.pillarsForm.value["id"]) {
                  pilar = this.categoriasArray.find((x) => x.id == this.pillarsForm.value["id"]);
                  this.pillarsForm.patchValue(pilar);
                }
              }
              this.skillsInit = true;
            }
          });
      });
  }

  courseHasSkill(skill) {
    let skillFind = this.tmpSkillRefArray.find((x) => x.id == skill.id);
    if (skillFind) {
      return true;
    }
    return false;
  }

  troggleSkill(skill) {
    if (this.courseHasSkill(skill)) {
      // quitar
      this.tmpSkillRefArray = this.tmpSkillRefArray.filter((x) => x.id != skill.id);
      this.tmpSkillArray = this.tmpSkillArray.filter((x) => x.id != skill.id);
    } else {
      //agregar (valar si tiene menos de 3 skills)
      if (this.tmpSkillRefArray.length < 3) {
        let skillRef = this.afs.collection<any>("skill").doc(skill.id).ref;
        this.tmpSkillRefArray.push(skillRef);
        this.tmpSkillArray.push(skill);
      } else {
        Swal.fire({
          text: `Ya posee la cantidad máxima de competencias permitidas (3).`,
          icon: "info",
          confirmButtonColor: "var(--blue-5)",
        });
      }
    }
  }

  async changePillar(newPillar) {//estoy aqui
    if (this.curso?.skillsRef[0]?.id) {
      let pilar = this.categoriasArray.find((x) => x.competencias.find((y) => y.id == this.curso?.skillsRef[0]?.id));
      //this.pillarsForm.patchValue(pilar)
      if (pilar.id != newPillar.id) {
        this.curso.skillsRef = [];
        this.skillsCurso = [];
        this.formNewCourse.get("skills").setValue([]);
        await this.saveNewSkill(newPillar.name)
      }
    }
    else{
      this.skillsCurso = [];
      this.formNewCourse.get("skills").setValue([]);
      await this.saveNewSkill(newPillar.name)
    }
  }

  createPillar() {
    this.savingPillar = false;
    this.pillarsForm.patchValue("");

    this.curso?.skillsRef ? (this.curso.skillsRef = []) : null;
    this.skillsCurso = [];

    this.showErrorPillar = false;
    this.showErrorPillarSkill = false;

    this.formNewPillar = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      // skills: new FormControl([]),
      // skillTmp: new FormControl(null, Validators.required),
    });

    this.modalPillar = this.modalService.open(this.modalCrearPilarContent, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "sm",
    });
  }

  objetivosValidator(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.length >= min) return null;
      return { minLengthArray: true };
    };
  }

    // Validador personalizado para verificar que el valor sea mayor que 0
  
  greaterThanZeroValidator(control: AbstractControl): ValidationErrors | null {
    return control.value > 0 ? null : { greaterThanZero: true };
  }

  async inicializarformNewCourse() {
    if (this.mode == "create") {
      // console.log("this.empresa", this.empresa);

      if (!this.user.isSystemUser && !this.product.accesses.enableCreateParticularCourses) {
        this.router.navigate(["management/courses"]);
      }

      this.empresa;
      setTimeout(() => {
        this.formNewCourse = new FormGroup({
          id: new FormControl(null),
          titulo: new FormControl(null, Validators.required),
          // resumen: new FormControl(null, Validators.required),
          descripcion: new FormControl(null, Validators.required),
          metaDescripcion: new FormControl(null),
          KeyWords: new FormControl(null),
          // objetivos: this.fb.array([], this.objetivosValidator(1)),
          //objetivos: this.fb.array([]),
          //nivel: new FormControl(null, Validators.required),
          //categoria: new FormControl(null, Validators.required),
          //idioma: new FormControl(null, Validators.required),
          // contenido: new FormControl(null, Validators.required),
          //instructorRef: new FormControl(null),
          //instructor: new FormControl(null, Validators.required),
          //resumen_instructor: new FormControl(null, Validators.required),
          imagen: new FormControl(null, Validators.required),
          banner: new FormControl(null, Validators.required),
          //imagen_instructor: new FormControl(null, Validators.required),
          skills: new FormControl(null, Validators.required),
          vimeoFolderId: new FormControl(null),
          proximamente: new FormControl(false),
          public: new FormControl(false),
          isFree: new FormControl(false),
          customUrl: new FormControl(""),
          precio: new FormControl(""),
          precioOferta: new FormControl(""),
          stripeUrl: new FormControl(""),
          // duracion: new FormControl(0, [Validators.required,this.greaterThanZeroValidator]),
          duracion:new FormControl(""),
          fechaInicio:new FormControl(""),
          diaSesiones:new FormControl(""),
          fehcaSesiones:new FormControl(""),
          aQuienVaDirigido:new FormControl(""),
          queIncluye:new FormControl(""),
          enCalendario: new FormControl(false),
          descuentos: new FormControl(""),
          modalidad: new FormControl("",Validators.required),
          modalidadCapacitacion: new FormControl(""),
          objetivo: new FormControl(""),
          final: new FormControl(""),
          pdf: new FormControl(""),

        });
        this.initSkills();
      }, 2000);
    } else {
      this.courseService.getDiplomadoObservableP21().pipe(
          filter((courses) => courses.length > 0),
          take(1)
        )
        .subscribe(async (courses) => {
          console.log("cursos", courses);
          let curso = courses.find((course) => course.id == this.idCurso);
          // console.log('curso edit', curso,this.user.isSystemUser);
          let enterpriseREf = this.enterpriseService.getEnterpriseRef();
          if (!this.user.isSystemUser && !(curso.enterpriseRef.id == enterpriseREf.id)) {
            this.router.navigate(["management/courses"]);
          }
          this.curso = curso;
          console.log('curso',curso,this.idCurso)
          this.curso.modules = this.curso['modulos']
          curso["modules"].sort((a, b) => a.numero - b.numero);
          this.modulos = curso["modules"];

          console.log("datos cursos", curso,this.instructores);

          let instructor = null

          // if(this.instructores.length>0){
          //   instructor = this.instructores.find((x) => x.id == curso.instructorRef.id);

          // }
          // else{
          //   instructor = await this.instructorsService.fetchInstructorDataByIdPromise(curso.instructorRef.id)
          //   console.log('instructor',instructor)
          // }


          //this.instructoresForm.patchValue(instructor);

          // resumen_instructor
          // imagen_instructor

          let customUrl = curso.customUrl

          if(customUrl == curso.id){
            customUrl = null
          }

          this.formNewCourse = new FormGroup({
            id: new FormControl(curso.id, Validators.required),
            vimeoFolderId: new FormControl(curso.vimeoFolderId),
            titulo: new FormControl(curso.titulo, Validators.required),
            // resumen: new FormControl(curso.resumen, Validators.required),
            descripcion: new FormControl(curso.descripcion, Validators.required),
            metaDescripcion: new FormControl(curso.metaDescripcion),
            KeyWords:new FormControl(curso.KeyWords),
            objetivos: this.fb.array([]),
            //nivel: new FormControl(curso.nivel, Validators.required),
            //idioma: new FormControl(curso.idioma, Validators.required),
            // contenido: new FormControl(curso.contenido, Validators.required),
            //instructorRef: new FormControl(curso.instructorRef),
            //instructor: new FormControl(instructor.nombre, Validators.required),
            //resumen_instructor: new FormControl(instructor.resumen, Validators.required),
            imagen: new FormControl(curso.imagen, Validators.required),
            banner: new FormControl(curso['banner'], Validators.required),
            //imagen_instructor: new FormControl(instructor.foto, Validators.required),
            skills: new FormControl(curso.skillsRef, Validators.required),
            proximamente: new FormControl(curso.proximamente),
            public: new FormControl(curso.public),
            isFree: new FormControl(curso.isFree),
            customUrl: new FormControl(customUrl),
            precio: new FormControl(curso.precio),
            precioOferta: new FormControl(curso.precioOferta),
            stripeUrl: new FormControl(curso.stripeUrl),
            // duracion:new FormControl(curso.duracion, [Validators.required,this.greaterThanZeroValidator]),
            duracion:new FormControl(curso.duracion),
            fechaInicio:new FormControl(curso['fechaInicio']),
            fehcaSesiones:new FormControl(curso['fehcaSesiones']),
            diaSesiones:new FormControl(curso['diaSesiones']),
            aQuienVaDirigido:new FormControl(curso['aQuienVaDirigido']),
            queIncluye:new FormControl(curso['queIncluye']),
            enCalendario: new FormControl(curso['enCalendario']),
            descuentos: new FormControl(curso['descuentos']),
            modalidad: new FormControl(curso['modalidad'],Validators.required),
            modalidadCapacitacion: new FormControl(curso['modalidadCapacitacion']),
            objetivo: new FormControl(curso['objetivo']),
            final: new FormControl(curso['final']),
            pdf: new FormControl(curso['pdf']),


          });
          curso?.objetivos?.forEach(objetivo => this.addObjetivo(objetivo));

          //this.formNewCourse.get('resumen_instructor').disable();
          this.initSkills(); // Asegúrate de que initSkills también maneje las suscripciones correctamente
          this.activityClassesService
            .getActivityAndQuestionsForCourse(this.idCurso, false)
            .pipe(
              filter((activities) => activities != null),
              take(1)
            )
            .subscribe((activities) => {
              //console.log('activities clases', activities);
              this.activitiesCourse = activities;
              this.modulos.forEach((modulo) => {
                // let instructoresForm = new FormControl("");
                // let filteredinstructores: Observable<any[]>;
                // filteredinstructores = instructoresForm.valueChanges.pipe(
                //   startWith(""),
                //   map((value) => this._filter(value || ""))
                // );
                // instructor =  this.instructores.find(x=>x.id == modulo['instructorData'].id)
                // instructoresForm.patchValue(instructor);      
                // modulo['instructoresForm'] = instructoresForm
                // modulo['filteredinstructores'] = filteredinstructores

                modulo['clases']?.forEach(clase => {

                  if(clase['instructorData']){
                    let instructoresFormClase = new FormControl("");
                    let filteredinstructoresClase: Observable<any[]>;
                    filteredinstructoresClase = instructoresFormClase.valueChanges.pipe(
                      startWith(""),
                      map((value) => this._filter(value || ""))
                    );
                    instructor =  this.instructores.find(x=>x.id == clase['instructorData'].id)
                    instructoresFormClase.patchValue(instructor);      
                    clase['instructoresForm'] = instructoresFormClase
                    clase['filteredinstructores'] = filteredinstructoresClase
                  }                    
                });
              });
            });
        });
    }
  }

  loadObjetivos(objetivos: ObjetivoCurso[]) {
    const formArray = this.objetivos;
    objetivos.forEach(objetivo => {
      formArray.push(new FormGroup({
        title: new FormControl(objetivo.titulo),
        description: new FormControl(objetivo.descripcion)
      }));
    });
    this.formNewCourse.patchValue({ objetivos: formArray });
  }

  get objetivos(): FormArray {
    return this.formNewCourse.get("objetivos") as FormArray;
  }

  newObjetivo(objetivo = { titulo: '', descripcion: '' }) {
    return this.fb.group({
        titulo: [objetivo.titulo],
        descripcion: [objetivo.descripcion, Validators.required]
    });
  }

  addObjetivo(objetivo = { titulo: '', descripcion: '' }) {
    this.objetivos.push(this.newObjetivo(objetivo));
  }

	removeObjetivo(index: number) {
    this.objetivos.removeAt(index);
  }

  async setInstructor(instructor,clase) {

    console.log(instructor,clase)
    clase['instructorData'] = instructor
    clase["edited"] = true
    // let instructorRef = await this.afs.collection<any>("instructors").doc(instructor.id).ref;
    // this.formNewCourse.get("instructorRef").patchValue(instructorRef);
    // this.formNewCourse.get("instructor").patchValue(instructor.nombre);
    // this.formNewCourse.get("resumen_instructor").patchValue(instructor.resumen);
    // this.formNewCourse.get("imagen_instructor").patchValue(instructor.foto);
  }

  tmpSkillRefArray = [];
  tmpSkillArray = [];

  changeBorrador(event: Event) {
    // Accede a la propiedad 'checked' del checkbox
    const isChecked = (event.target as HTMLInputElement).checked;

    // Actualiza el valor del campo 'proximamente' en el formulario con el nuevo estado
    this.formNewCourse.get("proximamente").setValue(isChecked);

    if (this.curso) {
      this.curso.proximamente = isChecked;
    }

    // Opcionalmente, imprime si el checkbox quedó marcado o no
    console.log("El checkbox Borrador está:", isChecked ? "marcado (true)" : "desmarcado (false)");
  }

  changePublic(event: Event) {
    // Accede a la propiedad 'checked' del checkbox
    const isChecked = (event.target as HTMLInputElement).checked;

    // Actualiza el valor del campo 'proximamente' en el formulario con el nuevo estado
    this.formNewCourse.get("public").setValue(isChecked);

    if (this.curso) {
      this.curso.public = isChecked;
    }

    // Opcionalmente, imprime si el checkbox quedó marcado o no
    console.log("El checkbox Borrador está:", isChecked ? "marcado (true)" : "desmarcado (false)");
  }

  changeEnCalendario(event: Event) {
    // Accede a la propiedad 'checked' del checkbox
    const isChecked = (event.target as HTMLInputElement).checked;

    // Actualiza el valor del campo 'proximamente' en el formulario con el nuevo estado
    this.formNewCourse.get("enCalendario").setValue(isChecked);

    if (this.curso) {
      this.curso['enCalendario'] = isChecked;
    }

    // Opcionalmente, imprime si el checkbox quedó marcado o no
  }

  changeIsFree(event: Event) {
    // Accede a la propiedad 'checked' del checkbox
    const isChecked = (event.target as HTMLInputElement).checked;

    this.formNewCourse.get("isFree").setValue(isChecked);

    if (this.curso) {
      this.curso.isFree = isChecked;
    }

    console.log("El checkbox isFree está:", isChecked ? "marcado (true)" : "desmarcado (false)");
  }

  openModal(content, size = "lg") {
    this.tmpSkillRefArray = [];
    this.tmpSkillArray = [];

    this.curso?.skillsRef?.forEach((element) => {
      this.tmpSkillRefArray.push(element);
    });

    this.skillsCurso?.forEach((element) => {
      this.tmpSkillArray.push(element);
    });

    this.currentModal = this.modalService.open(content, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: size,
    });
  }

  modalInstructor;
  @ViewChild("modalCrearInstructor") modalCrearInstructorContent: TemplateRef<any>;
  @ViewChild("modalCrearPilar") modalCrearPilarContent: TemplateRef<any>;

  showErrorInstructor = false;

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
    this.showErrorInstructor = false;

    this.formNewInstructor = new FormGroup({
      nombre: new FormControl(null, Validators.required),
      email: new FormControl(null, [Validators.required, Validators.email]),
      resumen: new FormControl(null, Validators.required),
      foto: new FormControl(null, Validators.required),
    });

    this.modalInstructor = this.modalService.open(this.modalCrearInstructorContent, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "lg",
    });
  }

  createInstructor() {
    this.formNewCourse.get("instructorRef").patchValue(null);
    this.formNewCourse.get("instructor").patchValue(null);
    this.formNewCourse.get("resumen_instructor").patchValue(null);
    this.formNewCourse.get("imagen_instructor").patchValue(null);

    this.openModalinstructor();
  }

  showErrorPillar;
  showErrorPillarSkill;
  formNewPillar: FormGroup;
  modalPillar;

  addSkill() {
    this.showErrorPillarSkill = false;

    let skill = this.formNewPillar.get("skillTmp")?.value;
    if (!skill) {
      this.showErrorPillarSkill = true;
    } else {
      let skillsTmpAdd = this.formNewPillar.get("skills")?.value;
      if (!skillsTmpAdd.find((x) => x == skill)) {
        skillsTmpAdd.push(skill);
        this.formNewPillar.get("skillTmp").patchValue("");
      } else {
        this.formNewPillar.get("skillTmp").patchValue("");
        this.showErrorPillarSkill = true;
      }
    }
  }

  savingPillar = false;

  async saveNewPillar() {
    this.savingPillar = true;
    this.showErrorPillar = false;
    this.showErrorPillarSkill = false;

    let pillar = this.formNewPillar.get("nombre")?.value;
    //let skills = this.formNewPillar.get('skills')?.value;

    let pillarCheck = this.categoriasArray.find((x) => x.name == pillar);

    if (pillarCheck) {
      this.showErrorPillar = true;
      this.savingPillar = false;

      Swal.fire({
        title: "Info!",
        text: `Ya existe un pilar con este nombre`,
        icon: "info",
        confirmButtonColor: "var(--blue-5)",
      });
      return;
    }

    let enterpriseRef = this.enterpriseService.getEnterpriseRef(); //here
    if (this.user.isSystemUser) {
      enterpriseRef = null;
    }

    if (pillar) {
      let category = new Category(null, pillar, enterpriseRef);
      await this.categoryService.addCategory(category);
      //let categoryRef = this.afs.collection<any>('category').doc(category.id).ref;
      // for(let skill of skills){
      //   let skillAdd = new Skill(null,skill,categoryRef,enterpriseRef)
      //   await this.skillService.addSkill(skillAdd)
      // }
      this.modalPillar.close();
      this.alertService.succesAlert("El pilar se ha guardado exitosamente");
      this.savingPillar = false;
    } else {
      this.savingPillar = false;
      this.showErrorPillar = true;
      this.showErrorPillarSkill = true;
    }
  }

  removeSkillTmp(skill) {
    let skillsTmpAdd = this.formNewPillar.get("skills")?.value;
    skillsTmpAdd = skillsTmpAdd.filter((x) => x != skill);
    this.formNewPillar.get("skills").patchValue(skillsTmpAdd);

    // this.curso.skillsRef = this.curso.skillsRef.filter(x=> x.id != skill.id)
    // this.skillsCurso = this.getCursoSkills();
    // this.curso.skillsRef = this.tmpSkillRefArray
    // this.formNewCourse.get("skills").patchValue(this.curso.skillsRef);
  }

  async saveDraftPre() {
    let checkStatus = await this.chackAllInfo();
    if (!checkStatus && this.formNewCourse.valid) {
      Swal.fire({
        title: "Revisar datos",
        text: "Existen problemas en el curso, ¿desea continuar?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Guardar",
        confirmButtonColor: "var(--blue-5)",
      }).then((result) => {
        /* Read more about isConfirmed, isDenied below */
        if (result.isConfirmed && this.formNewCourse.valid) {
          this.formNewCourse.get("proximamente").patchValue(true);
          if (this.curso) {
            this.curso.proximamente = true;
          }
          this.saveDraft();
        }
      });
    } else if (this.formNewCourse.valid) {
      this.saveDraft();
    } else if (!this.formNewCourse.valid) {
      Swal.fire({
        title: "Datos faltantes!",
        text: `Por favor verifique los datos del curso para poder guardarlo`,
        icon: "warning",
        confirmButtonColor: "var(--blue-5)",
      });
    }
  }



  savingCourse = false;

  async saveDraft() {
    //console.log('----- save borrador ------')

    this.savingCourse = true;

    Swal.fire({
      title: "Generando curso...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (this.formNewCourse.valid) {
      console.log("this.curso", this.curso);
      if (this.curso) {
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        this.curso.enterpriseRef = enterpriseRef;
        if (this.user.isSystemUser) {
          this.curso.enterpriseRef = null;
        }
        if (!this.curso.skillsRef && this.curso["skills"]) {
          this.curso.skillsRef = this.curso["skills"];
          delete this.curso["skills"];
        }

        // let duracion = this.getDurationModuleCourse();
        // this.curso.duracion = duracion;

        //const instructorData = await this.instructorsService.fetchInstructorDataByIdPromise(this.curso.instructorRef.id)

        //this.curso['instructorData'] = instructorData
        //this.curso['pillarData'] = this.pillarsForm.value
        const pillarData= this.pillarsForm.value

        delete pillarData['competencias']
        delete pillarData['enterprise']

        this.curso['pillarData'] = pillarData


        await this.courseService.saveDiplomadoP21(this.curso);
      }

      if (this.modulos.length > 0) {

        let validModules = this.modulos;
        for (let modulo of validModules) {
          let arrayClasesRef = [];
          const clases = modulo["clases"];
          const instructorRef = this.formNewCourse.get("instructorRef")?.value

          for (let i = 0; i < clases.length; i++) {
            try {
              let clase = clases[i];
              if (clase["edited"]) {
                console.log("clase borrador add/edit", clase);
                let claseLocal = new Clase();
                claseLocal['instructorData'] = clase.instructorData? clase.instructorData: null
                claseLocal['image'] = clase.image? clase.image: null
                claseLocal['image'] = clase.image? clase.image: null
                claseLocal['fechaInicio'] = clase.fechaInicio? clase.fechaInicio: null

                claseLocal.HTMLcontent = clase.HTMLcontent;
                claseLocal.archivos = clase.archivos.map((archivo) => ({
                  id: archivo.id,
                  nombre: archivo.nombre,
                  size: archivo.size,
                  type: archivo.type,
                  url: archivo.url,
                }));
                claseLocal.descripcion = clase.descripcion;
                claseLocal.duracion = clase.duracion;
                claseLocal.id = clase.id;
                claseLocal.vimeoId1 = clase.vimeoId1;
                claseLocal.vimeoId2 = clase.vimeoId2;
                claseLocal.skillsRef = clase.skillsRef;
                claseLocal.tipo = clase.tipo;
                claseLocal.titulo = clase.titulo;
                claseLocal.instructorRef = instructorRef ? instructorRef : null
                claseLocal.vigente = clase.vigente;
                claseLocal.imagen = clase?.imagen ? clase.imagen:null
                if (this.user.isSystemUser) {
                  claseLocal.enterpriseRef = null;
                } else {
                  claseLocal.enterpriseRef = this.enterpriseService.getEnterpriseRef();
                }

                const arrayRefSkills = clase.competencias?.map((skillClase) => this.curso.skillsRef.find((skill) => skill.id == skillClase.id)).filter(Boolean) || [];
                claseLocal.skillsRef = arrayRefSkills;
                console.log("activityClass", clase);
              } else {
                let findDeleted = this.deletedClasses.find((x) => x.claseInId == clase.id);
                console.log("claseRevisar", clase, findDeleted);
                if (!findDeleted && !clase["deleted"]) {
                  // let refClass = await this.afs.collection<Clase>(Clase.collection).doc(clase.id).ref;
                  // arrayClasesRef.push(refClass);
                }
              }
            } catch (error) {
              console.error("Error processing clase", error);
            }
          }
          console.log("claseModuloSave", modulo, clases);
          this.deletedClasses = [];
          //moduleService
          let module = new Modulo();
          module.clasesRef = null;
          module.duracion = modulo.duracion;
          module.id = modulo.id;
          module.numero = modulo.numero;
          module.titulo = modulo.titulo;
          module.clasesRef = arrayClasesRef;

        }
      }
      let modulosToSave = []
      this.modulos.forEach(modulo => {

        // modulo['fechaInicio'] = null
        // modulo['duracion'] = null
        //instructorData

        let clases = []
        modulo['clases'].forEach(clase => {
          console.log('clasesToSave',clase)
          let claseLocal = {
            id:clase.id,
            duracion:clase.duracion,
            descripcion:clase.descripcion,
            tipo:clase.tipo,
            titulo:clase.titulo,
            imagen:clase?.imagen?clase.imagen:null,
            instructorData:clase.instructorData,
            image:clase.image,
            fechaInicio:clase.fechaInicio?clase.fechaInicio:null,
          }
          clases.push(claseLocal)
        });

        let moduloLocal ={
          numero:modulo.numero,
          titulo:modulo.titulo,
          fechaInicio:modulo['fechaInicio'],
          duracion:modulo.duracion,
          instructorData:modulo['instructorData'],
          clases:clases,
          
        }
        modulosToSave.push(moduloLocal)
      });

      
      console.log('modulosToSave',modulosToSave)

      await this.afs.collection('diplomadoP21').doc(this.curso.id).update({
        // duracion: duracion,
        modulos:modulosToSave
      });

      Swal.close();
      this.savingCourse = false;
      this.alertService.succesAlert("El curso se ha guardado exitosamente");

      if (this.mode == "create") {
        this.router.navigate([`admin/create-diplomado-p21/edit/${this.curso.id}`]);
      }
    } else {
      Swal.close();
      this.savingCourse = false;
    }
  }

  previousTab() {
    if (this.activeStep > 1) {
      this.activeStep--;
    } else {
      this.router.navigate(["management/courses"]);
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

  async avanceTab() {
    this.updateTriggeQuestionsExam = 0;

    if (this.activeStep < 6) {
      this.showErrorCurso = false;
      let valid = true;
      if (this.activeStep == 1) {
        console.log(this.formNewCourse);
        if (!this.formNewCourse.valid) {
          valid = false;
        } else {
          console.log("datos curso", this.formNewCourse.value);
          if (this.curso) {
            this.curso = this.formNewCourse.value;
            this.curso.instructorNombre = this.curso.instructor;
          } else {
            let id = await this.afs.collection<Curso>(Curso.collection).doc().ref.id;
            let newCurso = new Curso();
            this.formNewCourse.get("id").patchValue(id);
            newCurso = this.formNewCourse.value;
            this.curso = newCurso;
            this.curso.instructorNombre = this.curso.instructor;
          }
        }
      }

      if (this.activeStep == 2) {
        if (!this.validarModulosClases()) {
          valid = false;
        }
      }

      if (this.activeStep == 3) {
        this.updateTriggeQuestionsExam++;
        setTimeout(() => {
          if (this.validExam == null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0) {
            valid = false;
            this.updateTriggeQuestionsExam++;
          } else {
            let questions = structuredClone(this.validExam.value.questions);
            questions.forEach((question) => {
              if (!question.typeFormated) {
                question.typeFormated = this.getTypeQuestion(question.type);
                if (question.type == "complete") {
                  this.showDisplayText(question);
                }
              }
            });
            console.log("revisar", this.examen, questions);
            if (this.examen) {
              this.examen.questions = questions;
            } else {
              let exam = new Activity();
              exam.questions = questions;
              exam.type = "test";
              exam.title = `Questionario Final: ${this.curso.titulo}`;
              exam.updatedAt = new Date().getTime();
              exam.createdAt = new Date().getTime();
              this.examen = exam;
            }

            console.log("examen", this.examen);
            this.openModal(this.endCourseModal);
          }
        }, 10);
      } else {
        if (valid) {
          this.activeStep++;
        } else {
          this.showErrorCurso = true;
        }
      }
    } else {
      this.openModal(this.endCourseModal);
    }
  }

  questionsFormated = false;

  currentTab = "Contenido del programa";

  onTabChange(event: MatTabChangeEvent) {
    this.currentTab = "Contenido del programa";
    if (event.tab.textLabel === "Examen") {
      this.currentTab = "Examen";
      console.log("El tab Examen fue seleccionado");

      if (!this.examen) {
        let exam = new Activity();
        exam.type = "test";
        exam.title = `Questionario Final: ${this.formNewCourse.get("titulo")?.value}`;
        exam.updatedAt = new Date().getTime();
        exam.createdAt = new Date().getTime();
        this.questionsFormated = true;
        this.examen = exam;
      }
      this.formatExamQuestions();
    }
  }

  activityAnswers: Array<any>;
  isSuccess: boolean = null;

  selectedIsCorrect(questionIndex: number, placeholder: string): boolean {
    return this.activityAnswers[questionIndex].answerItems.filter((x) => x.placeholder == placeholder && x.isCorrect && x.answer).length == 1;
  }

  updateSelectedOption(questionIndex: number, placeholder: string, selectedValue: string): void {
    this.activityAnswers[questionIndex].answerItems
      .filter((item) => item.placeholder == placeholder)
      .forEach((item) => {
        item.answer = item.text === selectedValue;
      });
  }

  selectOption(questionIndex: number, optionIndex: number): void {
    this.checkAnswer(questionIndex, optionIndex);

    // Additional logic if required when an option is selected
  }

  questionTypes = QuestionType;

  checkAnswer(questionIndex: number, optionIndex: number): void {
    switch (this.examen.questions[questionIndex].type.value) {
      case QuestionType.TYPE_SINGLE_CHOICE_VALUE:
        {
          this.activityAnswers[questionIndex].answerItems.forEach((answerItem, index) => {
            answerItem.answer = index === optionIndex;
          });
        }
        break;
      case QuestionType.TYPE_MULTIPLE_CHOICE_VALUE:
        {
          this.activityAnswers[questionIndex].answerItems[optionIndex].answer = !this.activityAnswers[questionIndex].answerItems[optionIndex].answer;
        }
        break;
      case QuestionType.TYPE_COMPLETE_VALUE:
        {
          this.activityAnswers[questionIndex].answerItems.forEach((answerItem, index) => {
            answerItem.answer = index === optionIndex;
          });
        }

        break;
      default:
        {
        }
        break;
    }
    //console.log(this.activityAnswers);
  }

  formatExamQuestions() {
    console.log("formatExamQuestions");

    setTimeout(() => {
      this.updateTriggeQuestionsExam++;
      setTimeout(() => {
        if (this.validExam == null || !this.validExam?.valid || this.validExam.value?.questions?.length == 0) {
          this.updateTriggeQuestionsExam++;
          console.log("formatExamQuestions invalid", this.validExam.controls.questions);
          let formArray: FormArray = this.validExam.get("questions") as FormArray;
          // let preguntasValidas = formArray.controls.filter(control => control.status === 'VALID');
          let preguntasValidas = formArray.controls;
          console.log("preguntasValidas", preguntasValidas);
          let valoresPreguntasValidas = preguntasValidas.map((pregunta) => pregunta.value);
          console.log("valoresPreguntasValidas", valoresPreguntasValidas);

          if (valoresPreguntasValidas.length > 0) {
            let questions = structuredClone(valoresPreguntasValidas);
            questions.forEach((question) => {
              if (!question.typeFormated) {
                question.typeFormated = this.getTypeQuestion(question.type);
                if (question.type == "complete") {
                  this.showDisplayText(question);
                }
              }
            });
            if (this.examen) {
              this.examen.questions = questions;
              this.questionsFormated = true;
            }
          }
        } else {
          let questions = structuredClone(this.validExam.value.questions);
          questions.forEach((question) => {
            if (!question.typeFormated) {
              question.typeFormated = this.getTypeQuestion(question.type);
              if (question.type == "complete") {
                this.showDisplayText(question);
              }
            }
          });
          console.log("revisar", this.examen, questions);
          if (this.examen) {
            this.examen.questions = questions;
            this.questionsFormated = true;
          }
        }
      }, 30);
    }, 20);
  }

  async chackAllInfo() {
    this.showErrorCurso = false;
    let valid = true;
    console.log("formNewCourse", this.formNewCourse);
    console.log(this.formNewCourse);
    if (!this.formNewCourse.valid) {
      valid = false;
    } else {
      console.log("datos curso", this.formNewCourse.value);
      if (this.curso) {
        this.curso = this.formNewCourse.value;
        this.curso.instructorNombre = this.curso.instructor;
      } else {
        let id = await this.afs.collection<Curso>(Curso.collectionP21).doc().ref.id;
        let newCurso = new Curso();
        this.formNewCourse.get("id").patchValue(id);
        newCurso = this.formNewCourse.value;
        this.curso = newCurso;
        this.curso.instructorNombre = this.curso.instructor;
      }
    }
    if (!this.validarModulosClases()) {
      valid = false;
    }
    this.updateTriggeQuestionsExam++;

    await new Promise((resolve) => setTimeout(resolve, 30));

    if (valid) {
      return true;
    } else {
      this.showErrorCurso = true;
    }

    return false;
  }
  uploadingImgCurso = false;
  uploadingBannerCurso = false;
  uploadingImgInstuctor = false;
  fileNameImgCurso = "";
  fileNameImgInstuctor = "";
  uploading_file_progressImgCurso = 0;
  uploading_file_progressImgInstuctor = 0;
  uploading_file_progressbannerCurso = 0;
  uploadProgress$: Observable<number>;

  imagenesCurso = ["../../../assets/images/cursos/placeholder1.jpg", "../../../assets/images/cursos/placeholder2.jpg", "../../../assets/images/cursos/placeholder3.jpg", "../../../assets/images/cursos/placeholder4.jpg"];

  avatarInstructor = ["../../../assets/images/cursos/avatar1.svg", "../../../assets/images/cursos/avatar2.svg", "../../../assets/images/cursos/avatar3.svg", "../../../assets/images/cursos/avatar4.svg"];

  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const base64content = event.target.result.split(",")[1];
        resolve(base64content);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }

  uploadCourseImage(event, tipo, newInstructor = false,clase = null) {
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
        if(tipo == 'pdf'){

        }
        else if(tipo == 'banner'){
          this.uploadingBannerCurso = true;
        }
        else if (tipo == "instructor" ) {
          this.uploadingImgInstuctor = true;
        } else {
          this.uploadingImgCurso = true;
        }
        let fileBaseName = file.name.split(".").slice(0, -1).join(".");
        let fileExtension = file.name.split(".").pop();

        let nombre = fileBaseName + "." + fileExtension;
        if(tipo == "clase"){

        }
        if (tipo == "instructor") {
          this.fileNameImgInstuctor = nombre;
        } else {
          this.fileNameImgCurso = nombre;
        }
        //console.log(nombre)

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;

        let nombreCurso = this.formNewCourse.get("titulo").value ? this.formNewCourse.get("titulo").value : "Temporal";
        //let nombreinstructor = this.formNewCourse.get("instructor").value ? this.formNewCourse.get("instructor").value : "Temporal";

        let filePath;

        if (tipo == "instructor") {
          //filePath = `Clientes/${this.empresa.name}/Instructor/${nombreinstructor}/${newName}`;
        } else {
          filePath = `DiplomadosP21/${nombreCurso}/${newName}`;
        }

        const task = this.storage.upload(filePath, file);

        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);

        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();

        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe((progress) => {
          //console.log(progress);
          if(tipo == "banner"){
            this.uploading_file_progressbannerCurso = Math.floor(progress);
          }
          else if (tipo == "clase"){

          }
          else if (tipo == "instructor") {
            this.uploading_file_progressImgInstuctor = Math.floor(progress);
          } else {
            this.uploading_file_progressImgCurso = Math.floor(progress);
          }
        });

        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task
          .snapshotChanges()
          .pipe(
            finalize(() => {
              // Obtén la URL de descarga del archivo.
              fileRef.getDownloadURL().subscribe((url) => {
                if(tipo == 'pdf'){
                  let fileInfo = {
                    nombre: fileBaseName + "." + fileExtension,
                    size: file.size,
                    type: file.type,
                    url: url,
                  };
                  this.formNewCourse.get("pdf").patchValue(fileInfo);

                }
                else if(tipo == "banner"){
                  this.uploadingBannerCurso = false;
                  this.formNewCourse.get("banner").patchValue(url);
                  //this.imagenesCurso.unshift(url);
                }
                else if (tipo == "clase"){
                  clase.image = url
                }
                else if (tipo == "instructor") {
                  this.uploadingImgInstuctor = false;
                  if (!newInstructor) {
                    this.formNewCourse.get("imagen_instructor").patchValue(url);
                    this.avatarInstructor.unshift(url);
                  } else {
                    this.formNewInstructor.get("foto").patchValue(url);
                  }
                } else {
                  this.uploadingImgCurso = false;
                  this.formNewCourse.get("imagen").patchValue(url);
                  this.imagenesCurso.unshift(url);
                }
                //console.log(`File URL: ${url}`);
              });
            })
          )
          .subscribe();
      }
    };
  }

  async crearInstructor() {
    this.showErrorInstructor = false;

    console.log(this.formNewInstructor);

    if (!this.formNewInstructor.valid) {
      this.showErrorInstructor = true;
    } else {
      let instructor = this.formNewInstructor.value;
      instructor.fechaCreacion = new Date();
      instructor.ultimaEdicion = new Date();
      instructor.ultimoEditor = this.user.uid;
      let enterpriseRef = this.enterpriseService.getEnterpriseRef();
      if (this.user.isSystemUser) {
        enterpriseRef = null;
      }
      instructor.enterpriseRef = enterpriseRef;
      await this.instructorsService.addInstructor(instructor);
      console.log(instructor);

      this.alertService.succesAlert("El instructor se ha guardado exitosamente");
      //this.instructoresForm.patchValue("");
      this.modalInstructor.close();
    }
  }

  seleccionarImagenCurso(imagen) {
    this.formNewCourse.get("imagen").patchValue(imagen);
  }

  seleccionarImagenInstructor(imagen) {
    this.formNewCourse.get("imagen_instructor").patchValue(imagen);
  }

  deleteModule(modulo) {
    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar curso ${modulo.numero} - ${modulo.titulo ? modulo.titulo : "Sin título"}</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--red-5)",
      cancelButtonColor: "var(--gray-4)",
      confirmButtonText: `Borrar curso`,
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        let numero = modulo.numero;
        this.modulos = this.modulos.filter((modulo) => modulo.numero != numero);
        this.modulos.forEach((modulo) => {
          if (modulo.numero > numero) {
            modulo.numero--;
          }
        });

        await this.moduleService.deleteModulo(modulo.id, this.curso.id);

        Swal.fire({
          title: "Borrado!",
          text: `El curso ${modulo.numero} - ${modulo.titulo ? modulo.titulo : "Sin título"} fue borrado`,
          icon: "success",
          confirmButtonColor: "var(--blue-5)",
        });
      }
    });
  }

  totalClases = 0;

  hideModuleClasses(modulo): void {
    // for (const clase of modulo.clases) {
    //   clase.expanded = false;
    //   this.totalClases++;
    // }
  }

  hideOtherModules(moduloIn) {
    this.modulos.map((modulo) => {
      if (moduloIn.numero != modulo.numero) modulo["expanded"] = false;
      this.hideModuleClasses(modulo);
    });
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

  getIconClase(clase) {
    if (clase == "lectura") {
      return "catelog";
    } else if (clase == "actividad") {
      return "chess";
    } else if (clase == "corazones") {
      return "favorite";
    } else if (clase == "video") {
      return "videoChat";
    }

    return "catelog";
  }

  getnumerClassTipo(moduloIn, claseIn) {
    let modulo = this.modulos.find((modulo) => modulo.numero == moduloIn.numero);
    let clases = modulo["clases"].filter((clase) => clase.tipo == claseIn.tipo);
    let valor = clases.findIndex((clase) => clase.id == claseIn.id);
    return valor + 1;
  }

  formNuevaActividadBasica: FormGroup;
  formNuevaActividadGeneral: FormGroup;
  //   formNuevaComptencia: FormGroup;
  //   questionTypesIn = QuestionType;

  courseRef;

  //   questionTypes: Array<QuestionType> = QuestionType.TYPES.sort((a, b) =>
  //     compareByString(a.displayName, b.displayName)
  //   );

  actividades: Activity[] = [];
  //   public zoom = '100%';

  //   file_name = "assets/videos/test-video.mp4"
  //   //859408918?h=6e44212c1a&amp nuevo formato de id en vimeo

  //   panelOpenState = false;

  stepsActividad = [
    "Información básica",
    // 'Instrucciones generales de la actividad',
    "Preguntas",
    // 'Previsualización de preguntas',
  ];

  stepsCompetencias = ["Clase", "Estructura Actividad"];

  onPanelTitleClick(event: Event) {
    event.stopPropagation();
  }

  activeStepActividad = 1;
  activeStepCompetencias = 1;

  competenciasSelectedClase = [];

  getSelectedCategoriasCompetenciasClase() {
    let respuesta = [];
    //console.log(this.competenciasSelectedClase)

    this.competenciasSelectedClase.forEach((categoria) => {
      let selected = categoria.competencias.filter((competencia) => competencia.selected);
      if (selected.length > 0) {
        //console.log('categoria revisar',categoria)
        let categoriaR;
        if (categoria.categoria) {
          categoriaR = categoria.categoria;
        } else {
          categoriaR = {
            id: categoria.id,
            name: categoria.name,
            expanded: false,
          };
        }
        let obj = {
          categoria: categoriaR,
          competencias: selected,
          expanded: true,
        };
        respuesta.push(obj);
      }
    });

    //console.log(respuesta)
    this.competenciasSelectedClase = respuesta;
    this.competenciasSelectedClaseFormated = this.formatSkills(respuesta);
  }
  competenciasSelectedClaseFormated;

  isOverflowRequired(): boolean {
    const container = document.querySelector(".contenedor-chips-selected");
    return container.scrollHeight > container.clientHeight;
  }

  anidarCompetencias(categorias: any[], competencias: any[]): any[] {
    return categorias.map((categoria) => {
      let skills = competencias.filter((comp) => comp.categoriaId === categoria.id);
      //console.log('skills procesado',skills);
      return {
        ...categoria,
        competencias: skills,
      };
    });
  }

  //   categoriesObservable
  //   skillsObservable

  //   addClassMode = false;
  obtenerNumeroMasGrande(): number {
    return this.modulos.reduce((maximoActual, modulo) => {
      const maximoModulo = modulo["clases"].reduce((maximoClase, clase) => {
        return Math.max(maximoClase, clase.numero);
      }, -0);

      return Math.max(maximoActual, maximoModulo);
    }, -0);
  }

  obtenerNumeroMasGrandeModulo(moduloIn): number {
    let respuesta = moduloIn?.clases?.length > 0 ? moduloIn?.clases?.length : 0;
    //console.log('obtenerNumeroMasGrandeModulo',moduloIn.clases.length, respuesta)

    return respuesta;
  }

  quitarVideoClase(clase) {
    clase.vimeoId1 = null;
    clase.vimeoId2 = null;
    clase.videoUpload = false;
  }

  async addClase(tipo, moduloIn) {
    let modulo = this.modulos.find((modulo) => modulo.numero == moduloIn.numero);
    ////console.log('modulo',modulo);}

    if(!modulo["clases"])[
      modulo["clases"] = []
    ]
    let clases = modulo["clases"];
    let clase = new Clase();
    clase.tipo = tipo;
    clase["edited"] = true;
    clase["modulo"];
    clase["modulo"] = moduloIn.numero;

    let numero = this.obtenerNumeroMasGrandeModulo(moduloIn);
    clase["numero"] = numero;
    clase.date = numero;

    if (clase.tipo == "lectura") {
      // clase.HTMLcontent = '<h4><font face="Arial">Sesi&#243;n de lectura.</font></h4><h6><font face="Arial">&#161;Asegurate de descargar los archivos adjuntos!</font></h6><p><font face="Arial">Encu&#233;ntralos en la secci&#243;n de material descargable</font></p>';
      clase.duracion = 0;
    }

    clase["expanded"] = false;

    let instructoresForm = new FormControl("");
    let filteredinstructores: Observable<any[]>;

    filteredinstructores = instructoresForm.valueChanges.pipe(
      startWith(""),
      map((value) => this._filter(value || ""))
    );

    clase['instructoresForm'] = instructoresForm
    clase['filteredinstructores'] = filteredinstructores

    clase['fechaInicio'] = null
    clase['duracion'] = null
    clase['image'] = null
    clase['descripcion']=null


    clases.push(clase);

    //console.log(clases);
  }

  clickAddImgClase(modulo,iClase){
    document.getElementById('imgClase-' + modulo.numero + '-' + iClase).click()
  }
  

  hideOtherQuestion(questionIn) {
    //console.log(questionIn);
    //console.log(this.selectedClase.activity.questions)

    this.selectedClase.activity.questions.map((question) => {
      if (questionIn.id != question.id) question["expanded"] = false;
    });
  }

  borrarPregunta(pregunta, index) {
    //console.log(pregunta,index);

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar pregunta ${index + 1}</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--red-5)",
      cancelButtonColor: "var(--gray-4)",
      confirmButtonText: `Borrar pregunta`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteQuestionImage(pregunta);
        this.selectedClase.activity.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
        Swal.fire({
          title: "Borrado!",
          text: `La pregunta fue borrada`,
          icon: "success",
          confirmButtonColor: "var(--blue-5)",
        });
      }
    });
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

  expandModulo(modulo) {
    console.log(modulo);

    if (!modulo["expanded"] && modulo.titulo) {
      modulo["expanded"] = true;
    } else if (modulo["expanded"]) {
      modulo["expanded"] = !modulo["expanded"];
    }
  }

  addModulo() {
    //console.log(this.modulos);

    let number = 0;

    // let instructoresForm = new FormControl("");
    // let filteredinstructores: Observable<any[]>;

    // filteredinstructores = instructoresForm.valueChanges.pipe(
    //   startWith(""),
    //   map((value) => this._filter(value || ""))
    // );



    if (this.modulos.length > 0) {
      const objetoConMayorNumero = this.modulos.reduce((anterior, actual) => {
        return anterior.numero > actual.numero ? anterior : actual;
      });
      //console.log(objetoConMayorNumero);
      number = objetoConMayorNumero.numero;
    }
    number++;
    let modulo = new Modulo();
    modulo.numero = number;
    modulo["expanded"] = false;
    modulo["clases"] = [];
    // modulo['instructoresForm'] = instructoresForm
    // modulo['filteredinstructores'] = filteredinstructores
    modulo['fechaInicio'] = null
    modulo['duracion'] = null


    let titulo = "";
    if (number == 1) {
      titulo = "Introducción";
    }
    modulo.titulo = titulo;

    this.modulos.map((modulo) => {
      modulo["expanded"] = false;
    });
    this.modulos.push(modulo);
  }

  deletedClasses = [];

  borrarClase(moduloIn, claseIn) {
    let modulo = this.modulos.find((modulo) => modulo.numero == moduloIn.numero);
    let clases = modulo["clases"];

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar clase ${claseIn.numero} - ${claseIn.titulo ? claseIn.titulo : "Sin título"}</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--red-5)",
      cancelButtonColor: "var(--gray-4)",
      confirmButtonText: `Borrar clase`,
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        clases = clases.filter((clase) => clase.id != claseIn.id);
        modulo["clases"] = clases;
        claseIn["deleted"] = true;

        let classDelete = {
          claseInId: claseIn.id,
          cursoId: this.curso.id,
          moduloInId: moduloIn.id,
          activityId: claseIn?.activity?.id,
        };

        this.deletedClasses.push(classDelete);
        //this.courseClassService.deleteClassAndReference(claseIn.id,this.curso.id,moduloIn.id);
        Swal.fire({
          title: "Borrado!",
          text: `La clase ${claseIn.numero} - ${claseIn.titulo ? claseIn.titulo : "Sin título"} fue borrada`,
          icon: "success",
          confirmButtonColor: "var(--blue-5)",
        });
      }
    });
  }

  @ViewChildren("inputRef") inputElements: QueryList<ElementRef>;
  @ViewChildren("inputRefModulo") inputElementsModulo: QueryList<ElementRef>;

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

  getIconFileFormat(formato) {
    if (formato == "application/pdf") {
      return "pdf";
    } else if (formato == "actividad") {
      return "chess";
    } else if (formato == "corazones") {
      return "favorite";
    } else if (formato == "video") {
      return "videoChat";
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
      const parts = decodedUrl.split("/");
      // Extract the filename which is before the '?' character
      const filenamePart = parts.pop().split("?")[0];

      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filenamePart; // Use the original filename or a default

      // Append to the document and trigger the download
      document.body.appendChild(link);
      link.click();

      // Remove the anchor element and revoke the object URL
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading the file:", error);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
  }

  onDrop(event: DragEvent, tipo, clase, modulo) {
    event.preventDefault(); // Prevenir el comportamiento por defecto
    const files = event.dataTransfer?.files;

    if (files && files.length > 0) {
      const imageFiles: File[] = this.filterFiles(files);
      if (imageFiles.length > 0) {
        this.onFileSelected(imageFiles, clase, true, modulo, true);
      } else {
        //console.log('No se encontraron imágenes válidas.');
      }
    }
  }

  filterFiles(files: FileList): File[] {
    // Define los tipos MIME para PDF y Excel
    const aceptedTypes = [
      "application/pdf", // PDF
      "application/vnd.ms-excel", // Excel (formato antiguo .xls)
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // Excel (formato nuevo .xlsx)
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

  base64view;

  viewFileActivity = false;
  viewVideoActivity = false;



  async onFileSelectedImageClass(event, clase) {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      Swal.fire({
        title: "Aviso!",
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

        const image = new Image();
        image.src = reader.result as string;

        image.onload = () => {

          const width = image.width;
          const height = image.height;

          console.log('dimeciones',width,height)

          if(width == 192 && height == 108){
            //this.uploadingImgCurso = true;
            let fileBaseName = file.name.split(".").slice(0, -1).join(".");
            let fileExtension = file.name.split(".").pop();

            let nombre = fileBaseName + "." + fileExtension;
            this.fileNameImgCurso = nombre;
            //console.log(nombre)

            // Reorganizar el nombre para que el timestamp esté antes de la extensión
            let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;

            let nombreCurso = this.formNewCourse.get("titulo").value ? this.formNewCourse.get("titulo").value : "Temporal";
            let filePath;

            filePath = `Clientes/${this.empresa.name}/Cursos/${nombreCurso}/Imagen/${clase.titulo}/${newName}`;

            const task = this.storage.upload(filePath, file);

            // Crea una referencia a la ruta del archivo.
            const fileRef = this.storage.ref(filePath);

            // Obtener el progreso como un Observable
            this.uploadProgress$ = task.percentageChanges();

            // Suscríbete al Observable para actualizar tu componente de barra de progreso
            this.uploadProgress$.subscribe((progress) => {
              //this.uploading_file_progressImgCurso = Math.floor(progress);
            });

            // Observa el progreso de la carga del archivo y haz algo cuando se complete.
            task
              .snapshotChanges()
              .pipe(
                finalize(() => {
                  // Obtén la URL de descarga del archivo.
                  fileRef.getDownloadURL().subscribe((url) => {
                    this.uploadingImgCurso = false;
                    clase.imagen = url
                    clase["edited"] = true;
                    //this.formNewCourse.get("imagen").patchValue(url);
                    //this.imagenesCurso.unshift(url);
                  });
                })
              )
              .subscribe();
          }
          else{
            Swal.fire({
              title: "Aviso!",
              text: `La imagen debe tener dimensiones 192 * 108`,
              icon: "warning",
              confirmButtonColor: "var(--blue-5)",
            });
          }
         
        }
      }
    };
  }


  async onFileSelected(event, clase, local = false, modulo, adicional = false, tipo = null) {
    clase["uploading"] = true;
    clase["edited"] = true;

    if (clase.tipo == "video") {
      clase["videoUpload"] = 0;
    }
    let file;
    if (!local) {
      file = event.target.files[0];
    } else {
      file = event[0];
    }
    if (file) {
      let fileBaseName = file.name.split(".").slice(0, -1).join(".");
      let fileExtension = file.name.split(".").pop();

      let base64content;

      if (clase.tipo != "video") {
        base64content = await this.fileToBase64(file);
      } else {
        base64content = URL.createObjectURL(file);
      }

      if (clase.tipo == "lectura" || adicional) {
        let idFile = Date.now();
        let fileInfo = {
          id: idFile,
          nombre: fileBaseName + "." + fileExtension,
          size: file.size,
          type: file.type,
          uploading: true,
          uploading_file_progress: 0,
          url: null,
          base64: base64content,
        };
        //console.log('adicional',adicional)
        if (tipo == "archivoActividad") {
          adicional = false;
          this.viewFileActivity = false;
          this.selectedClase.activity["recursosBase64"] = fileInfo ? fileInfo : null;
        }

        if (!adicional && clase.archivos.length > 0) {
          clase.archivos[0] = fileInfo;
        } else {
          clase.archivos = clase.archivos.concat(fileInfo);
        }

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;

        let nombreCurso = this.formNewCourse.get("titulo").value ? this.formNewCourse.get("titulo").value : "Temporal";

        const filePath = `Clientes/${this.empresa.name}/Cursos/${nombreCurso}/${newName}`;
        const task = this.storage.upload(filePath, file);

        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);

        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();

        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe((progress) => {
          //console.log(progress);
          fileInfo.uploading_file_progress = Math.floor(progress);
        });

        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task
          .snapshotChanges()
          .pipe(
            finalize(() => {
              // Obtén la URL de descarga del archivo.
              fileRef.getDownloadURL().subscribe((url) => {
                clase["uploading"] = false;
                //console.log(`File URL: ${url}`);
                fileInfo.url = url;
                //clase.archivos = clase.archivos.concat(fileInfo);
                //console.log('clase',clase);
                if (tipo == "archivoActividad") {
                  this.formNuevaActividadGeneral.get("recursos").patchValue(newName);
                }
              });
            })
          )
          .subscribe();
      } else if (clase.tipo == "video") {
        let nombre = fileBaseName + "." + fileExtension;
        clase["base64Video"] = base64content;
        clase["videoFileName"] = nombre;
        //console.log(this.selectedClase)
      } else if (clase.tipo == "actividad") {
        if (tipo == "videoActividad") {
          let nombre = fileBaseName + "." + fileExtension;
          clase["base64Video"] = base64content;
          clase["videoFileName"] = nombre;
          this.viewVideoActivity = false;
        }
      }
    }
  }

  selectedClase;
  selectedModulo;
  fileViewTipe = null;
  //   categoriaNuevaCompetencia;
  modalCompetenciaAsignar;

  
  adjustSkills() {
    this.competenciasSelected.forEach((category) => {
      category.competencias.forEach((competencia) => {
        competencia.enterprise = null;
      });
    });

    return this.competenciasSelected;
  }

  openModalAsignarCompetencia(content, clase) {
    this.selectedClase = clase;

    this.activeStepCompetencias = 1;

    if (clase.competencias?.length > 0) {
      this.competenciasSelectedClase = [];
      //console.log('this.competenciasSelected',this.competenciasSelected)
      let competenciasTotal = structuredClone(this.adjustSkills());
      let competenciasTotalProcesdo = [];
      let categorias = [];
      competenciasTotal.forEach((categoria) => {
        let item = categoria.categoria;
        item.expanded = true;
        categorias.push(item);
        categoria.competencias.forEach((competencia) => {
          competencia.selected = false;
          competenciasTotalProcesdo.push(competencia);
        });
      });
      ////console.log(competencias);
      clase.competencias.forEach((competencia) => {
        //console.log(competencia)
        let competenciaP = competenciasTotalProcesdo.find((competenciaeach) => competenciaeach.id == competencia.id);
        if (competenciaP) {
          competenciaP.selected = true;
        }
      });

      //console.log(competenciasTotalProcesdo);

      let respueta = this.anidarCompetencias(categorias, competenciasTotalProcesdo);
      //console.log(respueta);
      this.competenciasSelectedClase = respueta;
      this.competenciasSelectedClaseFormated = this.formatSkills(respueta);
    } else {
      //console.log('competenciasSelected',this.competenciasSelected)
      this.competenciasSelectedClase = structuredClone(this.adjustSkills());
      this.competenciasSelectedClase.forEach((categoria) => {
        categoria.competencias.forEach((competencia) => {
          competencia.selected = false;
        });
      });

      this.competenciasSelectedClaseFormated = this.formatSkills(this.competenciasSelectedClase);

      //console.log(this.competenciasSelectedClase)
    }
    this.modalCompetenciaAsignar = this.openModal(content);
  }

  saveCompetenciasClase(close = true) {
    //console.log('this.competenciasSelectedClase',this.competenciasSelectedClase)
    //this.selectedClase.competencias = this.competenciasSelectedClase;
    let arrayCompetencias = [];
    this.competenciasSelectedClase.forEach((categoria) => {
      let selected = categoria.competencias.filter((competencia) => competencia.selected);
      arrayCompetencias = [...arrayCompetencias, ...selected];
    });
    //console.log(arrayCompetencias);

    this.selectedClase.competencias = arrayCompetencias;

    if (close) {
      this.modalCompetenciaAsignar.close();
    }
  }

  getTypeQuestion(type) {
    const TYPE_CALCULATED: string = "calculated";
    const TYPE_MATCHING: string = "matching";
    const TYPE_NUMERIC: string = "numeric";
    const TYPE_MULTIPLE_CHOICE: string = "multiple_choice";
    const TYPE_SINGLE_CHOICE: string = "single_choice";
    const TYPE_SHORT_ANSWER: string = "short-answer";
    const TYPE_COMPLETE: string = "complete";
    const TYPE_TRUE_OR_FALSE: string = "true-false";

    let typeToInfoDict = {
      [TYPE_MULTIPLE_CHOICE]: {
        value: TYPE_MULTIPLE_CHOICE,
        displayName: "Opción Múltiple",
        tooltipInfo: "Configure una serie de opciones para una pregunta - una o mas respuestas pueden ser correctas",
        createInstructions: "",
        solveInstructions: "Seleccione una o mas opciones como correctas del listado de opciones",
      },
      [TYPE_SINGLE_CHOICE]: {
        value: TYPE_SINGLE_CHOICE,
        displayName: "Opción Simple",
        tooltipInfo: "Configure una serie de opciones para una pregunta - solo una respuesta puede ser correcta",
        createInstructions: "",
        solveInstructions: "Seleccione la opción correcta del listado de opciones",
      },
      [TYPE_COMPLETE]: {
        value: TYPE_COMPLETE,
        displayName: "Completar",
        tooltipInfo: "Configure una pregunta cuyo texto pueda ser completado a partir de las opciones provistas para cada marcador de referencia - cada marcador debe tener una única respuesta correcta",
        createInstructions: "Ingrese cada marcador como una palabra de referencia encerrada entre corchetes ([]).<br/>Ejemplo: El presidente [nombreDelPresidente] nacio en [paisDeNacimiento]",
        solveInstructions: "Complete el texto utilizando los selectores proporcionados para dar sentido a la frase",
      },
      [TYPE_TRUE_OR_FALSE]: {
        value: TYPE_TRUE_OR_FALSE,
        displayName: "Verdadero o Falso",
        tooltipInfo: "Configure una pregunta cuya respuesta sea verdadero o falso",
        createInstructions: "Marque las opciones que sean verdaderas y deje en blanco las que sean falsas",
        solveInstructions: "Clasifique las siguientes afirmaciones como verdadera o falsa",
      },
    };

    let typeComplete = typeToInfoDict[type];
    return typeComplete;
  }

  srsView;

  seletFilePDF(archivo) {
    if (archivo.base64) {
      this.base64view = archivo.base64;
      this.srsView = null;
    } else if (archivo.url) {
      this.srsView = archivo.url;
      this.base64view = null;
    }

    //console.log('this.base64view',this.base64view,'this.srsView',this.srsView)
  }

  modalActivity;

  videoReady = false;
  safeUrl;

  initVideo(): void {
    if (!this.videoReady) {
      let videoURL;
      if (!this.selectedClase?.vimeoId2) {
        videoURL = "https://player.vimeo.com/video/" + this.selectedClase.vimeoId1 + "?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479";
      } else {
        videoURL = "https://player.vimeo.com/video/" + this.selectedClase.vimeoId1 + "?h=" + this.selectedClase.vimeoId2 + "&amp";
        ("?title=0&amp;byline=0&amp;portrait=0&amp;autoplay=1&amp;speed=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479");
      }
      //console.log('videoURL',videoURL)
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(videoURL);
    } else {
      this.loadVideo();
    }
  }
  private player;

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
          case "TypeError":
            // the id was not a number
            break;

          case "PasswordError":
            // the video is password-protected and the viewer needs to enter the
            // password first
            break;

          case "PrivacyError":
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

  playing = false;
  async initPlayer() {
    if (!this.videoReady) {
      this.initVideo();
      this.videoReady = true;
    } else {
      await this.timer(100);
      var iframe = document.querySelector("iframe");
      if (iframe) {
        this.player = new VimeoPlayer(iframe, {
          autoplay: true,
        });
        if (this.player) {
          let completedVideo = 0;
          let tiempoVisto = 0;
          let step = 0;
          this.player.on("play", (data) => {
            completedVideo = 0;
            //console.log("play")
            this.playing = true;
            //this.playClass();
          });
          this.player.on("pause", (data) => {
            this.playing = false;
            //console.log("pause")
          });
          const tolerance = 0.01;

          this.player.on("timeupdate", (data) => {
            tiempoVisto += 0.25;
            step += 1;
            if (step == 4) {
              // //console.log("tiempo visto: "+tiempoVisto+"s")
              step = 0;
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

  structureActivity(content, clase, modulo, tipo = "crear") {
    this.videoReady = false;
    this.base64view = null;

    this.selectedClase = clase;
    this.selectedModulo = modulo;
    this.viewFileActivity = false;

    this.activeStepActividad = 1;
    clase["edited"] = true;

    //this.inicializarFormNuevaActividad();

    if (clase.tipo == "lectura") {
      //this.base64view = clase.archivos[0].base64;
      this.seletFilePDF(clase.archivos[0]);
      this.fileViewTipe = "pdf";
    } else if (clase.tipo == "video") {
      // estoy aqui
      if (clase["base64Video"]) {
        this.base64view = clase["base64Video"];
      } else {
        this.initVideo();
      }
      this.fileViewTipe = "video";
    } else if (clase.tipo == "actividad" || clase.tipo == "corazones") {
      let activity: Activity = this.selectedClase.activity;

      //console.log('clase',clase)

      this.formNuevaActividadBasica = new FormGroup({
        titulo: new FormControl(clase.titulo, Validators.required),
        //descripcion: new FormControl(activity?.description?activity.description : '', Validators.required),
        duracion: new FormControl(clase.duracion, Validators.required),
        recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null),
      });

      if (clase?.archivos[0]?.nombre) {
        clase.archivos[0].uploading_file_progress = 100;
      }
      this.formNuevaActividadGeneral = new FormGroup({
        //instrucciones: new FormControl(activity?.description?activity.description : '', Validators.required),
        // video: new FormControl(clase.vimeoId1, [Validators.required, this.NotZeroValidator()]),
        video: new FormControl(clase.vimeoId1),
        recursos: new FormControl(clase.archivos[0]?.nombre ? clase.archivos[0].nombre : null),
      });
    }

    if (tipo == "crear") {
      this.modalActivity = this.modalService.open(content, {
        windowClass: "custom-modal",
        ariaLabelledBy: "modal-basic-title",
        size: "lg",
        centered: true,
      });
    } else {
      this.modalActivity = this.modalService.open(content, {
        ariaLabelledBy: "modal-basic-title",
        centered: true,
        size: "lg",
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

  getDurationModule(module) {
    let duracion = 0;
    module.clases.forEach((clase) => {
      duracion += clase?.duracion ? clase.duracion : 0;
    });
    return duracion;
  }

  getDurationModuleCourse() {
    let duracion = 0;

    this.modulos.forEach((modulo) => {
      if(modulo['clases'].length>0){
        modulo['clases'].forEach(clase => {
          duracion +=(clase?.duracion)
        });
      }
    });


    return duracion;
  }

  borrarArchivo(clase, archivo) {
    Swal.fire({
      title: "Advertencia",
      text: `¿Desea borrar el archivo ${archivo.nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Borrar",
      confirmButtonColor: "var(--red-5)",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        console.log(clase, archivo);
        clase.archivos = clase.archivos.filter((x) => x.url != archivo.url);
        clase["edited"] = true; // Marca la clase como editada
      }
    });
  }

  deleteFileClass(clase) {
    clase.archivos = [];
  }

  deleteQuestionImage(question: Question, warnign = false): void {
    if (question.image) {
      if (warnign) {
        Swal.fire({
          title: `<span class=" gray-9 ft20">Borrar la imagen de la pregunta</span>`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "var(--red-5)",
          cancelButtonColor: "var(--gray-4)",
          confirmButtonText: `Borrar imagen`,
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (result.isConfirmed) {
            firstValueFrom(this.storage.refFromURL(question.image).delete()).catch((error) => console.log(error));
            question.image = "";
            question["uploading_file_progress"] = 0;

            Swal.fire({
              title: "Borrado!",
              text: `La imagen fue borrada`,
              icon: "success",
              confirmButtonColor: "var(--blue-5)",
            });
          }
        });
      } else {
        firstValueFrom(this.storage.refFromURL(question.image).delete()).catch((error) => console.log(error));
        question.image = "";
        question["uploading_file_progress"] = 0;
      }
    }
  }

  showDisplayText(question: Question) {
    question["render"] = this.sanitizer.bypassSecurityTrustHtml(this.getDisplayText(question));
  }

  getDisplayText(question): string {
    let displayText = question.text;
    const placeholders = this.getPlaceholders(question);
    for (const placeholder of placeholders) {
      const options = question.options.filter((question) => question.placeholder == placeholder);
      let optionsHtml = "<option disabled selected value> -- Selecciona una opcion -- </option>";
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
    this.updateTriggeQuestions = 0;

    this.showErrorActividad = false;
    let valid = true;

    this.validActividad == null;

    //console.log('tab actividad',this.activeStepActividad);

    if (this.activeStepActividad == 1) {
      //console.log(this.formNuevaActividadBasica)
      if (this.formNuevaActividadBasica.valid) {
        this.selectedClase.titulo = this.formNuevaActividadBasica.value.titulo;
        this.selectedClase.activity.title = this.formNuevaActividadBasica.value.titulo;
        this.selectedClase.activity.description = this.formNuevaActividadBasica.value.descripcion;
        this.selectedClase.activity.duration = this.formNuevaActividadBasica.value.duracion;
        this.selectedClase.duracion = this.formNuevaActividadBasica.value.duracion;
      } else {
        this.showErrorActividad = true;
        valid = false;
      }
    }
    if (this.activeStepActividad == 99) {
      //console.log(this.formNuevaActividadGeneral)
      if (this.formNuevaActividadGeneral.valid) {
        this.selectedClase.activity.instructions = this.formNuevaActividadGeneral.value.instrucciones;
      } else {
        this.showErrorActividad = true;
        valid = false;
      }
    }
    //formNuevaActividadGeneral
    if (this.activeStepActividad == 2) {
      this.updateTriggeQuestions++;
      setTimeout(() => {
        if (this.validActividad == null || !this.validActividad?.valid || this.validActividad.value?.questions?.length == 0) {
          valid = false;
          this.updateTriggeQuestions++;
        } else {
          let questions = structuredClone(this.validActividad.value.questions);
          questions.forEach((question) => {
            if (!question.typeFormated) {
              question.typeFormated = this.getTypeQuestion(question.type);
              if (question.type == "complete") {
                this.showDisplayText(question);
              }
            }
          });
          //getTypeQuestion
          this.selectedClase.activity.questions = questions;
          this.modalActivity.close();
          Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: "Actividad cambiada exitosamente",
          });

          console.log("this.selectedClase.activity", this.selectedClase.activity);
        }

        if (valid) {
          if (this.validateActivity()) {
            this.selectedClase.activity["isInvalid"] = false;
          }
          this.showErrorActividad = false;
          this.activeStepActividad = this.activeStepActividad + 1;
          //console.log(this.selectedClase)
        } else {
          this.selectedClase.activity["isInvalid"] = true;
        }
      }, 10);
    } else {
      if (valid) {
        if (this.validateActivity()) {
          this.selectedClase.activity["isInvalid"] = false;
        }
        this.showErrorActividad = false;
        this.activeStepActividad = this.activeStepActividad + 1;
        //console.log(this.selectedClase)
      } else {
        this.selectedClase.activity["isInvalid"] = true;
      }
    }
  }

  validateActivity() {
    // if(this.formNuevaActividadBasica.valid && this.formNuevaActividadGeneral.valid && this.validatePreguntasActividad()){
    //   return true
    // }
    if (this.formNuevaActividadBasica.valid) {
      return true;
    }
    return false;
  }

  updateTriggeQuestions = 0; // new property to trigger updates
  updateTriggeQuestionsExam = 0; // new property to trigger updates

  validatePreguntasActividad() {
    return true;
  }

  validActividad;
  validExam;

  showErrorActividad = false;
  //   showErrorCompetencia = false
  isInvalidCases = false;
  //   isInvaliExamen= false;
  invalidMessages = [];

  titleCase(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
  }

  validarModulosClases() {
    let valid = true;
    this.isInvalidCases = false;
    this.invalidMessages = [];
    if (this.modulos.length == 0) {
      valid = false;
      this.isInvalidCases = true;
      this.invalidMessages.push("El diplomado debe contener al menos un curso");
    }

    this.modulos.forEach((modulo) => {
      modulo["InvalidMessages"] = [];
      modulo["isInvalid"] = false;

      if (modulo["clases"].length == 0) {
        modulo["isInvalid"] = true;
        valid = false;
        modulo["InvalidMessages"].push("El módulo debe contener al menos una sesión");
      }
      if (modulo.titulo == "") {
        modulo["isInvalid"] = true;
        valid = false;
        modulo["InvalidMessages"].push("El módulo debe tener título");
      }

      let clases = modulo["clases"];
      let classIndex = 0;
      clases.forEach((clase) => {
        classIndex++
        console.log("clase", clase);
        clase["InvalidMessages"] = [];
        clase["isInvalid"] = false;

        if (clase.titulo == "") {
          modulo["isInvalid"] = true;
          clase["isInvalid"] = true;
          valid = false;
          modulo["InvalidMessages"].push(`La sesión ${classIndex} no tiene título`);
          clase["InvalidMessages"].push("La sesión debe tener título");
        }

        if (clase.duracion == 0) {
          modulo["isInvalid"] = true;
          clase["isInvalid"] = true;
          valid = false;
          modulo["InvalidMessages"].push(`La sesión ${classIndex} ${clase.titulo} no tiene duración`);
          clase["InvalidMessages"].push("La sesión debe tener duración");
        }

        if (!clase.instructorData) {
          modulo["isInvalid"] = true;
          clase["isInvalid"] = true;
          valid = false;
          modulo["InvalidMessages"].push(`La sesión ${classIndex} ${clase.titulo} no tiene instructor`);
          clase["InvalidMessages"].push("La sesión debe tener instructor");
        }
        if (!clase.fechaInicio) {
          modulo["isInvalid"] = true;
          clase["isInvalid"] = true;
          valid = false;
          modulo["InvalidMessages"].push(`La sesión ${classIndex} ${clase.titulo} no tiene fecha`);
          clase["InvalidMessages"].push("La sesión debe tener fecha");
        }

        if (!clase.descripcion) {
          modulo["isInvalid"] = true;
          clase["isInvalid"] = true;
          valid = false;
          modulo["InvalidMessages"].push(`La sesión ${classIndex} ${clase.titulo} no tiene descipción`);
          clase["InvalidMessages"].push("La sesión debe tener descipción");
        }

        if (!clase.image) {
          modulo["isInvalid"] = true;
          clase["isInvalid"] = true;
          valid = false;
          modulo["InvalidMessages"].push(`La sesión ${classIndex} ${clase.titulo} no tiene imagen`);
          clase["InvalidMessages"].push("La sesión debe tener imagen");
        }
      })

      // if (!modulo['fechaInicio']) {
      //   modulo["isInvalid"] = true;
      //   valid = false;
      //   modulo["InvalidMessages"].push("El curso debe tener fecha de unicio");
      // }
      // if (!modulo['duracion']) {
      //   modulo["isInvalid"] = true;
      //   valid = false;
      //   modulo["InvalidMessages"].push("El curso debe tener duración");
      // }
    });

    //console.log('modulos',this.modulos)

    return valid;
  }

  showErrorCurso = false;

  mensageCompetencias = "Selecciona una competencia para asignarla al curso";
  comepetenciaValid = true;

  saveCompetenciasActividad() {
    let preguntas = this.selectedClase.activity.questions;

    preguntas.forEach((pregunta) => {
      let arrayCompetencias = [];
      //console.log(pregunta);
      let competencias = pregunta.competencias_tmp;
      competencias.forEach((categoria) => {
        let competenciasLocal = categoria.competencias.filter((competencia) => competencia.selected == true);
        arrayCompetencias = [...arrayCompetencias, ...competenciasLocal];
      });
      pregunta.competencias = arrayCompetencias;
    });

    this.modalCompetenciaAsignar.close();
  }

  advanceTabCompetencia() {
    let valid = true;

    if (this.activeStepCompetencias == 1) {
      //console.log(this.selectedClase,this.competenciasSelectedClase)
      this.getSelectedCategoriasCompetenciasClase();
      if (this.competenciasSelectedClase.length > 0) {
        this.saveCompetenciasClase(false);
        //console.log('revisar',this.selectedClase.competencias,this.selectedClase.activity.questions);
        this.selectedClase.activity.questions.forEach((question) => {
          //console.log(question);
          if (question.competencias.length > 0) {
            //this.getSelectedCategoriasCompetenciasClase();
            question["competencias_tmp"] = [];
            let competenciasTotal = structuredClone(this.competenciasSelectedClase);
            //console.log('competenciasSelectedClase',this.competenciasSelectedClase)
            let competenciasTotalProcesdo = [];
            let categorias = [];
            competenciasTotal.forEach((categoria) => {
              //console.log('error',categoria)
              let item = categoria.categoria;
              //console.log('error',item)
              item["expanded"] = true;
              categorias.push(item);
              categoria.competencias.forEach((competencia) => {
                competencia.selected = false;
                competenciasTotalProcesdo.push(competencia);
              });
            });
            ////console.log(competencias);
            question.competencias.forEach((competencia) => {
              //console.log(competencia)
              let competenciaP = competenciasTotalProcesdo.find((competenciaeach) => competenciaeach.id == competencia.id);
              if (competenciaP) {
                competenciaP.selected = true;
              }
            });

            //console.log(competenciasTotalProcesdo);

            let respueta = this.anidarCompetencias(categorias, competenciasTotalProcesdo);
            //console.log(respueta);
            question["competencias_tmp"] = respueta;
          } else {
            //this.getSelectedCategoriasCompetenciasClase();
            let preguntasCompetenciasTmp = structuredClone(this.competenciasSelectedClase);
            preguntasCompetenciasTmp.forEach((categoria) => {
              //console.log(categoria)
              categoria.expanded = true;
              categoria.competencias.forEach((competencia) => {
                competencia.selected = false;
              });
            });
            question["competencias_tmp"] = preguntasCompetenciasTmp;
          }
        });
      } else {
        valid = false;
      }
    }

    if (valid) {
      this.activeStepCompetencias++;
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

  formatSkills(skills) {
    skills = structuredClone(skills);

    let respuesta = [];

    skills.forEach((category) => {
      category.competencias.forEach((skill) => {
        skill.categoryId = skill["categoriaId"];
        delete skill["categoriaId"];
        delete skill["enterprise"];
        delete skill["selected"];
        respuesta.push(skill);
      });
    });

    return respuesta;
  }

  modalCrearSkill;
  formNewSkill: FormGroup;
  showErrorSkill = false;

  crearCompetencia(modal) {
    this.savingSkill = false;
    this.showErrorSkill = false;
    this.formNewSkill = new FormGroup({
      nombre: new FormControl(null, Validators.required),
    });

    this.modalCrearSkill = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "sm",
    });
  }

  saveNewSkills() {
    console.log("this.tmpSkillRefArray", this.tmpSkillRefArray);

    if (this.curso) {
      this.curso.skillsRef = this.tmpSkillRefArray;
      this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
    } else {
      this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
    }
    this.skillsCurso = this.tmpSkillArray;
    this.modalService.dismissAll();
  }

  savingSkill = false;

  async saveNewSkill(nameSkill = null) {
    this.savingSkill = true;
    //console.log(this.pillarsForm.value)

    if(nameSkill){
      console.log('nameSkill',nameSkill)
      this.formNewSkill = new FormGroup({
        nombre: new FormControl(nameSkill, Validators.required),
      });
    }
    this.showErrorSkill = false;
    if (this.formNewSkill.valid) {
      this.tmpSkillRefArray = [];
      this.skillsCurso = [];

      let pilar = this.pillarsForm.value;
      let competencias = pilar["competencias"] || [];
      console.log('this.formNewSkill',this.formNewSkill.value)
      let competencia = competencias.find((x) => x.name.toLowerCase() == this.formNewSkill.get("nombre")?.value.toLowerCase().trim());

      let skills = this.formNewCourse.get("skills")?.value;
      console.log("skills aqui ", skills)
      if (skills) {
        this.tmpSkillRefArray = skills;
      } else {
        skills = [];
      }
      if (competencia) {
        // duplicado asignar
        console.log("duplicado asignar", competencia, pilar, skills);
        let SkillCheck = skills.find((x) => x.id == competencia.id);
        if (!SkillCheck) {
          let skillRef = await this.afs.collection<Skill>(Skill.collection).doc(competencia.id).ref;
          this.tmpSkillRefArray.push(skillRef);
          if (this.curso) {
            this.curso.skillsRef = this.tmpSkillRefArray;
            this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
          } else {
            this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
          }
          this.skillsCurso = this.getCursoSkills();
          this.savingSkill = false;
          this.modalCrearSkill?.close();
        } else {
          this.skillsCurso = this.getCursoSkills();
          this.savingSkill = false;
          this.modalCrearSkill?.close();
        }
      } else {
        // crear y asignar
        let categoryRef = this.afs.collection<any>("category").doc(pilar["id"]).ref;
        let enterpriseRef = this.enterpriseService.getEnterpriseRef(); //Here
        if (this.user.isSystemUser) {
          enterpriseRef = null;
        }
        let skillAdd = new Skill(null, this.formNewSkill.get("nombre")?.value, categoryRef, enterpriseRef);
        await this.skillService.addSkill(skillAdd);
        competencias.push(skillAdd);
        //this.pillarsForm.get("competencias").patchValue(competencias);
        let skillRef = await this.afs.collection<Skill>(Skill.collection).doc(skillAdd.id).ref;
        this.tmpSkillRefArray.push(skillRef);
        if (this.curso) {
          this.curso.skillsRef = this.tmpSkillRefArray;
          this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
        } else {
          this.formNewCourse.get("skills").patchValue(this.tmpSkillRefArray);
        }

        console.log("tmpSkillRefArray", this.tmpSkillRefArray);
        this.skillsCurso = this.getCursoSkills();
        this.savingSkill = false;
        this.modalCrearSkill?.close();
      }
    } else {
      this.showErrorSkill = true;
    }
  }

  async _saveNewSkill() {
    //console.log(this.pillarsForm.value)
    this.showErrorSkill = false;
    if (this.formNewSkill.valid) {
      let pilar = this.pillarsForm.value;
      let competencias = pilar["competencias"] || [];
      console.log("saveNewSkill pillar", pilar, competencias);

      if (competencias.find((x) => x.name.toLowerCase() == this.formNewSkill.get("nombre")?.value.toLowerCase())) {
        // duplicado
        Swal.fire({
          title: "Info!",
          text: `Ya existe una competencia en el pilar ${pilar["name"]} con este nombre`,
          icon: "info",
          confirmButtonColor: "var(--blue-5)",
        });
        return;
      } else {
        let categoryRef = this.afs.collection<any>("category").doc(pilar["id"]).ref;
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        if (this.user.isSystemUser) {
          enterpriseRef = null;
        }
        let skillAdd = new Skill(null, this.formNewSkill.get("nombre")?.value, categoryRef, enterpriseRef);
        this.skillService.addSkill(skillAdd);
        competencias.push(skillAdd);
        this.modalCrearSkill.close();
        this.pillarsForm.get("competencias").patchValue(competencias);
      }
    } else {
      this.showErrorSkill = true;
    }
  }

  verVideoVimeo(clase): NgbModalRef {
    let openModal = false;
    let isNewUser = false;

    const modalRef = this.modalService.open(VimeoComponent, {
      animation: true,
      centered: true,
      size: "lg",
    });
    modalRef.componentInstance.clase = clase;
    return modalRef;
  }


  abrirEnVimeo(clase){
    let vimeoUrl = `https://vimeo.com/manage/videos/${clase.vimeoId1}`;

    if(clase.vimeoId2){
      vimeoUrl+='/'+clase.vimeoId2
    }

    window.open(vimeoUrl, '_blank');
  }

  confirmarTitulo(modulo: any) {
    modulo["editarTitulo"] = false;
    modulo.titulo = modulo["tituloTMP"];
  }

  confirmarTituloClase(clase) {
    clase["editarTitulo"] = false;
    clase.titulo = clase["tituloTMP"];
    clase["edited"] = true; // Marca la clase como editada
    // Aquí puedes añadir cualquier otra lógica necesaria después de confirmar el título
  }

  descargarPDF(){
    
    
    this.curso = this.formNewCourse.value;
    this.curso.modules = this.modulos
    this.PDFService.downloadP21Diplomado(this.curso)
    
  }
}
