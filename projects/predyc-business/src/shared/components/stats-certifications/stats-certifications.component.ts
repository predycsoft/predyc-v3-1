import { Component, Input, SimpleChanges } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { ActivityClassesService } from '../../services/activity-classes.service';
import { Chart } from "chart.js";


@Component({
  selector: 'app-stats-certifications',
  templateUrl: './stats-certifications.component.html',
  styleUrls: ['./stats-certifications.component.css']
})
export class StatsCertificationsComponent {

  constructor(

    private activityClassesService:ActivityClassesService,


  ) {}

  results
  promedioGeneral
  averageScores

  @Input() certificationId;
  @Input() makeChart = 0;


  ngOnChanges(changes: SimpleChanges) {
    if (changes.makeChart) {
      if (this.makeChart!=0){
        this.chartSetup();
      }
    }
  }




  ngOnInit() {


    this.activityClassesService.getActivityResults(this.certificationId).pipe().subscribe((resultados)=>{
      console.log('resultados',resultados);
      this.results=resultados
      let allClassResults = [];

      let score =0;
      resultados.forEach(result => {
        allClassResults = allClassResults.concat(result.resultByClass);
        console.log('resultado',result)
        score+=result.score
      });
      this.promedioGeneral = score/resultados.length


      // Agrupa los resultados por classId
      const groupedByClassId = allClassResults.reduce((acc, current) => {
        // Asegura que el classId y el score son válidos
        const { classId, score } = current;
        if (classId && score != null) {
          if (!acc[classId]) {
            acc[classId] = { totalScore: 0, count: 0 };
          }
          acc[classId].totalScore += score;
          acc[classId].count += 1;
        }
        return acc;
      }, {});

      // Calcula el promedio de los puntajes por cada classId
      const averageScores = Object.keys(groupedByClassId).map(classId => {
        const { totalScore, count } = groupedByClassId[classId];
        return {
          classId,
          averageScore: totalScore / count
        };
      });

      console.log('averageScores',averageScores);
      averageScores.sort((a, b) => b['averageScore'] - a['averageScore']);
      this.averageScores =averageScores

      //this.chartSetup()
    })
  }


  chartSetup(){

    // Crear un objeto para mantener el conteo de las puntuaciones
    const scoreCounts = {};
    for (let i = 0; i <= 100; i += 10) {
      scoreCounts[i] = 0; // Inicializar cada rango de puntuación con 0
    }

    // Incrementar el conteo basado en los resultados
    this.results.forEach(result => {
      const score = Math.floor(result.score / 10) * 10; // Agrupar en rangos de 10
      scoreCounts[score]++;
    });

    // Separar las llaves y los valores del objeto scoreCounts en dos arrays para las etiquetas y los datos del gráfico
    const labels = Object.keys(scoreCounts);
    const data = Object.values(scoreCounts);

    // Configuración del gráfico


    // Obtener el contexto del elemento canvas en el DOM donde se dibujará el gráfico
    const canvas = document.getElementById('chartStats')as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    // Inicializar y mostrar el gráfico

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, // tus etiquetas de eje X
        datasets: [{
          label: 'Número de exámenes',
          data: data,
          borderColor: '#008CE3', // Color de la línea
          backgroundColor: '#008CE3', // Color de fondo de la línea
          cubicInterpolationMode: 'monotone',
          tension: 0.4,
          pointRadius: 0 // Establece el radio del punto a 0 para no mostrar puntos
        }]
      },
      options: {
        interaction: {
          intersect: false,
        },
        scales: {
          y: {
            display: true, // Muestra el eje Y
            title: {
              display: true, // Mostrar título del eje Y
              text: 'Nº de resultados' // Texto del título
            },
            grid: {
              display: false, // Ocultar líneas de cuadrícula en Y
            },
            ticks: {
              display: false // Ocultar las marcas del eje Y
            }
          },
          x: {
            grid: {
              display: false, // No mostrar líneas de cuadrícula para el eje X
            },
            title: {
              display: true,
              text: 'Puntuación obtenida'
            }
          }
        },
        plugins: {
          legend: {
            display: false // Ocultar la leyenda si no se necesita
          }
        }
      }
    });
    


    
  }

}
