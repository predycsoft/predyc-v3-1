import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { AlertsService } from 'src/shared/services/alerts.service';
import { EnterpriseService } from 'src/shared/services/enterprise.service';

@Component({
  selector: 'app-enterprise-info',
  templateUrl: './enterprise-info.component.html',
  styleUrls: ['./enterprise-info.component.css']
})
export class EnterpriseInfoComponent {

  @Input() enterprise: Enterprise

  constructor(
    private fb: FormBuilder,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService,
  ) {}

  enterpriseForm: FormGroup
  imageUrl: string

  ngOnInit() {
    this.setupForm()
  }

  async setupForm() {
    this.enterpriseForm = this.fb.group({
      name: [null, [Validators.required]],
      summary: [null],
      description: [null],
      website: [null],
      linkedin: [null],
      photoUrl: [null],
    });
    // Edit mode
    if (this.enterprise) {
      this.enterpriseForm.patchValue({
        name: this.enterprise.name,
        summary: "",
        description: this.enterprise.description,
        website: this.enterprise.socialNetworks.website,
        linkedin: this.enterprise.socialNetworks.linkedin,
        photoUrl: this.enterprise.photoUrl
      });
      // this.enterpriseForm.get('name')?.disable();
      if (this.enterprise.photoUrl) {
        this.imageUrl = this.enterprise.photoUrl;
      }
    }

  }

  cargarFoto(event, campo) {
  }

  async onSubmit() {
    const formValue = this.enterpriseForm.value
    // console.log("form", formValue)

    const enterprise = this.enterprise
    enterprise.name = formValue.name
    // enterprise.summary = formValue.summary
    enterprise.description = formValue.description
    enterprise.socialNetworks.website = formValue.website
    enterprise.socialNetworks.linkedin = formValue.linkedin

    console.log("enterprise Actualizado: ", enterprise)

    try {
      // if (this.enterprise) await this.enterpriseService.editEnterprise(enterprise)
      // else await this.enterpriseService.addEnterprise(enterprise)
      this.alertService.succesAlert('Estudiante agregado exitosamente')
    } catch (error) {
      this.alertService.errorAlert(error)
    }
  }

  getEnterpriseFromForm() {

  }

}
