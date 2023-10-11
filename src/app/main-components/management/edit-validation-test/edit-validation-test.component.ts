import { Component, Input } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable } from 'rxjs';
import { IconService } from 'src/app/shared/services/icon.service';
import { VimeoUploadService } from 'src/app/shared/services/vimeo-upload.service';
import { Question, QuestionType } from 'src/app/shared/models/activity-classes.model'
import { compareByString, getPlaceholders } from 'src/app/shared/utils';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-edit-validation-test',
  templateUrl: './edit-validation-test.component.html',
  styleUrls: ['./edit-validation-test.component.css']
})
export class EditValidationTestComponent {

  @Input() existingActivity: {}

  stepsActividad = [
    'Información básica',
    // 'Instrucciones generales de la actividad',
    'Preguntas',
    'Previsualización de preguntas',
  ];

  activeStep: number = 2
  // displayVideoPreview: boolean = false
  // displayFilePreview: boolean = false

  questionStatus: {expanded: boolean, visibleImage: boolean, placeholders: string[], textToRender: SafeHtml}[] = []

  mainForm: FormGroup

  questionTypes: QuestionType[] = QuestionType.TYPES.sort((a, b) => compareByString(a.displayName, b.displayName))
  questionTypeClass = QuestionType

  questionMaxSize: number = 50

  constructor(
    public icon: IconService,
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    // private vimeoService: VimeoUploadService,
    private alertService: AlertsService,
    public sanitizer: DomSanitizer,
  ) {}

  ngOnInit() {
    this.mainForm = this.fb.group({
      modalPage1: this.fb.group({
        title: ['', [Validators.required]],
        description: ['', [Validators.required]],
        duration: [0, [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      }),
      // modalPage2: this.fb.group({
      //   vimeoId1: [0],
      //   vimeoId2: [''],
      //   instructions: ['', [Validators.required]],
      //   files: [''],
      // }),
      modalPage2: this.fb.group({
        questions: this.fb.array([])
      })
    });

    if (this.existingActivity) {
      this.mainForm.patchValue(this.existingActivity);
    }
  }

  validateCurrentModalPage(currentModalPage: string) {
    const currentPageGroup = this.mainForm.get(currentModalPage);
    
    if (currentPageGroup && currentPageGroup.invalid) {
      Object.keys(currentPageGroup['controls']).forEach(field => {
        const control = currentPageGroup.get(field);
        control.markAsTouched({ onlySelf: true });
      });
      return false; // Indicate that the form is invalid
    }
    return true; // Indicate that the form is valid
  }

  previousPage() {
    this.activeStep--
  }

  nextPage() {
    if (this.validateCurrentModalPage(`modalPage${this.activeStep}`)) {
      this.activeStep++;
    }
    // this.activeStep++;
  }

  get questions(): FormArray {
    return <FormArray>this.mainForm.get('modalPage2.questions');
  }

  addQuestion(): void {
    this.questions.push(this.fb.group({
      text: ['', [Validators.required]],
      type: [QuestionType.TYPE_COMPLETE_VALUE],
      image: this.fb.group({
        url: [''],
        file: [null]
      }),
      options: this.fb.array([]),
      points: ['', [Validators.required, Validators.min(1), Validators.pattern(/^\d*$/)]],
      skills: this.fb.array([]),
    }));
    this.questionStatus.push({
      expanded: true,
      visibleImage: false,
      placeholders: [],
      textToRender: null
    })
  }

  removeQuestion(index: number): void {
    this.questions.removeAt(index);
    this.questionStatus.splice(index, 1)
  }

  // Method to get inner array by outer array's index
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
    this.questions.at(questionIndex)['controls']['type'].setValue(typeValue)
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

  questionInstruction(questionIndex: number) {
    return this.sanitizer.bypassSecurityTrustHtml(
      QuestionType.TYPES.find(type => type.value === this.questions.at(questionIndex)['controls']['type'].value).createInstructions
    );
  }

  onSingleOptionSelected(questionIndex: number, optionIndex: number): void {
    for (let index = 0; index < this.options(questionIndex).controls.length; index++) {
      this.options(questionIndex).at(optionIndex).get('isCorrect').setValue(index === optionIndex ? true : false)
    }
  }

  // parseQuestionText(questionIndex: number): void {
  //   const existingPlaceholders = getPlaceholders(this.questions.at(questionIndex)['controls']['text'].value)
  //   this.questionStatus[questionIndex].placeholders = existingPlaceholders;
  //   this.options(questionIndex).setValue([])
  // }

  // showDisplayText(questionIndex) {
  //   this.questionStatus[questionIndex].textToRender = this.sanitizer.bypassSecurityTrustHtml(
  //     this.getDisplayText(questionIndex)
  //   );
  // }

  // getDisplayText(questionIndex: number): string {
  //   let displayText = this.questions[questionIndex].get('text').value;
  //   const placeholders = getPlaceholders(displayText);
  //   for (const placeholder of placeholders) {
  //     const options = this.options(questionIndex)['controls'].filter(
  //       (option) => option.get('placeholder').value == placeholder
  //     );
  //     let optionsHtml =
  //       '<option disabled selected value> -- Selecciona una opcion -- </option>';
  //     for (const option of options) {
  //       optionsHtml += `<option value="${option.get('text').value}">${option.get('text').value}</option>`;
  //     }
  //     const placeholderHtml = `<select class="">${optionsHtml}</select>`;
  //     displayText = displayText.replace(`[${placeholder}]`, placeholderHtml);
  //   }
  //   return displayText;
  // }

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
