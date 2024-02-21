import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { User } from 'src/shared/models/user.model';
import { AuthService } from 'src/shared/services/auth.service';
import { UserService } from 'src/shared/services/user.service';

@Component({
  selector: 'app-admin-data',
  templateUrl: './admin-data.component.html',
  styleUrls: ['./admin-data.component.css']
})
export class AdminDataComponent {

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ){}

  // From presentation form (above form)
  presentationData = {}
  originalPresentationData: any; 
  isPresentationFormEditing = false;
  // From info form (below form)
  infoData = {}
  originalInfoData: any; 
  isInfoFormEditing = false;


  adminUser: User
  adminSuscription: Subscription

  async ngOnInit(){
    this.adminSuscription = this.authService.user$.subscribe(user => {
      this.adminUser = user
    })

  }

  onAdminPresentationChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    this.isPresentationFormEditing = data.isEditing;
    this.handleDataChange(data, 'presentation');
  }

  onAdminInfoChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    this.isInfoFormEditing = data.isEditing;
    this.handleDataChange(data, 'info');
  }

  handleDataChange(data: { formValue: Object; isEditing: boolean }, type: string) {
    try {
      if (data.formValue) {
        if (type === 'presentation') {
          if(!this.originalPresentationData){ 
            this.originalPresentationData = {
              ...data.formValue,
              displayName: data.formValue["displayName"].toLowerCase()
            }
          };
          this.presentationData = {
            ...data.formValue,
            displayName: data.formValue["displayName"].toLowerCase()
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
    const newData = { ...this.presentationData, ...this.infoData }

    let updatedAdmin: User = User.fromJson({...this.adminUser}) 

    for (const key in newData) {
      if (Object.hasOwnProperty.call(updatedAdmin, key)) {
        updatedAdmin[key] = newData[key];
      }
    }

    console.log("updatedAdmin nuevo")
    console.log(updatedAdmin)

    await this.userService.editUser(updatedAdmin.toJson())

    // Descomentar la siguiente linea
    this.adminUser = User.fromJson({ ...updatedAdmin})
    this.originalInfoData = { ...this.infoData }
    this.originalPresentationData = { ...this.presentationData }
  }
  
  ngOnDestroy() {
    this.adminSuscription.unsubscribe()
  }


}
