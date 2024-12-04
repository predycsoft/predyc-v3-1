import { Component } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { Subscription, combineLatest, filter, firstValueFrom, map, switchMap, take } from "rxjs";
import { DialogDownloadReportComponent } from "projects/predyc-business/src/shared/components/dialogs/dialog-download-report/dialog-download-report.component";
import { AfterOnInitResetLoading } from "projects/predyc-business/src/shared/decorators/loading.decorator";
import { CourseByStudent, CourseByStudentJson } from "projects/shared/models/course-by-student.model";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { LoaderService } from "projects/predyc-business/src/shared/services/loader.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import * as XLSX from "xlsx-js-style";
import { ProfileService } from "projects/predyc-business/src/shared/services/profile.service";
import { DepartmentService } from "projects/predyc-business/src/shared/services/department.service";
import { AngularFirestore, QuerySnapshot } from "@angular/fire/compat/firestore";
import { Curso, Profile, ProfileJson, User as UserClass, UserJson } from "projects/shared";
import { ActivityClassesService } from '../../../shared/services/activity-classes.service';
import { AuthService } from "projects/predyc-business/src/shared/services/auth.service";

interface User {
  displayName: string;
  profile: string;
  department: string;
  hours: number;
  targetHours: number;
  ratingPoints: number;
  rhythm: string;
  uid: string;
  photoUrl: string;
}

@AfterOnInitResetLoading
@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent {
  enterprise: Enterprise;
  enterpriseSubscription: Subscription;
  combinedSubscription: Subscription;
  userServiceSubscription: Subscription;
  performances = [];
  displayErrors;
  profilesSubscription: Subscription;
  testUsers
  examenInicial
  user
  allUsers

  // rythms
  rythms = {
    high: 0,
    medium: 0,
    low: 0,
    noPlan: 0,
  };

  constructor(
    public loaderService: LoaderService,
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private courseService: CourseService,
    private modalService: NgbModal,
    private profileService: ProfileService,
    private departmentService: DepartmentService,
    private afs: AngularFirestore,
    private activityClassesService: ActivityClassesService,
    private authService: AuthService,

  ) {}

  async ngOnInit() {
    this.authService.user$.subscribe((user) => {
      this.user = user;
    });
    // console.log("this.user", this.user)
    this.loaderService.setLoading(true);
    // this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(async (enterprise) => {
    this.enterpriseSubscription = this.enterpriseService.enterprise$
    .pipe(
      // Proceed only if the enterprise exists (is not null or undefined)
      filter(enterprise => !!enterprise),
      take(1)
    )
    .subscribe(async (enterprise) => {
      // console.log("enterprise", enterprise)
      if (enterprise) {

        //let certicates = await this.enterpriseService.getCertificatesEnterprise(enterprise)
        //console.log('certicates',certicates)
        this.enterprise = enterprise;
        this.rythms = this.enterprise["rythms"]

        // console.log('enterpriseDashboard',enterprise)
        this.loaderService.setLoading(false);
        if(this.enterprise.examenInicial  === undefined || this.enterprise?.examenInicial){
          this.examenInicial = true
        }
        else{
          this.examenInicial = false
        }

        this.generatinReport = false;
        this.displayErrors = false;

        const [profiles, departments, courses, classes, tests] = await Promise.all([
          firstValueFrom(this.profileService.getProfiles$()),
          firstValueFrom(this.departmentService.getDepartments$()),
          firstValueFrom(this.courseService.getCourses$()),
          firstValueFrom(this.courseService.getClassesEnterprise$()),
          firstValueFrom(this.activityClassesService.getTestProfileResultsEnterprise())
        ]);
        
        // console.log("profiles", profiles)
        // console.log("departments", departments)
        // console.log("courses", courses)
        // console.log("tests", tests)
        this.allUsers = await this.userService.getEnterpriseUsers();
        this.profiles = profiles;
        this.departments = departments;
        this.courses = courses;
        this.classes = classes
        this.testUsers = tests

        let users = [...this.allUsers]
        const usersRefs = users.map(x => this.userService.getUserRefById(x.uid))
        const allUsersCoursesByStudent: CourseByStudent[] = await this.courseService.getActiveCoursesByStudentByUserRefs(usersRefs)
        // console.log("users", users)
        if (users && users.length > 1) {
          // first response is an 1 element array corresponded to admin
          // const performances = [];
          users = users.filter(x=>x.status == 'active')
          for (let user of users) {

            let test = this.testUsers.filter(x=>x.userRef.id == user.uid && x.type == 'inicial')
            let dateLastActivity = null
            let lastActivityText: string;
            let groupedLastActivity ='Más de 30 días' // Is being used in users-onboarding
            // Determinar el estado de la actividad
            let activityStatus = 'Sin inicio sesión'; // Is being used in users-onboarding
            if (user['lastActivityDate']?.seconds) {
              // console.log('lastActivityDate',user['lastActivityDate']?.seconds,user.uid)
              let date = new Date(user['lastActivityDate'].seconds * 1000);
              date.setHours(0, 0, 0, 0); // Establecer la hora a 00:00:00.000
              activityStatus = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
              dateLastActivity = date.getTime();
              // console.log('dateLastActivity',dateLastActivity)
              // Crear la variable de texto para indicar hace cuánto fue la última actividad
              let today = new Date();
              today.setHours(0, 0, 0, 0);
              let diffTime = Math.abs(today.getTime() - date.getTime());
              let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Diferencia en días
    
              if(diffDays <= 15){
                groupedLastActivity ='Menos de 15 días'
              }
              else if(diffDays <= 30){
                groupedLastActivity ='Menos de 30 días'
              }
              else{
                groupedLastActivity ='Más de 30 días'
              }

              if (diffDays === 0) {
                lastActivityText = 'Hoy';
              } else if (diffDays <= 30) {
                if(diffDays == 1){
                  lastActivityText = `Hace 1 día`;
                }
                else{
                  lastActivityText = `Hace ${diffDays} días`;
                }
              } else {
                lastActivityText = 'Más de 30 días';
              }
            } else if (!user['lastActivityDate']?.seconds && this.examenInicial && test.length === 0 && user['lastViewDate']) {
              activityStatus = 'Sin diagnostico completado';
              groupedLastActivity ='Más de 30 días'
              // actStatus.push(activityStatus)
            } else if (!user['lastActivityDate']?.seconds && this.examenInicial && test.length > 0) {
              activityStatus = 'Sin clases vistas';
              groupedLastActivity ='Más de 30 días'
              // actStatus.push(activityStatus)
            }

            user['groupedLastActivity'] = groupedLastActivity
            user['activityStatusText'] = activityStatus
            user['lastActivity'] =  user['lastActivity']?user['lastActivity']:null
            
            // const userRef = this.userService.getUserRefById(user.uid);
            const studyPlan: CourseByStudent[] = allUsersCoursesByStudent.filter(x => x.userRef.id === user.uid);
            // console.log("studyPlan", studyPlan)
            // studyPlan.forEach(course => {
            //   const courseJson = this.courses.find(item => item.id === course.courseRef.id);
            //   // console.log('cursosRevisarPlan',this.courses,courseJson)
            //   if (courseJson) {
            //     course.courseTime = courseJson.duracion
            //   }
            // });
            // const userPerformance:
            //   | "no plan"
            //   | "high"
            //   | "medium"
            //   | "low"
            //   | "no iniciado" =
            //   this.userService.getPerformanceWithDetails(studyPlan);
            //   user.performance = userPerformance,
            user['studyPlan'] = studyPlan
              // console.log('studyPlanReporteUser',user,userPerformance)
            // performances.push(userPerformance);
            // user['ready'] = true
            
          }
          this.users = users
          // console.log('this.user performance',this.users, performances)
          // this.getUsersRythmData(performances);
          // console.log("Performances calculated")
        }
        //this.getData();
      }
    });
  }

  // getUsersRythmData(performances: Array<"no plan" | "high" | "medium" | "low" | "no iniciado">) {
  //   this.rythms = {
  //     high: 0,
  //     medium: 0,
  //     low: 0,
  //     noPlan: 0,
  //   };
  //   // Iterar sobre el array de performances
  //   for (const performance of performances) {
  //     switch (performance) {
  //       case "no plan":
  //         this.rythms.noPlan += 1;
  //         break;
  //       case "high":
  //         this.rythms.high += 1;
  //         break;
  //       case "medium":
  //         this.rythms.medium += 1;
  //         break;
  //       case "low":
  //         this.rythms.low += 1;
  //         break;
  //       case "no iniciado":
  //         this.rythms.noPlan += 1;
  //         break;
  //     }
  //   }
  //   // console.log(`No Plan: ${this.rythms.noPlan}, High: ${this.rythms.high}, Medium: ${this.rythms.medium}, Low: ${this.rythms.low}`);
  // }

  // async fixProfiles() {
  //   const profilesSnapshot: QuerySnapshot<ProfileJson> = (await this.afs.collection(Profile.collection).ref.get()) as QuerySnapshot<ProfileJson>;
  //   const profiles = profilesSnapshot.docs.map((doc) => doc.data());
  //   for (let profile of profiles) {
  //     const newCoursesRef = profile.coursesRef.map((item, idx) => {
  //       return {
  //         courseRef: item,
  //         studyPlanOrder: idx + 1,
  //       };
  //     });
  //     const usersSnapshot: QuerySnapshot<UserJson> = (await this.afs.collection(UserClass.collection).ref
  //     .where("profile","==",this.profileService.getProfileRefById(profile.id))
  //     .get()) as QuerySnapshot<UserJson>;
  //     const users = usersSnapshot.docs.map((doc) => doc.data());
  //     for (let user of users) {
  //       const coursesSnapshot: QuerySnapshot<CourseByStudentJson> = (await this.afs.collection(CourseByStudent.collection).ref
  //       .where("userRef","==",this.userService.getUserRefById(user.uid))
  //       .get()) as QuerySnapshot<CourseByStudentJson>;
  //       const courses = coursesSnapshot.docs.map((doc) => doc.data());
  //       if (courses.length > 0) {
  //         for (let item of newCoursesRef) {
  //           const targetCourseRef = courses.find(
  //             (x) => x.courseRef.id === item.courseRef.id
  //           );
  //           await this.afs.collection<CourseByStudentJson>(CourseByStudent.collection).doc(targetCourseRef.id).set(
  //             {
  //               ...targetCourseRef,
  //               studyPlanOrder: item.studyPlanOrder,
  //             },
  //             { merge: true }
  //           );
  //         }
  //       }
  //     }
  //     await this.afs.collection<ProfileJson>(Profile.collection).doc(profile.id).set({ ...profile, coursesRef: newCoursesRef }, { merge: true });
  //   }
  //   this.courseService.fixStudyPlanEnterprise();
  // }

  async getValoraciones() {
    const valoraciones = await this.enterpriseService.getCursosValoraciones();
    console.log('valoraciones', valoraciones);

    let valoracionesExport = [];
    valoraciones.forEach(valoracion => {
        // Convertir la fecha de string a objeto Date
        const fechaString = valoracion.valoracion.fecha; // Suponiendo que la fecha está en este campo
        const fecha = this.convertirFechaString(fechaString); // Convertir la fecha usando la función
        let respuesta = {
            nombreUsuario: valoracion.usuarioDetalles.name,
            curso: valoracion.cursoDetalles.titulo,
            empresa: valoracion?.empresaDetalles?.name ? valoracion.empresaDetalles.name : 'independiente',
            date: fecha, // Mantener como objeto Date
            ...valoracion.valoracion
        };
        valoracionesExport.push(respuesta);
    });

    valoracionesExport.forEach(element => {
      delete element['fecha']
      delete element['completado']
    });

    console.log('valoracionesExport', valoracionesExport);
    this.exportToExcel(valoracionesExport, 'valoracionesExport');
  }

  // Función para convertir la fecha de string a objeto Date
  convertirFechaString(fechaString: string): Date | null {
      const partes = fechaString.split(', '); // Separar fecha y hora
      const fechaParte = partes[0].trim(); // "10 de septiembre de 2024"
      const horaParte = partes[1] ? partes[1].trim() : ''; // "09:19"

      const meses = {
          'enero': 0,
          'febrero': 1,
          'marzo': 2,
          'abril': 3,
          'mayo': 4,
          'junio': 5,
          'julio': 6,
          'agosto': 7,
          'septiembre': 8,
          'octubre': 9,
          'noviembre': 10,
          'diciembre': 11
      };

      // Expresión regular para extraer el día, mes y año
      const regex = /(\d{1,2}) de ([a-zA-Z]+) de (\d{4})/;
      const match = fechaParte.match(regex);
      if (match) {
          const dia = parseInt(match[1], 10);
          const mes = meses[match[2].toLowerCase()];
          const anio = parseInt(match[3], 10);

          const fecha = new Date(anio, mes, dia);
          if (horaParte) {
              const [horas, minutos] = horaParte.split(':').map(Number);
              fecha.setHours(horas, minutos);
          }
          return fecha;
      }
      return null; // Si no se pudo analizar, devolver null
  }

  // Asegúrate de manejar el formateo de la fecha en el método exportToExcel si es necesario.
  descargarDatosMEC() {
    this.enterpriseService.getEventRegister$().pipe(take(1)).subscribe((eventos) => {
      const eventosProcesados = eventos.map(evento => {
        // Convertir fechas de Firebase
        const eventoConFecha = this.convertirFechasFirebase(evento);

        if(eventoConFecha?.origen){
          // Extraer valores de 'origen'
          const urlParts = eventoConFecha.origen.split('?');
          const baseUrl = 'https://predyc.com'; // Base URL
          // Asignar los parámetros UTM si existen
          const url = new URLSearchParams(urlParts[1] || '');
          eventoConFecha.source = url.get('utm_source') || '';
          eventoConFecha.medium = url.get('utm_medium') || '';
          eventoConFecha.campaign = url.get('utm_campaign') || '';
          // Crear el nuevo campo con el origen sin parámetros
          eventoConFecha.origenBase = `${baseUrl}${urlParts[0]}`;
        }

        if(eventoConFecha.assistanceData) {
          let days = eventoConFecha.assistanceData.map(element => {
            return element.id;
          });
        
          // Ordenar alfabéticamente
          days.sort();
        
          days = days.toString();
          eventoConFecha.asistencia = days;
          delete eventoConFecha.assistanceData;
        }
        
        return eventoConFecha;
      });
  
      // Exportar a Excel si hay datos
      if (eventosProcesados && eventosProcesados.length > 0) {
        this.exportToExcel(eventosProcesados, 'MenAccuion_data');
      }
    });
  }

  descargarDatosFoms() {
    this.enterpriseService.getFormsData$().pipe(take(1)).subscribe((eventos) => {
      const eventosProcesados = eventos.map(evento => {
        // Convertir fechas de Firebase
        const eventoConFecha = this.convertirFechasFirebase(evento);
  
        // Extraer valores de 'origen'
        if(eventoConFecha?.origen){
          const urlParts = eventoConFecha.origen.split('?');
          const baseUrl = 'https://predyc.com'; // Base URL
    
          // Asignar los parámetros UTM si existen
          const url = new URLSearchParams(urlParts[1] || '');
          eventoConFecha.source = url.get('utm_source') || '';
          eventoConFecha.medium = url.get('utm_medium') || '';
          eventoConFecha.campaign = url.get('utm_campaign') || '';
    
          // Crear el nuevo campo con el origen sin parámetros
          eventoConFecha.origenBase = `${baseUrl}${urlParts[0]}`;
    
        }

        return eventoConFecha;
      });
  
      // Exportar a Excel si hay datos
      if (eventosProcesados && eventosProcesados.length > 0) {
        this.exportToExcel(eventosProcesados, 'forms_data');
      }
    });
  }

  // Método para convertir las marcas de tiempo de Firebase a objetos Date
  convertirFechasFirebase(obj: any): any {
    Object.keys(obj).forEach(key => {
      const value = obj[key];

      // Verificar si el valor es un objeto con la propiedad `seconds`
      if (value && value.seconds) {
        const date = new Date(value.seconds * 1000);
        obj[key] = date;  // Asigna directamente el objeto Date
      }
    });

    return obj;  // Devolver el objeto con las fechas convertidas a Date
  }

  // Método para exportar a Excel
  exportToExcel(jsonData: any[], fileName: string): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(jsonData);
    const workbook: XLSX.WorkBook = {
      Sheets: { 'data': worksheet },
      SheetNames: ['data']
    };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  ngOnDestroy() {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe();
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe();
  }

  openDownloadReportModal(): NgbModalRef {
    const modalRef = this.modalService.open(DialogDownloadReportComponent, {
      animation: true,
      centered: true,
      size: "auto",
      backdrop: "static",
      keyboard: false,
    });
    return modalRef;
  }

  downloadExcelReport() {
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
    const wsResumenPorPuesto: XLSX.WorkSheet = {};
    const wsResumenEstudiantes: XLSX.WorkSheet = {};
    const wsDetalleEstudiantes: XLSX.WorkSheet = {};

    let endColumn = 400;
    const fechaActual = new Date().toLocaleDateString("es", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Hoja 1 (GENERAL)

    let nombreEmpresa = this.enterprise.name;

    let usuariosConLicencia = this.users.filter((x) =>
      x?.allsubscriptions.find((y) => y?.status == "active")
    );

    let usuariosSinLicencia = this.users.filter(
      (user) =>
        !user.allsubscriptions ||
        user.allsubscriptions.length === 0 || // No tiene suscripciones
        user.allsubscriptions.every(
          (subscription) => subscription.status !== "active"
        ) // Todas sus subcripciones estan inactivas
    );

    console.log('usuariosReporte',usuariosConLicencia, usuariosSinLicencia);

    let cantidadUsuariosConLicencia = usuariosConLicencia?.length;
    let cantidadUsuariosTotal = this.users.length;
    let cantidadUsuariosSinLicencia =
      cantidadUsuariosTotal - cantidadUsuariosConLicencia;

    //"no plan" | "high" | "medium" | "low"| "no iniciado"

    let usuariosLicenciaALto = usuariosConLicencia.filter(
      (x) => x.rhythm == "high"
    ).length;
    let usuariosLicenciaMedio = usuariosConLicencia.filter(
      (x) => x.rhythm == "medium"
    ).length;
    let usuariosLicenciaBajo = usuariosConLicencia.filter(
      (x) => x.rhythm == "low"
    ).length;
    let usuariosLicenciaSin = usuariosConLicencia.filter(
      (x) => x.rhythm == "no plan" || x.rhythm == "no iniciado"
    ).length;

    let usuariosSinLicenciaALto = usuariosSinLicencia.filter(
      (x) => x.rhythm == "high"
    ).length;
    let usuariosSinLicenciaMedio = usuariosSinLicencia.filter(
      (x) => x.rhythm == "medium"
    ).length;
    let usuariosSinLicenciaBajo = usuariosSinLicencia.filter(
      (x) => x.rhythm == "low"
    ).length;
    let usuariosSinLicenciaSin = usuariosSinLicencia.filter(
      (x) => x.rhythm == "no plan" || x.rhythm == "no iniciado"
    ).length;

    if (!wsGeneral["!merges"]) wsGeneral["!merges"] = [];

    // Combinar celdas B2 y C2
    wsGeneral["!merges"].push({
      s: { r: 1, c: 1 }, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: { r: 1, c: 2 }, // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });

    wsGeneral["B2"] = {
      t: "s",
      v: `Reporte de progreso de usuarios ${this.titleCase(nombreEmpresa)}`,
      s: whiteCalibriBold,
    };
    wsGeneral["B3"] = { t: "s", v: fechaActual, s: whiteCalibriBold };
    wsGeneral["B5"] = {
      t: "s",
      v: "Licencias",
      s: grayCalibriBoldLeftBordered,
    };
    wsGeneral["B6"] = {
      t: "s",
      v: "Estudiantes con licencias activas",
      s: whiteCalibriLeftBordered,
    };
    wsGeneral["B7"] = {
      t: "s",
      v: "Estudiantes registrados",
      s: whiteCalibriLeftBordered,
    };
    wsGeneral["B9"] = {
      t: "s",
      v: "Progreso de usuarios con licencias activas",
      s: grayCalibriBoldLeftBordered,
    };
    wsGeneral["B10"] = {
      t: "s",
      v: "Estudiantes con ritmo alto",
      s: greenCalibriBoldGreenLeftBordered,
    };
    wsGeneral["B11"] = {
      t: "s",
      v: "Estudiantes con ritmo medio",
      s: yellowCalibriBoldYellowLeftBordered,
    };
    wsGeneral["B12"] = {
      t: "s",
      v: "Estudiantes con ritmo bajo",
      s: redCalibriBoldRedLeftBordered,
    };
    wsGeneral["B13"] = {
      t: "s",
      v: "Estudiantes sin plan de estudio o sin iniciar",
      s: gray6CalibriBoldGreyLeftBordered,
    };

    wsGeneral["B15"] = {
      t: "s",
      v: "Progreso de usuarios con licencias inactivas",
      s: grayCalibriBoldLeftBordered,
    };
    wsGeneral["B16"] = {
      t: "s",
      v: "Estudiantes con ritmo alto",
      s: greenCalibriBoldGreenLeftBordered,
    };
    wsGeneral["B17"] = {
      t: "s",
      v: "Estudiantes con ritmo medio",
      s: yellowCalibriBoldYellowLeftBordered,
    };
    wsGeneral["B18"] = {
      t: "s",
      v: "Estudiantes con ritmo bajo",
      s: redCalibriBoldRedLeftBordered,
    };
    wsGeneral["B19"] = {
      t: "s",
      v: "Estudiantes sin plan de estudio o sin iniciar",
      s: gray6CalibriBoldGreyLeftBordered,
    };

    wsGeneral["C5"] = { t: "s", v: "Cant.", s: grayCalibriBoldCenterBordered };
    wsGeneral["C6"] = {
      t: "s",
      v: cantidadUsuariosConLicencia,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C7"] = {
      t: "s",
      v: cantidadUsuariosTotal,
      s: whiteCalibriRightBordered,
    };

    wsGeneral["C9"] = { t: "s", v: "Cant.", s: grayCalibriBoldCenterBordered };
    wsGeneral["C10"] = {
      t: "s",
      v: usuariosLicenciaALto,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C11"] = {
      t: "s",
      v: usuariosLicenciaMedio,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C12"] = {
      t: "s",
      v: usuariosLicenciaBajo,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C13"] = {
      t: "s",
      v: usuariosLicenciaSin,
      s: whiteCalibriRightBordered,
    };

    wsGeneral["C15"] = { t: "s", v: "Cant.", s: grayCalibriBoldCenterBordered };
    wsGeneral["C16"] = {
      t: "s",
      v: usuariosSinLicenciaALto,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C17"] = {
      t: "s",
      v: usuariosSinLicenciaMedio,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C18"] = {
      t: "s",
      v: usuariosSinLicenciaBajo,
      s: whiteCalibriRightBordered,
    };
    wsGeneral["C19"] = {
      t: "s",
      v: usuariosSinLicenciaSin,
      s: whiteCalibriRightBordered,
    };

    // Fin Hoja 1 (GENERAL)

    // Hoja 2 (Resumen por puesto)

    let perfiles = Array.from(
      new Set(usuariosConLicencia.map((user) => user.profileId))
    );
    perfiles = perfiles.filter((x) => x != "");

    if (!wsResumenPorPuesto["!merges"]) wsResumenPorPuesto["!merges"] = [];

    // Combinar celdas B2 y C2
    wsResumenPorPuesto["!merges"].push({
      s: { r: 1, c: 1 }, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: { r: 1, c: 2 }, // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });

    wsResumenPorPuesto["B2"] = {
      t: "s",
      v: `Reporte de progreso por perfil ${this.titleCase(nombreEmpresa)}`,
      s: whiteCalibriBold,
    };
    wsResumenPorPuesto["B3"] = { t: "s", v: fechaActual, s: whiteCalibriBold };

    wsResumenPorPuesto["B5"] = {
      t: "s",
      v: "Perfil",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenPorPuesto["C5"] = {
      t: "s",
      v: "Estudiantes registrados",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenPorPuesto["D5"] = {
      t: "s",
      v: "Estudiantes con licencia activa",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenPorPuesto["E5"] = {
      t: "s",
      v: "Horas del plan de estudio",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenPorPuesto["F5"] = {
      t: "s",
      v: "Cant. de Est. con ritmo alto",
      s: greenCalibriBoldGreenCenterBordered,
    };
    wsResumenPorPuesto["G5"] = {
      t: "s",
      v: "Cant. de Est. con ritmo medio",
      s: yellowCalibriBoldYellowCenterBordered,
    };
    wsResumenPorPuesto["H5"] = {
      t: "s",
      v: "Cant. de Est. con ritmo bajo",
      s: redCalibriBoldRedCenterBordered,
    };
    wsResumenPorPuesto["I5"] = {
      t: "s",
      v: "Cant. de Est. sin plan de estudio o sin iniciar",
      s: gray6CalibriBoldGreyCenterBordered,
    };
    wsResumenPorPuesto["J5"] = {
      t: "s",
      v: "Procentaje de completación promedio de los estudiantes",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenPorPuesto["K5"] = {
      t: "s",
      v: "Calificación promedio de los estudiantes",
      s: grayCalibriBoldCenterCenterBordered,
    };

    perfiles.forEach((perfil, i) => {
      let j = i + 6;

      let usuariosConLicenciaProfile = usuariosConLicencia.filter(
        (x) => x.profileId == perfil
      );
      wsResumenPorPuesto[`B${j}`] = {
        t: "s",
        v: `${this.profiles.find((x) => x.id == perfil).name}`,
        s: whiteCalibriLeftBordered,
      };

      wsResumenPorPuesto[`C${j}`] = {
        t: "s",
        v: `${this.users.filter((x) => x.profileId == perfil).length}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenPorPuesto[`D${j}`] = {
        t: "s",
        v: `${usuariosConLicencia.filter((x) => x.profileId == perfil).length}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenPorPuesto[`E${j}`] = {
        t: "s",
        v: `${this.getHoursProfile(perfil)}`,
        s: whiteCalibriCenteredBordered,
      };

      let usuariosLicenciaALto = usuariosConLicenciaProfile.filter(
        (x) => x.rhythm == "high"
      ).length;
      let usuariosLicenciaMedio = usuariosConLicenciaProfile.filter(
        (x) => x.rhythm == "medium"
      ).length;
      let usuariosLicenciaBajo = usuariosConLicenciaProfile.filter(
        (x) => x.rhythm == "low"
      ).length;
      let usuariosLicenciaSin = usuariosConLicenciaProfile.filter(
        (x) => x.rhythm == "no plan" || x.rhythm == "no iniciado"
      ).length;

      wsResumenPorPuesto[`F${j}`] = {
        t: "s",
        v: `${usuariosLicenciaALto}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenPorPuesto[`G${j}`] = {
        t: "s",
        v: `${usuariosLicenciaMedio}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenPorPuesto[`H${j}`] = {
        t: "s",
        v: `${usuariosLicenciaBajo}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenPorPuesto[`I${j}`] = {
        t: "s",
        v: `${usuariosLicenciaSin}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenPorPuesto[`J${j}`] = {
        t: "s",
        v: `${this.getProfileProgress(usuariosConLicenciaProfile)}%`,
        s: whiteCalibriCenteredBordered,
      };

      let notas = this.getProfileNotaPromedio(usuariosConLicenciaProfile);

      wsResumenPorPuesto[`K${j}`] = {
        t: "s",
        v: notas >= 0 ? notas : "-",
        s: whiteCalibriCenteredBordered,
      };
    });

    // Fin Hoja 2 (Resumen por puesto)

    // Hoja 3 (Resumen por usuario)

    wsResumenEstudiantes["B2"] = {
      t: "s",
      v: `Reporte de resumen por estudiante ${this.titleCase(nombreEmpresa)}`,
      s: whiteCalibriBold,
    };
    wsResumenEstudiantes["B3"] = {
      t: "s",
      v: fechaActual,
      s: whiteCalibriBold,
    };

    if (!wsResumenEstudiantes["!merges"]) wsResumenEstudiantes["!merges"] = [];

    // Combinar celdas B2 y C2
    wsResumenEstudiantes["!merges"].push({
      s: { r: 1, c: 1 }, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: { r: 1, c: 2 }, // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });

    wsResumenEstudiantes["B5"] = {
      t: "s",
      v: "Nombre",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["C5"] = {
      t: "s",
      v: "Licencia",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["D5"] = {
      t: "s",
      v: "Correo",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["E5"] = {
      t: "s",
      v: "Perfil",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["F5"] = {
      t: "s",
      v: "Departamento",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["G5"] = {
      t: "s",
      v: "Cursos asignados",
      s: grayCalibriBoldCenterCenterBordered,
    };


    wsResumenEstudiantes["H5"] = {
      t: "s",
      v: "Cursos asignados completados",
      s: grayCalibriBoldCenterCenterBordered,
    };


    wsResumenEstudiantes["I5"] = {
      t: "s",
      v: "Horas asignadas",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["J5"] = {
      t: "s",
      v: "Horas completadas",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsResumenEstudiantes["K5"] = {
      t: "s",
      v: "Progreso",
      s: grayCalibriBoldCenterCenterBordered,
    };


    wsResumenEstudiantes["L5"] = {
      t: "s",
      v: "Cursos extra",
      s: grayCalibriBoldCenterCenterBordered,
    };


    wsResumenEstudiantes["M5"] = {
      t: "s",
      v: "Cursos extra completados",
      s: grayCalibriBoldCenterCenterBordered,
    };


    wsResumenEstudiantes["N5"] = {
      t: "s",
      v: "Horas extra asignadas",
      s: grayCalibriBoldCenterCenterBordered,
    };

    wsResumenEstudiantes["O5"] = {
      t: "s",
      v: "Horas extra completadas",
      s: grayCalibriBoldCenterCenterBordered,
    };

    wsResumenEstudiantes["P5"] = {
      t: "s",
      v: "Calificación promedio",
      s: grayCalibriBoldCenterCenterBordered,
    };
    
    wsResumenEstudiantes["Q5"] = {
      t: "s",
      v: "Ritmo",
      s: grayCalibriBoldCenterCenterBordered,
    };
    
    wsResumenEstudiantes["R5"] = {
      t: "s",
      v: "Fecha límite de completación",
      s: grayCalibriBoldCenterCenterBordered,
    };
    
    wsResumenEstudiantes["S5"] = {
      t: "s",
      v: "Examen diagnóstico",
      s: grayCalibriBoldCenterCenterBordered,
    };
    
    wsResumenEstudiantes["T5"] = {
      t: "s",
      v: "Resultado diagnóstico",
      s: grayCalibriBoldCenterCenterBordered,
    };
    
    wsResumenEstudiantes["U5"] = {
      t: "s",
      v: "Fecha examen diagnóstico",
      s: grayCalibriBoldCenterCenterBordered,
    };


    const rhythmOrder = {
      high: 1,
      medium: 2,
      low: 3,
      "no iniciado": 4,
      "no plan": 5,
    };

    usuariosConLicencia.sort((a, b) => {
      return rhythmOrder[a.rhythm] - rhythmOrder[b.rhythm];
    });

    usuariosSinLicencia.sort((a, b) => {
      return rhythmOrder[a.rhythm] - rhythmOrder[b.rhythm];
    });

    let usuariosDetalles = [...usuariosConLicencia, ...usuariosSinLicencia];

    usuariosDetalles.forEach((usuario, i) => {
      let j = i + 6;

      //let usuariosConLicencia = this.users.filter(x=>x?.allsubscriptions.find(y=>y?.status == 'active'))

      wsResumenEstudiantes[`B${j}`] = {
        t: "s",
        v: `${this.titleCase(usuario.displayName)}`,
        s: whiteCalibriLeftBordered,
      };

      let status = usuario?.allsubscriptions.find((y) => y?.status == "active")
        ? "Activa"
        : "Inactiva";

      wsResumenEstudiantes[`C${j}`] = {
        t: "s",
        v: status,
        s:
          status == "Activa"
            ? greenCalibriBoldGreenCenterBordered
            : redCalibriBoldRedCenterBordered,
      };

      wsResumenEstudiantes[`D${j}`] = {
        t: "s",
        v: `${usuario.email}`,
        s: mailLinkStyle,
      };

      wsResumenEstudiantes[`E${j}`] = {
        t: "s",
        v: `${usuario.profile ? usuario.profile : "Sin asignar"}`,
        s: usuario.profile
          ? whiteCalibriCenteredBordered
          : whiteCalibriRedCenteredBordered,
      };

      wsResumenEstudiantes[`F${j}`] = {
        t: "s",
        v: `${usuario.department ? usuario.department : "Sin asignar"}`,
        s: usuario.department
          ? whiteCalibriCenteredBordered
          : whiteCalibriRedCenteredBordered,
      };

      wsResumenEstudiantes[`G${j}`] = {
        t: "s",
        v: `${usuario.allCourses.length}`,
        s: whiteCalibriCenteredBordered,
      };


      wsResumenEstudiantes[`H${j}`] = {
        t: "s",
        v: `${
          usuario?.allCourses?.filter((x) => x.progress.progress >= 100)?.length
        }`,
        s: whiteCalibriCenteredBordered,
      };


      
      let targetHoursAllCourses =
        Math.round(usuario.targetHoursAllCourses * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
      
      wsResumenEstudiantes[`I${j}`] = {
        t: "s",
        v: targetHoursAllCourses,
        s: whiteCalibriCenteredBordered,
      };
      
      let completedHoursAllCourses =
        Math.round(usuario.hoursAllCourses * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
      
      wsResumenEstudiantes[`J${j}`] = {
        t: "s",
        v: completedHoursAllCourses,
        s: whiteCalibriCenteredBordered,
      };
      
      let progreso = Math.round(usuario.completacionAll * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
      
      wsResumenEstudiantes[`K${j}`] = {
        t: "s",
        v: `${progreso}%`,
        s: whiteCalibriCenteredBordered,
      };
      
      let notas = 0;
      let coursesCompleted = usuario.allCourses.filter(
        (x) => x.progress.progress >= 100
      );
      
      coursesCompleted?.forEach((course) => {
        notas += course.progress.finalScore;
      });
      
      notas = notas / coursesCompleted.length;
      notas = Math.round(notas * 10) / 10;


      wsResumenEstudiantes[`L${j}`] = {
        t: "s",
        v: `${usuario.inactivecourses.length}`,
        s: whiteCalibriCenteredBordered,
      };

      wsResumenEstudiantes[`M${j}`] = {
        t: "s",
        v: `${
          usuario?.inactivecourses?.filter((x) => x.progress.progress >= 100)?.length
        }`,
        s: whiteCalibriCenteredBordered,
      };



      let targetHoursExtraCourses =
        Math.round(usuario.targetHoursExtra * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
      
      wsResumenEstudiantes[`N${j}`] = {
        t: "s",
        v: targetHoursExtraCourses,
        s: whiteCalibriCenteredBordered,
      };



      let completedHoursExtraCourses =
      Math.round(usuario.hoursExtra * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
    
    wsResumenEstudiantes[`O${j}`] = {
      t: "s",
      v: completedHoursExtraCourses,
      s: whiteCalibriCenteredBordered,
    };

      wsResumenEstudiantes[`P${j}`] = {
        t: "s",
        v: notas >= 0 ? notas : "-",
        s: whiteCalibriCenteredBordered,
      };
      
      let ritmo = this.getRitmoAndStyleUser(usuario);
      
      wsResumenEstudiantes[`Q${j}`] = {
        t: "s",
        v: ritmo.ritmo,
        s: eval(ritmo.estilo),
      };
      
      let fechaFin = this.getLastDateStudyPlan(usuario);
      
      wsResumenEstudiantes[`R${j}`] = {
        t: "s",
        v: fechaFin,
        s:
          fechaFin == "Sin Asignar"
            ? whiteCalibriRedCenteredBordered
            : whiteCalibriCenteredBordered,
      };
      
      let initTest = usuario.initTest[0]
      
      console.log('usuarioReporte', initTest)
      
      let resultadoTestInit = '-'
      let score = '-'
      
      let dateExamenInicial = '-'
      
      if (initTest) {
        resultadoTestInit = `Completado`
      
        let latestDate = new Date(initTest.date.seconds * 1000);
        let options: Intl.DateTimeFormatOptions = {
          day: 'numeric',
          year: "numeric",
          month: "long",
        };
        dateExamenInicial = latestDate.toLocaleDateString("es-ES", options);
      }
      
      if (initTest && initTest?.certificationTest) {
        score = `${initTest.score}`
      }
      
      wsResumenEstudiantes[`S${j}`] = {
        t: "s",
        v: resultadoTestInit,
        s: whiteCalibriCenteredBordered,
      };
      
      wsResumenEstudiantes[`T${j}`] = {
        t: "s",
        v: score,
        s: whiteCalibriCenteredBordered,
      };
      
      wsResumenEstudiantes[`U${j}`] = {
        t: "s",
        v: dateExamenInicial,
        s: whiteCalibriCenteredBordered,
      };
      

    });
    // Fin Hoja 3 (Resumen por usuario)

    // Fin Hoja 4 (Detalle por usuario)

    if (!wsDetalleEstudiantes["!merges"]) wsDetalleEstudiantes["!merges"] = [];

    // Combinar celdas B2 y C2
    wsDetalleEstudiantes["!merges"].push({
      s: { r: 1, c: 1 }, // B2 (la numeración comienza en 0, entonces B=1 y la fila 2 es r=1)
      e: { r: 1, c: 2 }, // C2 (para combinar horizontalmente, aumentamos el índice de la columna)
    });

    wsDetalleEstudiantes["B2"] = {
      t: "s",
      v: `Reporte Detalle estudiantes ${this.titleCase(nombreEmpresa)}`,
      s: whiteCalibriBold,
    };
    wsDetalleEstudiantes["B3"] = {
      t: "s",
      v: fechaActual,
      s: whiteCalibriBold,
    };

    wsDetalleEstudiantes["B5"] = {
      t: "s",
      v: "Nombre",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["C5"] = {
      t: "s",
      v: "Licencia",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["D5"] = {
      t: "s",
      v: "Correo",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["E5"] = {
      t: "s",
      v: "Perfil",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["F5"] = {
      t: "s",
      v: "Departamento",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["G5"] = {
      t: "s",
      v: "N. Curso",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["H5"] = {
      t: "s",
      v: "Titulo",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["I5"] = {
      t: "s",
      v: "Duración del curso horas",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["J5"] = {
      t: "s",
      v: "Progreso",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["K5"] = {
      t: "s",
      v: "Estatus",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["L5"] = {
      t: "s",
      v: "Calificación",
      s: grayCalibriBoldCenterCenterBordered,
    };
    wsDetalleEstudiantes["M5"] = {
      t: "s",
      v: "Fecha límite de completación",
      s: grayCalibriBoldCenterCenterBordered,
    };

    usuariosDetalles.sort((a, b) => a.displayName.localeCompare(b.displayName));

    console.log("usuariosDetalles", usuariosDetalles);

    let userDetail = 6;
    usuariosDetalles.forEach((usuario, index) => {
      if (usuario.allCourses.length > 0) {
        // tiene cursos
        let coursesUser = usuario.allCourses;
        console.log('coursesUser',coursesUser)
        coursesUser.sort(
          (a, b) =>
            a?.progress?.dateStartPlan?.seconds - b?.progress?.dateStartPlan?.seconds
        );

        

        coursesUser = coursesUser.concat(usuario.inactivecourses)


        coursesUser.forEach((curso, IndexCurso) => {
          wsDetalleEstudiantes[`B${userDetail}`] = {
            t: "s",
            v: `${this.titleCase(usuario.displayName)}`,
            s: whiteCalibriLeftBordered,
          };

          let status = usuario?.allsubscriptions.find(
            (y) => y?.status == "active"
          )
            ? "Activa"
            : "Inactiva";
          wsDetalleEstudiantes[`C${userDetail}`] = {
            t: "s",
            v: status,
            s:
              status == "Activa"
                ? greenCalibriBoldGreenCenterBordered
                : redCalibriBoldRedCenterBordered,
          };
          wsDetalleEstudiantes[`D${userDetail}`] = {
            t: "s",
            v: `${usuario.email}`,
            s: mailLinkStyle,
          };
          wsDetalleEstudiantes[`E${userDetail}`] = {
            t: "s",
            v: `${usuario.profile ? usuario.profile : "Sin asignar"}`,
            s: usuario.profile
              ? whiteCalibriCenteredBordered
              : whiteCalibriRedCenteredBordered,
          };
          wsDetalleEstudiantes[`F${userDetail}`] = {
            t: "s",
            v: `${usuario.department ? usuario.department : "Sin asignar"}`,
            s: usuario.department
              ? whiteCalibriCenteredBordered
              : whiteCalibriRedCenteredBordered,
          };

          wsDetalleEstudiantes[`H${userDetail}`] = {
            t: "s",
            v: curso.titulo,
            s: whiteCalibriLeftBordered,
          };

          wsDetalleEstudiantes[`I${userDetail}`] = {
            t: "s",
            v: Math.round((curso.duracion / 60) * 10) / 10,
            s: whiteCalibriCenteredBordered,
          };

          wsDetalleEstudiantes[`J${userDetail}`] = {
            t: "s",
            v: `${Math.round(curso.progress.progress * 10) / 10}%`,
            s: whiteCalibriCenteredBordered,
          };

          wsDetalleEstudiantes[`K${userDetail}`] = {
            t: "s",
            v: curso.progress.progress >= 100 ? "Completado" : "Pendiente",
            s:
              curso.progress.progress >= 100
                ? greenCalibriBoldGreenCenterBordered
                : redCalibriBoldRedCenterBordered,
          };

          wsDetalleEstudiantes[`L${userDetail}`] = {
            t: "s",
            v: curso.progress.finalScore
              ? curso.progress.finalScore >= 100
                ? 100
                : Math.round(curso.progress.finalScore * 10) / 10
              : "-",
            s: whiteCalibriCenteredBordered,
          };

          if(!curso.extra){

            wsDetalleEstudiantes[`G${userDetail}`] = {
              t: "s",
              v: IndexCurso + 1,
              s: whiteCalibriCenteredBordered,
            };

            let fechaFin = curso?.progress?.dateEndPlan?.seconds * 1000;

            let latestDate = new Date(fechaFin);
            let options: Intl.DateTimeFormatOptions = {
              year: "numeric",
              month: "long",
            };
            let dateString = latestDate.toLocaleDateString("es-ES", options);
  
            wsDetalleEstudiantes[`M${userDetail}`] = {
              t: "s",
              v: dateString,
              s: whiteCalibriCenteredBordered,
            };
          }

          else{


            wsDetalleEstudiantes[`G${userDetail}`] = {
              t: "s",
              v: 'Extracurricular',
              s: whiteCalibriCenteredBordered,
            };

            wsDetalleEstudiantes[`M${userDetail}`] = {
              t: "s",
              v: '-',
              s: whiteCalibriCenteredBordered,
            };
          }


          userDetail = userDetail + 1;
        });
      } else {
        // no tiene cursos
        console.log(usuario.displayName);
        wsDetalleEstudiantes[`B${userDetail}`] = {
          t: "s",
          v: `${this.titleCase(usuario.displayName)}`,
          s: whiteCalibriLeftBordered,
        };
        let status = usuario?.allsubscriptions.find(
          (y) => y?.status == "active"
        )
          ? "Activa"
          : "Inactiva";
        wsDetalleEstudiantes[`C${userDetail}`] = {
          t: "s",
          v: status,
          s:
            status == "Activa"
              ? greenCalibriBoldGreenCenterBordered
              : redCalibriBoldRedCenterBordered,
        };

        wsDetalleEstudiantes[`D${userDetail}`] = {
          t: "s",
          v: `${usuario.email}`,
          s: mailLinkStyle,
        };

        wsDetalleEstudiantes[`E${userDetail}`] = {
          t: "s",
          v: `${usuario.profile ? usuario.profile : "Sin asignar"}`,
          s: usuario.profile
            ? whiteCalibriCenteredBordered
            : whiteCalibriRedCenteredBordered,
        };
        wsDetalleEstudiantes[`F${userDetail}`] = {
          t: "s",
          v: `${usuario.department ? usuario.department : "Sin asignar"}`,
          s: usuario.department
            ? whiteCalibriCenteredBordered
            : whiteCalibriRedCenteredBordered,
        };

        wsDetalleEstudiantes[`G${userDetail}`] = {
          t: "s",
          v: `-`,
          s: whiteCalibriCenteredBordered,
        };

        wsDetalleEstudiantes[`H${userDetail}`] = {
          t: "s",
          v: "Sin cursos asignados",
          s: whiteCalibriRedLeftBordered,
        };

        wsDetalleEstudiantes[`I${userDetail}`] = {
          t: "s",
          v: "-",
          s: whiteCalibriCenteredBordered,
        };

        wsDetalleEstudiantes[`J${userDetail}`] = {
          t: "s",
          v: "-",
          s: whiteCalibriCenteredBordered,
        };

        wsDetalleEstudiantes[`K${userDetail}`] = {
          t: "s",
          v: "-",
          s: whiteCalibriCenteredBordered,
        };

        wsDetalleEstudiantes[`L${userDetail}`] = {
          t: "s",
          v: "-",
          s: whiteCalibriCenteredBordered,
        };

        wsDetalleEstudiantes[`M${userDetail}`] = {
          t: "s",
          v: "-",
          s: whiteCalibriCenteredBordered,
        };

        userDetail = userDetail + 1;
      }
    });

    // Fin Hoja 4 (Detalle por usuario)

    [wsGeneral, wsResumenEstudiantes, wsDetalleEstudiantes].forEach(
      (workSheet) => {
        workSheet["!ref"] = `A1:${this.toColumnName(endColumn)}${
          userDetail + 20
        }`;

        workSheet["!cols"] = Array(endColumn)
          .fill(0)
          .map((item) => {
            return { wch: 10 };
          });

        // Fix columns length
        Object.keys(workSheet).forEach((key) => {
          if (key.charAt(0) === "!") {
            return;
          }
          const baseLetterSize = 12;
          const letterSizeToBaseLetterSizeDifference =
            workSheet[key].s.font.sz - baseLetterSize;
          const letterSizeMultiplicationFactor =
            1 + 0.2 * letterSizeToBaseLetterSizeDifference;
          const stringLength = workSheet[key]?.v?.length
            ? workSheet[key]?.v?.length
            : 5 * letterSizeMultiplicationFactor;
          const colLetter = this.separateLettersAndNumbers(key).letters;
          const columnIndex = this.columnNameToIndex(colLetter);
          workSheet["!cols"][columnIndex]["wch"] =
            workSheet["!cols"][columnIndex]["wch"] >= stringLength + 4
              ? workSheet["!cols"][columnIndex]["wch"]
              : stringLength + 4;
        });
      }
    );

    wsResumenPorPuesto["!ref"] = `A1:${this.toColumnName(endColumn)}${
      this.users.length + 20
    }`;

    wsResumenPorPuesto["!cols"] = Array(endColumn)
      .fill(0)
      .map((item) => {
        return { wch: 10 };
      });

    // Fix columns length
    Object.keys(wsResumenPorPuesto).forEach((key) => {
      if (key.charAt(0) === "!") {
        return;
      }
      const colLetter = this.separateLettersAndNumbers(key).letters;
      const columnIndex = this.columnNameToIndex(colLetter);
      if (columnIndex == 1) {
        wsResumenPorPuesto["!cols"][columnIndex]["wch"] = 40;
      } else {
        wsResumenPorPuesto["!cols"][columnIndex]["wch"] = 20;
      }
    });

    XLSX.utils.book_append_sheet(wb, wsGeneral, "General");
    XLSX.utils.book_append_sheet(wb, wsResumenPorPuesto, "Resumen por perfil");
    XLSX.utils.book_append_sheet(
      wb,
      wsResumenEstudiantes,
      "Resumen estudiantes"
    );
    XLSX.utils.book_append_sheet(
      wb,
      wsDetalleEstudiantes,
      "Detalle estudiantes"
    );

    XLSX.writeFile(
      wb,
      `Reporte General ${this.enterprise.name} ${fechaActual}.xlsx`
    );

    this.generatinReport = false;
  }

  getLastDateStudyPlan(user) {
    let fechas = [];
    //console.log("getLastDateStudyPlan", user);
    if (user?.allCourses?.length > 0) {
      user.allCourses.forEach((curso) => {
        if (curso?.progress?.dateEndPlan?.seconds) {
          let fecha = curso.progress.dateEndPlan.seconds * 1000;
          fechas.push(fecha);
        }
      });

      let latestTimestamp = Math.max(...fechas);
      let latestDate = new Date(latestTimestamp);
      let options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
      };
      let dateString = latestDate.toLocaleDateString("es-ES", options);

      return dateString;
    }
    return "Sin Asignar";
  }

  getRitmoAndStyleUser(users) {
    let ritmo = null;
    let estilo = null;

    if (users.rhythm == "high") {
      ritmo = "Alto";
      estilo = "greenCalibriBoldGreenCenterBordered";
    } else if (users.rhythm == "medium") {
      ritmo = "Medio";
      estilo = "yellowCalibriBoldYellowCenterBordered";
    } else if (users.rhythm == "low") {
      ritmo = "Bajo";
      estilo = "redCalibriBoldRedCenterBordered";
    } else if (users.rhythm == "no iniciado") {
      ritmo = "No iniciado";
      estilo = "gray6CalibriBoldGreyCenterBordered";
    } else if (users.rhythm == "no plan") {
      ritmo = "Sin plan de estudio";
      estilo = "gray6CalibriBoldGreyCenterBordered";
    }
    return {
      ritmo: ritmo,
      estilo: estilo,
    };
  }

  getProfileProgress(users) {
    //completacionAll
    let progress = 0;
    users.forEach((user) => {
      progress += user.completacionAll;
    });
    let promedioCompletacion = progress / users.length;
    promedioCompletacion = Math.round(promedioCompletacion * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
    return promedioCompletacion;
  }

  getProfileNotaPromedio(users) {
    let notas = 0;
    let cursos = [];

    users.forEach((usuario) => {
      let coursesCompleted = usuario.allCourses.filter(
        (x) => x.progress.progress >= 100
      );
      cursos = [...cursos, ...coursesCompleted];
    });
    console.log("getProfileNotaPromedio", cursos);

    cursos?.forEach((course) => {
      notas += course.progress.finalScore;
    });

    notas = notas / cursos.length;
    notas = Math.round(notas * 10) / 10;

    return notas;
  }

  getHoursProfile(idProfile) {
    let profile = this.profiles.find((x) => x.id == idProfile);
    let minutesCourses = 0;
    profile.coursesRef.forEach((courseRef) => {
      let curso = this.courses.find((x) => x.id == courseRef.courseRef.id);
      minutesCourses += curso.duracion;
    });
    let hoursCourses = Math.round((minutesCourses / 60) * 10) / 10; // Convierte minutos a horas y redondea a 1 decimal
    return hoursCourses;
  }

  generatinReport;
  startDate;
  endDate;
  profiles;
  courses;
  classes;
  departments;
  users;

  async downloadReport() {
    //alert('inicio reporte')
    this.generatinReport = true;
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe();

    let fechaInicio = null;
    let fechaFin = null;

    if (this.startDate) {
      fechaInicio = new Date(
        this.startDate.year,
        this.startDate.month - 1,
        this.startDate.day
      );
    }
    if (this.endDate) {
      fechaFin = new Date(
        this.endDate.year,
        this.endDate.month - 1,
        this.endDate.day
      );
    }

    this.userServiceSubscription = this.userService.getUsersReport$(null, null, null, null, fechaInicio, fechaFin)
    .pipe(
      filter((user) => user != null),
      take(1),
      switchMap((users) => {
        const userCourseObservables = users.map((user) => {
          const userRef = this.userService.getUserRefById(user.uid);
          // Obtener cursos activos por usuario
          const coursesObservable = this.courseService.getActiveCoursesByStudentDateFiltered$(userRef,fechaInicio,fechaFin).pipe(take(1));
          // Obtener clases asociadas al usuario, independientemente de los cursos
          const inactiveCoursesObservable = this.courseService.getInactiveCoursesByStudentDateFiltered$(userRef,fechaInicio,fechaFin).pipe(take(1));
          const classesObservable = this.courseService.getClassesByStudentDatefilterd$(userRef, fechaInicio, fechaFin).pipe(take(1));
          const initTestObservable = this.profileService.getDiagnosticTestForUser$(user).pipe(take(1));
          const allCoursesObservable = this.courseService.getActiveCoursesByStudent(userRef);
          const certificatesObservable = this.courseService.getCertificatestDatefilterd$(userRef, fechaInicio, fechaFin).pipe(take(1));
          const subscriptionsObservable = this.userService.getSubscriptionByStudentDateFiltered$( userRef, fechaInicio, fechaFin ).pipe(take(1));
          return combineLatest([
            coursesObservable,
            inactiveCoursesObservable,
            classesObservable,
            initTestObservable,
            certificatesObservable,
            allCoursesObservable,
            subscriptionsObservable,
          ]).pipe(
            map(
              ([
                courses,
                inactiveCourses,
                classes,
                initTest,
                certificados,
                allCourses,
                allsubscriptions,
              ]) => {
                // Aquí tienes un objeto que incluye tanto los cursos como las clases asociadas a ese usuario
                // Cursos y clases están en sus propios objetos y no anidadas
                return {
                  user,
                  courses,
                  inactiveCourses,
                  initTest,
                  classes,
                  certificados,
                  allCourses,
                  allsubscriptions,
                };
              }
            )
          );
        });
        // Combina los observables de todos los usuarios con sus cursos y clases
        return combineLatest(userCourseObservables).pipe(take(1));
      })
    ).subscribe((response) => {
      console.log("datos reporte", response);
      const users: User[] = response.map(
        ({
          user,
          courses,
          inactiveCourses,
          initTest,
          classes,
          certificados,
          allCourses,
          allsubscriptions,
        }) => {
          const profile = this.profiles.find((profile) => {
            if (user.profile) {
              return profile.id === user.profile.id;
            }
            return false;
          });
          let profileName = "";
          if (profile) {
            profileName = profile.name;
          }
          let hours = 0;
          let targetHours = 0;
          let targetHoursAllCourses = 0;
          let hoursAllCourses = 0;
          let coursesUser = [];
          let allcoursesUser = [];
          let classesUser = [];
          let inactivecoursesUser = [];

          let hoursExtra = 0;
          let targetHoursExtra = 0;

          console.log('revisarCursosReporte',courses,this.courses)

          courses.forEach((course) => {
            hours += (course?.progressTime ? course.progressTime : 0) / 60;
            const courseJson = this.courses.find(
              (item) => item.id === course.courseRef.id
            );
            let courseIn = { ...courseJson, progress: course };
            courseIn.completed = course.progress >= 100 ? true : false;
            coursesUser.push(courseIn);
            targetHours += (course.courseTime? course.courseTime :  courseJson.duracion) / 60;
            if(!course.courseTime){
              course.courseTime = courseJson.duracion
            }
          });

          allCourses.forEach((course) => {
            hoursAllCourses +=
              (course?.progressTime ? course.progressTime : 0) / 60;
            const courseJson = this.courses.find(
              (item) => item.id === course.courseRef.id
            );
            let courseIn = { ...courseJson, progress: course };
            courseIn.completed = course.progress >= 100 ? true : false;
            allcoursesUser.push(courseIn);
            targetHoursAllCourses += (course.courseTime? course.courseTime :  courseJson.duracion) / 60;
          });

          // inactiveCourses.forEach(course => {
          //   const courseJson = this.courses.find(item => item.id === course.courseRef.id)
          //   let courseIn = {...courseJson,progress:course}
          //   courseIn.completed = course.progress >= 100? true : false
          //   inactivecoursesUser.push(courseIn)            
          // })

          inactiveCourses.forEach((course) => {
            hoursExtra += (course?.progressTime ? course.progressTime : 0) / 60;
            const courseJson = this.courses.find(
              (item) => item.id === course.courseRef.id
            );
            let courseIn = { ...courseJson, progress: course };
            courseIn.completed = course.progress >= 100 ? true : false;
            courseIn.extra = true
            inactivecoursesUser.push(courseIn);
            targetHoursExtra += (course.courseTime? course.courseTime :  courseJson.duracion) / 60;
            if(!course.courseTime){
              course.courseTime = courseJson.duracion
            }
          });

          classes.forEach((clase) => {
            const classJson = this.classes.find(
              (item) => item.id === clase.classRef.id
            );
            let claseData = { ...classJson, ...clase };
            classesUser.push(claseData);
          });
          const userPerformance:
            | "no plan"
            | "high"
            | "medium"
            | "low"
            | "no iniciado" =
            this.userService.getPerformanceWithDetails(courses);
          const department = this.departments.find(
            (department) => department.id === user.departmentRef?.id
          );
          const ratingPoints: number =
            this.userService.getRatingPointsFromStudyPlan(
              courses,
              this.courses
            );
          return {
            email: user.email,
            displayName: user.displayName,
            department: department?.name ? department.name : "",
            departmentId: department?.id ? department.id : "",
            hours: hours, // Calculation pending
            hoursAllCourses: hoursAllCourses,
            targetHours: targetHours,
            targetHoursAllCourses: targetHoursAllCourses,
            profile: profileName,
            profileId: profile?.id ? profile.id : "",
            ratingPoints: ratingPoints,
            rhythm: userPerformance, // Calculation pending
            uid: user.uid,
            initTest:initTest,
            jog: user.job,
            photoUrl: user.photoUrl,
            courses: coursesUser,
            clases: classesUser,
            certificados: certificados,
            allCourses: allcoursesUser,
            allsubscriptions: allsubscriptions,
            completacion: targetHours ? (hours * 100) / targetHours : "",
            completacionAll: targetHoursAllCourses ? (hoursAllCourses * 100) / targetHoursAllCourses : "",
            inactivecourses:inactivecoursesUser,
            hoursExtra,
            targetHoursExtra
          };
        }
      );
      this.users = users; // Assuming the data is in 'items'
      console.log("data reporte", this.users);
      this.downloadExcelReport();
    });
  }

  titleCase(str: string): string {
    if (!str) return str;
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(" ");
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

    throw new Error("The string does not match the expected pattern.");
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
}
