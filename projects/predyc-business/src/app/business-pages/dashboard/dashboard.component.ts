import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, combineLatest, filter, map, switchMap, take } from 'rxjs';
import { DialogDownloadReportComponent } from 'projects/predyc-business/src/shared/components/dialogs/dialog-download-report/dialog-download-report.component';
import { AfterOnInitResetLoading } from 'projects/predyc-business/src/shared/decorators/loading.decorator';
import { CourseByStudent } from 'projects/shared/models/course-by-student.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import * as XLSX from 'xlsx-js-style';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { DepartmentService } from 'projects/predyc-business/src/shared/services/department.service';

interface User {
  displayName: string,
  profile: string,
  department: string,
  hours: number,
  targetHours: number,
  ratingPoints: number,
  rhythm: string
  uid: string,
  photoUrl: string,
}


@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  enterprise: Enterprise
  enterpriseSubscription: Subscription
  combinedSubscription: Subscription
  userServiceSubscription: Subscription
  performances = []

  // rythms
  rythms = {
    high: 0,
    medium: 0,
    low: 0,
    noPlan: 0,
  }

  constructor(
    public loaderService: LoaderService,  
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private courseService: CourseService,
    private modalService: NgbModal,
    private profileService: ProfileService,
    private departmentService: DepartmentService


  ) {}


  displayErrors
  profilesSubscription: Subscription


  ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.loaderService.setLoading(false)
      }
    })
    this.userServiceSubscription = this.userService.users$.subscribe(async users => {
      if (users && users.length > 1) { // first response is an 1 element array corresponded to admin
        console.log('users',users)
        const performances = []
        for (let user of users) {
          const userRef = this.userService.getUserRefById(user.uid);
          const studyPlan: CourseByStudent[] = await this.courseService.getActiveCoursesByStudent(userRef);
          const userPerformance: "no plan" | "high" | "medium" | "low" | "no iniciado" = this.userService.getPerformanceWithDetails(studyPlan);
          performances.push(userPerformance);
        }
        this.getUsersRythmData(performances)
      }
    })

    this.generatinReport = false;
    this.displayErrors = false
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(async enterprise => {
      if (enterprise) {
        this.enterprise = enterprise;
      }
    })
    this.profileService.loadProfiles()
    this.profilesSubscription = combineLatest([this.profileService.getProfiles$(), this.departmentService.getDepartments$(), this.courseService.getCourses$(),this.courseService.getClassesEnterprise$()]).subscribe(([profiles, departments, courses,classes]) => {
      this.profiles = profiles
      this.departments = departments
      this.courses = courses
      this.classes = classes
      //this.getData();
    })
  }

  ngOnDestroy() {
    this.enterpriseSubscription.unsubscribe()
    this.userServiceSubscription.unsubscribe()
  }

  openDownloadReportModal(): NgbModalRef {
    const modalRef = this.modalService.open(DialogDownloadReportComponent, {
      animation: true,
      centered: true,
      size: 'auto',
      backdrop: 'static',
      keyboard: false 
    })
    return modalRef
  }

  getUsersRythmData(performances: Array<"no plan" | "high" | "medium" | "low"| "no iniciado"  >){
    this.rythms = {
      high: 0,
      medium: 0,
      low: 0,
      noPlan: 0,
    }
    // Iterar sobre el array de performances
    for (const performance of performances) {
      switch (performance) {
        case "no plan":
          this.rythms.noPlan += 1;
          break;
        case "high":
          this.rythms.high += 1;
          break;
        case "medium":
          this.rythms.medium += 1;
          break;
        case "low":
          this.rythms.low += 1;
          break;
          case "no iniciado":
          this.rythms.noPlan += 1;
          break;
      }
    }
    // console.log(`No Plan: ${this.rythms.noPlan}, High: ${this.rythms.high}, Medium: ${this.rythms.medium}, Low: ${this.rythms.low}`);
  }


  

  downloadExcelReport() {
    const wb: XLSX.WorkBook = XLSX.utils.book_new();

    const black = "000000"

    const gray2 = "F5F5F5"
    const gray4 = "D5DCE0"
    const gray6 = "9CA6AF"
    const gray8 = "646F79"
    const gray9 = "222B37"


    const green1 =  "E2FFFA"
    const green2 = "BCE8DF"
    const green3 =  "74d96e"
    const green4 =  "2ea838"
    const green5 =  "00BF9C"
    const green6 =  "5cb85c"

    const yellow1 = "FFFEDE"
    const yellow2 = "FFF78F"
    const yellow3 = "FFE01B"
    const yellow4 = "FFE084"
    const yellow5 = "F2A100"


    const red1 = "FFEDEF"
    const red2 = "ffb9bf"
    const red3 = "FF7381"
    const red4 = "FF5263"
    const red5 = "ED4758"


    const styleNoBorders = {
      border: null
    };

    const calibri = {
      name: "Calibri",
      sz: 12,
      bold: false,
      color: { rgb: black },
    }

    const calibriRed5 = {
      name: "Calibri",
      sz: 12,
      bold: false,
      color: { rgb: red5 },
    }

    const calibriBold = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: black },
    }
    const calibriBoldGray = {
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: gray8 },
    }

    const calibriBoldGreen= { 
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: green5 },
    }
    const calibriBoldYellow= { 

      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: yellow5 },
    }
    const calibriBoldRed= { 
      name: "Calibri",
      sz: 12,
      bold: true,
      color: { rgb: red5 },
    }



    const whiteCalibriBold = {
      font: calibriBold,
      alignment: {
        horizontal: 'left'
      }
    }


    const whiteCalibriLeftBordered = {
      font: calibri,
      alignment: {
        horizontal: 'left'
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const whiteCalibriRedLeftBordered = {
      font: calibriRed5,
      alignment: {
        horizontal: 'left'
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const whiteCalibriRedCenteredBordered = {
      font: calibriRed5,
      alignment: {
        horizontal: 'center'
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const whiteCalibriCenteredBordered = {
      font: calibri,
      alignment: {
        horizontal: 'center'
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const mailLinkStyle = {
      font: {
          color: { rgb: "0000FF" }, // Azul
          underline: true,
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
      // Otras propiedades de estilo aquí
  };

    
    const grayCalibriBoldLeftBordered = {
      font: calibriBold,
      alignment: {
        horizontal: 'left'
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray2
        },
        bgColor: {
          rgb: gray2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const grayCalibriBoldCenterBordered = {
      font: calibriBold,
      alignment: {
        horizontal: 'center'
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray2
        },
        bgColor: {
          rgb: gray2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const whiteCalibriRightBordered = {
      font: calibri,
      alignment: {
        horizontal: 'right'
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const greenCalibriBoldGreenLeftBordered = {
      font: calibriBoldGreen,
      alignment: {
        horizontal: 'left'
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: green2
        },
        bgColor: {
          rgb: green2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const yellowCalibriBoldYellowLeftBordered = {
      font: calibriBoldYellow,
      alignment: {
        horizontal: 'left'
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: yellow1
        },
        bgColor: {
          rgb: yellow1
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }


    const redCalibriBoldRedLeftBordered = {
      font: calibriBoldRed,
      alignment: {
        horizontal: 'left'
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: red2
        },
        bgColor: {
          rgb: red2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const gray6CalibriBoldGreyLeftBordered = {
      font: calibriBoldGray,
      alignment: {
        horizontal: 'left'
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray4
        },
        bgColor: {
          rgb: gray4
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }




    const greenCalibriBoldGreenCenterBordered = {
      font: calibriBoldGreen,
      alignment: {
        horizontal: 'center',
        vertical: 'center', // Añade esto para centrar verticalmente
        wrapText: true // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: green2
        },
        bgColor: {
          rgb: green2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const yellowCalibriBoldYellowCenterBordered = {
      font: calibriBoldYellow,
      alignment: {
        horizontal: 'center',
        vertical: 'center', // Añade esto para centrar verticalmente
        wrapText: true // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: yellow1
        },
        bgColor: {
          rgb: yellow1
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }


    const redCalibriBoldRedCenterBordered = {
      font: calibriBoldRed,
      alignment: {
        horizontal: 'center',
        vertical: 'center', // Añade esto para centrar verticalmente
        wrapText: true // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: red2
        },
        bgColor: {
          rgb: red2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const gray6CalibriBoldGreyCenterBordered = {
      font: calibriBoldGray,
      alignment: {
        horizontal: 'center',
        vertical: 'center', // Añade esto para centrar verticalmente
        wrapText: true // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray4
        },
        bgColor: {
          rgb: gray4
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const grayCalibriBoldCenterCenterBordered = {
      font: calibriBold,
      alignment: {
        horizontal: 'center',
        vertical: 'center', // Añade esto para centrar verticalmente
        wrapText: true // Esto permite que el texto se ajuste dentro de la celda si es demasiado largo
      },
      fill: {
        patternType: "solid",
        fgColor: {
          rgb: gray2
        },
        bgColor: {
          rgb: gray2
        }
      },
      border: {
        top: { style: "thin", color: { rgb: black } },
        bottom: { style: "thin", color: { rgb: black } },
        left: { style: "thin", color: { rgb: black } },
        right: { style: "thin", color: { rgb: black } }
      }
    }

    const wsGeneral: XLSX.WorkSheet = {}
    const wsResumenPorPuesto: XLSX.WorkSheet = {}
    const wsResumenEstudiantes: XLSX.WorkSheet = {}
    const wsDetalleEstudiantes: XLSX.WorkSheet = {}

    
    let endColumn = 400
    const fechaActual = new Date().toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });


    // Hoja 1 (GENERAL)

    let nombreEmpresa = this.enterprise.name

    let usuariosConLicencia = this.users.filter(x=>x?.allsubscriptions.find(y=>y?.status == 'active'))

    let usuariosSinLicencia = this.users.filter(user =>
      !user.allsubscriptions || user.allsubscriptions.length === 0 || // No tiene suscripciones
      user.allsubscriptions.some(subscription => subscription.status !== 'active') // Tiene al menos una suscripción no activa
    );

    console.log(usuariosConLicencia,usuariosSinLicencia)
    
    let cantidadUsuariosConLicencia = usuariosConLicencia?.length
    let cantidadUsuariosTotal = this.users.length
    let cantidadUsuariosSinLicencia = cantidadUsuariosTotal-cantidadUsuariosConLicencia

    //"no plan" | "high" | "medium" | "low"| "no iniciado"

    let usuariosLicenciaALto = usuariosConLicencia.filter(x=>x.rhythm == 'high').length
    let usuariosLicenciaMedio = usuariosConLicencia.filter(x=>x.rhythm == 'medium').length
    let usuariosLicenciaBajo = usuariosConLicencia.filter(x=>x.rhythm == 'low').length
    let usuariosLicenciaSin = usuariosConLicencia.filter(x=>x.rhythm == 'no plan' || x.rhythm == 'no iniciado').length

    let usuariosSinLicenciaALto = usuariosSinLicencia.filter(x=>x.rhythm == 'high').length
    let usuariosSinLicenciaMedio = usuariosSinLicencia.filter(x=>x.rhythm == 'medium').length
    let usuariosSinLicenciaBajo = usuariosSinLicencia.filter(x=>x.rhythm == 'low').length
    let usuariosSinLicenciaSin = usuariosSinLicencia.filter(x=>x.rhythm == 'no plan' || x.rhythm == 'no iniciado').length

    if (!wsGeneral['!merges']) wsGeneral['!merges'] = [];


    // Combinar celdas B2 y C2
    wsGeneral['!merges'].push({
      s: {r: 1, c: 1}, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: {r: 1, c: 2}  // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });


    wsGeneral['B2'] = { t: 's', v: `Reporte de progreso de usuarios ${this.titleCase(nombreEmpresa)}`, s: whiteCalibriBold };
    wsGeneral['B3'] = { t: 's', v: fechaActual, s: whiteCalibriBold };
    wsGeneral['B5'] = { t: 's', v: 'Licencias', s: grayCalibriBoldLeftBordered };
    wsGeneral['B6'] = { t: 's', v: 'Estudiantes con licencias activas', s: whiteCalibriLeftBordered };
    wsGeneral['B7'] = { t: 's', v: 'Estudiantes registrados', s: whiteCalibriLeftBordered };
    wsGeneral['B9'] = { t: 's', v: 'Progreso de usuarios con licencias activas', s: grayCalibriBoldLeftBordered };
    wsGeneral['B10'] = { t: 's', v: 'Estudiantes con ritmo alto', s: greenCalibriBoldGreenLeftBordered };
    wsGeneral['B11'] = { t: 's', v: 'Estudiantes con ritmo medio', s: yellowCalibriBoldYellowLeftBordered };
    wsGeneral['B12'] = { t: 's', v: 'Estudiantes con ritmo bajo', s: redCalibriBoldRedLeftBordered };
    wsGeneral['B13'] = { t: 's', v: 'Estudiantes sin plan de estudio', s: gray6CalibriBoldGreyLeftBordered };

    wsGeneral['B15'] = { t: 's', v: 'Progreso de usuarios con licencias inactivas', s: grayCalibriBoldLeftBordered };
    wsGeneral['B16'] = { t: 's', v: 'Estudiantes con ritmo alto', s: greenCalibriBoldGreenLeftBordered };
    wsGeneral['B17'] = { t: 's', v: 'Estudiantes con ritmo medio', s: yellowCalibriBoldYellowLeftBordered };
    wsGeneral['B18'] = { t: 's', v: 'Estudiantes con ritmo bajo', s: redCalibriBoldRedLeftBordered };
    wsGeneral['B19'] = { t: 's', v: 'Estudiantes sin plan de estudio', s: gray6CalibriBoldGreyLeftBordered };

  
    wsGeneral['C5'] = { t: 's', v: 'Cant.', s: grayCalibriBoldCenterBordered };
    wsGeneral['C6'] = { t: 's', v: cantidadUsuariosConLicencia, s: whiteCalibriRightBordered };
    wsGeneral['C7'] = { t: 's', v: cantidadUsuariosTotal, s: whiteCalibriRightBordered };

    wsGeneral['C9'] = { t: 's', v: 'Cant.', s: grayCalibriBoldCenterBordered };
    wsGeneral['C10'] = { t: 's', v: usuariosLicenciaALto, s: whiteCalibriRightBordered };
    wsGeneral['C11'] = { t: 's', v: usuariosLicenciaMedio, s: whiteCalibriRightBordered };
    wsGeneral['C12'] = { t: 's', v: usuariosLicenciaBajo, s: whiteCalibriRightBordered };
    wsGeneral['C13'] = { t: 's', v: usuariosLicenciaSin, s: whiteCalibriRightBordered };

    wsGeneral['C15'] = { t: 's', v: 'Cant.', s: grayCalibriBoldCenterBordered };
    wsGeneral['C16'] = { t: 's', v: usuariosSinLicenciaALto, s: whiteCalibriRightBordered };
    wsGeneral['C17'] = { t: 's', v: usuariosSinLicenciaMedio, s: whiteCalibriRightBordered };
    wsGeneral['C18'] = { t: 's', v: usuariosSinLicenciaBajo, s: whiteCalibriRightBordered };
    wsGeneral['C19'] = { t: 's', v: usuariosSinLicenciaSin, s: whiteCalibriRightBordered };


    // Fin Hoja 1 (GENERAL)


    // Hoja 2 (Resumen por puesto)

    let perfiles = Array.from(new Set(usuariosConLicencia.map(user => user.profileId)));
    perfiles = perfiles.filter(x=>x!='')

    if (!wsResumenPorPuesto['!merges']) wsResumenPorPuesto['!merges'] = [];

    // Combinar celdas B2 y C2
    wsResumenPorPuesto['!merges'].push({
      s: {r: 1, c: 1}, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: {r: 1, c: 2}  // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });

    wsResumenPorPuesto['B2'] = { t: 's', v: `Reporte de progreso por perfil ${this.titleCase(nombreEmpresa)}`, s: whiteCalibriBold };
    wsResumenPorPuesto['B3'] = { t: 's', v: fechaActual, s: whiteCalibriBold };

    wsResumenPorPuesto['B5'] = { t: 's', v: 'Perfil', s: grayCalibriBoldCenterCenterBordered };
    wsResumenPorPuesto['C5'] = { t: 's', v: 'Estudiantes registrados', s: grayCalibriBoldCenterCenterBordered };
    wsResumenPorPuesto['D5'] = { t: 's', v: 'Estudiantes con licencia activa', s: grayCalibriBoldCenterCenterBordered };
    wsResumenPorPuesto['E5'] = { t: 's', v: 'Horas del plan de estudio', s: grayCalibriBoldCenterCenterBordered };
    wsResumenPorPuesto['F5'] = { t: 's', v: 'Cant. de Est. con ritmo alto', s: greenCalibriBoldGreenCenterBordered };
    wsResumenPorPuesto['G5'] = { t: 's', v: 'Cant. de Est. con ritmo medio', s: yellowCalibriBoldYellowCenterBordered };
    wsResumenPorPuesto['H5'] = { t: 's', v: 'Cant. de Est. con ritmo bajo', s: redCalibriBoldRedCenterBordered };
    wsResumenPorPuesto['I5'] = { t: 's', v: 'Cant. de Est. sin plan de estudio', s: gray6CalibriBoldGreyCenterBordered };
    wsResumenPorPuesto['J5'] = { t: 's', v: 'Procentaje de completación promedio de los estudiantes', s: grayCalibriBoldCenterCenterBordered };
    wsResumenPorPuesto['K5'] = { t: 's', v: 'Calificación promedio de los estudiantes', s: grayCalibriBoldCenterCenterBordered };


    perfiles.forEach((perfil,i) => {
      let j = i+6;


      let usuariosConLicenciaProfile = usuariosConLicencia.filter(x=>x.profileId == perfil)
      wsResumenPorPuesto[`B${j}`] = 
      { t: 's',
        v: `${this.profiles.find(x=>x.id == perfil).name}`,
        s: whiteCalibriLeftBordered 
      };

      wsResumenPorPuesto[`C${j}`] = 
      { t: 's',
        v: `${this.users.filter(x=>x.profileId == perfil).length}`,
        s: whiteCalibriCenteredBordered 
      };

      wsResumenPorPuesto[`D${j}`] = 
      { t: 's',
        v: `${usuariosConLicencia.filter(x=>x.profileId == perfil).length}`,
        s: whiteCalibriCenteredBordered 
      };

      wsResumenPorPuesto[`E${j}`] = 
      { t: 's',
        v: `${this.getHoursProfile(perfil)}`,
        s: whiteCalibriCenteredBordered 
      };

      let usuariosLicenciaALto = usuariosConLicenciaProfile.filter(x=>x.rhythm == 'high').length
      let usuariosLicenciaMedio = usuariosConLicenciaProfile.filter(x=>x.rhythm == 'medium').length
      let usuariosLicenciaBajo = usuariosConLicenciaProfile.filter(x=>x.rhythm == 'low').length
      let usuariosLicenciaSin = usuariosConLicenciaProfile.filter(x=>((x.rhythm == 'no plan')||(x.rhythm == 'no iniciado'))).length

      wsResumenPorPuesto[`F${j}`] = 
      { t: 's',
        v: `${usuariosLicenciaALto}`,
        s: whiteCalibriCenteredBordered 
      };


      wsResumenPorPuesto[`G${j}`] = 
      { t: 's',
        v: `${usuariosLicenciaMedio}`,
        s: whiteCalibriCenteredBordered 
      };

      wsResumenPorPuesto[`H${j}`] = 
      { t: 's',
        v: `${usuariosLicenciaBajo}`,
        s: whiteCalibriCenteredBordered 
      };

      wsResumenPorPuesto[`I${j}`] = 
      { t: 's',
        v: `${usuariosLicenciaSin}`,
        s: whiteCalibriCenteredBordered 
      };
      
      wsResumenPorPuesto[`J${j}`] = 
      { t: 's',
        v: `${this.getProfileProgress(usuariosConLicenciaProfile)}%`,
        s: whiteCalibriCenteredBordered 
      };

      let notas = this.getProfileNotaPromedio(usuariosConLicenciaProfile)

      wsResumenPorPuesto[`K${j}`] = 
      { t: 's',
        v: notas>=0?notas:'-',
        s: whiteCalibriCenteredBordered 
      };

    });
    
    // Fin Hoja 2 (Resumen por puesto)


    // Hoja 3 (Resumen por usuario)


    wsResumenEstudiantes['B2'] = { t: 's', v: `Reporte de resumen por estudiante ${this.titleCase(nombreEmpresa)}`, s: whiteCalibriBold };
    wsResumenEstudiantes['B3'] = { t: 's', v: fechaActual, s: whiteCalibriBold };

    if (!wsResumenEstudiantes['!merges']) wsResumenEstudiantes['!merges'] = [];


    // Combinar celdas B2 y C2
    wsResumenEstudiantes['!merges'].push({
      s: {r: 1, c: 1}, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: {r: 1, c: 2}  // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });


    wsResumenEstudiantes['B5'] = { t: 's', v: 'Nombre', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['C5'] = { t: 's', v: 'Licencia', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['D5'] = { t: 's', v: 'Correo', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['E5'] = { t: 's', v: 'Perfil', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['F5'] = { t: 's', v: 'Departamento', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['G5'] = { t: 's', v: 'Cursos asignados', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['H5'] = { t: 's', v: 'Cursos completados', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['I5'] = { t: 's', v: 'Horas asignadas', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['J5'] = { t: 's', v: 'Horas completadas', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['K5'] = { t: 's', v: 'Progreso', s: grayCalibriBoldCenterCenterBordered };

    wsResumenEstudiantes['L5'] = { t: 's', v: 'Calificación promedio', s: grayCalibriBoldCenterCenterBordered };


    wsResumenEstudiantes['M5'] = { t: 's', v: 'Ritmo', s: grayCalibriBoldCenterCenterBordered };
    wsResumenEstudiantes['N5'] = { t: 's', v: 'Fecha límite de completación', s: grayCalibriBoldCenterCenterBordered };

    const rhythmOrder = {
      "high": 1,
      "medium": 2,
      "low": 3,
      "no iniciado": 4,
      "no plan": 5
    };

    usuariosConLicencia.sort((a, b) => {
      return rhythmOrder[a.rhythm] - rhythmOrder[b.rhythm];
    });

    usuariosSinLicencia.sort((a, b) => {
      return rhythmOrder[a.rhythm] - rhythmOrder[b.rhythm];
    });

    let usuariosDetalles = [...usuariosConLicencia,...usuariosSinLicencia]

    usuariosDetalles.forEach((usuario,i) => {
      let j = i+6;

      //let usuariosConLicencia = this.users.filter(x=>x?.allsubscriptions.find(y=>y?.status == 'active'))


      wsResumenEstudiantes[`B${j}`] = 
      { t: 's',
        v: `${this.titleCase(usuario.displayName)}`,
        s: whiteCalibriLeftBordered 
      };

      let status = usuario?.allsubscriptions.find(y=>y?.status == 'active')?'Activa':'Inactiva'

      wsResumenEstudiantes[`C${j}`] = 
      { t: 's',
        v: status,
        s: status=='Activa'?greenCalibriBoldGreenCenterBordered:redCalibriBoldRedCenterBordered
      };

      wsResumenEstudiantes[`D${j}`] = 
      { t: 's',
        v: `${usuario.email}`,
        s: mailLinkStyle 
      };

      wsResumenEstudiantes[`E${j}`] = 
      { t: 's',
        v: `${usuario.profile ? usuario.profile : 'Sin asignar'}`,
        s: usuario.profile ? whiteCalibriCenteredBordered : whiteCalibriRedCenteredBordered
      };

      wsResumenEstudiantes[`F${j}`] = 
      { t: 's',
        v: `${usuario.department ? usuario.department : 'Sin asignar'}`,
        s: usuario.department ? whiteCalibriCenteredBordered : whiteCalibriRedCenteredBordered
      };

      wsResumenEstudiantes[`G${j}`] = 
      { t: 's',
        v: `${usuario.allCourses.length}`,
        s:  whiteCalibriCenteredBordered 
      };

      wsResumenEstudiantes[`H${j}`] = 
      { t: 's',
        v: `${usuario?.allCourses?.filter(x=>x.progress.progress >=100)?.length}`,
        s:  whiteCalibriCenteredBordered 
      };

      let targetHoursAllCourses =  Math.round((usuario.targetHoursAllCourses) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal

      wsResumenEstudiantes[`I${j}`] = 
      { t: 's',
        v: targetHoursAllCourses,
        s: whiteCalibriCenteredBordered 
      };
      
      let completedHoursAllCourses =  Math.round((usuario.hoursAllCourses) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal

      wsResumenEstudiantes[`J${j}`] = 
      { t: 's',
        v: completedHoursAllCourses,
        s: whiteCalibriCenteredBordered 
      };


      let progreso =  Math.round((usuario.completacionAll) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal

      wsResumenEstudiantes[`K${j}`] = 
      { t: 's',
        v: `${progreso}%`,
        s: whiteCalibriCenteredBordered 
      };

      let notas = 0
      let coursesCompleted = usuario.allCourses.filter(x=>x.progress.progress>=100)
      


      coursesCompleted?.forEach(course => {
        notas+=course.progress.finalScore
      });

      notas=notas/coursesCompleted.length
      notas = Math.round((notas) * 10) / 10

      wsResumenEstudiantes[`L${j}`] = 
      { t: 's',
        v: notas>=0?notas:'-',
        s: whiteCalibriCenteredBordered
      };


      let ritmo = this.getRitmoAndStyleUser(usuario)

      wsResumenEstudiantes[`M${j}`] = 
      { t: 's',
        v: ritmo.ritmo,
        s: eval(ritmo.estilo)
      };

      let fechaFin = this.getLastDateStudyPlan(usuario)

      wsResumenEstudiantes[`N${j}`] = 
      { t: 's',
        v: fechaFin,
        s: fechaFin=='Sin Asignar'?whiteCalibriRedCenteredBordered:whiteCalibriCenteredBordered 
      };


    });
    // Fin Hoja 3 (Resumen por usuario)


    // Fin Hoja 4 (Detalle por usuario)


    if (!wsDetalleEstudiantes['!merges']) wsDetalleEstudiantes['!merges'] = [];

    // Combinar celdas B2 y C2
    wsDetalleEstudiantes['!merges'].push({
      s: {r: 1, c: 1}, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: {r: 1, c: 2}  // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });

    wsDetalleEstudiantes['B2'] = { t: 's', v: `Reporte Detalle estudiantes ${this.titleCase(nombreEmpresa)}`, s: whiteCalibriBold };
    wsDetalleEstudiantes['B3'] = { t: 's', v: fechaActual, s: whiteCalibriBold };



    wsDetalleEstudiantes['B5'] = { t: 's', v: 'Nombre', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['C5'] = { t: 's', v: 'Licencia', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['D5'] = { t: 's', v: 'Correo', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['E5'] = { t: 's', v: 'Perfil', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['F5'] = { t: 's', v: 'Departamento', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['G5'] = { t: 's', v: 'N. Curso', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['H5'] = { t: 's', v: 'Titulo', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['I5'] = { t: 's', v: 'Duración del curso horas', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['J5'] = { t: 's', v: 'Progreso', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['K5'] = { t: 's', v: 'Estatus', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['L5'] = { t: 's', v: 'Calificación', s: grayCalibriBoldCenterCenterBordered };
    wsDetalleEstudiantes['M5'] = { t: 's', v: 'Fecha límite de completación', s: grayCalibriBoldCenterCenterBordered };


    usuariosDetalles.sort((a, b) => a.displayName.localeCompare(b.displayName));

    console.log('usuariosDetalles',usuariosDetalles)

    let userDetail= 6
    usuariosDetalles.forEach((usuario,index) => {
      if(usuario.allCourses.length>0){ // tiene cursos
        let coursesUser = usuario.allCourses
        coursesUser.sort((a, b) => a.progress.dateStartPlan.seconds - b.progress.dateStartPlan.seconds);
        coursesUser.forEach((curso,IndexCurso) => {
          wsDetalleEstudiantes[`B${userDetail}`] = 
          { t: 's',
            v: `${this.titleCase(usuario.displayName)}`,
            s: whiteCalibriLeftBordered 
          };

          let status = usuario?.allsubscriptions.find(y=>y?.status == 'active')?'Activa':'Inactiva'
          wsDetalleEstudiantes[`C${userDetail}`] = 
          { t: 's',
            v: status,
            s: status=='Activa'?greenCalibriBoldGreenCenterBordered:redCalibriBoldRedCenterBordered
          };
          wsDetalleEstudiantes[`D${userDetail}`] = 
          { t: 's',
            v: `${usuario.email}`,
            s: mailLinkStyle 
          };
        wsDetalleEstudiantes[`E${userDetail}`] = 
        { t: 's',
          v: `${usuario.profile ? usuario.profile : 'Sin asignar'}`,
          s: usuario.profile ? whiteCalibriCenteredBordered : whiteCalibriRedCenteredBordered
        };
        wsDetalleEstudiantes[`F${userDetail}`] = 
        { t: 's',
          v: `${usuario.department ? usuario.department : 'Sin asignar'}`,
          s: usuario.department ? whiteCalibriCenteredBordered : whiteCalibriRedCenteredBordered
        };

        wsDetalleEstudiantes[`G${userDetail}`] = 
        { t: 's',
          v: IndexCurso+1,
          s:  whiteCalibriCenteredBordered
        };

        wsDetalleEstudiantes[`H${userDetail}`] = 
        { t: 's',
          v: curso.titulo,
          s:  whiteCalibriLeftBordered
        };


        wsDetalleEstudiantes[`I${userDetail}`] = 
        { t: 's',
          v:  Math.round((curso.duracion)/60 * 10) / 10 ,
          s:  whiteCalibriCenteredBordered
        };

        wsDetalleEstudiantes[`J${userDetail}`] = 
        { t: 's',
          v:  `${Math.round((curso.progress.progress) * 10) / 10}%` ,
          s:  whiteCalibriCenteredBordered
        };


        wsDetalleEstudiantes[`K${userDetail}`] = 
        { t: 's',
          v: curso.progress.progress>=100? 'Completado' : 'Pendiente',
          s:  curso.progress.progress>=100? greenCalibriBoldGreenCenterBordered:redCalibriBoldRedCenterBordered
        };

        wsDetalleEstudiantes[`L${userDetail}`] = 
        { t: 's',
        v: curso.progress.finalScore ?(curso.progress.finalScore>=100?100:Math.round((curso.progress.finalScore) * 10) / 10) : '-',
        s:  whiteCalibriCenteredBordered
        };

        let fechaFin = curso.progress.dateEndPlan.seconds*1000
        
        let latestDate = new Date(fechaFin);
        let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
        let dateString = latestDate.toLocaleDateString('es-ES', options);

        wsDetalleEstudiantes[`M${userDetail}`] = 
        { t: 's',
          v: dateString,
          s:  whiteCalibriCenteredBordered
        };


        userDetail=userDetail+1;
        });
      }
      else{ // no tiene cursos
        console.log(usuario.displayName)
        wsDetalleEstudiantes[`B${userDetail}`] = 
        { t: 's',
          v: `${this.titleCase(usuario.displayName)}`,
          s: whiteCalibriLeftBordered 
        };
        let status = usuario?.allsubscriptions.find(y=>y?.status == 'active')?'Activa':'Inactiva'
        wsDetalleEstudiantes[`C${userDetail}`] = 
        { t: 's',
          v: status,
          s: status=='Activa'?greenCalibriBoldGreenCenterBordered:redCalibriBoldRedCenterBordered
        };
  
        wsDetalleEstudiantes[`D${userDetail}`] = 
        { t: 's',
          v: `${usuario.email}`,
          s: mailLinkStyle 
        };

        wsDetalleEstudiantes[`E${userDetail}`] = 
        { t: 's',
          v: `${usuario.profile ? usuario.profile : 'Sin asignar'}`,
          s: usuario.profile ? whiteCalibriCenteredBordered : whiteCalibriRedCenteredBordered
        };
        wsDetalleEstudiantes[`F${userDetail}`] = 
        { t: 's',
          v: `${usuario.department ? usuario.department : 'Sin asignar'}`,
          s: usuario.department ? whiteCalibriCenteredBordered : whiteCalibriRedCenteredBordered
        };

        wsDetalleEstudiantes[`G${userDetail}`] = 
        { t: 's',
          v: `-`,
          s: whiteCalibriCenteredBordered
        };

        
        wsDetalleEstudiantes[`H${userDetail}`] = 
        { t: 's',
          v: 'Sin cursos asignados',
          s:  whiteCalibriRedLeftBordered
        };


        wsDetalleEstudiantes[`I${userDetail}`] = 
        { t: 's',
          v: '-',
          s:  whiteCalibriCenteredBordered
        };


        wsDetalleEstudiantes[`J${userDetail}`] = 
        { t: 's',
          v: '-',
          s:  whiteCalibriCenteredBordered
        };


        wsDetalleEstudiantes[`K${userDetail}`] = 
        { t: 's',
          v: '-',
          s:  whiteCalibriCenteredBordered
        };

        wsDetalleEstudiantes[`L${userDetail}`] = 
        { t: 's',
          v: '-',
          s:  whiteCalibriCenteredBordered
        };

        wsDetalleEstudiantes[`M${userDetail}`] = 
        { t: 's',
          v: '-',
          s:  whiteCalibriCenteredBordered
        };



        userDetail=userDetail+1;
      }
    });

    // Fin Hoja 4 (Detalle por usuario)


    [wsGeneral,wsResumenEstudiantes,wsDetalleEstudiantes].forEach(workSheet => {
      workSheet['!ref'] = `A1:${this.toColumnName(endColumn)}${userDetail+20}`;
  
      workSheet['!cols'] = Array(endColumn).fill(0).map(item => {
        return {wch: 10}
      })

      // Fix columns length
      Object.keys(workSheet).forEach(key => {
        if (key.charAt(0) === '!') {
          return
        }
        const baseLetterSize = 12
        const letterSizeToBaseLetterSizeDifference = workSheet[key].s.font.sz - baseLetterSize
        const letterSizeMultiplicationFactor = 1 + 0.2*letterSizeToBaseLetterSizeDifference
        const stringLength = workSheet[key]?.v?.length?  workSheet[key]?.v?.length: 5 * letterSizeMultiplicationFactor
        const colLetter = this.separateLettersAndNumbers(key).letters
        const columnIndex = this.columnNameToIndex(colLetter)
        workSheet['!cols'][columnIndex]['wch'] = workSheet['!cols'][columnIndex]['wch'] >= stringLength  + 4 ? workSheet['!cols'][columnIndex]['wch'] : stringLength  + 4
      })
    })

    wsResumenPorPuesto['!ref'] = `A1:${this.toColumnName(endColumn)}${this.users.length+20}`;
  
    wsResumenPorPuesto['!cols'] = Array(endColumn).fill(0).map(item => {
      return {wch: 10}
    })

    // Fix columns length
    Object.keys(wsResumenPorPuesto).forEach(key => {
      if (key.charAt(0) === '!') {
        return
      }
      const colLetter = this.separateLettersAndNumbers(key).letters
      const columnIndex = this.columnNameToIndex(colLetter)
      if(columnIndex == 1 ){
        wsResumenPorPuesto['!cols'][columnIndex]['wch'] = 40
      }
      else{
        wsResumenPorPuesto['!cols'][columnIndex]['wch'] = 20
      }
    })
    

    XLSX.utils.book_append_sheet(wb, wsGeneral, 'General');
    XLSX.utils.book_append_sheet(wb, wsResumenPorPuesto, 'Resumen por perfil');
    XLSX.utils.book_append_sheet(wb, wsResumenEstudiantes, 'Resumen estudiantes');
    XLSX.utils.book_append_sheet(wb, wsDetalleEstudiantes, 'Detalle estudiantes');

    XLSX.writeFile(wb, `Reporte General ${this.enterprise.name} ${fechaActual}.xlsx`);

    this.generatinReport = false

  }


  getLastDateStudyPlan(user){

    let fechas = []
    console.log('getLastDateStudyPlan',user)
    if(user?.allCourses?.length>0){
      user.allCourses.forEach(curso => {
        if(curso?.progress?.dateEndPlan?.seconds){
          let fecha = curso.progress.dateEndPlan.seconds*1000
          fechas.push(fecha)
        }
      });

      let latestTimestamp = Math.max(...fechas);
      let latestDate = new Date(latestTimestamp);
      let options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
      let dateString = latestDate.toLocaleDateString('es-ES', options);

      return dateString

    }
    return 'Sin Asignar'



  }

  getRitmoAndStyleUser(users){

    let ritmo = null
    let estilo = null

    if(users.rhythm == 'high'){
      ritmo = "Alto"
      estilo = 'greenCalibriBoldGreenCenterBordered'
    }
    else if(users.rhythm == 'medium'){
      ritmo = "Medio"
      estilo = 'yellowCalibriBoldYellowCenterBordered'
    }
    else if(users.rhythm == 'low'){
      ritmo = "Bajo"
      estilo = 'redCalibriBoldRedCenterBordered'
    }
    else if(users.rhythm == 'no iniciado'){
      ritmo = "No iniciado"
      estilo = 'gray6CalibriBoldGreyCenterBordered'
    }
    else if( users.rhythm == 'no plan'){
      ritmo = "Sin plan de estudio"
      estilo = 'gray6CalibriBoldGreyCenterBordered'
    }
    return {
      ritmo: ritmo,
      estilo:estilo
    }
  }


  getProfileProgress(users){
    //completacionAll
    let progress = 0
    users.forEach(user => {
      progress+=user.completacionAll;
    });
    let promedioCompletacion = progress/users.length
    promedioCompletacion =  Math.round((promedioCompletacion) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal
    return promedioCompletacion;
  }



  
  getProfileNotaPromedio(users){


    let notas = 0
    let cursos = []


    users.forEach(usuario => {
      let coursesCompleted = usuario.allCourses.filter(x=>x.progress.progress>=100)
      cursos = [...cursos,...coursesCompleted]
    });
    console.log('getProfileNotaPromedio',cursos)

    cursos?.forEach(course => {
      notas+=course.progress.finalScore
    });

    notas=notas/cursos.length
    notas = Math.round((notas) * 10) / 10

    return notas



  }


  getHoursProfile(idProfile){
    let profile = this.profiles.find(x=>x.id == idProfile)
    let minutesCourses = 0
    profile.coursesRef.forEach(courseRef => {
      let curso = this.courses.find(x=>x.id == courseRef.id)
      minutesCourses+=curso.duracion
    });
    let hoursCourses =  Math.round((minutesCourses / 60) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal
    return hoursCourses
  }

  generatinReport
  startDate
  endDate
  profiles
  courses
  classes
  departments
  users



  downloadReport() {

    //alert('inicio reporte')
    this.generatinReport = true
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe()
    }
    

    let fechaInicio = null
    let fechaFin = null

    if(this.startDate){
      fechaInicio = new Date(this.startDate.year,this.startDate.month-1,this.startDate.day)
    }
    if(this.endDate){
      fechaFin = new Date(this.endDate.year,this.endDate.month-1,this.endDate.day)
    }


    this.userServiceSubscription = this.userService.getUsersReport$(null,null,null,null,fechaInicio,fechaFin).pipe(
      filter(user=>user !=null),take(1),
      switchMap(users => {
        const userCourseObservables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid);
          // Obtener cursos activos por usuario
          const coursesObservable = this.courseService.getActiveCoursesByStudentDateFiltered$(userRef,fechaInicio,fechaFin).pipe(take(1));
          // Obtener clases asociadas al usuario, independientemente de los cursos
          const classesObservable = this.courseService.getClassesByStudentDatefilterd$(userRef,fechaInicio,fechaFin).pipe(take(1));
          const allCoursesObservable = this.courseService.getActiveCoursesByStudent(userRef)
          const certificatesObservable = this.courseService.getCertificatestDatefilterd$(userRef,fechaInicio,fechaFin).pipe(take(1))
          const subscriptionsObservable = this.userService.getSubscriptionByStudentDateFiltered$(userRef,fechaInicio,fechaFin).pipe(take(1))
          return combineLatest([coursesObservable, classesObservable,certificatesObservable,allCoursesObservable,subscriptionsObservable]).pipe(
            map(([courses, classes,certificados,allCourses,allsubscriptions]) => {
              // Aquí tienes un objeto que incluye tanto los cursos como las clases asociadas a ese usuario
              // Cursos y clases están en sus propios objetos y no anidadas
              return { user, courses, classes,certificados,allCourses,allsubscriptions };
            })
          );
        });
        // Combina los observables de todos los usuarios con sus cursos y clases
        return combineLatest(userCourseObservables).pipe(take(1));
        })).subscribe(response => {
        console.log('datos reporte',response)
        const users: User[] = response.map(({user, courses,classes,certificados,allCourses,allsubscriptions}) => {
          const profile = this.profiles.find(profile => {
            if(user.profile) {
              return profile.id === user.profile.id
            }
            return false
          })
          let profileName = ''
          if (profile) {
            profileName = profile.name
          }
          let hours = 0
          let targetHours = 0
          let targetHoursAllCourses = 0
          let hoursAllCourses = 0
          let coursesUser = [];
          let allcoursesUser = [];
          let classesUser= []
          courses.forEach(course => {
            hours += (course?.progressTime ? course.progressTime : 0)/60
            const courseJson = this.courses.find(item => item.id === course.courseRef.id)
            let courseIn = {...courseJson,progress:course}
            courseIn.completed = course.progress >= 100? true : false
            coursesUser.push(courseIn)
            targetHours += (courseJson.duracion/60)
          })

          allCourses.forEach(course => {
            hoursAllCourses += (course?.progressTime ? course.progressTime : 0)/60
            const courseJson = this.courses.find(item => item.id === course.courseRef.id)
            let courseIn = {...courseJson,progress:course}
            courseIn.completed = course.progress >= 100? true : false
            allcoursesUser.push(courseIn)            
            targetHoursAllCourses += (courseJson.duracion/60)
          })

          classes.forEach(clase => {
            const classJson = this.classes.find(item => item.id === clase.classRef.id)
            let claseData = {...classJson,...clase}
            classesUser.push(claseData)
          })
          const userPerformance: "no plan" | "high" | "medium" | "low" | "no iniciado"= this.userService.getPerformanceWithDetails(courses);
          const department = this.departments.find(department => department.id === user.departmentRef?.id)
          const ratingPoints: number = this.userService.getRatingPointsFromStudyPlan(courses, this.courses);
          return {
            email:user.email,
            displayName: user.displayName,
            department: department?.name ? department.name : '',
            departmentId: department?.id ? department.id : '',
            hours: hours, // Calculation pending
            hoursAllCourses:hoursAllCourses,
            targetHours: targetHours,
            targetHoursAllCourses:targetHoursAllCourses,
            profile: profileName,
            profileId: profile?.id ? profile.id : '',
            ratingPoints: ratingPoints,
            rhythm: userPerformance, // Calculation pending
            uid: user.uid,
            jog: user.job,
            photoUrl: user.photoUrl,
            courses:coursesUser,
            clases:classesUser,
            certificados:certificados,
            allCourses:allcoursesUser,
            allsubscriptions:allsubscriptions,
            completacion:targetHours?hours*100/targetHours:'',
            completacionAll:targetHoursAllCourses?hoursAllCourses*100/targetHoursAllCourses:''
          }
        })
        this.users = users; // Assuming the data is in 'items'
        console.log('data reporte',this.users)
        this.downloadExcelReport()
      }
    );
  }



  titleCase(str: string): string {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }


  columnNameToIndex(columnName) {
    let column = columnName.toUpperCase();
    let length = column.length;
    let index = 0;
  
    for (let i = 0; i < length; i++) {
      index += (column.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
    }
  
    return index - 1; // -1 because Excel columns are 1-indexed
  }

  separateLettersAndNumbers(str) {
    const matches = str.match(/^([a-zA-Z]+)(\d+)$/);
    
    if (matches) {
      return { letters: matches[1], numbers: matches[2] };
    }
    
    throw new Error('The string does not match the expected pattern.');
  }


  toColumnName(num) {
    let ret = '', a = 1, b = 26;
    while (num >= 0) {
      ret = String.fromCharCode((num % b) + 65) + ret;
      num = Math.floor((num - num % b) / b) - 1;
    }
    return ret;
  }

}
