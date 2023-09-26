import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-enterprise-presentation-form',
  templateUrl: './enterprise-presentation-form.component.html',
  styleUrls: ['./enterprise-presentation-form.component.css']
})
export class EnterprisePresentationFormComponent {

  constructor(
    public icon:IconService,
    private alertService: AlertsService,
    private enterpriseService: EnterpriseService,

  ) {}

  @Output() onEnterprisePresentationChange: EventEmitter<{ formValue: FormGroup; isEditing: boolean }> = new EventEmitter<{ formValue: FormGroup; isEditing: boolean }>()


  enterprise: Enterprise

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    photoUrl: null,
    name: "Empresa",
    facebook: "Facebook desconocido",
    instagram: "Instagram desconocido",
    website: "Página web desconocida",
    linkedin: "Linkedin desconocido",
  }

  async ngOnInit(){
    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()

    if (this.enterprise.photoUrl) {
      this.imageUrl = this.enterprise.photoUrl;
    }

    this.initForm()
  }

  initForm() {

    const socialNetworks = this.enterprise.socialNetworks
    let facebook = ""
    let instagram = ""
    let website = ""
    let linkedin = ""
    let name = ""
    let photoUrl = ""
    if (socialNetworks) {
      facebook = socialNetworks.facebook ? socialNetworks.facebook : facebook
      instagram = socialNetworks.instagram ? socialNetworks.instagram : instagram
      website = socialNetworks.website ? socialNetworks.website : website
      linkedin = socialNetworks.linkedin ? socialNetworks.linkedin : linkedin
    }
    name = this.enterprise.name ? this.enterprise.name : name
    photoUrl = this.enterprise.photoUrl ? this.enterprise.photoUrl : photoUrl
    

    this.form = new FormGroup({
      "photoUrl": new FormControl(photoUrl),
      "name": new FormControl(name),
      "facebook": new FormControl(facebook),
      "instagram": new FormControl(instagram),
      "website": new FormControl(website),
      "linkedin": new FormControl(linkedin),
    })

    this.onEnterprisePresentationChange.emit({
      formValue: this.form.value,
      isEditing: false
    })
  }

  onClick() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.onEnterprisePresentationChange.emit({
        formValue: null,
        isEditing: true
      })
    }
    else {
      this.onSubmit();
    }
  }

  async onSubmit(){
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      this.onEnterprisePresentationChange.emit({
        formValue: this.form.value,
        isEditing: false
      })
    }
    else {
      Object.keys(controls).forEach(prop => {
        if (!controls[prop].valid && !controls[prop].disabled ) {
          if (controls[prop].touched) {
            console.log(`El valor de "${prop}" es invalido`)
          }
          else {
            console.log(`Debes llenar el campo "${prop}"`)
          }
        }
      });
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || !input.files[0] || input.files[0].length === 0) {
      this.alertService.errorAlert(`Debe seleccionar una imagen`);
      return;
    }
    const file = input.files[0];
    if (file.type !== 'image/webp') {
      this.alertService.errorAlert(`La imagen seleccionada debe tener formato:  WEBP`);
      return;
    }
    /* checking size here - 1MB */
    const imageMaxSize = 1000000;
    if (file.size > imageMaxSize) {
      this.alertService.errorAlert(`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.imageUrl = reader.result;
      this.uploadedImage = file;
    };

  }


}
