import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-data',
  templateUrl: './admin-data.component.html',
  styleUrls: ['./admin-data.component.css']
})
export class AdminDataComponent {

  presentationData = {}
  infoData = {}


  onAdminPresentationChangeHandler(data) {
    try {
      console.log("Admin presentation data")
      console.log(data)
      this.presentationData = data
    } catch (error) {
      console.log(error)
    }
  }

  onAdminInfoChangeHandler(data) {
    try {
      console.log("Admin info data")
      console.log(data)
      this.infoData = data
    } catch (error) {
      console.log(error)
    }
  }

  onUpdate() {
    const adminNewData = {...this.presentationData, ...this.infoData}
    console.log("adminNewData")
    console.log(adminNewData)
  }


}
