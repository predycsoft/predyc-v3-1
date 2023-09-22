import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css']
})
export class MyAccountComponent {

  constructor(
    private authService: AuthService,
    public icon:IconService,
    private enterpriseService: EnterpriseService,

  ) {}

  user: User
  enterprise: Enterprise

  questions = [
    "¿Cómo agrego nuevos empleados a la plataforma?",
    "¿Qué debo hacer si un empleado olvida sus contraseña o tiene problemas para iniciar sesión?",
    "¿Cómo asigno cursos a empleados específicos?",
    "¿Cómo se gestionan las licencias de acceso a los cursos?",
    "¿Puedo verificar el progreso de los empleados en sus cursos?",
    "¿Cómo puedo personalizar la plataforma para que se adapte a las necesidades específicas de mi empresa?",
    "¿Cuál es el proceso para agregar nuevos cursos o contenidos a la plataforma?",
    "¿Qué opciones de facturación y pago están disponibles para licencias de acceso?",
    "¿Cuál es el proceso de configuración inicial de la plataforma para mi empresa?",
    "¿Puedo personalizar los informes y estadísticas para obtener información específica sobre el progreso de los empleados?",
  ]

  isEditing = false

  enterpriseSocialDataForm: FormGroup = new FormGroup({
    "enterprisePhotoUrl": new FormControl(null),
    "enterpriseName": new FormControl(null),
    "enterpriseFacebook": new FormControl(null),
    "enterpriseInstagram": new FormControl(null),
    "enterpriseWebsite": new FormControl(null),
    "enterpriseLinkedin": new FormControl(null),
  })
  enterpriseGeneralDataForm: FormGroup = new FormGroup({
    "enterpriseDescription": new FormControl(null),
    "enterpriseSector": new FormControl(null),
    "enterpriseSize": new FormControl(null),
    "enterpriseEmployesNo": new FormControl(null),
    "enterpriseCountry": new FormControl(null),
    "enterpriseCity": new FormControl(null),
    "enterprisePostalCode": new FormControl(null),
  })

  adminSocialDataForm: FormGroup = new FormGroup({
    "adminPhotoUrl": new FormControl(null),
    "adminFullName": new FormControl(null),
    "adminJob": new FormControl(null),
  })
  adminGeneralDataForm: FormGroup = new FormGroup({
    "adminName": new FormControl(null),
    "adminEmail": new FormControl(null),
    "adminJob": new FormControl(null),
    "adminLastName": new FormControl(null),
    "adminPhone": new FormControl(null),
    "adminCountry": new FormControl(null),
    "adminCity": new FormControl(null),
    "adminPostalCode": new FormControl(null),
  })

  

  async ngOnInit(){
    this.authService.user$.subscribe(user=> {
      this.user = user
      console.log("user")
      console.log(user)
    })

    await this.enterpriseService.whenEnterpriseLoaded()
    this.enterprise = this.enterpriseService.getEnterprise()
    console.log("this.enterprise")
    console.log(this.enterprise)

  }

  signOut() {
    this.authService.signOut();
  }

}
