import { Component } from '@angular/core';
import { User } from 'src/app/shared/models/user.model';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-admin-data',
  templateUrl: './admin-data.component.html',
  styleUrls: ['./admin-data.component.css']
})
export class AdminDataComponent {

  constructor(
    private userService: UserService,
  ){}

  // From presentation form (above form)
  presentationData = {}
  originalPresentationData: any; 
  // From info form (below form)
  infoData = {}
  originalInfoData: any; 

  adminUser: User

  async ngOnInit(){
    this.userService.getUsersObservable().subscribe(users => {
      if(users.length > 0) {
        const adminUsers = users.filter(x => x.role === "admin")
        this.adminUser = adminUsers.length > 0? adminUsers[0]: null
      }
    })

  }

  onAdminPresentationChangeHandler(data: { formValue: Object; isEditing: boolean }) {
    this.handleDataChange(data, 'presentation');
  }

  onAdminInfoChangeHandler(data: { formValue: Object; isEditing: boolean }) {
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
    const newData = { ...this.presentationData, ...this.infoData }

    // let updatedAdmin: User = {...this.enterprise}
    let updatedAdmin = {...this.adminUser}

    for (const key in newData) {
      if (Object.hasOwnProperty.call(updatedAdmin, key)) {
        updatedAdmin[key] = newData[key];
      }
    }


    console.log("updatedAdmin nuevo")
    console.log(updatedAdmin)

    await this.userService.editUser(updatedAdmin)

    // Descomentar la siguiente linea
    // this.adminUser = { ...updatedAdmin}
    this.originalInfoData = { ...this.infoData }
    this.originalPresentationData = { ...this.presentationData }
  }


}
