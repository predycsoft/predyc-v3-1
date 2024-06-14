import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CreateDemoComponent } from '../create-demo/create-demo.component';
import { firstValueFrom } from 'rxjs';
import { AngularFireFunctions } from '@angular/fire/compat/functions';

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
    private fireFunctions: AngularFireFunctions,
  ) {}

  createEnterprise() {
    this.router.navigate(["/admin/enterprises/form"])
  }

  async updateEmpresasUsage() {
    await firstValueFrom(this.fireFunctions.httpsCallable('updateDataAllEnterprisesUsage')(null));
    await firstValueFrom(this.fireFunctions.httpsCallable('updateDataAllEnterprisesRhythm')(null));
  }


  empresasActive = 0
  empresasInactive = 0
  empresasTotales = 0
  empresasDemo = 0



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
    let demo = empresas.filter(x=>x.demo)
    console.log('empresas',actives,inactives,empresas)
    this.empresasActive = actives.length
    this.empresasInactive = inactives.length
    this.empresasDemo= demo.length
    this.empresasTotales = empresas.length
  }

  onStudentSelected(event) {console.log("Student Selected!")}

}
