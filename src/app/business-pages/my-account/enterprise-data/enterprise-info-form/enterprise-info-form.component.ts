import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { AlertsService } from 'src/shared/services/alerts.service';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-enterprise-info-form',
  templateUrl: './enterprise-info-form.component.html',
  styleUrls: ['./enterprise-info-form.component.css']
})
export class EnterpriseInfoFormComponent {
  
  constructor(
    public icon:IconService,
    private alertService: AlertsService,

  ) {}

  @Input() enterprise: Enterprise;
  @Input() isOtherFormEditing: boolean;
  @Output() onEnterpriseInfoChange: EventEmitter<{ formValue: Object; isEditing: boolean }> = new EventEmitter<{ formValue: Object; isEditing: boolean }>()

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    description : "Sin descripción",
    workField : "Sector desconocido",
    employesNo : "Cantidad desconocida",
    country : "País desconocido",
    city : "Ciudad desconocida",
    zipCode : "Código postal desconocido",
  }

  enterpriseSize: string

  enterpriseSubscription: Subscription

  ngOnInit(){
      if (this.enterprise.employesNo) this.getEnterpriseSize() 
      this.initForm()
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
    if (this.isOtherFormEditing) {
      this.alertService.infoAlert("Primero debes guardar los cambios del otro formulario de la empresa.")
      console.error("El otro formulario está en modo de edición.");
      return;
    }
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

  getEnterpriseSize() {
    if (0 <= this.enterprise.employesNo && this.enterprise.employesNo <= 10) {
      this.enterpriseSize = "Pequeña"
    }
    else if (11 <= this.enterprise.employesNo && this.enterprise.employesNo <= 20) {
      this.enterpriseSize = "Mediana"
    }
    else {
      this.enterpriseSize = "Grande"
    }
  }

}
