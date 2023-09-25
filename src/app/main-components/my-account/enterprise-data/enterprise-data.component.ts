import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'app-enterprise-data',
  templateUrl: './enterprise-data.component.html',
  styleUrls: ['./enterprise-data.component.css']
})
export class EnterpriseDataComponent {

  presentationData = {}
  presentationEditingFlag = false
  infoData = {}
  infoEditingFlag = false

  originalInfoData: any; 
  originalPresentationData: any; 


  onEnterprisePresentationChangeHandler(data: { formValue: FormGroup; isEditing: boolean }) {
    try {
      if (data.formValue){
        // Si es la primera carga, almacenar el valor original.
        if(!this.originalPresentationData){ 
          this.originalPresentationData = data.formValue.value
        };
        // Almacena el valor actual del formulario.
        this.presentationData = data.formValue.value;
      }
      this.presentationEditingFlag = data.isEditing;
    } catch (error) {
      console.log(error)
    }
  }

  onEnterpriseInfoChangeHandler(data: { formValue: FormGroup; isEditing: boolean }) {
    try {
      if (data.formValue){
        if(!this.originalInfoData){ 
          this.originalInfoData = data.formValue.value
        };
        this.infoData = data.formValue.value;
      }
      this.infoEditingFlag = data.isEditing;
    } catch (error) {
      console.log(error)
    }
  }

  showButton(): boolean {
    return !this.presentationEditingFlag && !this.infoEditingFlag && 
    (JSON.stringify(this.originalInfoData) !== JSON.stringify(this.infoData) || JSON.stringify(this.originalPresentationData) !== JSON.stringify(this.presentationData));
  }

  onUpdate() {
    const enterpriseNewData = {...this.presentationData, ...this.infoData}
    console.log("enterpriseNewData")
    console.log(enterpriseNewData)

    this.originalInfoData = this.infoData
    this.originalPresentationData = this.presentationData
  }
}
