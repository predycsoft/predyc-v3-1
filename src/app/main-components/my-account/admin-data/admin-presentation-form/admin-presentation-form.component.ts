import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-admin-presentation-form',
  templateUrl: './admin-presentation-form.component.html',
  styleUrls: ['./admin-presentation-form.component.css']
})
export class AdminPresentationFormComponent {

  constructor(
    private authService: AuthService,
    public icon:IconService,
    private alertService: AlertsService,
    private userService: UserService,

  ) {}

  @Output() onAdminPresentationChange: EventEmitter<any> = new EventEmitter<any>()

  user: User
  adminUser: User

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  isEditing = false

  form: FormGroup

  async ngOnInit(){
    this.authService.user$.subscribe(user=> {
      this.user = user
    })

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
    let photoUrl = null
    let name = "Administrador desconocido"
    let job = null

    this.form = new FormGroup({
      "photoUrl": new FormControl(photoUrl),
      "name": new FormControl(name),
      "job": new FormControl(job)
    })

    if (this.adminUser) {
      this.form.patchValue(this.adminUser)
    }

  }

  onClick() {
    if (this.isEditing) {
      this.onSubmit();
    }
    this.isEditing = !this.isEditing;
  }

  async onSubmit(){
    const controls = this.form.controls
    if (this.form.status === "VALID") {
      this.onAdminPresentationChange.emit(this.form.value)
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
