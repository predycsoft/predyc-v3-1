import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CategoryJson, Category } from 'projects/shared/models/category.model';
import { Subscription, Observable, startWith, map } from 'rxjs';
import { EnterpriseJson } from 'shared';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dialog-pillars-form',
  templateUrl: './dialog-pillars-form.component.html',
  styleUrls: ['./dialog-pillars-form.component.css']
})

export class DialogPillarsFormComponent {
  @Input() pillar: CategoryJson;
  
  pillarForm: FormGroup;
  showFormError: boolean = false;
  
  enterpriseSubscription: Subscription;
  filteredEnterprises: Observable<EnterpriseJson[]>;
  enterprises: EnterpriseJson[] = [];
  selectedEnterprise: EnterpriseJson;

  constructor(
    public icon: IconService,
    public modal: NgbActiveModal,
    private categoryService: CategoryService,
    private enterpriseService: EnterpriseService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.loadPillarForm(this.pillar);
    
    this.enterpriseSubscription = this.enterpriseService.getAllEnterprises$().subscribe(enterprises => {
      this.enterprises = enterprises;
      this.filteredEnterprises = this.pillarForm.get('enterprise').valueChanges.pipe(
        startWith(''),
        map(value => this._filterEnterprises(value))
      );
      // Update the form with the loaded enterprises
      this.updateFormWithEnterprise();
    });
  }

  loadPillarForm(pillar: CategoryJson) {
    this.pillarForm = this.fb.group({
      pillarName: [pillar ? pillar.name : '', Validators.required],
      enterprise: ['']
    });
  }

  updateFormWithEnterprise() {
    if (this.pillar && this.pillar.enterprise) {
      const enterprise = this.enterprises.find(x => x.id === this.pillar.enterprise.id);
      if (enterprise) {
        this.pillarForm.patchValue({ enterprise });
      }
    }
  }

  _filterEnterprises(value: string | EnterpriseJson): EnterpriseJson[] {
    const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.name.toLowerCase();
    return this.enterprises.filter(pillar => pillar.name.toLowerCase().includes(filterValue));
  }

  getOptionTextEnterprise(option: EnterpriseJson): string {
    return option ? option.name : '';
  }

  onEnterpriseSelected(enterprise: EnterpriseJson) {
    this.selectedEnterprise = enterprise;
  }

  async savePillar() {
    Swal.fire({
      title: "Generando pilar...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    if (this.pillarForm.valid) {
      const pillarName = this.pillarForm.get('pillarName').value;
      const selectedEnterprise: EnterpriseJson = this.pillarForm.get('enterprise').value;
      const newPillar: CategoryJson = {
        name: pillarName,
        id: this.pillar.id ? this.pillar.id : null,
        enterprise: selectedEnterprise ? this.enterpriseService.getEnterpriseRefById(selectedEnterprise.id) : null
      };
      console.log("newPillar", newPillar)
      try {
        await this.categoryService.addCategory(Category.fromJson(newPillar));
        console.log("Pilar guardado")
        Swal.close();
        this.modal.close();
      } catch (error) {
        console.error("Error: ", error);
        Swal.fire({
          title: "Error!",
          text: `Ha ocurrido un error guardando el pilar. Intentalo de nuevo más tarde.`,
          icon: "warning",
          confirmButtonColor: "var(--blue-5)",
        });
      }
    }
    else {
      this.showFormError = true;
      Swal.close();
    }
  }

  ngOnDestroy() {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe();
  }
}
