import { Component } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { DialogPillarsFormComponent } from './dialog-pillars-form/dialog-pillars-form.component';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { EnterpriseJson } from 'projects/shared/models/enterprise.model';

@Component({
  selector: 'app-pillars',
  templateUrl: './pillars.component.html',
  styleUrls: ['./pillars.component.css']
})
export class PillarsComponent {
  constructor(
    public icon: IconService,
		private modalService: NgbModal,
    public dialogService: DialogService,

  ){}

  pillarForm: FormGroup;
  newPillarName: string = '';
  createPillarModal;
  showFormError: boolean = false;

  enterpriseForm = new FormControl();
  enterpriseSubscription: Subscription
  filteredEnterprises: Observable<EnterpriseJson[]>;
  enterprises: EnterpriseJson[] = []
  selectedEnterprise: EnterpriseJson;


  ngOnInit() {
  }

  openCreatePillarModal() {
    const modalRef = this.modalService.open(DialogPillarsFormComponent, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.pillar = null;
  }

}
