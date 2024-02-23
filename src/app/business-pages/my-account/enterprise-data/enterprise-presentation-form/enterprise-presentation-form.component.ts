import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { AlertsService } from 'src/shared/services/alerts.service';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-enterprise-presentation-form',
  templateUrl: './enterprise-presentation-form.component.html',
  styleUrls: ['./enterprise-presentation-form.component.css']
})
export class EnterprisePresentationFormComponent {

  constructor(
    public icon:IconService,
    private alertService: AlertsService,
    private storage: AngularFireStorage,

  ) {}
  
  @Input() enterprise: Enterprise;
  @Input() isOtherFormEditing: boolean;
  @Output() onEnterprisePresentationChange: EventEmitter<{ formValue: FormGroup; isEditing: boolean }> = new EventEmitter<{ formValue: FormGroup; isEditing: boolean }>()

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  isEditing = false

  form: FormGroup

  enterpriseSubscription: Subscription


  onNullFormValues = {
    photoUrl: null,
    name: "Empresa",
    facebook: "Facebook desconocido",
    instagram: "Instagram desconocido",
    website: "Página web desconocida",
    linkedin: "Linkedin desconocido",
  }

  async ngOnInit() {
      this.initForm()
      if (this.enterprise.photoUrl) this.imageUrl = this.enterprise.photoUrl;
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
    
    this.form = new FormGroup({
      "photoUrl": new FormControl(photoUrl),
      "name": new FormControl(name),
      "facebook": new FormControl(facebook),
      "instagram": new FormControl(instagram),
      "website": new FormControl(website),
      "linkedin": new FormControl(linkedin),
    })
    
    if (this.enterprise) this.form.patchValue(this.enterprise)

    this.onEnterprisePresentationChange.emit({
      formValue: this.form.value,
      isEditing: false
    })
  }

  onClick() {
    if (this.isOtherFormEditing) {
      this.alertService.infoAlert("Primero debes guardar los cambios del otro formulario de la empresa.")
      console.error("El otro formulario está en modo de edición.");
      return;
    }
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

  async onSubmit() {
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      await this.saveEnterprisePhoto()
      if (this.enterprise.photoUrl) this.form.patchValue({photoUrl: this.enterprise.photoUrl});
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
    // if (file.type !== 'image/webp') {
    //   this.alertService.errorAlert(`La imagen seleccionada debe tener formato:  WEBP`);
    //   return;
    // }
    /* checking size here - 10MB */
    const imageMaxSize = 10000000;
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

  async saveEnterprisePhoto() {
    if (this.uploadedImage) {
      if (this.enterprise.photoUrl) {
        // Existing image must be deleted before
        await firstValueFrom(
          this.storage.refFromURL(this.enterprise.photoUrl).delete()
        ).catch((error) => console.log(error));
        console.log('Old image has been deleted!');
      }
      // Upload new image
      const fileName = this.uploadedImage.name.replace(' ', '-');
      const filePath = `${Enterprise.storageProfilePhotoFolder}/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImage);
      await new Promise<void>((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(async () => {
            this.enterprise.photoUrl = await firstValueFrom(fileRef.getDownloadURL());
            console.log("Se ha guardado la imagen");
            this.uploadedImage = null
            resolve();
          })
        ).subscribe({
          next: () => {},
          error: error => reject(error),
        });
      });
    } else {
      this.enterprise.photoUrl = null
    }

  }

}
