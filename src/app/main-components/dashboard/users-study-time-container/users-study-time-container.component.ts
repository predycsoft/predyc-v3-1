import { Component } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';

export class Log {
  timestamp: number = 0
  time: number = 0 // Tiempo empleado en minutos
}
@Component({
  selector: 'app-users-study-time-container',
  templateUrl: './users-study-time-container.component.html',
  styleUrls: ['./users-study-time-container.component.css']
})
export class UsersStudyTimeContainerComponent {

  constructor(
    public icon: IconService,

  ){}
  
  chartTab: number = 0
  hoursTimeWeek: number = 0 // Suma de los tiempos (en horas) empleados en la ultima semana
  hoursTimeMonth: number = 0
  logs: Log[] = null
  now = new Date()
  startOfWeek: number
  startOfMonth: number

  ngOnInit() {
    // Set of first day of the week and first day on the last 12 months
    let startOfWeek = new Date();
    startOfWeek.setUTCDate(this.now.getUTCDate() - ((this.now.getUTCDay() + 6) % 7));
    startOfWeek.setUTCHours(0,0,0,0)
    this.startOfWeek = +startOfWeek

    const now = new Date();
    now.setUTCMonth(now.getUTCMonth() - 11);
    now.setUTCDate(1);
    now.setUTCHours(0, 0, 0, 0);
    this.startOfMonth = +now

    //Datos de ejemplo:
    this.logs = this.generateTestData()
    // console.log("this.logs", this.logs)
    // -----

    this.getStats()
  }

  getStats() {
    let minutesTimeWeek = this.getTotalLogsTime(this.logs.filter(x => x.timestamp > this.startOfWeek))
    this.hoursTimeWeek = minutesTimeWeek / 60
    // console.log("this.hoursTimeWeek", this.hoursTimeWeek)
    let minutesTimeMonth = this.getTotalLogsTime(this.logs.filter(x => x.timestamp > this.startOfMonth))
    this.hoursTimeMonth = minutesTimeMonth / 60
    // console.log("this.hoursTimeMonth", this.hoursTimeMonth)
  }
  

  getTotalLogsTime(logs: Log[]):number {
    return logs.reduce((totalTime: number, log: Log) => {
      return totalTime + log.time;
    }, 0);
  }

  // DATOS DE EJEMPLO
  generateTestData(): Log[] {
    const logs: Log[] = [];
    const startDate = new Date(2022, 9, 1).getTime(); // 1 de octubre de 2022
    for (let i = 0; i < 20; i++) {
      const log = new Log();
      // Si i es menor que 10, generamos timestamps entre startDate y startOfWeek
      // De lo contrario, generamos timestamps entre startOfWeek y la fecha actual
      if (i < 10) {
          log.timestamp = this.randomDateBetween(startDate, this.startOfWeek);
      } else {
          log.timestamp = this.randomDateBetween(this.startOfWeek, +new Date());
      }
      // Generar time (tiempo en minutos) aleatorio entre 20 y 120
      log.time = Math.floor(Math.random() * (120 - 20 + 1) + 20);
      logs.push(log);
    }
    return logs;
  }
  // Función para obtener una fecha aleatoria entre dos fechas dadas (en millisegundos)
  randomDateBetween(start: number, end: number): number {
    return new Date(start + Math.random() * (end - start)).getTime();
  }

  
}
