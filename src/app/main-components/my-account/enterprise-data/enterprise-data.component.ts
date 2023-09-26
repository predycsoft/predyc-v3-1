import { Component } from '@angular/core';

@Component({
  selector: 'app-enterprise-data',
  templateUrl: './enterprise-data.component.html',
  styleUrls: ['./enterprise-data.component.css']
})
export class EnterpriseDataComponent {

  // From presentation form (above form)
  presentationData = {}
  presentationEditingFlag = false
  originalPresentationData: any; 
  // From info form (below form)
  infoData = {}
  infoEditingFlag = false
  originalInfoData: any; 


  onEnterprisePresentationChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    try {
      if (data.formValue){
        // Si es la primera carga, almacenar el valor original.
        if(!this.originalPresentationData){ 
          this.originalPresentationData = data.formValue
        };
        // Almacena el valor actual del formulario.
        this.presentationData = data.formValue;
      }
      this.presentationEditingFlag = data.isEditing;
    } catch (error) {
      console.log(error)
    }
  }

  onEnterpriseInfoChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    try {
      if (data.formValue){
        if(!this.originalInfoData){ 
          this.originalInfoData = data.formValue
        };
        this.infoData = data.formValue;
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
