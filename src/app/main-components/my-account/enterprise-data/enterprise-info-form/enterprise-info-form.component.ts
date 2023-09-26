import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-enterprise-info-form',
  templateUrl: './enterprise-info-form.component.html',
  styleUrls: ['./enterprise-info-form.component.css']
})
export class EnterpriseInfoFormComponent {
  
  constructor(
    public icon:IconService,
    private enterpriseService: EnterpriseService,

  ) {}

  @Output() onEnterpriseInfoChange: EventEmitter<{ formValue: FormGroup; isEditing: boolean }> = new EventEmitter<{ formValue: FormGroup; isEditing: boolean }>()


  user: User
  enterprise: Enterprise

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    description : "Sin descripción",
    workField : "Sector desconocido",
    size : "Tamaño desconocido",
    employesNo : "Cantidad desconocida",
    country : "País desconocido",
    city : "Ciudad desconocida",
    zipCode : "Código postal desconocido",
  }

  async ngOnInit(){
    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()

    this.initForm()
  
  }

  initForm() {

    // Aqui calculamos de size, employesNo
    // let size =
    // let employesNo = 
    //

    this.form =  new FormGroup({
      "description": new FormControl(null),
      "workField": new FormControl(null),
      "size": new FormControl(null),
      "employesNo": new FormControl(null),
      "country": new FormControl(null),
      "city": new FormControl(null),
      "zipCode": new FormControl(null),
    })

    if (this.enterprise){
      this.form.patchValue(this.enterprise)
    }

    this.onEnterpriseInfoChange.emit({
      formValue: this.form,
      isEditing: false
    })

  }


  onClick() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.onEnterpriseInfoChange.emit({
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
      this.onEnterpriseInfoChange.emit({
        formValue: this.form,
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
