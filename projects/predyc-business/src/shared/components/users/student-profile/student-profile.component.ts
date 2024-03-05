import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { finalize, firstValueFrom } from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { countriesData } from 'projects/predyc-business/src/assets/data/countries.data'
import { Profile } from 'projects/predyc-business/src/shared/models/profile.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { timestampToDateNumbers, capitalizeFirstLetter, dateFromCalendarToTimestamp } from 'projects/predyc-business/src/shared/utils';


@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent implements OnInit {

  constructor(
    public icon:IconService,
    private alertService: AlertsService,
    private storage: AngularFireStorage,
    private profileService: ProfileService,
  ){}

  @Input() student: User
  @Input() isStudentProfile: boolean = false
  @Output() hideEmit: EventEmitter<void> = new EventEmitter<void>()
  @Output() onStudentSave: EventEmitter<User> = new EventEmitter<User>()

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null
  selectedDepartmentProfiles: Profile[] = [];
  
  countries: {name: string, code: string, isoCode: string}[] = countriesData
  profiles: Profile[]
  experienceOptions: string[] = [
    "Menos de 1 año",
    "1-2 años",
    "3-5 años",
    "6-10 años",
    "11-20 años",
    "Mas de 20 años",
  ]
  isEditing = false
  isNewUser = false
  requiredValidator = Validators.required

  // Colocar "this.requiredValidator" en los campos que se consideren requeridos
  form: FormGroup = new FormGroup({
    "displayName": new FormControl(null, Validators.required),
    "photoUrl": new FormControl(null),
    "email": new FormControl(null, [Validators.required, Validators.email]),
    "phoneNumber": new FormControl(null),
    "country": new FormControl(null),
    "birthdate": new FormControl(null),
    "job": new FormControl(null),
    "hiringDate": new FormControl(null,),
    "experience": new FormControl(null,),
    "department": new FormControl(null),
    "profile": new FormControl(null, [Validators.required]),
  })

  @ViewChild('closeButton') closeButton: ElementRef;

  ngOnInit(): void {
    // console.log("this.student", this.student)
    this.profileService.getProfilesObservable().subscribe(profiles => {
      if (profiles) this.profiles = profiles   
    })

    if (!this.student.uid) {
      this.isNewUser = true
    } else {
      // this.onEdit()

      Object.keys(this.form.controls).forEach(prop => {
        this.form.get(prop)?.disable();
      });

      if (this.student.photoUrl) {
        this.imageUrl = this.student.photoUrl;
      }

      this.form.patchValue(this.student)
      this.student.birthdate ? this.timestampToFormFormat(this.student.birthdate, "birthdate") : null
      this.student.hiringDate ? this.timestampToFormFormat(this.student.hiringDate, "hiringDate") : null
      
      this.form.get("profile")?.setValue((this.student.profile && this.student.profile.id) ? this.student.profile.id : null)
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeButton.nativeElement.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || !input.files[0]) {
      this.alertService.errorAlert(`Debe seleccionar una imagen`);
      return;
    }
    const file = input.files[0];
    // if (file.type !== 'image/webp') {
    //   this.alertService.errorAlert(`La imagen seleccionada debe tener formato:  WEBP`);
    //   return;
    // }
    /* checking size here - 10MB */
    const imageMaxSize = 10000000;
    if (file.size > imageMaxSize) {
      this.alertService.errorAlert(`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.imageUrl = reader.result;
      this.uploadedImage = file;
    };

  }

  timestampToFormFormat(timestamp: number, property: ("birthdate" | "hiringDate")) {
    const date = timestampToDateNumbers(timestamp)
    this.form.get(property)?.setValue({
      day: date.day, month: date.month, year: date.year
    });
  }

  hide(){
    this.hideEmit.emit()
  }

  async onSubmit(){
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      await this.saveUser()
      Object.keys(controls).forEach(prop => {
        this.form.get(prop)?.disable();
      });
      this.isEditing = false
      this.isNewUser = false
    }
    else {
      Object.keys(controls).forEach(prop => {
        if (!controls[prop].valid && !controls[prop].disabled ) {
          if (controls[prop].touched) {
            console.log(`El valor de "${prop}" es invalido`)
          }
          else {
            console.log(`Debes llenar el campo "${prop}"`)
          }
        }
      });
    }
  }

  async saveUser(){
    const formData = this.form.value 
    console.log("this.form.value")
    console.log(this.form.value)
    // Guarda la imagen
    await this.saveStudentPhoto()
    this.student.name = formData.displayName ? capitalizeFirstLetter(formData.displayName) : null
    this.student.displayName = formData.displayName ? capitalizeFirstLetter(formData.displayName) : null
    this.student.phoneNumber = formData.phoneNumber ? formData.phoneNumber : null
    this.student.country = formData.country ? formData.country : null 
    this.student.birthdate = formData.birthdate ? dateFromCalendarToTimestamp(formData.birthdate): null
    this.student.job = formData.job ? formData.job : null 
    this.student.hiringDate = formData.hiringDate ? dateFromCalendarToTimestamp(formData.hiringDate) : null
    this.student.experience = formData.experience ? formData.experience : null 
    // this.student.department = formData.department ? formData.department : null 
    this.student.profile = formData.profile ? this.profileService.getProfileRefById(formData.profile) : null
    if (!this.student.uid) {
      this.student.email = formData.email ? formData.email.toLowerCase() : null
    }

    // Guardar en en firebase ...
    this.onStudentSave.emit(this.student)
  }

  async saveStudentPhoto() {
    if (this.uploadedImage) {
      if (this.student.photoUrl) {
        // Existing image must be deleted before
        await firstValueFrom(
          this.storage.refFromURL(this.student.photoUrl).delete()
        ).catch((error) => console.log(error));
        console.log('Old image has been deleted!');
      }
      // Upload new image
      const fileName = this.uploadedImage.name.replace(' ', '-');
      const filePath = `Imagenes/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImage);
      await new Promise<void>((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(async () => {
            this.student.photoUrl = await firstValueFrom(fileRef.getDownloadURL());
            console.log(this.student.photoUrl)
            console.log("Se ha guardado la imagen");
            resolve();
          })
        ).subscribe({
          next: () => {},
          error: error => reject(error),
        });
      });
    } else {
      this.student.photoUrl = null
    }

  }

  onEdit() {
    this.isEditing = true
    const controls = this.form.controls
    Object.keys(controls).forEach(prop => {
      this.form.get(prop)?.enable();
    });

  }

  showAlert(property: string){
    if(
      this.form.get(property)?.hasValidator(Validators.required)
      && !this.form.get(property)?.valid 
      && !this.form.get(property)?.disabled 
      && this.form.get(property)?.touched
    ){
      return true
    }
    return false
  }

  onDepartmentChange(isFirsLoad: boolean = false) {
    const profileControl = this.form.get('profile');
    if (!isFirsLoad) profileControl.setValue(null)
  }

  displayName(id: string): string {
    const profile: Profile = this.profiles.find(x => x.id === id)
    if (profile) return profile.name
    return null
  }

}
