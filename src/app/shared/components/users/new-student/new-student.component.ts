import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { DatesService } from 'src/app/shared/services/dates.service';
import { GeneralService } from 'src/app/shared/services/general.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-new-student',
  templateUrl: './new-student.component.html',
  styleUrls: ['./new-student.component.css']
})
export class NewStudentComponent implements OnInit {

  constructor(
    public icon:IconService,
    public dates: DatesService,
    public general: GeneralService
  ){}

  ngOnInit(): void {
    this.countries = this.general.countries
    this.departments = this.general.departments
    this.profiles = this.general.profiles
    this.experienceOptions = this.general.experienceOptions
  }
  
  @Output() hideEmit: EventEmitter<void> = new EventEmitter<void>()

  isSaved = false
  isEditing = false
  countries: {name: string, code: string, isoCode: string}[]
  departments: {name: string, id: string}[]
  profiles: {name: string, id: string}[]
  experienceOptions: string[]
  requiredValidator = Validators.required;

  // Colocar "this.requiredValidator" en los campos que se consideren requeridos
  form: FormGroup = new FormGroup({
    "name": new FormControl(null, this.requiredValidator),
    "photoUrl": new FormControl(null),
    "email": new FormControl(null, [this.requiredValidator, Validators.email]),
    "phoneNumber": new FormControl(null),
    "country": new FormControl(null),
    "birthDate": new FormControl(null),    //
    "job": new FormControl(null),                              //
    "hiringDate": new FormControl(null,),                     //
    "experience": new FormControl(null,),                     //
    "departmentId": new FormControl(null),
    "profileId": new FormControl(null, this.requiredValidator),
  })



  hide(){
    this.hideEmit.emit()
  }

  async onSubmit(){
    console.log("this.form")
    console.log(this.form)
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      console.log("El usuario se ha creado satisfactoriamente")
      await this.saveUser()
      this.isSaved = true      
      Object.keys(controls).forEach(prop => {
        this.form.get(prop)?.disable();
      });
      // this.hide()
    }
    else {
      console.log("INVALIDO")
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
    const photoUrl = formData.photoUrl ? formData.photoUrl : null 
    const name = formData.name ? formData.name : null
    const email = formData.email ? formData.email : null
    const phoneNumber = formData.phoneNumber ? formData.phoneNumber : null
    const country = formData.country ? formData.country : null 
    const birthDate = formData.birthDate ? this.dates.dateFromCalendarToTimestamp(formData.birthDate): null
    const job = formData.job ? formData.job : null 
    const hiringDate = formData.hiringDate? this.dates.dateFromCalendarToTimestamp(formData.hiringDate) : null
    const experience = formData.experience ? formData.experience : null 
    const departmentId = formData.departmentId ? formData.departmentId : null 
    const profileId = formData.profileId ? formData.profileId : null 
    // Guardar en en firebase ...
  }

  onEdit() {
    this.isEditing = true
    this.isSaved = false
    const controls = this.form.controls
    Object.keys(controls).forEach(prop => {
      this.form.get(prop)?.enable();
    });

  }

  showAlert(property: string){
    if(this.form.get(property)?.hasValidator(this.requiredValidator)){
      if (!this.form.get(property)?.valid && !this.form.get(property)?.disabled && this.form.get(property)?.touched){
        return true
      }
      return false
    }
    else {
      return false
    }
  }


}