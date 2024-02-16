import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
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
  isPresentationFormEditing = false;
  // From info form (below form)
  infoData = {}
  originalInfoData: any; 
  isInfoFormEditing = false;

  enterpriseSubscription: Subscription

  ngOnInit(){
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
      }
    })
  }

  onEnterprisePresentationChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    this.isPresentationFormEditing = data.isEditing;
    this.handleDataChange(data, 'presentation');
  }
  
  onEnterpriseInfoChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    this.isInfoFormEditing = data.isEditing;
    this.handleDataChange(data, 'info');
  }

  handleDataChange(data: { formValue: Object; isEditing: boolean }, type: string) {
    try {
      if (data.formValue) {
        if (type === 'presentation') {
          if(!this.originalPresentationData){ 
            this.originalPresentationData = data.formValue
          };
          this.presentationData = {
            ...data.formValue,
            name: data.formValue["name"].toLowerCase()
          };
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

    let updatedEnterprise: Enterprise = Enterprise.fromJson({...this.enterprise})

    for (const key in newData) {
      if (Object.hasOwnProperty.call(updatedEnterprise, key)) {
        updatedEnterprise[key] = newData[key];
      }
    }

    await this.enterpriseService.editEnterprise(updatedEnterprise.toJson())
    
    // Descomentar la siguiente linea
    this.enterprise = Enterprise.fromJson({ ...updatedEnterprise})
    this.originalInfoData = { ...this.infoData }
    this.originalPresentationData = { ...this.presentationData }
  }

  ngOnDestroy() {
    this.enterpriseSubscription.unsubscribe()
  }
}
