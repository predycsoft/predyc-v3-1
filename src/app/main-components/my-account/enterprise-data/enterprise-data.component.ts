import { Component } from '@angular/core';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';

@Component({
  selector: 'app-enterprise-data',
  templateUrl: './enterprise-data.component.html',
  styleUrls: ['./enterprise-data.component.css']
})
export class EnterpriseDataComponent {

  constructor (
    private enterpriseService: EnterpriseService,
  ){}

  enterprise: Enterprise

  // From presentation form (above form)
  presentationData = {}
  originalPresentationData: any; 
  // From info form (below form)
  infoData = {}
  originalInfoData: any; 

  async ngOnInit(){
    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()
  }

    onEnterprisePresentationChangeHandler(data: { formValue: Object; isEditing: boolean }) {
      this.handleDataChange(data, 'presentation');
    }
  
    onEnterpriseInfoChangeHandler(data: { formValue: Object; isEditing: boolean }) {
      this.handleDataChange(data, 'info');
    }
  
    handleDataChange(data: { formValue: Object; isEditing: boolean }, type: string) {
      try {
        if (data.formValue) {
          if (type === 'presentation') {
            if(!this.originalPresentationData){ 
              this.originalPresentationData = data.formValue
            };
            this.presentationData = data.formValue;
            if (!data.isEditing && this.hasDataChanged('presentation')) {
              this.onUpdate()
            }
          } 
          else if (type === 'info') {
            if(!this.originalInfoData){ 
              this.originalInfoData = data.formValue
            };
            this.infoData = data.formValue;
            if (!data.isEditing && this.hasDataChanged('info')) {
              this.onUpdate()
            }
          }
        }
      } catch (error) {
        console.log(error);
      }
    }
  
    hasDataChanged(type: string): boolean {
      if (type === 'presentation') {
        return JSON.stringify(this.originalPresentationData) !== JSON.stringify(this.presentationData);
      } 
      else if (type === 'info') {
        return JSON.stringify(this.originalInfoData) !== JSON.stringify(this.infoData);
      }
      return false;
    }
  
    async onUpdate() {
      const newData = { 
        photoUrl: this.presentationData["photoUrl"],
        name: this.presentationData["name"],
        socialNetworks: {
          facebook: this.presentationData["facebook"],
          instagram: this.presentationData["instagram"],
          linkedin: this.presentationData["linkedin"],
          website: this.presentationData["website"]
        }, 
        ...this.infoData 
      }

      // let updatedEnterprise: Enterprise = {...this.enterprise}
      let updatedEnterprise = {...this.enterprise}

      for (const key in newData) {
        if (Object.hasOwnProperty.call(updatedEnterprise, key)) {
          updatedEnterprise[key] = newData[key];
        }
      }
      
      console.log("updatedEnterprise nuevo")
      console.log(updatedEnterprise)

      await this.enterpriseService.editEnterprise(updatedEnterprise)
      
      // Descomentar la siguiente linea
      // this.enterprise = { ...updatedEnterprise}
      this.originalInfoData = { ...this.infoData }
      this.originalPresentationData = { ...this.presentationData }
    }
}
