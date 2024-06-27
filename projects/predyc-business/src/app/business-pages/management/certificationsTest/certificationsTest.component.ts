import { Component } from '@angular/core';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';
import { titleCase } from 'shared';
import * as XLSX from "xlsx-js-style";
import { DatePipe } from "@angular/common";
import { Subscription } from 'rxjs';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';


@Component({
  selector: 'app-certifications-test',
  templateUrl: './certificationsTest.component.html',
  styleUrls: ['./certificationsTest.component.css']
})
export class CertificationsTestComponent {


  constructor(
    private activityClassesService:ActivityClassesService,
    private datePipe: DatePipe,
    private enterpriseService: EnterpriseService,


  ){

  }

  certificationId
  makeChart = 0
  datosReporte;

  enterpriseSubscription: Subscription;
  enterprise

  ngOnInit(): void {

    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(
      async (enterprise) => {
        if (enterprise) {
          this.enterprise = enterprise;
        }
      }
    );


  }

  removeDuplicates(strings: string[]): string[] {
    return Array.from(new Set(strings));
  }

  downloadReportData() {
    let datosReporte = this.datosReporte.filter(x => x.test.length > 0 && x.test.find(y => y.type == 'inicial'));
    console.log('datosReporte', datosReporte);
  
    let columnasResultados = [];
  
    // Recoger IDs de clase para columnas
    datosReporte.forEach(userResult => {
      userResult.test[0].resultByClass.forEach(resultByClass => {
        columnasResultados.push(resultByClass.classId);
      });
    });
  
    // Eliminar duplicados
    columnasResultados = this.removeDuplicates(columnasResultados);
    console.log('columnasResultados', columnasResultados);
  
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    const black = "000000";

    const gray2 = "F5F5F5";
    const gray4 = "D5DCE0";
    const gray6 = "9CA6AF";
    const gray8 = "646F79";
    const gray9 = "222B37";

    const green1 = "E2FFFA";
    const green2 = "BCE8DF";
    const green3 = "74d96e";
    const green4 = "2ea838";
    const green5 = "00BF9C";
    const green6 = "5cb85c";

    const yellow1 = "FFFEDE";
    const yellow2 = "FFF78F";
    const yellow3 = "FFE01B";
    const yellow4 = "FFE084";
    const yellow5 = "F2A100";

    const red1 = "FFEDEF";
    const red2 = "ffb9bf";
    const red3 = "FF7381";
    const red4 = "FF5263";
    const red5 = "ED4758";

    const styleNoBorders = {
      border: null,
    };

    const calibri = {
      name: "Calibri",
      sz: 12,
      bold: false,
      color: { rgb: black },
    };

    const calibriRed5 = {
      name: "Calibri",
      sz: 12,
      bold: false,
      color: { rgb: red5 },
    };

    const calibriBold = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: black },
    };
    const calibriBoldGray = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: gray8 },
    };

    const calibriBoldGreen = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: green5 },
    };
    const calibriBoldYellow = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: yellow5 },
    };
    const calibriBoldRed = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: red5 },
    };

    const whiteCalibriBold = {
      font: calibriBold,
      alignment: {
        horizontal: "left",
      },
    };

    const whiteCalibriLeftBordered = {
      font: calibri,
      alignment: {
        horizontal: "left",
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const whiteCalibriRedLeftBordered = {
      font: calibriRed5,
      alignment: {
        horizontal: "left",
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const whiteCalibriRedCenteredBordered = {
      font: calibriRed5,
      alignment: {
        horizontal: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const whiteCalibriCenteredBordered = {
      font: calibri,
      alignment: {
        horizontal: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const mailLinkStyle = {
      font: {
        color: { rgb: "0000FF" }, // Azul
        underline: true,
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
      // Otras propiedades de estilo aquí
    };

    const grayCalibriBoldLeftBordered = {
      font: calibriBold,
      alignment: {
        horizontal: "left",
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray2,
        },
        bgColor: {
          rgb: gray2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const grayCalibriBoldCenterBordered = {
      font: calibriBold,
      alignment: {
        horizontal: "center",
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray2,
        },
        bgColor: {
          rgb: gray2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const whiteCalibriRightBordered = {
      font: calibri,
      alignment: {
        horizontal: "right",
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const greenCalibriBoldGreenLeftBordered = {
      font: calibriBoldGreen,
      alignment: {
        horizontal: "left",
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: green2,
        },
        bgColor: {
          rgb: green2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const yellowCalibriBoldYellowLeftBordered = {
      font: calibriBoldYellow,
      alignment: {
        horizontal: "left",
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: yellow1,
        },
        bgColor: {
          rgb: yellow1,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const redCalibriBoldRedLeftBordered = {
      font: calibriBoldRed,
      alignment: {
        horizontal: "left",
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: red2,
        },
        bgColor: {
          rgb: red2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const gray6CalibriBoldGreyLeftBordered = {
      font: calibriBoldGray,
      alignment: {
        horizontal: "left",
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray4,
        },
        bgColor: {
          rgb: gray4,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const greenCalibriBoldGreenCenterBordered = {
      font: calibriBoldGreen,
      alignment: {
        horizontal: "center",
        vertical: "center", // Añade esto para centrar verticalmente
        wrapText: true, // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: green2,
        },
        bgColor: {
          rgb: green2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const yellowCalibriBoldYellowCenterBordered = {
      font: calibriBoldYellow,
      alignment: {
        horizontal: "center",
        vertical: "center", // Añade esto para centrar verticalmente
        wrapText: true, // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: yellow1,
        },
        bgColor: {
          rgb: yellow1,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const redCalibriBoldRedCenterBordered = {
      font: calibriBoldRed,
      alignment: {
        horizontal: "center",
        vertical: "center", // Añade esto para centrar verticalmente
        wrapText: true, // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: red2,
        },
        bgColor: {
          rgb: red2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const gray6CalibriBoldGreyCenterBordered = {
      font: calibriBoldGray,
      alignment: {
        horizontal: "center",
        vertical: "center", // Añade esto para centrar verticalmente
        wrapText: true, // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray4,
        },
        bgColor: {
          rgb: gray4,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

    const grayCalibriBoldCenterCenterBordered = {
      font: calibriBold,
      alignment: {
        horizontal: "center",
        vertical: "center", // Añade esto para centrar verticalmente
        wrapText: true, // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray2,
        },
        bgColor: {
          rgb: gray2,
        },
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } },
      },
    };

  
    const wsGeneral: XLSX.WorkSheet = {};
    // let nombreEmpresa = this.enterprise.name;
    let nombreEmpresa = this.enterprise.name;
    

    const fechaActual = new Date().toLocaleDateString("es", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    wsGeneral["B2"] = {
      t: "s",
      v: `Reporte de progreso de usuarios ${titleCase(nombreEmpresa)}`,
      s: whiteCalibriBold,
    };
    wsGeneral["B3"] = { t: "s", v: fechaActual, s: whiteCalibriBold };
  
    // Encabezados estáticos
    wsGeneral["B5"] = { t: "s", v: `Nombre`, s: grayCalibriBoldCenterCenterBordered };
    wsGeneral["C5"] = { t: "s", v: `Fecha`, s: grayCalibriBoldCenterCenterBordered };
    wsGeneral["D5"] = { t: "s", v: `Resultado`, s: grayCalibriBoldCenterCenterBordered };
  
    // Agregar encabezados dinámicos para cada columnaResultados
    let initialCharCode = 4;
    let totalCols = initialCharCode
    columnasResultados.forEach((classId, index) => {
      const cellRef = XLSX.utils.encode_col(initialCharCode+ index) + '5'; // Crear referencia de celda, e.g., 'D1'
      console.log('cellRef',cellRef)
      wsGeneral[cellRef] = { t: "s", v: `${classId}`, s: grayCalibriBoldCenterCenterBordered };
      totalCols++;
    });


    let rowIndex = 6;  // Comenzar a escribir datos desde la fila 2
    datosReporte.forEach((user, userIndex) => {
      const nameCellRef = `B${rowIndex}`;
      const dateCellRef= `C${rowIndex}`;
      const scoreCellRef = `D${rowIndex}`;
      wsGeneral[nameCellRef] = { t: "s", v: titleCase(user.displayName), s: whiteCalibriLeftBordered };
      wsGeneral[dateCellRef] = { t: "s", v: this.datePipe.transform(user.test[0].date.seconds*1000, 'dd/MM/yyyy', 'es'), s: whiteCalibriLeftBordered };
      wsGeneral[scoreCellRef] = { t: "s", v: Math.floor(user.test[0].score), s: whiteCalibriLeftBordered };

      user.test[0].resultByClass.forEach((result) => {
        const columnIndex = columnasResultados.indexOf(result.classId) + initialCharCode;
        const cellRef = XLSX.utils.encode_col(columnIndex) + rowIndex;
        wsGeneral[cellRef] = { t: "n", v: result.score.toFixed(2), s: whiteCalibriLeftBordered };
      });
  
      rowIndex++;  // Incrementar el índice de fila para el próximo alumno
    });

    let endColumn = totalCols+10;

    console.log('endColumn',endColumn);

    wsGeneral["!ref"] = `A1:${XLSX.utils.encode_col(endColumn)}${rowIndex - 1}`;
    wsGeneral["!cols"] = Array(endColumn + 1).fill({ wch: 15 });  // Ajustar el ancho de todas las columnas
  
  
    // Añadir la hoja al libro y escribir el archivo
    XLSX.utils.book_append_sheet(wb, wsGeneral, "Resultados Diagnósticos");
    XLSX.writeFile(wb, `Resultados diagnóstico ${nombreEmpresa.toUpperCase()} ${fechaActual}.xlsx`);
  }





  toColumnName(num) {
    let ret = "",
      a = 1,
      b = 26;
    while (num >= 0) {
      ret = String.fromCharCode((num % b) + 65) + ret;
      num = Math.floor((num - (num % b)) / b) - 1;
    }
    return ret;
  }

  ngAfterViewInit(){
    setTimeout(() => {
      this.makeChart=this.makeChart+1
    }, 1000);
  }


}
