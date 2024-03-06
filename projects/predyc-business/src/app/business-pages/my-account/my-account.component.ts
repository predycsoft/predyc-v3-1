import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { AuthService } from 'projects/predyc-business/src/shared/services/auth.service';
@Component({
  selector: 'app-my-account',
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.css']
})
export class MyAccountComponent {

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute

  ) {}

  user: User
  salesManager

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
    this.route.queryParams.subscribe(params => {
      this.activeTab = params['activeTab'] === 'soporte' ? 1 : 0;
    });
  }

  signOut() {
    this.authService.signOut();
  }

}
