import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { IconService } from 'src/shared/services/icon.service';
// import { VimeoUploadService } from 'src/shared/services/vimeo-upload.service';
import { cloneArrayOfObjects, compareByString, getPlaceholders } from 'src/shared/utils';
import { AlertsService } from 'src/shared/services/alerts.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CategoryService } from 'src/shared/services/category.service';
import { SkillService } from 'src/shared/services/skill.service';
import { Question } from 'src/shared/models/activity-classes.model';

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

const singleOptionQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator, singleCorrectOptionValidator]
const completeQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator, atLeastOnePlaceholderValidator, singleCorrectOptionPerPlaceholderValidator]
const multipleChoiceQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator, atLeastOneCorrectOptionValidator]
const trueOrFalseQuestionTypeValidators: ValidatorFn[] = [optionsLengthValidator, skillsLengthValidator]

const questionTypeToValidators = {
  [Question.TYPE_SINGLE_CHOICE]: singleOptionQuestionTypeValidators,
  [Question.TYPE_COMPLETE]: completeQuestionTypeValidators,
  [Question.TYPE_MULTIPLE_CHOICE]: multipleChoiceQuestionTypeValidators,
  [Question.TYPE_TRUE_OR_FALSE]: trueOrFalseQuestionTypeValidators,
}

@Component({
  selector: 'app-edit-validation-test',
  templateUrl: './edit-validation-test.component.html',
  styleUrls: ['./edit-validation-test.component.css']
})
export class EditValidationTestComponent {

  @Input() existingActivity: {}

  stepsActividad = [
    'Información básica',
    'Competencias',
    'Preguntas',
    'Previsualización de preguntas',
  ];

  activeStep: number = 1

  questionStatus: { expanded: boolean, visibleImage: boolean, placeholders: string[], textToRender: SafeHtml }[] = []

  mainForm: FormGroup

  questionTypes = Question.TYPES_INFO
  QuestionClass = Question

  questionMaxSize: number = 50

  displayErrors: boolean = false
  
  // initialSkills = []
  // enterpriseSkills: Skill[]
  // universalSkills: Skill[]
  // recommendedSkills: Skill[]
  // categories: { skills: Skill[]; id: string; name?: string; enterprise?: DocumentReference<DocumentData>}[]

  skills
  categories
  selectedTestSkills = []
  selectedQuestionsSkills = []
  selectedQuestionIndex: number | null = null
  selectedQuestionSkills: [] | null = null

  constructor(
    public icon: IconService,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    // private vimeoService: VimeoUploadService,
    private alertService: AlertsService,
    public sanitizer: DomSanitizer,
    private categoryService: CategoryService,
    private skillService: SkillService,
    private modalService: NgbModal
  ) {}

  skillServiceSubscription: Subscription
  categoryServiceSubscription: Subscription

  ngOnInit() {
    this.setupForm()
    this.setupSkillsData()
  }

  setupForm() {
    this.mainForm = this.fb.group({
      modalPage1: this.fb.group({
        title: ['', [Validators.required]],
        description: ['', [Validators.required]],
        duration: [0, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      }),
      modalPage2: this.fb.group({
        testSkills: this.fb.array([], [testSkillsMinLength(1)])
      }),
      modalPage3: this.fb.group({
        questions: this.fb.array([])
      })
    });

    if (this.existingActivity) {
      this.mainForm.patchValue(this.existingActivity);
    }
  }

  setupSkillsData() {
    this.skillServiceSubscription = this.skillService.getSkillsObservable().subscribe(skills => {
      this.skills = cloneArrayOfObjects(skills.map(skill => {
        return {id: skill.id, name: skill.name, categoryId: skill.category.id}
      }))
    }) 
    this.categoryServiceSubscription = this.categoryService.getCategoriesObservable().subscribe(categories => {
      this.categories = cloneArrayOfObjects(categories)
    }) 
  }

  ngOnDestroy() {
    this.skillServiceSubscription.unsubscribe()
    this.categoryServiceSubscription.unsubscribe()
  }

  validateCurrentModalPage(currentModalPage: string) {
    const currentPageGroup = this.mainForm.get(currentModalPage);
    
    if (currentPageGroup && currentPageGroup.invalid) {
      // Object.keys(currentPageGroup['controls']).forEach(field => {
      //   const control = currentPageGroup.get(field);
      //   control.markAsTouched({ onlySelf: true });
      // });
      return false; // Indicate that the form is invalid
    }
    return true; // Indicate that the form is valid
  }

  previousPage() {
    this.activeStep--
  }

  nextPage() {
    if (this.validateCurrentModalPage(`modalPage${this.activeStep}`)) {
      this.displayErrors = false
      this.activeStep++;
    } else {
      this.displayErrors = true
    }
  }

  get testSkills(): FormArray {
    return <FormArray>this.mainForm.get('modalPage2.testSkills')
  }

  addSkillToTest(skill) {
    this.testSkills.push(this.fb.group({
      id: [skill.id],
      name: [skill.name],
      categoryId: [skill.categoryId]
    }));    
    this.selectedTestSkills.push(skill)
  }

  removeSkillFromTest(skill) {
    const index = this.testSkills.controls.findIndex(control => control.get('id').value === skill.id)
    this.testSkills.removeAt(index);
    this.selectedTestSkills.splice(index, 1)
    for (let questionIndex = 0; questionIndex < this.questions.controls.length; questionIndex++) {
      this.removeQuestionSkill(questionIndex, skill)
    }
  }

  get questions(): FormArray {
    return <FormArray>this.mainForm.get('modalPage3.questions');
  }

  addQuestion(): void {
    const defaultQuestionType = Question.TYPE_COMPLETE
    this.questions.push(this.fb.group({
      text: ['', [Validators.required]],
      type: [defaultQuestionType],
      image: this.fb.group({
        url: [''],
        file: [null]
      }),
      options: this.fb.array([], []),
      points: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
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

  addOption(questionIndex: number, placeholder=null): void {
    this.options(questionIndex).push(this.fb.group({
      text: ['', [Validators.required]],
      isCorrect: [false],
      placeholder: [placeholder],
    }));
  }

  removeOption(questionIndex: number, optionIndex: number): void {
    this.options(questionIndex).removeAt(optionIndex)
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
      textToRender: null
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
    if (file.type !== 'image/webp') {
      this.alertService.errorAlert('La imagen seleccionada debe tener formato:  WEBP')
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
      this.questions.at(questionIndex)['controls']['image']['controls']['url'].setValue(reader.result)
      this.questions.at(questionIndex)['controls']['image']['controls']['file'].setValue(file)
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

  // async onFileSelected(event) {
  //   const file = event.target.files[0];
  //   if (!file) {
  //     return
  //   }
  //   let fileBaseName = file.name.split('.').slice(0, -1).join('.');
  //   let fileExtension = file.name.split('.').pop();

  //   const base64content = await fileToBase64(file);

  //   console.log('fileExtension', fileExtension)

  //   if (fileExtension === '.mp4') {
  //     // Es un video
  //     const videoFileName =  fileBaseName + '.' + fileExtension;
  //     this.displayVideoPreview = false
  //     // this.uploadVideo(file);
  //   } else {
  //     // No es un video
  //   }
  // }

  // uploadVideo(videoFile) {
  //   const file: File = videoFile;
  //    // Comprobar si el archivo es un video
  //   if (!file.type.startsWith('video/')) {
  //     console.error('Is not a video');
  //     return;
  //   }

  //   let videoTitle = this.mainForm.get('modalPage1.title').value ? this.mainForm.get('modalPage1.title').value : 'Temporal';
  //   let videoName =  `Validation Activity - ${videoTitle}`
  //   let videoDescription =  videoName;

  //   // Create a video element
  //   const video = document.createElement('video');

  //   // Error Handling: if there are any errors loading the video file
  //   video.addEventListener('error', (e) => {
  //     console.error('Error loading video file:', e);
  //   });

  //   // Set the source object of the video element to the object URL of the file
  //   video.src = URL.createObjectURL(file);
  
  //   const result = this.vimeoService.addVideo1(file, videoName, videoDescription)
  // }

  onSubmit() {
    // ... your submit logic
    this.activeModal.close(this.mainForm.value);
  }

}
