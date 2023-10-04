import { Component } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

@Component({
  selector: 'app-plan-card',
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.css']
})
export class PlanCardComponent {
  constructor(
    public icon: IconService,
  ) {}

  features = [
    {
      isActive: true,
      text: "Creación de cursos propios"
    },
    {
      isActive: true,
      text: "Acceso ilimitado a cursos"
    },
    {
      isActive: true,
      text: "Consultas con instructor"
    },
    {
      isActive: true,
      text: "Certificado por cada curso"
    },
    {
      isActive: true,
      text: "Creación de departamentos"
    },
    {
      isActive: true,
      text: "Cración de perfiles"
    },
    {
      isActive: true,
      text: "Creación de cronogramas"
    },
    {
      isActive: true,
      text: "Acceso a reportes"
    },
    {
      isActive: true,
      text: "Seguimiento y notificaciones"
    },
    {
      isActive: true,
      text: "Sistema por competencias"
    },
    {
      isActive: true,
      text: "Creación de evaluaviones"
    },
  ]


}
