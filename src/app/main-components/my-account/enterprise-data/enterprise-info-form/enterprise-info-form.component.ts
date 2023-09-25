import { Component, EventEmitter, Output } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { zip } from 'rxjs';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-enterprise-info-form',
  templateUrl: './enterprise-info-form.component.html',
  styleUrls: ['./enterprise-info-form.component.css']
})
export class EnterpriseInfoFormComponent {
  
  constructor(
    private authService: AuthService,
    public icon:IconService,
    private alertService: AlertsService,
    private enterpriseService: EnterpriseService,

  ) {}

  @Output() onEnterpriseInfoChange: EventEmitter<any> = new EventEmitter<any>()


  user: User
  enterprise: Enterprise

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  isEditing = false

  form: FormGroup

  async ngOnInit(){
    this.authService.user$.subscribe(user=> {
      this.user = user
  
    })
    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()

    if (this.enterprise.photoUrl) {
      this.imageUrl = this.enterprise.photoUrl;
    }

    this.initForm()
    console.log("this.form.value")
    console.log(this.form.value)
  
  }

  initForm() {
    let description = "Sin descripción"
    let workField = "Sector desconocido"
    let size = "Tamaño desconocido"
    let employesNo = "Cantidad desconocida"
    let country = "País desconocido"
    let city = "Ciudad desconocida"
    let zipCode = "Código postal desconocido"

    // Aqui calculamos de size, employesNo
    
    //

    this.form =  new FormGroup({
      "description": new FormControl(description),
      "workField": new FormControl(workField),
      "size": new FormControl(size),
      "employesNo": new FormControl(employesNo),
      "country": new FormControl(country),
      "city": new FormControl(city),
      "zipCode": new FormControl(zipCode),
    })

    this.form.patchValue(this.enterprise)

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
      this.onEnterpriseInfoChange.emit(this.form.value)
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
