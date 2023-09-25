import { Component } from '@angular/core';

@Component({
  selector: 'app-enterprise-data',
  templateUrl: './enterprise-data.component.html',
  styleUrls: ['./enterprise-data.component.css']
})
export class EnterpriseDataComponent {

  presentationData = {}
  infoData = {}


  onEnterprisePresentationChangeHandler(data) {
    try {
      console.log("Enterprise presentation data")
      console.log(data)
      this.presentationData = data
    } catch (error) {
      console.log(error)
    }
  }

  onEnterpriseInfoChangeHandler(data) {
    try {
      console.log("Enterprise info data")
      console.log(data)
      this.infoData = data
    } catch (error) {
      console.log(error)
    }
  }

  onUpdate() {
    const enterpriseNewData = {...this.presentationData, ...this.infoData}
    console.log("enterpriseNewData")
    console.log(enterpriseNewData)
  }
}
