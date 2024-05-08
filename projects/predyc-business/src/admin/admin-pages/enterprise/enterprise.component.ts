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


  empresasActive = 0
  empresasInactive = 0
  empresasTotales = 0


  createDemo() {
    this.modalService.open(CreateDemoComponent, {
			animation: true,
			centered: true,
			size: "md",
			backdrop: "static",
			keyboard: false,
		});
  }

  getEmpresas(empresas){
    let inactives = empresas.filter(x=>x.status == 'inactive')
    let actives = empresas.filter(x=>x.status == 'active')
    console.log('empresas',actives,inactives,empresas)
    this.empresasActive = actives.length
    this.empresasInactive = inactives.length
    this.empresasTotales = empresas.length
  }

  onStudentSelected(event) {console.log("Student Selected!")}

}
