import { Component, EventEmitter, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, NgForm, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Question } from 'src/shared/models/activity-classes.model';
import { cloneArrayOfObjects, getPlaceholders } from '../../utils';

import { CategoryService } from 'src/shared/services/category.service';
import { SkillService } from 'src/shared/services/skill.service';
import { Subscription, finalize } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AlertsService } from '../../services/alerts.service';
import { IconService } from '../../services/icon.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AngularFireStorage } from '@angular/fire/compat/storage';

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
  [Question.TYPE_TRUE_OR_FALSE]: trueOrFalseQuestionTypeValidators,
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
  @Input() nameEmpresa
  @Input() questionMaxSize: number = 50
  @Input() type: string = ''



  @Output() emmitForm = new EventEmitter();
  @Output() changeQuestion = new EventEmitter();

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

  constructor(
    private fb: FormBuilder,
    public icon: IconService,
    private alertService: AlertsService,
    public sanitizer: DomSanitizer,
    private modalService: NgbModal,
    private storage: AngularFireStorage,

  ) {}



  questionStatus: { expanded: boolean, visibleImage: boolean, placeholders: string[], textToRender: SafeHtml }[] = []

  mainForm: FormGroup

  questionTypes = Question.TYPES_INFO
  QuestionClass = Question


  displayErrors: boolean = false


  selectedQuestionsSkills = []
  selectedQuestionIndex: number | null = null
  selectedQuestionSkills: [] | null = null

  ngOnInit() {
    this.init();
  }

  init(){
    this.emmitForm.emit(null);
    console.log('selectedTestSkills',this.selectedTestSkills,this.nameCurso,this.nameEmpresa)
    this.setupForm()

    if(this.heartsActivity){
      this.questionTypes = this.questionTypes.filter( q=> q.value == "single_choice")
    }

    console.log('questionTypes',this.questionTypes,this.questions)
  }
  

  setupForm() {
    this.mainForm = this.fb.group({
      questions: this.fb.array([])
    });

    if (this.questionsArray) {
      this.questionsArray.forEach(questionData => {
        this.addQuestionInit(questionData);
      });
    }

  }

  get questions(): FormArray {
    return <FormArray>this.mainForm.get('questions');
  }


  addQuestionInit(question: any): void {
    const questionType = question.type;
  
    const newQuestionGroup = this.fb.group({
      text: [question.text, [Validators.required]],
      type: [questionType],
      image: this.fb.group({
        url: [question?.image?.url || ''],
        file: [question?.image?.file || null]
      }),
      id:[question?.id || null],
      options: this.fb.array([]),
      points: [question.points, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      skills: this.fb.array([]),
    }, { validators: questionTypeToValidators[questionType] });
  
    this.questions.push(newQuestionGroup);
  
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
      expanded: false,
      visibleImage: false,
      placeholders: [],
      textToRender: null
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
      type: [defaultQuestionType],
      image: this.fb.group({
        url: [''],
        file: [null]
      }),
      options: this.fb.array([], []),
      points: [this.heartsActivity?1:'', [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      skills: this.fb.array([]),
    }, { validators: questionTypeToValidators[defaultQuestionType] }));
    this.questionStatus.push({
      expanded: true,
      visibleImage: false,
      placeholders: [],
      textToRender: null
    })
    this.selectedQuestionsSkills.push([])
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
    this.questionStatus.splice(index, 1)
    this.selectedQuestionsSkills.splice(index, 1)
    console.log('Form Data:', this.mainForm);
    this.changeQuestion.emit(this.mainForm);
  }

  changePoints(points){

    if(points>0){
      this.changeQuestion.emit(this.mainForm);
    }

  }

  changeOption(option){
    if(option.length>0){
      this.changeQuestion.emit(this.mainForm);
    }
  }

  addOption(questionIndex: number, placeholder=null,image=null): void {
    this.options(questionIndex).push(this.fb.group({
      image: [image],
      text: ['', [Validators.required]],
      isCorrect: [false],
      placeholder: [placeholder],
    }));
    this.changeQuestion.emit(this.mainForm);
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.options(questionIndex).removeAt(optionIndex)
    this.changeQuestion.emit(this.mainForm);
  }

  changeOptionTrue(): void {
    this.changeQuestion.emit(this.mainForm);
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
            this.changeQuestion.emit(this.mainForm);
          });
        })
      ).subscribe();
      this.questions.at(questionIndex)['controls']['image']['controls']['file'].setValue(file)

    };
  }


  deleteOptionImage(option): void {
    option.get('image').setValue('');
    this.changeQuestion.emit(this.mainForm);

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
              this.changeQuestion.emit(this.mainForm);
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
    this.changeQuestion.emit(this.mainForm);

  }

  getQuestionTypeDisplayNameByValue(value: string): string {
    return Question.typeToInfoDict[value].displayName
  }

  parseQuestionText(questionIndex: number): void {
    const existingPlaceholders = getPlaceholders(this.questions.at(questionIndex)['controls']['text'].value)
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




}
