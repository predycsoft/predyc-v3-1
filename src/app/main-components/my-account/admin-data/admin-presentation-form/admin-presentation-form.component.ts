import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-admin-presentation-form',
  templateUrl: './admin-presentation-form.component.html',
  styleUrls: ['./admin-presentation-form.component.css']
})
export class AdminPresentationFormComponent {

  constructor(
    public icon:IconService,
    private alertService: AlertsService,
    private userService: UserService,

  ) {}

  @Output() onAdminPresentationChange: EventEmitter<{ formValue: FormGroup; isEditing: boolean }> = new EventEmitter<{ formValue: FormGroup; isEditing: boolean }>()

  adminUser: User

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  isEditing = false

  form: FormGroup

  onNullFormValues = {
    photoUrl : "",
    name : "Administrador",
    job: null,
  }

  async ngOnInit(){

    this.userService.getUsersObservable().subscribe(users => {
      if(users.length > 0) {
        const adminUsers = users.filter(x => x.role === "admin")
        this.adminUser = adminUsers.length > 0? adminUsers[0]: null
        this.initForm()
      }
    })

    if (this.adminUser.photoUrl) {
      this.imageUrl = this.adminUser.photoUrl;
    }


  }

  initForm() {

    this.form = new FormGroup({
      "photoUrl": new FormControl(null),
      "name": new FormControl(null),
      "job": new FormControl(null)
    })

    if (this.adminUser) {
      this.form.patchValue(this.adminUser)
    }

    this.onAdminPresentationChange.emit({
      formValue: this.form.value,
      isEditing: false
    })

  }

  onClick() {
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
