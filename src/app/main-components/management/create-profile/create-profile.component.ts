import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take, map, firstValueFrom, Observable, finalize } from 'rxjs';
import { Curso } from 'src/app/shared/models/course.model';
import { CategoryService } from 'src/app/shared/services/category.service';
import { CourseService } from 'src/app/shared/services/course.service';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { SkillService } from 'src/app/shared/services/skill.service';

import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ActivityClassesService } from '../../../shared/services/activity-classes.service';
import { Activity, Question, QuestionOption, QuestionType, QuestionValidationResponse } from 'src/app/shared/models/activity-classes.model';
import Swal from 'sweetalert2';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { DomSanitizer } from '@angular/platform-browser';
import { Profile } from 'src/app/shared/models/profile.model';
import { Department } from 'src/app/shared/models/department.model';

export const compareByString = (a: string, b: string): number => {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else {
    return 0;
  }
};


interface Competencia {
  id: number;
  name: string;
  selected: boolean;
  categoriaId: number;
}

@Component({
  selector: 'app-create-profile',
  templateUrl: './create-profile.component.html',
  styleUrls: ['./create-profile.component.css']
})
export class CreateProfileComponent {


  constructor(
    public icon: IconService,
    private afs: AngularFirestore,
    private loaderService: LoaderService,
    private departmentService: DepartmentService,
    private router: Router,
    private route: ActivatedRoute,
    public categoryService : CategoryService,
    public skillService: SkillService,
    public courseService : CourseService,
    private activityClassesService: ActivityClassesService,
    private modalService: NgbModal,
    private enterpriseService: EnterpriseService,
    private storage: AngularFireStorage,
    public sanitizer: DomSanitizer,

  ){}

  departments
  department;
  departmentId = this.route.snapshot.paramMap.get("id")
  activeStep = 1
  showErrorProfile = false;
  formNewProfile: FormGroup;
  skillsObservable
  categoriasArray
  skillsArray;
  competenciasEmpresa
  competenciasSelected;
  categories
  categoriesPredyc;
  categoriesPropios;
  searchValue = ""
  selectedCourse: Curso = null

  steps = [
    'Información del perfil',
    'Competencias del perfil',
    'Plan de estudios',
    'Examen',
    'Resumen'
  ];
  empresa

  profile: Profile;

  async ngOnInit() {

    this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.empresa = enterprise
      }
    })

    this.departmentService.loadDepartmens()
    this.departmentService.getDepartmentsObservable().subscribe(departments => {
      this.departments = departments
      console.log('profileId',this.departmentId);
      this.department = departments.find(department =>department.id == this.departmentId )
      console.log('this.department',this.department);

      this.inicialiceFormNewProfile();
    })

    this.categoryService.getCategoriesObservable().subscribe(category => {
      console.log('category from service',category);
      this.skillService.getSkillsObservable().pipe(
        take(2)
      ).subscribe(skill => {
        console.log('skill from service', skill);
        this.skillsArray = skill;
        this.categoriasArray = this.anidarCompetenciasInicial(category, skill);
        this.categories = this.categoriasArray;
        console.log('categoriasArray', this.categoriasArray)
        this.competenciasEmpresa = this.obtenerCompetenciasAlAzar(5);

        this.courseService.getCoursesObservable().subscribe(courses => {
          courses.forEach(curso => {
            //curso.foto = '../../../../assets/images/cursos/placeholder1.jpg'
            let skillIds = new Set();
            curso.skillsRef.forEach(skillRef => {
              skillIds.add(skillRef.id); // Assuming skillRef has an id property
            });
            let filteredSkills = skill.filter(skillIn => skillIds.has(skillIn.id));
            let categoryIds = new Set();
            filteredSkills.forEach(skillRef => {
              categoryIds.add(skillRef.category.id); // Assuming skillRef has an id property
            });
            let filteredCategories = category.filter(categoryIn => categoryIds.has(categoryIn.id));
            curso['skills'] = filteredSkills;
            curso['categories'] = filteredCategories;
            let modulos = curso['modules']
            let duracionCourse = 0;
            modulos.forEach(modulo => {
              console.log('modulo',modulo)
              modulo.expanded = false;
              let duracion = 0;
              modulo.clases.forEach(clase => {
                duracion+=clase.duracion
              });
              modulo.duracion = duracion
              duracionCourse+=duracion
            });
            curso['duracion'] = duracionCourse;

          });
          this.categories.forEach(category => {
            let filteredCourses = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id)
            );
            let filteredCoursesPropios = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef!=null
            );
            let filteredCoursesPredyc = courses.filter(course => 
              course['categories'].some(cat => cat.id === category.id) && course.enterpriseRef==null
            );
            category.expanded = false;
            category.expandedPropios = false;
            category.expandedPredyc = false;

            category.courses = filteredCourses;
            category.coursesPropios = filteredCoursesPropios;
            category.coursesPredyc = filteredCoursesPredyc;
          });
          console.log('this.categories',this.categories)
        })
      });
    })

    
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

  returnCursos(){

  }

  finishProfile(){

  }

  examen;
  questionTypesIn = QuestionType;


  createExam(){
    console.log('skills',this.competenciasSelected);
    let skillsId = [];
    this.competenciasSelected.forEach(categoria => {
      categoria.competencias.forEach(skill => {
        skillsId.push(skill.id)
      });
    });
    console.log('cursos plan de estudio',this.coursesSelectedPerfil);
    //this.activityClassesService.getQuestionsCourseSkills(this.coursesSelectedPerfil,null)
    let coursesId = [];
    this.coursesSelectedPerfil.forEach(curso => {
      coursesId.push(curso.id);
    });
    console.log(coursesId);
    this.activityClassesService.getQuestionsCourses(coursesId).subscribe(questions => {
      questions.forEach(question => {
        let skillsName = [];
        let skillsIdQuestion = question.skills.map(skill => {
          let skillname = this.skillsArray.find(skillFind => skillFind.id == skill.id);
          skillsName.push(skillname.name);
          return skill.id
        });
        question.skillsNames=skillsName;
        question.skillsId = skillsIdQuestion;
      });
      console.log('questions',questions);
      console.log('skillsId',skillsId);
      // Function to compute the number of common elements between two arrays
      const commonElementsCount = (arr1: any[], arr2: any[]): number => {
          return arr1.filter(item => arr2.includes(item)).length;
      };

      // Filter out questions with no matching skills
      const relevantQuestions = questions.filter(question => {
          return commonElementsCount(question.skillsId, skillsId) > 0;
      });

      // Sorting questions based on similarity
      relevantQuestions.sort((a, b) => {
          return commonElementsCount(b.skillsId, skillsId) - commonElementsCount(a.skillsId, skillsId);
      });
      console.log('relevant and sorted questions', relevantQuestions);
      if(!this.examen){
        this.examen = new Activity;
        this.examen.id = Date.now().toString();
      }
      this.examen.questions = relevantQuestions;
      console.log('this.examen',this.examen)
    });
  }


  async advanceTab(){

    let valid = true
    console.log('tab actividad',this.activeStep);

    if(this.activeStep == 1){
      console.log('formNewProfile',this.formNewProfile)
      if(this.formNewProfile.valid){
        if(!this.profile){
          let departmentRef = await this.afs.collection<Department>(Department.collection).doc(this.departmentId).ref;
          this.profile= new Profile()
          this.profile.id = this.formNewProfile.value.id;
          this.profile.departmentRef = departmentRef;
        }
        this.profile.name = this.formNewProfile.value.name;
        this.profile.description = this.formNewProfile.value.description;
        this.profile.responsabilities = this.formNewProfile.value.responsabilities;
        console.log('profile',this.profile)
      }
      else{
        this.showErrorProfile = true;
        valid = false;
      }
    }
    if(this.activeStep == 2){

    }
    if(this.activeStep == 3){
      if(!this.examen){
        this.createExam(); 
      }
    }
    if(this.activeStep == 4){
    }
    if(this.activeStep == 5){
    }

    valid = true; // comentar luego de probar
    if(valid){
      this.activeStep = this.activeStep+1
    }
    else{
      this.showErrorProfile = true;
    }

  }

  inicialiceFormNewProfile () {

    this.formNewProfile = new FormGroup({
      id: new FormControl(Date.now().toString(), Validators.required),
      name: new FormControl(null, Validators.required),
      description: new FormControl(null, Validators.required),
      responsabilities: new FormControl(null, Validators.required),
    })
  }


  coursesSelectedPerfil=[]

  mensageCursosSelect = "Selecciona un curso para asignar al plan de estudios.";
  CursosValid= true


  selectCourse(curso){

    console.log('curso selected',curso);
    let findCurso = this.coursesSelectedPerfil.find(cursoFilter => cursoFilter.id == curso.id)
    if(!findCurso){
      this.coursesSelectedPerfil.push(curso);
    }

    console.log('cursos', this.coursesSelectedPerfil)


  }

  onDrop(event: CdkDragDrop<string[]>): void {
    // previousIndex is the index of the item before dragging
    // currentIndex is the index of the item at the time of dropping
    moveItemInArray(this.coursesSelectedPerfil, event.previousIndex, event.currentIndex);
  }


  retirarCursoPlandeEstudio(curso){
    this.coursesSelectedPerfil = this.coursesSelectedPerfil.filter(cursoFilter => cursoFilter.id != curso.id)
  }

  borrarPreguntaExamen(pregunta,index){
    console.log(pregunta,index);

    Swal.fire({
      title: `<span class=" gray-9 ft20">Borrar pregunta ${index+ 1 }</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--red-5)',
      cancelButtonColor: 'var(--gray-4)',
      confirmButtonText: `Borrar pregunta`,
      cancelButtonText:'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.examen.questions.splice(index, 1); // El primer argumento es el índice desde donde quieres empezar a borrar, y el segundo argumento es la cantidad de elementos que quieres borrar.
        await this.activityClassesService.deleteQuestion(this.examen.id,pregunta.id);
        Swal.fire({
          title:'Borrado!',
          text:`La pregunta fué borrada`,
          icon:'success',
          confirmButtonColor: 'var(--blue-5)',
        })
      }
    })
  }

  async saveBorrador(){
    if(this.examen){
      let activityClass = new Activity
      let questions: any[]= [];

      this.examen.questions.forEach(question => {
        let questionEach = new Question
        questionEach.id = question.id
        questionEach.image = question.image
        questionEach.options = question.options
        //questionEach.skills = question.skills
        questionEach.text = question.text
        questionEach.type = question.type
        questionEach.points = question.points
        questions.push(structuredClone(questionEach));
      });

      activityClass.questions = structuredClone(questions);
      activityClass.id = this.examen.id;
      activityClass.isTest = true;
      activityClass.questions=[];
      console.log('activityExamen',activityClass)
      activityClass = structuredClone(activityClass)
      await this.activityClassesService.saveActivity(activityClass);
      questions.forEach(pregunta => {
        pregunta.skills = this.examen.questions.find(preguntaIn => preguntaIn.id == pregunta.id).skills;
        this.activityClassesService.saveQuestion(pregunta,activityClass.id)
      });
    }

  }
  modalCreateQuestion
  
  questionTypes: Array<QuestionType> = QuestionType.TYPES.sort((a, b) =>
  compareByString(a.displayName, b.displayName)
  );

  onQuestionTypeChange(pregunta: Question,questionTypeValue: string): void {
    console.log(questionTypeValue,pregunta)
    pregunta.type = QuestionType.TYPES.find(
      (questionType) => questionType.value == questionTypeValue
    );
    // this.createInstructions = this.sanitizer.bypassSecurityTrustHtml(
    //   pregunta.type.createInstructions
    // );
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

  uploadProgress$: Observable<number>

  questionInstruction(pregunta){

    return this.sanitizer.bypassSecurityTrustHtml(
      pregunta.type.createInstructions
    );

  }


  uploadQuestionImage(event, pregunta: Question): void {
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
    if (file.type !== 'image/webp') {
      Swal.fire({
        title:'Borrado!',
        text:`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`,
        icon:'warning',
        confirmButtonColor: 'var(--blue-5)',
      })
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (_event) => {
      //this.deleteQuestionImage(pregunta);

      if (file) {
        pregunta['uploading'] = true;
        let fileBaseName = file.name.split('.').slice(0, -1).join('.');
        let fileExtension = file.name.split('.').pop();
  
        const base64content = await this.fileToBase64(file);

        let nombre = fileBaseName+'.'+fileExtension;
        pregunta['fileName'] = nombre
        pregunta['imageHidden'] = false
        console.log(nombre)

        // Reorganizar el nombre para que el timestamp esté antes de la extensión
        let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
  
        //let nombreCurso = this.formNuevoCurso.get('titulo').value?  this.formNuevoCurso.get('titulo').value : 'Temporal';
        let nombreCurso = 'Examen';

        const filePath = `Clientes/${this.empresa.name}/Cursos/${nombreCurso}/Activities/${newName}`;
        const task = this.storage.upload(filePath, file);
  
        // Crea una referencia a la ruta del archivo.
        const fileRef = this.storage.ref(filePath);
  
        // Obtener el progreso como un Observable
        this.uploadProgress$ = task.percentageChanges();
  
        // Suscríbete al Observable para actualizar tu componente de barra de progreso
        this.uploadProgress$.subscribe(progress => {
          console.log(progress);
          pregunta['uploading_file_progress'] = Math.floor(progress) ;
        });
  
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              pregunta['uploading'] = false;
              console.log(`File URL: ${url}`);
              pregunta.image = url;
              //clase.archivos = clase.archivos.concat(fileInfo);
              console.log('pregunta',pregunta)
            });
          })
        ).subscribe();
      }

    };
  }

  // QuestionType Single Choice
  changeCorrectOption(question: Question,optionIndex: number): void {
    const placeholder = question.options[optionIndex].placeholder;
    console.log(optionIndex);
    console.log(question.options)
    question.options.forEach((option, index) => {
      if (index == optionIndex && option.placeholder === placeholder) {
        option.isCorrect = true;
        question['correctOption']=optionIndex;
      } else {
        option.isCorrect = false;
      }
    });
  }

  parseQuestionText(pregunta: Question): void {

    console.log('pregunta',pregunta)

    let existingPlaceholders = pregunta.getPlaceholders();
    pregunta['placeHolders'] = existingPlaceholders;

  }

  newQuestions

  createNewQuestion(content){

    this.newQuestions = []

    let pregunta = new Question;
    pregunta.id = Date.now().toString();
    pregunta['expanded'] = true;
    pregunta['competencias'] = [];
    console.log('questions',pregunta);
    this.newQuestions.push(pregunta)
    this.modalCreateQuestion = this.modalService.open(content, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      size:'lg'
    });
  }

  saveNewQuestion(){
    let pregunta = this.newQuestions[0]
    let valid = true;

    let response: QuestionValidationResponse = pregunta.isValidForm();

    if (!response.result) {
      console.log(response.messages)
      pregunta['isInvalid'] = true;
      pregunta['InvalidMessages'] = response.messages;
      valid = false;
    }
    else{
      if(pregunta.type.value == this.questionTypesIn.TYPE_COMPLETE_VALUE){
        this.showDisplayText(pregunta);
      }
      pregunta['isInvalid'] = false;
      pregunta['InvalidMessages'] = null;
      console.log('pregunta new',pregunta)

      let preguntaNew = structuredClone(pregunta)
      delete preguntaNew['isInvalid'];
      delete preguntaNew['imageHidden'];
      delete preguntaNew['uploading_file_progress'];
      delete preguntaNew['uploading'];
      delete preguntaNew['imageHidden'];
      delete preguntaNew['expanded'];
      this.examen.questions.push(preguntaNew);
      this.modalCreateQuestion.close()

    }


  }

  // QuestionType Multiple Choice
  toggleOptionValue(question : Question,optionIndex: number): void {
    const placeholder = question.options[optionIndex].placeholder;
    question.options[optionIndex].isCorrect = question.options[
      optionIndex
    ].isCorrect
      ? false
      : true;
    if (
      question.options[optionIndex].isCorrect &&
      question.type.value === QuestionType.TYPE_COMPLETE_VALUE
    ) {
      question.options.forEach((option, index) => {
        if (index != optionIndex && option.placeholder === placeholder) {
          option.isCorrect = false;
        }
      });
    }
    console.log(question.options);
  }

  addChoice(question: Question, placeholder: string = ''): void {
    if (!question.options) {
      question.options = [];
    }
    let newOption: QuestionOption = {
      text: '',
      isCorrect: false,
      placeholder: placeholder,
    };
    question.options = [...question.options, newOption];
    console.log(question.options);
  }

  deleteOption(question: Question,optIndex: number): void {
    question.options = question.options.filter(
      (_, index) => index !== optIndex
    );
  }

  showDisplayText(question:Question) {
    question['render'] = this.sanitizer.bypassSecurityTrustHtml(
      question.getDisplayText()
    );
  }
  
  hideOtherQuestion(questionIn){

    console.log(questionIn);
    console.log(this.examen.questions)

    this.examen.questions.questions.map( question => {
      if(questionIn.id != question.id)
      question['expanded'] = false;
    })

  }



  

}
