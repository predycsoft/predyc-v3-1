import { Component, EventEmitter, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
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
    private authService: AuthService,
    // private userService: UserService,

  ) {}

  @Output() onAdminPresentationChange: EventEmitter<{ formValue: FormGroup; isEditing: boolean }> = new EventEmitter<{ formValue: FormGroup; isEditing: boolean }>()

  // adminUser: User
  adminUser$: Observable<User>

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

    this.adminUser$ = this.authService.user$
    this.adminUser$.subscribe(adminUser => {
      if(adminUser){
        this.initForm(adminUser)
        if (adminUser.photoUrl) {
          this.imageUrl = adminUser.photoUrl;
        }
      }
    })

  }

  initForm(adminUser: User) {

    this.form = new FormGroup({
      "photoUrl": new FormControl(""),
      "name": new FormControl(""),
      "job": new FormControl("")
    })

    if (adminUser) {
      this.form.patchValue(adminUser)
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
