import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Question, QuestionType } from 'projects/shared/models/activity-classes.model';
import { cloneArrayOfObjects, getPlaceholders } from 'projects/shared/utils';

import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { SkillService } from 'projects/predyc-business/src/shared/services/skill.service';
import { Subscription, finalize } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertsService } from '../../services/alerts.service';
import { IconService } from '../../services/icon.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFireStorage } from '@angular/fire/compat/storage';

import * as XLSX from 'xlsx-js-style';
import { AuthService } from '../../services/auth.service';


function optionsLengthValidator(question: FormGroup): ValidationErrors | null {
  const options = question.get('options') as FormArray
  const minOptionsLength = 2
  return options.length < minOptionsLength ? { wrongOptionsLength: true } : null;
}

function skillsLengthValidator(question: FormGroup): ValidationErrors | null {
  const options = question.get('skills') as FormArray
  const minOptionsLength = 1
  return options.length < minOptionsLength ? { wrongSkillsLength: true } : null;
}

function singleCorrectOptionValidator(question: FormGroup): ValidationErrors | null {
  const options = question.get('options') as FormArray
  const correctOptionsLength = 1
  const correctOptions = options.controls.filter(option => option.get('isCorrect').value).length
  return correctOptions !== correctOptionsLength ? { wrongCorrectOptionsLength: true } : null
}

function atLeastOneCorrectOptionValidator(question: FormGroup): ValidationErrors | null {
  const options = question.get('options') as FormArray
  const minCorrectOptionsLength = 1
  const correctOptions = options.controls.filter(option => option.get('isCorrect').value).length
  return correctOptions < minCorrectOptionsLength ? { lessThanMinCorrectOptionsLength: true } : null
}

function atLeastOnePlaceholderValidator(question: FormGroup): ValidationErrors | null {
  const minPlaceholdersLength = 1
  const questionPlaceholders = getPlaceholders(question.get('text').value).length
  return questionPlaceholders < minPlaceholdersLength ? { wrongPlaceholdersLength: true } : null
}

function singleCorrectOptionPerPlaceholderValidator(question: FormGroup): ValidationErrors | null {
  const questionPlaceholders = getPlaceholders(question.get('text').value)
  const options = question.get('options') as FormArray
  const correctOptionsLengthPerPlaceholder = 1
  for (let placeholder of questionPlaceholders) {
    const correctOptions = options.controls.filter(option => option.get('placeholder').value === placeholder && option.get('isCorrect').value).length
    if (correctOptions !== correctOptionsLengthPerPlaceholder) {
      return { wrongCorrectOptionsLengthPerPlaceholder: true }
    }
  }
  return null
}

function testSkillsMinLength(min: number) {
  return (fa: FormArray): {[key: string]: any} | null => {
    return fa.length >= min ? null : { minLengthArray: { valid: false }};
  }
}

// const singleOptionQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator, singleCorrectOptionValidator]
// const completeQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator, atLeastOnePlaceholderValidator, singleCorrectOptionPerPlaceholderValidator]
// const multipleChoiceQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator, atLeastOneCorrectOptionValidator]
// const trueOrFalseQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator]

const singleOptionQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, singleCorrectOptionValidator]
const completeQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, atLeastOnePlaceholderValidator, singleCorrectOptionPerPlaceholderValidator]
const multipleChoiceQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, atLeastOneCorrectOptionValidator]
const trueOrFalseQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator]

const questionTypeToValidators = {
  [Question.TYPE_SINGLE_CHOICE]: singleOptionQuestionTypeValidators,
  [Question.TYPE_COMPLETE]: completeQuestionTypeValidators,
  [Question.TYPE_MULTIPLE_CHOICE]: multipleChoiceQuestionTypeValidators,
  // [Question.TYPE_TRUE_OR_FALSE]: trueOrFalseQuestionTypeValidators,
  [Question.TYPE_TRUE_OR_FALSE]: singleOptionQuestionTypeValidators,
}



@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.css']
})
export class QuestionsComponent {

  // @Input() selectedPaymentMethod: string = '';
  @Input() selectedTestSkills = []
  @Input() checkQuestions
  @Input() questionsArray =[]
  @Input() heartsActivity = false
  @Input() nameCurso
  @Input() courseData = null
  @Input() nameEmpresa
  @Input() questionMaxSize: number = 50
  @Input() type: string = ''



  @Output() emmitForm = new EventEmitter();
  @Output() changeQuestion = new EventEmitter();

  questionTypesModel = QuestionType;
  isSuccess: boolean = null;
  activityAnswers: Array<any>;


  ngOnChanges(changes: SimpleChanges): void {
    if (changes.checkQuestions) {
      if(this.checkQuestions !=0){
        this.submitForm();
      }
    }
    if(changes.questionsArray){
      this.init()
    }
  }

  submitForm(): void {
    this.displayErrors= false
    console.log('Form Data:', this.mainForm);

    this.emmitForm.emit(this.mainForm);

    if (!this.mainForm?.valid || this.questions?.controls?.length==0) {
      this.displayErrors= true
    }
  }

  applyOrder(campo) {
    this.appliedOrder = campo
    // Obtén el FormArray
    const questionsFormArray = this.questions;
    const formGroups = questionsFormArray.controls.slice();
  
    if (campo === 'id') {
      formGroups.sort((a, b) => {
        const idUserA = a.get('idUser').value;
        const idUserB = b.get('idUser').value;
        return idUserA - idUserB;
      });
    } else if (campo === 'tipo') {
      formGroups.sort((a, b) => {
        const tipoA = a.get('type').value;
        const tipoB = b.get('type').value;
        return tipoA.localeCompare(tipoB); // Comparación de cadenas
      });
    } else if (campo === 'clase') {
      formGroups.sort((a, b) => {
        const classIdA = a.get('classId').value;
        const classIdB = b.get('classId').value;
  
        // Preguntas sin classId van primero
        if (!classIdA && classIdB) return -1;
        if (classIdA && !classIdB) return 1;
        if (!classIdA && !classIdB) return 0;
  
        // Ambas preguntas tienen classId, buscar sus clases correspondientes
        const claseA = this.classesArray.find(x => x.id === classIdA);
        const claseB = this.classesArray.find(x => x.id === classIdB);
  
        // Si alguna pregunta no tiene una clase correspondiente en classesArray, la consideramos igual (esto no debería pasar)
        if (!claseA || !claseB) return 0;
  
        // Comparación por moduloIndex y claseIndex
        if (claseA.moduloIndex !== claseB.moduloIndex) {
          return claseA.moduloIndex - claseB.moduloIndex;
        } else {
          return claseA.claseIndex - claseB.claseIndex;
        }
      });
    }
  
    // Limpia el FormArray original y rellénalo con los FormGroup ordenados
    while (questionsFormArray.length !== 0) {
      questionsFormArray.removeAt(0);
    }
    formGroups.forEach(formGroup => {
      questionsFormArray.push(formGroup);
    });

    this.formatExamQuestions()




  }
  
  
  

  constructor(
    private fb: FormBuilder,
    public icon: IconService,
    private alertService: AlertsService,
    public sanitizer: DomSanitizer,
    private modalService: NgbModal,
    private storage: AngularFireStorage,
    private authService: AuthService,


  ) {}



  questionStatus: { expanded: boolean, editing:boolean, visibleImage: boolean, placeholders: string[], textToRender: SafeHtml,formated }[] = []

  mainForm: FormGroup

  questionTypes = Question.TYPES_INFO
  QuestionClass = Question


  displayErrors: boolean = false

  


  selectedQuestionsSkills = []
  selectedQuestionIndex: number | null = null
  selectedQuestionSkills: [] | null = null



  getQuestionTypeName (type){
    let seach = this.questionTypes.find(x=>x.value == type)

    if(seach) return seach.displayName


    return null




  }
  user
  ngOnInit() {

    this.authService.user$.subscribe(user=> {

      if (user) {
        console.log('user',user)
        this.user = user
        this.init();

      }



    })



  }


  extraerModuloYClase(claseRelacionada) {
    // Limpiar puntos adicionales al final de los números
    const cleanedString = claseRelacionada.replace(/\.\s/, ' ').trim();
    // Divide la cadena por espacios
    const parts = cleanedString.split(' ');
    // Extrae el primer elemento y lo divide por el punto
    const moduloyClase = parts.shift().split('.');
    // El número del módulo
    const modulo = moduloyClase[0];
    // El número de la clase (asegurarse de que no sea undefined por el punto extra)
    const clase = moduloyClase[1] || '';
    // El resto es el título
    const titulo = parts.join(' ');
  
    return {
      modulo,
      clase,
      titulo
    };
  }

  
  uploadQuestions(evt){
    

    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      let preguntasJSON = XLSX.utils.sheet_to_json(ws);
      let preguntas = this.estructurarPreguntas(preguntasJSON)
      preguntas.forEach(pregunta => {
        let idUser = parseInt(String(pregunta.preg).replace("P", ""));
        // Encuentra el índice de la pregunta en el formulario que coincide con el idUser
        console.log('idUser',idUser,this.questions)
        const preguntaIndex = this.questions.controls.findIndex(
          c => c.get('idUser').value === idUser
        );
        console.log('preguntaIndex',preguntaIndex,pregunta,this.classesArray)
        // Si se encuentra una pregunta con el mismo idUser, actualiza su texto

        let newType = pregunta.tipo
        let classId = null

        if(this.type !='certification'){
          let clase = this.extraerModuloYClase(pregunta.claseRelacionada)
          if(clase.modulo && clase.clase){
            let clasefind = this.classesArray.find(x=> x.claseIndex == clase.clase-1 && x.moduloIndex == clase.modulo-1)
            console.log('clasefind',clasefind)
            if(clasefind){
              classId = clasefind.id
            }
          }
        }
        else{
          classId = pregunta.claseRelacionada;
        }
        if(newType =='Verdadero y falso'){
          newType = this.QuestionClass.TYPE_TRUE_OR_FALSE
        }
        else if(newType =='Selección múltiple'){
          newType = this.QuestionClass.TYPE_MULTIPLE_CHOICE
        }
        else if(newType =='Selección simple'){
          newType =  this.QuestionClass.TYPE_SINGLE_CHOICE
        }

        let opciones = [];

        if (newType == this.QuestionClass.TYPE_TRUE_OR_FALSE) {
          // Solo tomar las opciones 'A' y 'B' para preguntas de tipo Verdadero y Falso
          opciones = pregunta.opciones
            .filter(opcion => opcion.letra === 'A' || opcion.letra === 'B')
            .map(opcion => ({
              image: null,
              isCorrect: opcion.letra === pregunta.respuestaCorrecta,
              placeholder: null,
              text: opcion.texto
            }));
        } else {
          // Para todos los otros tipos de preguntas, toma todas las opciones disponibles
          opciones = pregunta.opciones
            .filter(opcion => opcion.texto) // Asegurarse de que la opción tenga texto
            .map(opcion => ({
              image: null,
              isCorrect: pregunta?.respuestaCorrecta?.split(',').map(letra => letra.trim()).includes(opcion.letra),
              placeholder: null,
              text: opcion.texto
            }));
        }

        if (preguntaIndex !== -1) {
          // Utiliza patchValue para actualizar solo una parte del FormGroup
          // Obtiene el FormArray de opciones
          const optionsArray = this.questions.at(preguntaIndex).get('options') as FormArray;
          // Limpia todas las opciones existentes
          while (optionsArray.length) {
            optionsArray.removeAt(0);
          }
              
          this.questions.at(preguntaIndex).patchValue({
            text: pregunta.pregunta,
            type:newType,
            explanation:pregunta.explicacion,
            classId:classId,
          });

          this.initializeOptions(preguntaIndex, opciones);

        }
        else{// se debe crear la pregunta
          this.addQuestionExcel(pregunta,newType,idUser,classId)

        }

        
      });

      console.log(this.mainForm,this.questions)

      this.applyOrder('id')
      this.formatExamQuestions()
      this.changeQuestion.emit(this.mainForm);
      this.submitForm()


    };
    reader.readAsBinaryString(target.files[0]); 

  }

  addQuestionExcel(pregunta,newType,idUser,classId): void {
    
    this.questions.push(this.fb.group({
      text: [pregunta.pregunta, [Validators.required]],
      idUser : [idUser, [Validators.required,this.uniqueIdUserValidator(this.questions)]],
      type: [newType],
      image: this.fb.group({
        url: [''],
        file: [null]
      }),
      options: this.fb.array([], []),
      points: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      skills: this.fb.array([]),
      explanation: [pregunta.explicacion, []],
      classId: [classId, []],
    }, { validators: questionTypeToValidators[newType] }));
   // Calcula el índice de la nueva pregunta
    const questionIndex = this.questions.length - 1;
    // Agrega 4 opciones vacías a la nueva pregunta

    let opciones = [];
    if (newType == this.QuestionClass.TYPE_TRUE_OR_FALSE) {
      // Solo tomar las opciones 'A' y 'B' para preguntas de tipo Verdadero y Falso
      opciones = pregunta.opciones
        .filter(opcion => opcion.letra === 'A' || opcion.letra === 'B')
        .map(opcion => ({
          image: null,
          isCorrect: pregunta?.respuestaCorrecta?.split(',').map(letra => letra.trim()).includes(opcion.letra),
          placeholder: null,
          text: opcion.texto
        }));
    } else {
      // Para todos los otros tipos de preguntas, toma todas las opciones disponibles
      opciones = pregunta.opciones
        .filter(opcion => opcion.texto) // Asegurarse de que la opción tenga texto
        .map(opcion => ({
          image: null,
          isCorrect: pregunta?.respuestaCorrecta?.split(',').map(letra => letra.trim()).includes(opcion.letra),
          placeholder: null,
          text: opcion.texto
        }));
    }
    this.initializeOptions(questionIndex, opciones);
    this.questionStatus.push({
      editing:false,
      expanded: false,
      visibleImage: true,
      placeholders: [],
      textToRender: null,
      formated:null
    })
    this.selectedQuestionsSkills.push([])

  }

  estructurarPreguntas(preguntasJSON) {
    const preguntasEstructuradas = [];
    let preguntaActual = null;
    
    preguntasJSON.forEach(item => {
      // Corregir booleanos mal interpretados por valores de cadena
      if (typeof item.Texto === 'boolean') {
        item.Texto = item.Texto ? 'Verdadero' : 'Falso';
      }
  
      // Si es el inicio de una nueva pregunta
      if (item.Estructura === 'Pregunta') {
        // Si ya estamos procesando una pregunta, la guardamos antes de empezar la siguiente
        if (preguntaActual) {
          preguntasEstructuradas.push(preguntaActual);
        }
        preguntaActual = {
          preg: item.Preg,
          pregunta: item.Texto,
          claseRelacionada: item["Clase relacionada"],
          tipo: item.Tipo,
          opciones: []
        };
      } else if (['A', 'B', 'C', 'D'].includes(item.Estructura)) {
        // Si es una opción de respuesta
        preguntaActual.opciones.push({
          letra: item.Estructura,
          texto: item.Texto
        });
      } else if (item.Estructura === 'Respuesta') {
        // Si es la respuesta correcta
        preguntaActual.respuestaCorrecta = item.Texto;
      } else if (item.Estructura === 'Explicación') {
        // Si es la explicación
        preguntaActual.explicacion = item.Texto;
      }
    });
  
    // No olvides añadir la última pregunta si existe
    if (preguntaActual) {
      preguntasEstructuradas.push(preguntaActual);
    }
    
    return preguntasEstructuradas;
  }
  

  getClassName(question){
    let respuesta = ""
    if(this.type !='certification'){
      respuesta = 'Clase sin asignar'
      if(question.value.classId){
        let clase = this.classesArray.find(x=> x.id == question.value.classId)
        if(clase){ 
          return `${clase.moduloIndex+1}.${clase.claseIndex+1} ${clase.titulo}`
        }
      }
    }
    else{
      respuesta = question?.value?.classId
    }


    return respuesta
  }

  
  getClassIdUser(question){

    let respuesta = 'Pregunta sin Número'
    if(question.value.idUser){
      respuesta = question.value.idUser
    }
    return respuesta
  }

  classesArray = []
  init(){
    this.classesArray = []
    if (this.courseData) {
      this.courseData.forEach((modulo, moduloIndex) => {
        modulo.clases.forEach((clase, claseIndex) => {
          // Agregar propiedades de índices al objeto de clase
          const claseConIndices = {
            ...clase,
            moduloIndex: moduloIndex,
            claseIndex: claseIndex
          };
          if(clase.tipo != 'actividad' &&  clase.tipo !=  'corazones')
          this.classesArray.push(claseConIndices);
        });
      });
    }
    this.emmitForm.emit(null);
    console.log('selectedTestSkills',this.selectedTestSkills,this.nameCurso,this.nameEmpresa)
    this.setupForm()

    if(this.heartsActivity){
      this.questionTypes = this.questionTypes.filter( q=> q.value == "single_choice")
    }

    console.log('questionTypes',this.questionTypes,this.questions)
  }
  

  setupForm() {
    this.questionStatus = [];
    this.mainForm = this.fb.group({
      questions: this.fb.array([])
    });

    if (this.questionsArray) {
      this.questionsArray.forEach(questionData => {
        this.addQuestionInit(questionData);
      });
    }

    this.formatExamQuestions()

  }

  get questions(): FormArray {
    return <FormArray>this.mainForm.get('questions');
  }

  uniqueIdUserValidator(questionsFormArray: FormArray): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const idUser = control.value;
      const idUserExists = questionsFormArray.controls
        .some(formGroup => formGroup.get('idUser')?.value === idUser && formGroup !== control.parent);
      
      return idUserExists ? { nonUniqueUserId: true } : null;
    };
  }

  appliedOrder = '';

  addQuestionInit(question: any): void {
    const questionType = question.type;
  
    const newQuestionGroup = this.fb.group({
      text: [question.text, [Validators.required]],
      idUser: [question.idUser, [Validators.required]],
      type: [questionType],
      image: this.fb.group({
        url: [question?.image?.url || ''],
        file: [question?.image?.file || null]
      }),
      id:[question?.id || null],
      options: this.fb.array([]),
      points: [question.points, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      skills: this.fb.array([]),
      explanation: [question.explanation, []],
      classId: [question.classId, []],
    }, { validators: questionTypeToValidators[questionType] });
  
    this.questions.push(newQuestionGroup);

    this.questions.controls.forEach(control => {
      control.get('idUser')?.setValidators([
        Validators.required,
        this.uniqueIdUserValidator(this.questions)
      ]);
      control.get('idUser')?.updateValueAndValidity();
    });
  
    const questionIndex = this.questions.length - 1;
    if (question.options && question.options.length > 0) {
      this.initializeOptions(questionIndex, question.options);
    }
    this.selectedQuestionsSkills.push([]);

    // Initialize skills
    if (question.skills && question.skills.length > 0) {
      this.initializeQuestionSkills(questionIndex, question.skills);
    }
  
    this.questionStatus.push({
      editing:false,
      expanded: true,
      visibleImage: true,
      placeholders: [],
      textToRender: null,
      formated:null
    });


  
  }

  initializeOptions(questionIndex: number, options: any[]): void {
    const optionsArray = this.questions.at(questionIndex).get('options') as FormArray;
    options.forEach(option => {
      optionsArray.push(this.fb.group({
        text: [option.text, [Validators.required]],
        isCorrect: [option.isCorrect],
        placeholder: [option.placeholder],
        image: [option?.image]
      }));
    });
  }

  initializeQuestionSkills(questionIndex: number, skills: any[]): void {
    const skillsArray = this.questions.at(questionIndex).get('skills') as FormArray;
    skills.forEach(skill => {
      skillsArray.push(this.fb.group({
        id: [skill.id],
        name: [skill.name],
        categoryId: [skill.categoryId]
      }));
      this.selectedQuestionsSkills[questionIndex].push(skill);
    });
  }

  addQuestion(): void {
    
    const defaultQuestionType = Question.TYPE_SINGLE_CHOICE
    this.questions.push(this.fb.group({
      text: ['', [Validators.required]],
      idUser : ['', [Validators.required,this.uniqueIdUserValidator(this.questions)]],
      type: [defaultQuestionType],
      image: this.fb.group({
        url: [''],
        file: [null]
      }),
      options: this.fb.array([], []),
      points: [1, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      skills: this.fb.array([]),
      explanation: ['', []],
      classId: ['', []],
    }, { validators: questionTypeToValidators[defaultQuestionType] }));
   // Calcula el índice de la nueva pregunta
    const questionIndex = this.questions.length - 1;
    // Agrega 4 opciones vacías a la nueva pregunta
    for (let i = 0; i < 4; i++) {
      this.addOption(questionIndex);
    }

    this.questionStatus.push({
      editing:true,
      expanded: true,
      visibleImage: true,
      placeholders: [],
      textToRender: null,
      formated:null
    })
    this.selectedQuestionsSkills.push([])

  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
    this.questionStatus.splice(index, 1)
    this.selectedQuestionsSkills.splice(index, 1)
    console.log('Form Data:', this.mainForm);
    this.changeQuestion.emit(this.mainForm);
    this.formatExamQuestions()
  }

  changePoints(points){

    if(points>0){
      // this.changeQuestion.emit(this.mainForm);
      // this.formatExamQuestions()
    }

  }

  saveQuestionsForm(index){


    this.changeQuestion.emit(this.mainForm);
    this.formatExamQuestions()

    if(this.questions.controls[index]){ 
      this.questionStatus[index].editing = false
    }


  }


  changeTextQuestions(event){
    let text = event.value
    //if(text?.length>0)
    // this.changeQuestion.emit(this.mainForm);
    // this.formatExamQuestions()
  }

  changeOption(option){
    if(option.length>0){
      // this.changeQuestion.emit(this.mainForm);
      // this.formatExamQuestions()
    }
  }

  addOption(questionIndex: number, placeholder=null,image=null,text=''): void {
    this.options(questionIndex).push(this.fb.group({
      image: [image],
      text: [text, [Validators.required]],
      isCorrect: [false],
      placeholder: [placeholder],
    }));
    //this.changeQuestion.emit(this.mainForm);
    // this.formatExamQuestions()
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.options(questionIndex).removeAt(optionIndex)
    // this.changeQuestion.emit(this.mainForm);
    // this.formatExamQuestions()
  }

  changeOptionTrue(): void {
    // this.changeQuestion.emit(this.mainForm);
    // this.formatExamQuestions()
  }

  modifyQuestionSkills(modalTemplate, questionIndex) {
    const modalRef = this.modalService.open(modalTemplate, {
      animation: true,
      centered: true,
      size: 'md'
    })
    this.selectedQuestionIndex = questionIndex
    this.selectedQuestionSkills = this.selectedQuestionsSkills[questionIndex]
    modalRef.closed.subscribe(_ => {
      this.selectedQuestionIndex = null
      this.selectedQuestionSkills = null
    })
  }

    questionSkills(index: number): FormArray {
    return <FormArray>this.questions.at(index).get('skills');
  }

  addQuestionSkill(questionIndex: number, skill): void {
    this.questionSkills(questionIndex).push(this.fb.group({
      id: [skill.id],
      name: [skill.name],
      categoryId: [skill.categoryId]
    }));
    this.selectedQuestionsSkills[questionIndex].push(skill)
  }

  removeQuestionSkill(questionIndex: number, skill): void {
    const index = this.questionSkills(questionIndex).controls.findIndex(control => control.get('id').value === skill.id)
    if (index >= 0) {
      this.questionSkills(questionIndex).removeAt(index)
      this.selectedQuestionsSkills[questionIndex].splice(index, 1)
    }
  }

  options(index: number): FormArray {
    return <FormArray>this.questions.at(index).get('options');
  }


  toggleExpandedQuestion(questionIndex: number): void {
    this.questionStatus[questionIndex] = {
      ...this.questionStatus[questionIndex],
      expanded: !this.questionStatus[questionIndex].expanded,
      visibleImage: !this.questionStatus[questionIndex].expanded ? false : this.questionStatus[questionIndex].visibleImage
    }
  }

  deleteQuestionImage(questionIndex: number): void {
    this.questions.at(questionIndex)['controls']['image']['controls']['url'].setValue('')
    this.questions.at(questionIndex)['controls']['image']['controls']['file'].setValue(null)
  }

  onQuestionTypeChange(questionIndex: number, typeValue: string) {


    const question = this.questions.at(questionIndex)
    question['controls']['type'].setValue(typeValue)
    this.options(questionIndex).clear()
    this.questionStatus[questionIndex] = {
      ...this.questionStatus[questionIndex],
      placeholders: [],
      textToRender: null,
    }
    question.clearValidators()
    const validators: ValidatorFn[] = questionTypeToValidators[typeValue]
    question.setValidators(validators)
    question.updateValueAndValidity()



    if(typeValue=='single_choice' || typeValue=='multiple_choice'){
      for (let i = 0; i < 4; i++) {
        this.addOption(questionIndex);
      }
    }
    if(typeValue=='true-false'){
      this.addOption(questionIndex,null,null,'Verdadero');
      this.addOption(questionIndex,null,null,'Falso');

    }
  }

  uploadQuestionImage(questionIndex: number, event) {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      this.alertService.errorAlert('Debe seleccionar una imagen')
      return;
    }
    const file = event.target.files[0];
    if (file.type !== 'image/jpeg' && file.type !== 'image/png' ) {
      this.alertService.errorAlert('La imagen seleccionada debe tener formato de imagen')
      return;
    }
    /* checking size here - 1MB */
    const imageMaxSize = 1000000;
    if (file.size > imageMaxSize) {
      this.alertService.errorAlert('El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño')
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {

      let fileBaseName = file.name.split('.').slice(0, -1).join('.');
      let fileExtension = file.name.split('.').pop();

      let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;    

      let filePath = `Clientes/${this.nameEmpresa}/Cursos/${this.nameCurso}/Imagen/Preguntas/${newName}`;
      const task = this.storage.upload(filePath, file);
      const fileRef = this.storage.ref(filePath);

      // Observa el progreso de la carga del archivo y haz algo cuando se complete.
      task.snapshotChanges().pipe(
        finalize(() => {
          // Obtén la URL de descarga del archivo.
          fileRef.getDownloadURL().subscribe(url => {
            //clase['uploading'] = false;
            console.log(`File URL: ${url}`);
            this.questions.at(questionIndex)['controls']['image']['controls']['url'].setValue(url)
            this.questions.at(questionIndex)['controls']['image']['controls']['file'].setValue(newName)
            //this.changeQuestion.emit(this.mainForm);
          });
        })
      ).subscribe();
      this.questions.at(questionIndex)['controls']['image']['controls']['file'].setValue(file)

    };
  }


  deleteOptionImage(option): void {
    option.get('image').setValue('');
    // this.changeQuestion.emit(this.mainForm);
    // this.formatExamQuestions()
  }


  uploadQuestionOptionImage(option, event) {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      this.alertService.errorAlert('Debe seleccionar una imagen')
      return;
    }
    const file = event.target.files[0];
    if (file.type !== 'image/jpeg' && file.type !== 'image/png' ) {
      this.alertService.errorAlert('La imagen seleccionada debe tener formato de imagen')
      return;
    }
    /* checking size here - 1MB */
    const imageMaxSize = 1000000;
    if (file.size > imageMaxSize) {
      this.alertService.errorAlert('El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño')
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (_event) => {
      let fileBaseName = file.name.split('.').slice(0, -1).join('.');
      let fileExtension = file.name.split('.').pop();

      let newName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;    

      let filePath = `Clientes/${this.nameEmpresa}/Cursos/${this.nameCurso}/Imagen/Preguntas/${newName}`;
      const task = this.storage.upload(filePath, file);
      const fileRef = this.storage.ref(filePath);

      //this.uploadProgress$ = task.percentageChanges();

      // Suscríbete al Observable para actualizar tu componente de barra de progreso
      // this.uploadProgress$.subscribe(progress => {
      //   console.log(progress);
      //   fileInfo.uploading_file_progress = Math.floor(progress) ;
      // });

        
        // Observa el progreso de la carga del archivo y haz algo cuando se complete.
        task.snapshotChanges().pipe(
          finalize(() => {
            // Obtén la URL de descarga del archivo.
            fileRef.getDownloadURL().subscribe(url => {
              //clase['uploading'] = false;
              console.log(`File URL: ${url}`);
              option.get('image').setValue(url);
              // this.changeQuestion.emit(this.mainForm);
              // this.formatExamQuestions()
            });
          })
        ).subscribe();
        



      //option.get('image').setValue(reader.result);
    };
  }

  getQuestionInstruction(questionIndex: number) {
    return this.sanitizer.bypassSecurityTrustHtml(
      Question.typeToInfoDict[this.questions.at(questionIndex)['controls']['type'].value].createInstructions
    );
  }

  onSingleOptionSelected(questionIndex: number, optionIndex: number): void {

    
    const targetPlaceholder = this.options(questionIndex).at(optionIndex).get('placeholder').value
    for (let index = 0; index < this.options(questionIndex).controls.length; index++) {
      if (this.options(questionIndex).at(index).get('placeholder').value === targetPlaceholder) {
        this.options(questionIndex).at(index).get('isCorrect').setValue(index === optionIndex ? true : false)
      }
    }
    //this.changeQuestion.emit(this.mainForm);
    //this.formatExamQuestions()

  }

  getQuestionTypeDisplayNameByValue(value: string): string {
    return Question.typeToInfoDict[value].displayName
  }

  parseQuestionText(questionIndex: number): void {
    const existingPlaceholders = getPlaceholders(this.questions.at(questionIndex)['controls']['text'].value)
    this.questionStatus[questionIndex].placeholders = existingPlaceholders;
    this.options(questionIndex).setValue([])
  }

  parseQuestionExplanation(questionIndex: number): void {
    const existingPlaceholders = getPlaceholders(this.questions.at(questionIndex)['controls']['explanation'].value)
    this.questionStatus[questionIndex].placeholders = existingPlaceholders;
    this.options(questionIndex).setValue([])
  }


  showDisplayText(questionIndex) {
    this.questionStatus[questionIndex].textToRender = this.sanitizer.bypassSecurityTrustHtml(
      this.getDisplayText(questionIndex)
    );
  }

  getDisplayText(questionIndex: number): string {
    let displayText = this.questions.at(questionIndex).get('text').value;
    const placeholders = getPlaceholders(displayText);
    for (const placeholder of placeholders) {
      const options = this.options(questionIndex)['controls'].filter(
        (option) => option.get('placeholder').value == placeholder
      );
      let optionsHtml =
        '<option disabled selected value> -- Selecciona una opcion -- </option>';
      for (const option of options) {
        optionsHtml += `<option value="${option.get('text').value}">${option.get('text').value}</option>`;
      }
      const placeholderHtml = `<select class="">${optionsHtml}</select>`;
      displayText = displayText.replace(`[${placeholder}]`, placeholderHtml);
    }
    return displayText;
  }

  showCurrentForm() {
    console.log(this.mainForm.value)
  }


  onSubmit(){

    console.log(this.mainForm.value)

  }

  examenQuestionsFormated = [];
  questionsFormated
  
  formatExamQuestions(){

    let questions = structuredClone(this.questions.value)

    if(questions.length>0){
      questions.forEach(question => {
        if(!question.typeFormated){
          question.typeFormated = this.getTypeQuestion(question.type)
          if(question.type == 'complete'){
            this.showDisplayText(question)
          }
        }
      });
      if(this.examenQuestionsFormated){
        this.examenQuestionsFormated = questions
        this.questionsFormated = true
      }
    }

    console.log('revisarformatExamQuestions',this.examenQuestionsFormated)

  }

  formatQuestion(question){



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

  checkAnswer(questionIndex: number, optionIndex: number): void {
    switch (this.questions.value[questionIndex].type.value) {
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





}
