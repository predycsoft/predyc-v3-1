import { Component } from '@angular/core';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-study-plan',
  templateUrl: './study-plan.component.html',
  styleUrls: ['./study-plan.component.css']
})
export class StudyPlanComponent {

  firstStartDate = 1680528000000 //1 oct
  oneDay = 24 * 60 * 60 * 1000
  today = Date.now()

  studyPlanArr = [
    [
      { courseTitle: "Venta del valor generado en el de mantenimiento", startDate: this.firstStartDate, endDate: 0, completionDate: 0 },
      { courseTitle: "Gestión y optimización del mantneimiento", startDate: 0, endDate: 0, completionDate: 0 },
      { courseTitle: "Fundamentos en proyectos de confiabilidad", startDate: 0, endDate: 0, completionDate: 0 },
      { courseTitle: "Análisis de fluidos lubricantes", startDate: 0, endDate: 0, completionDate: 0 },
      { courseTitle: "Gestión de paradas de mantenimiento", startDate: 0, endDate: 0, completionDate: 0 },
      { courseTitle: "Aplicación de lubricantes en la industria", startDate: 0, endDate: 0, completionDate: 0 },
      { courseTitle: "Transición a la industriA 4.0", startDate: 0, endDate: 0, completionDate: 0 },
      { courseTitle: "Proceso de gestión de mantenimiento", startDate: 0, endDate: 0, completionDate: 0 },
    ],
    [
      { courseTitle: "Contabilidad financiera para ingenieros", startDate: 0, endDate: 0, completionDate: 0},
      { courseTitle: "Gestión de alcance", startDate: 0, endDate: 0, completionDate: 0},
      { courseTitle: "Ventas del valor generado en la gestion del mantenimiento", startDate: 0, endDate: 0, completionDate: 0},
    ],
    [
      { courseTitle: "Autocad para gestión de proyectos", startDate: 0, endDate: 0, completionDate: 0},
      { courseTitle: "Fundamentos de direccion de proyectos", startDate: 0, endDate: 0, completionDate: 0},
      { courseTitle: "Mantenimiento productivo total", startDate: 0, endDate: 0, completionDate: 0},
      { courseTitle: "Gestión del alcance", startDate: 0, endDate: 0, completionDate: 0},
    ],
    [
      { courseTitle: "Autoevaluación de mantenimiento", startDate: 0, endDate: 0, completionDate: 0},
      { courseTitle: "Gestión de mantenimiento", startDate: 0, endDate: 0, completionDate: 0},
    ],
  ];

  data = [
    { month: "Octubre", year: "2023", studyPlan: this.studyPlanArr[0] },
    { month: "Novimebre", year: "2023", studyPlan: this.studyPlanArr[1] },
    { month: "Diciembre", year: "2023", studyPlan: this.studyPlanArr[2] },
    { month: "Enero", year: "2024", studyPlan: this.studyPlanArr[3] },
  ];
  constructor(
    public icon: IconService,
  ) {}

  ngOnInit() {
    let lastCompletionDate = 0; // Fecha de completacion del curso anterior

    this.studyPlanArr.forEach(studyPlan => {
      for(let i = 0; i < studyPlan.length; i++) {
        let randomDays = this.getRandomDays();
        studyPlan[i].endDate = studyPlan[i].startDate + (randomDays * 24 * 60 * 60 * 1000);

        if (i > 0) lastCompletionDate = studyPlan[i - 1].completionDate;
        
        studyPlan[i].completionDate = this.getRandomTimestamp(studyPlan[i].startDate, this.today, lastCompletionDate);
        
        if(i + 1 < studyPlan.length) {
          studyPlan[i + 1].startDate = studyPlan[i].endDate + (24 * 60 * 60 * 1000);
        }
      }
    });
    console.log("this.data", this.data)
  }

  getRandomDays() {
    return Math.floor(Math.random() * 5) + 1; // Retorna un número aleatorio entre 1 y 5
  }

  getRandomTimestamp(start: number, end: number, lastCompletion: number): number {
    let date;
    do {
      date = start + Math.random() * (end - start);
    } while (date <= lastCompletion);
    return date;
  }

  sendEmail(course) {

  }
}
