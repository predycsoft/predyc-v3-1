import { Component, Input } from '@angular/core';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { DocumentReference } from '@angular/fire/compat/firestore';

@Component({
  selector: 'app-enterprise-students',
  templateUrl: './enterprise-students.component.html',
  styleUrls: ['./enterprise-students.component.css']
})
export class EnterpriseStudentsComponent {

  @Input() enterprise: Enterprise
  enterpriseRef: DocumentReference<Enterprise>
  constructor(
    public icon: IconService,
    public dialogService: DialogService,
    private entepriseService: EnterpriseService,
  ){}




  ngOnInit() {
    this.enterpriseRef = this.entepriseService.getEnterpriseRefById(this.enterprise.id)

  }


  ngAfterViewInit() {
  }


  async onSelect() {

  }





  addAdmins() {

  }

  addUser(){

  }

}
