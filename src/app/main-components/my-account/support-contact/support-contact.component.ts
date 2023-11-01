import { Component, Input } from '@angular/core';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-support-contact',
  templateUrl: './support-contact.component.html',
  styleUrls: ['./support-contact.component.css']
})
export class SupportContactComponent {
  @Input() type: string
  constructor(
    private userService: UserService,
    public icon:IconService,

  ){}

  manager: User

  // Crear modelo para este objeto de opciones 
  userTypes = {
    sales: "salesManagerRef",
    account: "accountManagerRef"
  }
  

  async ngOnInit() {
    this.userService.usersLoaded$.subscribe(async isLoaded => {
      if (isLoaded) {
        this.manager = await this.userService.getGeneralUserData(this.userTypes[this.type])
      }
    })
  }

  get text() {
    return {
      sales:  `
        Hola, soy ${this.manager?.displayName}, tu asesor de ventas. No dudes en contactarme para cualquier consulta o asistencia que necesites.
        <br>También puedo ayudarte a adquirir más licencias si es necesario. Estoy aquí para brindarte la mejor experiencia con nuestra plataforma. ¡Bienvenido!
      `,
      account: `
        Hola, soy ${this.manager?.displayName}, estoy aqui como tu account manager en esta aplicación. Si tienes
        alguna pregunta o necesitas asistencia, no dudes en contactarme. 
        <br>Además, cada mes, te proporcionaré un reporte detallado para mantenerte al tanto de los progresos y rendimiento
      `
    };
  }

  
}
