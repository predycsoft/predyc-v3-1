import { Component, Input } from '@angular/core';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';

interface Course {
  courseTitle: string,
  duration: number
}

interface Month {
  name: string;
  courses: Course[];
}

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.css']
})
export class StudentDetailsComponent {
  
  @Input() student: User
  constructor(
    public icon: IconService,
    private profileService: ProfileService,
  ){}

  studentProfile: Profile
  

  // -------------------------------- hardcode data
  months: Month[] = [
    {
      name: "Noviembre",
      courses: [
        {
          courseTitle: "Estrategias de Mantenimiento",
          duration: 1,
        },
        {
          courseTitle: "Gestión de Paradas de Mantenimiento",
          duration: 5,
        },
        {
          courseTitle: "Fundamentos Técnicos de Tribología y Lubricación",
          duration: 3,
        },
      ],
    },
    {
      name: "Octubre",
      courses: [
        {
          courseTitle: "Administración del Mantenimiento",
          duration: 2,
        },
        {
          courseTitle: "Gestión de Costos de Mantenimiento",
          duration: 4,
        },
        {
          courseTitle: "Gestión de Mantenimiento en SAP",
          duration: 6,
        },
      ],
    },
    {
      name: "Septiembre",
      courses: [
        {
          courseTitle: "Motocompresor Reciprocante: Funcionamiento, Operación y Mantenimiento",
          duration: 8,
        },
        {
          courseTitle: "Bombas Rotativas",
          duration: 7,
        },
        {
          courseTitle: "Bombas Reciprocantes",
          duration: 9,
        },
      ],
    },
    {
      name: "Agosto",
      courses: [
        {
          courseTitle: "Motores electricos",
          duration: 8,
        },
        {
          courseTitle: "Gestión de los interesado",
          duration: 7,
        },
        {
          courseTitle: "Fundamentos de Dirección de Proyectos",
          duration: 9,
        },
      ],
    },
  ];

  competences = [
    {
      title: "Pilar 1: Mantenimiento",
      categories: [
        "Equipos Estáticos",
        "VDF",
        "VDF",
        "Mecánica de precisión",
        "Equipos Estáticos",
        "Mecánica de precisión"
      ]
    },
    {
      title: "Pilar 2: Industria 4.0",
      categories: [
        "Motores eléctricos",
        "Puesta a tierra",
        "Calibración",
        "Motores eléctricos",
        "Calibración",
        "Puesta a tierra"
      ]
    },
    {
      title: "Pilar 3: Procesos",
      categories: [
        "Compresores",
        "Control de Fluidos",
        "Neumática",
        "Neumática",
        "Control de Fluidos",
        "Compresores",
      ]
    }
  ];
  
  // --------------------------------


  ngOnInit() {
    this.studentProfile = this.profileService.getProfile(this.student.profile.id)
    console.log(this.student)
  }
  
}
