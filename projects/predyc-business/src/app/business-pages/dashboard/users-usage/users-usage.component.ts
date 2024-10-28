import {Component, Input, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-users-usage',
  templateUrl: './users-usage.component.html',
  styleUrls: ['./users-usage.component.css']
})
export class UsersUsageComponent {

  ctx : any;
  config : any;
  chartData : number[] = [];
  chartDatalabels : string[] = [];

  constructor(
    public icon: IconService,
    private router: Router
  ){}

  @Input() enterprise

  data = [];
  usageByDay
  usageByHour
  textoHorasMasUso = 'Las horas donde tu equipo avanza más en los cursos es entre las'
  textoHorasMasUsoDetail = null
  textoDiasMasUso = null
  textoDiasMasUsoDetail = null

  movilUsage = 0;
  desktopUsage = 0;

  processData() {

    if (this.enterprise?.devices?.desktop >0 || this.enterprise?.devices?.movil >0) {

      let total = this.enterprise.devices.desktop + this.enterprise.devices.movil

      this.movilUsage = (this.enterprise.devices.movil*100)/total
      this.desktopUsage = (this.enterprise.devices.desktop*100)/total

      // console.log(this.movilUsage,this.desktopUsage)

    }

    const adjustedUsage = this.adjustUsageForTimezone(this.enterprise.usage);

    const usageByDay = this.calculateDayOfWeekStatistics(adjustedUsage);
    const usageByHour = this.calculateHourBlockStatistics(adjustedUsage);

    this.usageByDay = usageByDay
    this.usageByHour = usageByHour

    let daysSorted =  structuredClone(usageByDay).sort((a, b) => b.porcentaje - a.porcentaje);
    let HorasSorted =  structuredClone(usageByHour).sort((a, b) => b.porcentaje - a.porcentaje);

    if (daysSorted[0].porcentaje > 0) {

      if (daysSorted[1].porcentaje > 0) {

        let dia1 = daysSorted[0].name;
        let dia2 = daysSorted[1].name;
        
        // Arreglo original de días de la semana
        const diasDeLaSemana = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
        
        // Encuentra los índices de los días en el arreglo original
        const index1 = diasDeLaSemana.indexOf(dia1);
        const index2 = diasDeLaSemana.indexOf(dia2);
        
        // Ordena los días de acuerdo a estos índices
        let dia1Order, dia2Order;
        if (index1 < index2) {
          dia1Order = dia1;
          dia2Order = dia2;
        } else {
          dia1Order = dia2;
          dia2Order = dia1;
        }
        
        // Añade la "s" si es necesario
        if (!dia1Order.endsWith('s')) {
          dia1Order += 's';
        }
        if (!dia2Order.endsWith('s')) {
          dia2Order += 's';
        }
        
        // this.textoDiasMasUso = `Los ${dia1Order} y ${dia2Order} son los días en donde tu equipo más avanza`;
        this.textoDiasMasUsoDetail = `${dia1Order} y ${dia2Order}`
        this.textoDiasMasUso = `son los días en donde tu equipo más avanza en los cursos`;


      }
      else{
        let dia =daysSorted[0].name;
        if (!dia.endsWith('s')) {
          dia += 's';
        }
        // this.textoDiasMasUso = `Los ${dia} es el día en donde tu equipo más avanza`
        this.textoDiasMasUsoDetail = `${dia}`
        this.textoDiasMasUso = `es el día en donde tu equipo más en los cursos`

      }
    }
    else{
      this.textoHorasMasUso= null

    }

    if(HorasSorted[0].porcentaje>0){
      this.textoHorasMasUsoDetail= ` ${HorasSorted[0].range}`
    }
    else{
      this.textoHorasMasUso= null

    }

    // console.log('usageByHour',HorasSorted,daysSorted);

  }

  titleCase(str: string): string {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    this.processData()
  }

  adjustUsageForTimezone(usage) {
    // Calcular el offset de la zona horaria del usuario en horas
    const userTimezoneOffsetHours = new Date().getTimezoneOffset() / -60;
  
    // Inicializar un objeto para almacenar los datos ajustados
    const adjustedUsage = [
      { day: 0, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) },
      { day: 1, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) },
      { day: 2, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) },
      { day: 3, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) },
      { day: 4, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) },
      { day: 5, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) },
      { day: 6, data: Array.from({ length: 24 }, (_, hour) => ({ hour, classesTerminadas: 0 })) }
    ];
  
    usage.forEach(dayData => {
      dayData.data.forEach(hourData => {
        let adjustedHour = hourData.hour + userTimezoneOffsetHours;
        let adjustedDay = dayData.day;
  
        if (adjustedHour >= 24) {
          adjustedHour -= 24;
          adjustedDay = (adjustedDay + 1) % 7;
        } else if (adjustedHour < 0) {
          adjustedHour += 24;
          adjustedDay = (adjustedDay - 1 + 7) % 7;
        }
  
        adjustedUsage[adjustedDay].data[adjustedHour].classesTerminadas += hourData.classesTerminadas;
      });
    });
  
    // Ordenar los datos ajustados por día y luego por hora
    adjustedUsage.forEach(dayEntry => {
      dayEntry.data.sort((a, b) => a.hour - b.hour);
    });
  
    return adjustedUsage;
  }

  calculateDayOfWeekStatistics(adjustedUsage) {
    // Inicializar el arreglo para almacenar los datos finales en el orden de lunes a domingo
    const finalData = [
      { name: 'lunes', totalClasses: 0, porcentaje: 0 },
      { name: 'martes', totalClasses: 0, porcentaje: 0 },
      { name: 'miércoles', totalClasses: 0, porcentaje: 0 },
      { name: 'jueves', totalClasses: 0, porcentaje: 0 },
      { name: 'viernes', totalClasses: 0, porcentaje: 0 },
      { name: 'sábado', totalClasses: 0, porcentaje: 0 },
      { name: 'domingo', totalClasses: 0, porcentaje: 0 }
    ];
  
    // Calcular el total de clases y las clases por día
    let totalClasses = 0;
    adjustedUsage.forEach(dayData => {
      const dayIndex = (dayData.day + 6) % 7; // Ajustar el índice para que el orden sea lunes a domingo
      const totalClassesForDay = dayData.data.reduce((sum, hourData) => sum + hourData.classesTerminadas, 0);
      finalData[dayIndex].totalClasses = totalClassesForDay;
      totalClasses += totalClassesForDay;
    });
  
    // Calcular el porcentaje para cada día
    finalData.forEach(dayEntry => {
      dayEntry.porcentaje = totalClasses ? (dayEntry.totalClasses / totalClasses) * 100 : 0;
      dayEntry.porcentaje = parseFloat(dayEntry.porcentaje.toFixed(2));
    });
  
    return finalData;
  }

  calculateHourBlockStatistics(adjustedUsage) {
    // Definir los bloques de horas
    const hourBlocks = [
      { range: '00:00 - 06:00 horas', start: 0, end: 5, totalClasses: 0, porcentaje: 0 },
      { range: '06:00 - 09:00 horas', start: 6, end: 8, totalClasses: 0, porcentaje: 0 },
      { range: '09:00 - 12:00 horas', start: 9, end: 11, totalClasses: 0, porcentaje: 0 },
      { range: '12:00 - 15:00 horas', start: 12, end: 14, totalClasses: 0, porcentaje: 0 },
      { range: '15:00 - 18:00 horas', start: 15, end: 17, totalClasses: 0, porcentaje: 0 },
      { range: '18:00 - 21:00 horas', start: 18, end: 20, totalClasses: 0, porcentaje: 0 },
      { range: '21:00 - 00:00 horas', start: 21, end: 23, totalClasses: 0, porcentaje: 0 }
    ];
  
    // Calcular el total de clases y las clases por bloque de horas
    let totalClasses = 0;
    adjustedUsage.forEach(dayData => {
      dayData.data.forEach(hourData => {
        const hour = hourData.hour;
        const classesTerminadas = hourData.classesTerminadas;
        const block = hourBlocks.find(block => hour >= block.start && hour <= block.end);
        if (block) {
          block.totalClasses += classesTerminadas;
          totalClasses += classesTerminadas;
        }
      });
    });
  
    // Calcular el porcentaje para cada bloque de horas
    hourBlocks.forEach(block => {
      block.porcentaje = totalClasses ? (block.totalClasses / totalClasses) * 100 : 0;
      block.porcentaje = parseFloat(block.porcentaje.toFixed(2));
    });
  
    return hourBlocks;
  }

}
