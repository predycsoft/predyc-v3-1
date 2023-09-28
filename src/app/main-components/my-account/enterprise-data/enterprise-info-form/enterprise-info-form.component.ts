import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
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

  @Output() onEnterpriseInfoChange: EventEmitter<{ formValue: Object; isEditing: boolean }> = new EventEmitter<{ formValue: Object; isEditing: boolean }>()


  enterprise: Enterprise
  isEnterpriseLoaded = false;

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

  ngOnInit(){
    this.enterprise = this.enterpriseService.getEnterprise()
    this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.initForm()
        this.isEnterpriseLoaded = true;
      }
    })
  
  }

  initForm() {

    // Aqui calculamos de size, employesNo
    // let size =
    // let employesNo = 
    //

    this.form =  new FormGroup({
      "description": new FormControl(""),
      "workField": new FormControl(""),
      "size": new FormControl(""),
      "employesNo": new FormControl(""),
      "country": new FormControl(""),
      "city": new FormControl(""),
      "zipCode": new FormControl(null),
    })

    if (this.enterprise){
      this.form.patchValue(this.enterprise)
    }

    this.onEnterpriseInfoChange.emit({
      formValue: this.form.value,
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
