import { Component } from '@angular/core';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-enterprise',
  templateUrl: './enterprise.component.html',
  styleUrls: ['./enterprise.component.css']
})
export class EnterpriseComponent {
  
  constructor(
    public icon: IconService
  ) {}

  createEnterprise() {}

  onStudentSelected(event) {console.log("Student Selected!")}

}
