import { Component, Input, SimpleChanges } from '@angular/core';
import { LoaderService } from '../../services/loader.service';
import { ActivityClassesService } from '../../services/activity-classes.service';
import { Chart } from "chart.js";
import annotationPlugin from "chartjs-plugin-annotation";


@Component({
  selector: 'app-stats-certifications',
  templateUrl: './stats-certifications.component.html',
  styleUrls: ['./stats-certifications.component.css']
})
export class StatsCertificationsComponent {

  constructor(
    private activityClassesService:ActivityClassesService,
  ) {
    Chart.register(annotationPlugin);
  }


  datosTMP = [0,0,7,21,47,16,9,6,4,1,0]

  results = []
  promedioGeneral
  averageScores

  resultsEmpresa = []
  promedioGeneralEmpresa
  averageScoresEmpresa

  @Input() certificationId;
  @Input() makeChart = 0;
  @Input() origen = 'edit';

  ngOnChanges(changes: SimpleChanges) {
    if (changes.makeChart) {
      if (this.makeChart!=0){
        this.chartSetup();
      }
    }
  }


  procesarDatos(resultados,type='general'){
    console.log('resultados',resultados);
    if(type=='general'){
      this.results=resultados
    }
    else{
      this.resultsEmpresa=resultados
    }
    let allClassResults = [];
    let score =0;
    resultados.forEach(result => {
      allClassResults = allClassResults.concat(result.resultByClass);
      console.log('resultado',result)
      score+=result.score
    });

    if(type=='general'){
      this.promedioGeneral = score/resultados.length
    }
    else{
      this.promedioGeneralEmpresa = score/resultados.length
    }

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

    if(type=='general'){
      this.averageScores =averageScores
    }
    else{
      this.averageScoresEmpresa =averageScores
    }

  }

  ngOnInit() {
    this.activityClassesService.getActivityCertificationAll().subscribe((resultados)=>{
      if(resultados.length>0){
        this.resultadosCrudos = resultados
        this.procesarDatos(resultados)
      }
    })
    if(this.origen=='empresa'){
      this.activityClassesService.getActivityCertificationResultsEnterprise().subscribe((resultados)=>{
        if(resultados.length>0){
          this.resultadosCrudosEmpresa = resultados
          this.procesarDatos(resultados,'empresa')
        }
      })
    }
  }

  resultadosCrudos
  resultadosCrudosEmpresa

  chartSetup(){

    // Crear un objeto para mantener el conteo de las puntuaciones
    const scoreCounts = {};
    for (let i = 0; i <= 100; i += 10) {
      scoreCounts[i] = 0; // Inicializar cada rango de puntuación con 0
    }

    // Incrementar el conteo basado en los resultados
    this.results?.forEach(result => {
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

    let numericData: number[] = data.map(item => {
      if (typeof item === 'number') {
        return item;
      } else {
        throw new Error('All elements must be numbers');
      }
    });
    
    let promedio = 0
    
    if(this.origen == 'empresa'){
      if(this.resultsEmpresa?.length>0){
        promedio = Math.round(this.promedioGeneralEmpresa/10)
      }
      else{
        promedio = 20
      }
    }
    else{
      promedio = Math.round(this.promedioGeneral/10)
    }


    console.log('grafico',numericData,this.datosTMP)

    if(this.origen == 'empresa'){

      if(this.resultsEmpresa.length<100){

        const datosTMP = this.datosTMP

        console.log('datosRevisar',numericData,datosTMP)

        let sum = numericData.map(function (num, idx) {
          return num + datosTMP[idx];
        });
        numericData = sum
      }
    }

    let maxData = numericData[promedio]
    console.log(promedio,maxData)

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels, // tus etiquetas de eje X
        datasets: [{
          label: 'Número de exámenes',
          data: numericData,
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
              text: 'Resultados' // Texto del título
            },
            grid: {
              display: false, // Ocultar líneas de cuadrícula en Y
            },
            ticks: {
              display: false // Ocultar las marcas del eje Y
            },
            //suggestedMax:maxData
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
          },
          tooltip: {
            enabled: false,
          },
          annotation: {
            annotations: {
              averageLine: {  // Nombre de la anotación, puede ser cualquier cosa
                // Indicates the type of annotation
                type: 'box',
                xMin: promedio,
                xMax: promedio,
                yMin: 0,
                yMax: maxData,
                borderWidth:10,
                borderColor:'rgba(255, 99, 132, 0.5)',
              },
              point1: {
                type: 'point',
                xValue: promedio,
                yValue: maxData,
                borderWidth:0,
                radius:5,
                backgroundColor: 'rgb(255, 99, 132)'
              }
            }
          }
        },
      }
    });
  }
}
