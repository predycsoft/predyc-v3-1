import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, finalize, firstValueFrom } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-admin-presentation-form',
  templateUrl: './admin-presentation-form.component.html',
  styleUrls: ['./admin-presentation-form.component.css']
})
export class AdminPresentationFormComponent {

  constructor(
    public icon:IconService,
    private alertService: AlertsService,
    private storage: AngularFireStorage,
    private authService: AuthService,

  ) {}

  @Input() adminUser: User;
  @Input() isOtherFormEditing: boolean;
  @Output() onAdminPresentationChange: EventEmitter<{ formValue: FormGroup; isEditing: boolean }> = new EventEmitter<{ formValue: FormGroup; isEditing: boolean }>()

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    photoUrl : "",
    displayName : "Administrador",
    job: null,
  }

  ngOnInit(){
    this.initForm()
    if (this.adminUser.photoUrl) this.imageUrl = this.adminUser.photoUrl;
  }

  initForm() {

    this.form = new FormGroup({
      "photoUrl": new FormControl(""),
      "displayName": new FormControl(""),
      "job": new FormControl("")
    })

    if (this.adminUser) this.form.patchValue(this.adminUser)
    
    this.onAdminPresentationChange.emit({
      formValue: this.form.value,
      isEditing: false
    })

  }

  onClick() {
    if (this.isOtherFormEditing) {
      this.alertService.infoAlert("Primero debes guardar los cambios del otro formulario del administrador.")
      console.error("Primero debes guardar los cambios del otro formulario del administrador.");
      return;
    }
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.onAdminPresentationChange.emit({
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
      await this.saveAdminPhoto()
      if (this.adminUser.photoUrl) this.form.patchValue({photoUrl: this.adminUser.photoUrl});
      this.onAdminPresentationChange.emit({
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

  async saveAdminPhoto() {
    if (this.uploadedImage) {
      if (this.adminUser.photoUrl) {
        // Existing image must be deleted before
        await firstValueFrom(
          this.storage.refFromURL(this.adminUser.photoUrl).delete()
        ).catch((error) => console.log(error));
        console.log('Old image has been deleted!');
      }
      // Upload new image
      const fileName = this.uploadedImage.name.replace(' ', '-');
      const filePath = `${User.storageProfilePhotoFolder}/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImage);
      await new Promise<void>((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(async () => {
            this.adminUser.photoUrl = await firstValueFrom(fileRef.getDownloadURL());
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
      this.adminUser.photoUrl = null
    }

  }

}
