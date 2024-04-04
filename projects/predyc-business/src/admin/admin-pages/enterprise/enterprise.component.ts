import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CreateDemoComponent } from '../create-demo/create-demo.component';

@Component({
  selector: 'app-enterprise',
  templateUrl: './enterprise.component.html',
  styleUrls: ['./enterprise.component.css']
})
export class EnterpriseComponent {
  
  constructor(
    public icon: IconService,
    private router: Router,
		private modalService: NgbModal,

  ) {}

  createEnterprise() {
    this.router.navigate(["/admin/enterprises/form"])
  }

  createDemo() {
    this.modalService.open(CreateDemoComponent, {
			animation: true,
			centered: true,
			size: "md",
			backdrop: "static",
			keyboard: false,
		});
  }

  onStudentSelected(event) {console.log("Student Selected!")}

}
