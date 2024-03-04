import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-enterprise',
  templateUrl: './enterprise.component.html',
  styleUrls: ['./enterprise.component.css']
})
export class EnterpriseComponent {
  
  constructor(
    public icon: IconService,
    private router: Router,

  ) {}

  createEnterprise() {
      this.router.navigate(["/admin/enterprises/form"])
  }

  onStudentSelected(event) {console.log("Student Selected!")}

}
