import { Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from 'src/app/shared/services/utils.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { User } from 'src/app/shared/models/user.model';

@Component({
  selector: 'app-student-profile',
  templateUrl: './student-profile.component.html',
  styleUrls: ['./student-profile.component.css']
})
export class StudentProfileComponent implements OnInit {

  constructor(
    public icon:IconService,
    public utilsService: UtilsService,
  ){}

  @Input() student: User
  @Output() hideEmit: EventEmitter<void> = new EventEmitter<void>()
  @Output() onStudentSave: EventEmitter<User> = new EventEmitter<User>()

  countries: {name: string, code: string, isoCode: string}[]
  departments: {name: string, id: string}[]
  experienceOptions: string[]
  isEditing = false
  isNewUser = false
  profiles: {name: string, id: string}[]
  requiredValidator = Validators.required

  // Colocar "this.requiredValidator" en los campos que se consideren requeridos
  form: FormGroup = new FormGroup({
    "name": new FormControl(null, Validators.required),
    "photoUrl": new FormControl(null),
    "email": new FormControl(null, [Validators.required, Validators.email]),
    "phoneNumber": new FormControl(null),
    "country": new FormControl(null),
    "birthdate": new FormControl(null),
    "job": new FormControl(null),
    "hiringDate": new FormControl(null,),
    "experience": new FormControl(null,),
    // "departmentId": new FormControl(null),
    // "profileId": new FormControl(null),
  })

  @ViewChild('closeButton') closeButton: ElementRef;

  ngOnInit(): void {
    this.countries = this.utilsService.countries
    this.departments = this.utilsService.departments
    this.profiles = this.utilsService.profiles
    this.experienceOptions = this.utilsService.experienceOptions

    if (!this.student.uid) {
      this.isNewUser = true
    } else {
      // this.onEdit()

      Object.keys(this.form.controls).forEach(prop => {
        this.form.get(prop)?.disable();
      });

      this.form.patchValue(this.student)
      this.student.birthdate ? this.timestampToFormFormat(this.student.birthdate, "birthdate") : null
      this.student.hiringDate ? this.timestampToFormFormat(this.student.hiringDate, "hiringDate") : null

    }
    console.log("this.form.value")
    console.log(this.form.value)
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeButton.nativeElement.click();
    }
  }

  timestampToFormFormat(timestamp: number, property: ("birthdate" | "hiringDate")) {
    const date = this.utilsService.timestampToDateNumbers(timestamp)
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
    this.student.photoUrl = formData.photoUrl ? formData.photoUrl : null 
    this.student.name = formData.name ? this.utilsService.capitalizeFirstLetter(formData.name) : null
    this.student.displayName = formData.name ? this.utilsService.capitalizeFirstLetter(formData.name) : null
    this.student.phoneNumber = formData.phoneNumber ? formData.phoneNumber : null
    this.student.country = formData.country ? formData.country : null 
    console.log("formData.birthdate")
    console.log(formData.birthdate)
    this.student.birthdate = formData.birthdate ? this.utilsService.dateFromCalendarToTimestamp(formData.birthdate): null
    this.student.job = formData.job ? formData.job : null 
    this.student.hiringDate = formData.hiringDate ? this.utilsService.dateFromCalendarToTimestamp(formData.hiringDate) : null
    this.student.experience = formData.experience ? formData.experience : null 
    // this.student.departmentId = formData.departmentId ? formData.departmentId : null 
    // this.student.profileId = formData.profileId ? formData.profileId : null
    if (!this.student.uid) {
      this.student.email = formData.email ? formData.email.toLowerCase() : null
    }
    // Guardar en en firebase ...
    this.onStudentSave.emit(this.student)
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


}
