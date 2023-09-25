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

  @Output() onEnterpriseInfoChange: EventEmitter<any> = new EventEmitter<any>()


  user: User
  enterprise: Enterprise

  isEditing = false

  form: FormGroup

  async ngOnInit(){
    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()

    this.initForm()
  
  }

  initForm() {
    let description = "Sin descripción"
    let workField = "Sector desconocido"
    let size = "Tamaño desconocido"
    let employesNo = "Cantidad desconocida"
    let country = "País desconocido"
    let city = "Ciudad desconocida"
    let zipCode = "Código postal desconocido"

    // Aqui calculamos de size, employesNo
    
    //

    this.form =  new FormGroup({
      "description": new FormControl(description),
      "workField": new FormControl(workField),
      "size": new FormControl(size),
      "employesNo": new FormControl(employesNo),
      "country": new FormControl(country),
      "city": new FormControl(city),
      "zipCode": new FormControl(zipCode),
    })

    if (this.enterprise){
      this.form.patchValue(this.enterprise)
    }

  }


  onClick() {
    if (this.isEditing) {
      this.onSubmit();
    }
    this.isEditing = !this.isEditing;
  }

  async onSubmit(){
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      this.onEnterpriseInfoChange.emit(this.form.value)
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
