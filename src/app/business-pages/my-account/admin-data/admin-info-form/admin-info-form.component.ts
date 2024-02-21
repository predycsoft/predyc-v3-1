import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-admin-info-form',
  templateUrl: './admin-info-form.component.html',
  styleUrls: ['./admin-info-form.component.css']
})
export class AdminInfoFormComponent {

  constructor(
    public icon:IconService,
    private authService: AuthService,
    private alertService: AlertsService,
  ) {}

  @Input() adminUser: User;
  @Input() isOtherFormEditing: boolean;
  @Output() onAdminInfoChange: EventEmitter<{ formValue: Object; isEditing: boolean }> = new EventEmitter<{ formValue: Object; isEditing: boolean }>()

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    job: "Cargo desconocido",
    phoneNumber: "Teléfono desconocido",
    country: "País desconocido",
    city: "Ciudad desconocida",
    zipCode: "Código postal desconocido",
  }

  ngOnInit(){
    this.initForm(this.adminUser)
  }

  initForm(adminUser: User) {


    // Aqui podemos definir firstName y secondName a partir del name del adminUser
    // let firstName = ""
    // let secondName = ""
    //
    
    this.form =  new FormGroup({
      "job": new FormControl(""),
      "phoneNumber": new FormControl(null),
      "country": new FormControl(""),
      "city": new FormControl(""),
      "zipCode": new FormControl(null),
    })

    if (adminUser) {
      this.form.patchValue(adminUser)
    }

    this.onAdminInfoChange.emit({
      formValue: this.form.value,
      isEditing: false
    })

  }
  
  onClick() {
    if (this.isOtherFormEditing) {
      this.alertService.infoAlert("Primero debes guardar los cambios del otro formulario del administrador.")
      console.error("El otro formulario está en modo de edición.");
      return;
    }
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.onAdminInfoChange.emit({
        formValue: null,
        isEditing: true
      })
    }
    else {
      this.onSubmit();
    }
  }

  async onSubmit(){
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      this.onAdminInfoChange.emit({
        formValue: this.form.value,
        isEditing: false
      })
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

}
