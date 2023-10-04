import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    private route: ActivatedRoute

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

  activeTab: number = 0;

  async ngOnInit(){
    this.authService.user$.subscribe(user=> {
      if (user) {
        this.user = user
      }
    })
     this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
      }
    })
    this.route.queryParams.subscribe(params => {
      this.activeTab = params['activeTab'] === 'soporte' ? 1 : 0;
    });
  }

  signOut() {
    this.authService.signOut();
  }

}
