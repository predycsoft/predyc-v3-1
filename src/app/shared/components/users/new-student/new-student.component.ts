import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Form, FormControl, FormGroup, Validators } from '@angular/forms';
import { DatesService } from 'src/app/shared/services/dates.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-new-student',
  templateUrl: './new-student.component.html',
  styleUrls: ['./new-student.component.css']
})
export class NewStudentComponent implements OnInit {

  constructor(
    public icon:IconService,
    public dates: DatesService
  ){}

  ngOnInit(): void {
  }
  
  @Output() hideEmit: EventEmitter<void> = new EventEmitter<void>()

  form: FormGroup = new FormGroup({
    "name": new FormControl(null, Validators.required),
    "photoUrl": new FormControl(null),
    "email": new FormControl(null, [Validators.required, Validators.email]),
    "phoneNumber": new FormControl(null, Validators.required),
    "country": new FormControl(null, Validators.required),
    "birthDate": new FormControl(null, Validators.required),    //
    "job": new FormControl(null),                              //
    "hiringDate": new FormControl(null,),                     //
    "experience": new FormControl(null,),                     //
    "departmentId": new FormControl(null),
    "profileId": new FormControl(null),
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
      this.hide()
    }
    else {
      console.log("INVALIDO")
      Object.keys(controls).forEach(prop => {
        if (!controls[prop].valid) {
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
    const name = formData.name
    const email = formData.email
    const phoneNumber = formData.phoneNumber
    const country = formData.country ? formData.country : null 
    const birthDate = this.dates.dateFromCalendarToTimestamp(formData.birthDate)
    const job = formData.job ? formData.job : null 
    const hiringDate = formData.hiringDate? this.dates.dateFromCalendarToTimestamp(formData.hiringDate) : null
    const experience = formData.experience ? formData.experience : null 
    const departmentId = formData.departmentId ? formData.departmentId : null 
    const profileId = formData.profileId ? formData.profileId : null 
  }




}
