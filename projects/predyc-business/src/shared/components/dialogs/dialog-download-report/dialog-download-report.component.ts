import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Chart } from 'chart.js';
import jsPDF from 'jspdf';
import { Subscription, combineLatest, filter, map, of, switchMap, take } from 'rxjs';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { font, font2 } from 'projects/predyc-business/src/assets/fonts/font-constants';
import { UserService } from '../../../services/user.service';
import { CourseService } from '../../../services/course.service';
import { ProfileService } from '../../../services/profile.service';
import { DepartmentService } from '../../../services/department.service';
import { FormControl, FormGroup } from '@angular/forms';

interface textOpts {
  text: string,
  x: number,
  y: number,
  bold?: boolean,
  size?: number,
  color?: 'white' | 'black',
  textAlign: 'left' | 'center' | 'right',
  maxLineWidth?: number
}

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

@Component({
  selector: 'app-dialog-download-report',
  templateUrl: './dialog-download-report.component.html',
  styleUrls: ['./dialog-download-report.component.css']
})
export class DialogDownloadReportComponent {

  constructor(
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private activeModal: NgbActiveModal,
    private userService: UserService,
    private courseService: CourseService,
    private profileService: ProfileService,
    private departmentService: DepartmentService

  ) {}

  startDate
  hoy: number = Date.now()
  endDate
  startWeekDate: number
  startMonthDate: number
  startYearDate: number
  loaded = true

  enterprise: Enterprise
  enterpriseSubscription: Subscription
  userServiceSubscription: Subscription
  profilesSubscription: Subscription
  profiles
  departments
  courses
  users
  reportform: FormGroup
  displayErrors = false

  ngOnInit() { // estoy aqui
    this.displayErrors = false
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(async enterprise => {
      if (enterprise) {
        this.enterprise = enterprise;
      }
    })
    this.profileService.loadProfiles()
    this.profilesSubscription = combineLatest([this.profileService.getProfiles$(), this.departmentService.getDepartments$(), this.courseService.getCourses$()]).subscribe(([profiles, departments, courses]) => {
      this.profiles = profiles
      this.departments = departments
      this.courses = courses
      //this.getData();
    })

    this.reportform = new FormGroup({
      fechaInicio: new FormControl(null),
      fechafin: new FormControl(null),
    })
  }


  
  downloadReport() {
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe()
    }

    let fechaInicio = new Date(this.startDate.year,this.startDate.month-1,this.startDate.day)
    let fechaFin = new Date(this.endDate.year,this.endDate.month-1,this.endDate.day)

    console.log('fechas reporte',fechaInicio,fechaFin)


    this.userServiceSubscription = this.userService.getUsersReport$(null,null,null,null,this.startDate,this.endDate).pipe(
      filter(user=>user !=null),take(1),
      switchMap(users => {
        const userCourseObservables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid);
          // Obtener cursos activos por usuario
          const coursesObservable = this.courseService.getActiveCoursesByStudentDateFiltered$(userRef,this.startDate,this.endDate);
          // Obtener clases asociadas al usuario, independientemente de los cursos
          const classesObservable = this.courseService.getClassesByStudentDatefilterd$(userRef);
      
          return combineLatest([coursesObservable, classesObservable]).pipe(
            map(([courses, classes]) => {
              // Aquí tienes un objeto que incluye tanto los cursos como las clases asociadas a ese usuario
              // Cursos y clases están en sus propios objetos y no anidadas
              return { user, courses, classes };
            })
          );
        });
        // Combina los observables de todos los usuarios con sus cursos y clases
        return combineLatest(userCourseObservables);
        })).subscribe(response => {
        console.log('datos reporte',response)
        const users: User[] = response.map(({user, courses}) => {
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
          let coursesUser = [];
          courses.forEach(course => {
            hours += course?.progressTime ? course.progressTime : 0
            const courseJson = this.courses.find(item => item.id === course.courseRef.id)
            courseJson.progress=courseJson
            coursesUser.push(courseJson.progress)
            targetHours += (courseJson.duracion/60)
          })
          const userPerformance: "no plan" | "high" | "medium" | "low" | "no iniciado"= this.userService.getPerformanceWithDetails(courses);
          const department = this.departments.find(department => department.id === user.departmentRef?.id)
          const ratingPoints: number = this.userService.getRatingPointsFromStudyPlan(courses, this.courses);
          return {
            displayName: user.displayName,
            department: department?.name ? department.name : '',
            hours: hours, // Calculation pending
            targetHours: targetHours,
            profile: profileName,
            ratingPoints: ratingPoints,
            rhythm: userPerformance, // Calculation pending
            uid: user.uid,
            photoUrl: user.photoUrl,
            courses:coursesUser
          }
        })
        this.users = users; // Assuming the data is in 'items'
        console.log('data reporte',this.users)
        this.download()
      }
    );
  }

  ngOnDestroy() {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe()
  }

  dismiss() {
    this.activeModal.dismiss()
  }

  getGeneralStats(startDate, endDate, selectedPeriod) {
    // this.selectedPeriod = selectedPeriod
    // //Valores que no varian segun el periodo
    // this.activeStudents = this.students.filter(x => x.uid && x.status)
    // let allCourses = []
    // this.students.forEach(student => {
    //   student.studyPlan.forEach(course => {
    //     allCourses.push(course)
    //   });
    // });
    // const allCompletedCourses = allCourses.filter(x=> x.fechaCompletacion)
    // this.generalProgress = allCourses.length > 0 ?
    // allCompletedCourses.length * 100 / allCourses.length: 0
    // this.ritmoOptimo = this.students.filter(x => x.performance == "high")
    // this.ritmoMedio = this.students.filter(x => x.performance == "medium")
    // this.ritmoBajo = this.students.filter(x => x.performance == "low")
    // this.sinPlan = this.students.filter(x => x.studyPlan.length == 0)
    // //Valores que varian segun el periodo
    // let customPeriodTime = 0
    // let completedCourses = 0
    // let averageGrades = []
    // let enrolledCourses = []
    // if (this.logs.length > 0) {
    //   // Si se selecciono la opcion de "historico", se toman encuenta todos los logs.
    //   this.logsInsidePeriod = this.startDate == 0? this.logs: this.general.getCustomChartData(this.logs, startDate, endDate)
    //   console.log("logs inside custom time")
    //   console.log(this.logsInsidePeriod)
    //   this.logsInsidePeriod.forEach(item => customPeriodTime += item.tiempo);
    //   this.students.forEach(student => {
    //     let studyPlanInsidePeriod = student.studyPlan.filter(x => x.fechaInicio >= this.startDate && x.fechaInicio < this.endDate)
    //     let totalGrade = 0;
    //     studyPlanInsidePeriod.forEach(item => {
    //       enrolledCourses.push(item)
    //       if (item.fechaCompletacion && item.fechaCompletacion >= startDate && item.fechaCompletacion <= endDate) {
    //         let puntaje = item.puntaje
    //         if (puntaje == 0) {
    //           puntaje = this.general.getNotaInexistente(this.logsInsidePeriod, item)
    //         }
    //         totalGrade += puntaje
    //         completedCourses++;
    //       }
    //     })
    //     const studentGrade = completedCourses > 0 ? totalGrade/completedCourses : 0;
    //     averageGrades.push(studentGrade)
    //   })
    // }
    // this.horasTotales = customPeriodTime / 60
    // this.horasPromedioPorEstudiante = this.students.length >0 ? this.horasTotales / this.students.length : 0
    // this.horasPromedioEnPeriodo = this.getHorasPromedioEnPeriodo(this.horasTotales, this.logsInsidePeriod, startDate, endDate)
    // this.completedCourses = completedCourses
    // this.enrolledCourses = enrolledCourses.filter(x => x.fechaInicio >= this.startDate)
    // this.averageGrade = averageGrades.length > 0 ?
    // (averageGrades.reduce((a, b) => a + b, 0)) / averageGrades.length : 0

  }

  // ********* FOR REPORT *********
  indice = 1
  extraPages = 0
  space = 0
  pageHeigth = 0
  pageWidth = 0
  formattedPageHeigth = 0
  formattedPageWidth = 0
  fin = 0

  font = font
  font2 = font2

  // verticalMargin = 10
  verticalMargin = 5.2
  horizontalMargin = 4.5

  pdf: jsPDF = null



  // ********* Report Methods *********



  async download() {
    try {
      try {
        this.companyPhoto = await this.firebasePhotoToImage(this.enterprise.photoUrl)
      } catch(error) {
        this.companyPhoto = this.logo
        console.log("Error uploading enterprise photoUrl", error)
      }
      this.indice = 0
      this.extraPages = 0
      this.pdf = new jsPDF("p", "mm", "a4") as jsPDF
      this.space = this.pdf.getCharSpace()
      this.pageHeigth = this.pdf.internal.pageSize.height //297mm
      this.pageWidth = this.pdf.internal.pageSize.width //210mm
      this.formattedPageHeigth = this.pageHeigth - 2*this.verticalMargin //286.6mm
      this.formattedPageWidth = this.pageWidth - 2*this.horizontalMargin //201mm
      this.pdf.setLineHeightFactor(1)
      this.addFonts()
      this.addCover()
      await this.addGeneralPage()
      // for (let index = 0; index < this.pages.length; index++) {
      //   const student = this.pages[index];
      //   await this.studentPage(student, index)
      // }
      this.pdf.save(`Reporte Histórico de ${this.enterprise.name}.pdf`)
    }catch(err) {
      console.log(err)
    }

  }

  logo = "assets/images/logos/logo.png"
  predycBusinessImg = 'assets/images/design/predycBusiness.png';

  addCover() {
    this.pdf.setFillColor(21, 27, 38)
    this.pdf.rect(0, 0, this.pageWidth, this.pageHeigth, 'F')
    const imageAspectRatio = 628/1200 // 1200*628
    const imageXStartingPosition = this.pageWidth/2 - this.pageWidth*0.8/2
    const imageYStartingPosition = (this.pageHeigth/2 - this.pageWidth*0.8*imageAspectRatio/2) - 50
    const imageWidth = this.pageWidth*0.8
    const imageHeight = imageWidth*imageAspectRatio
    this.pdf.addImage(this.predycBusinessImg, 'png', imageXStartingPosition, imageYStartingPosition, imageWidth, imageHeight)
    let currentLine = 220
    const logoWidth = 5
    const logoHeight = 5
    const logoXStartingPosition = (this.formattedPageWidth / 2) - 8
    const logoYStartingPosition = currentLine + this.verticalMargin + this.pdf.getLineHeight()*1/2 - logoHeight
    this.pdf.addImage(this.logo, 'png', logoXStartingPosition , logoYStartingPosition, logoWidth, logoHeight)
    currentLine = this.addFormatedText({
      text: "Predyc",
      x: (this.formattedPageWidth / 2) + (logoWidth/2),
      y: currentLine,
      color: 'white',
      bold: true,
      textAlign: "center"
    })
    currentLine = this.addFormatedText({
      text: "Reporte de capacitación",
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
    currentLine = this.addFormatedText({
      text: this.enterprise.name,
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
    let dateInCoverPage = ""

    dateInCoverPage = "Histórico"
    currentLine = this.addFormatedText({
      text: dateInCoverPage,
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
  }

  async addGeneralPage() {
    this.pdf.addPage("a4", "p")
    let currentLine = 0
    currentLine = this.addLogoAndDate()
    let generalPageTitle = "Reporte de capacitación "
    // Si es historico
    generalPageTitle += "histórico"
    currentLine = this.addFormatedText({
      text: generalPageTitle,
      x: 0,
      y: currentLine + 7,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 18
    })
    currentLine = this.addFormatedText({
      text: this.enterprise.name,
      x: 0,
      y: currentLine,
      color: 'black',
      textAlign: "left",
      size: 16
    })
    currentLine += this.pdf.getLineHeight()/2 + 5
    this.pdf.line(this.horizontalMargin, currentLine, this.formattedPageWidth, currentLine)
    //DATA DISTRIBUTED IN RECTANGLES
    const strings = [
      "Estudiantes activos actualmente", 
      "Horas acumuladas del grupo en el período", 
      "Horas promedio por estudiante en el período", 
      `Horas promedio por mes"`,
      "Certificados emitidos en el período", 
      "Cursos inscritos en el período", 
      "Calificación promedio en el período", 
      "Progreso del plan general actualmente"
    ]
    const values = [
      0,    // No depende el periodo
      0, 
      0, 
      0, 
      0, 
      0, 
      0, 
      `0 %` // No depende el periodo
    ]
    currentLine = this.generalCoursesData(strings, values, currentLine) 
    // CHARTS
    const graphicHeight = 90
    currentLine = await this.getChart(currentLine, [], graphicHeight)

    // PROGRESS BAR
    currentLine = await this.generalProgressbar(currentLine)
  }

  addFonts() {
    this.pdf.addFileToVFS("calibri-normal.ttf", this.font)
    this.pdf.addFont("calibri-normal.ttf", "calibri", "normal")
    this.pdf.addFileToVFS("calibri-bold.ttf", this.font2)
    this.pdf.addFont("calibri-bold.ttf", "calibri", "bold")
  }

  addFormatedText(opts: textOpts): number {
    this.pdf.setFont("calibri", opts?.bold ? "bold" : "normal")
    if(opts?.size) {
      this.pdf.setFontSize(opts.size)
    }
    opts.color == 'white' ? this.pdf.setTextColor(255, 255, 255) : this.pdf.setTextColor(0, 0, 0)
    const textLines = this.pdf.splitTextToSize(opts.text, opts?.maxLineWidth ? opts.maxLineWidth : this.formattedPageWidth )
    for (let index=0; index < textLines.length; index++) {
      this.pdf.text(textLines[index], opts.x + this.horizontalMargin, opts.y + this.verticalMargin + this.pdf.getLineHeight()*(index+1)/2, { align: opts.textAlign })
    }
    const nextHeightValue = opts.y + textLines.length * this.pdf.getLineHeight()/2
    return nextHeightValue
  }

  generalCoursesData(strings, values, currentLine) {
    for (let i = 0; i < 2; i++) {
      for (let index = 0; index < 4; index++) {
        let rectXCoord = this.horizontalMargin + index*this.formattedPageWidth/4
        let rectYCoord = currentLine
        let rectWidth = this.formattedPageWidth/4
        let rectHeight = this.formattedPageHeigth/10
        // this.pdf.rect(rectXCoord, rectYCoord, rectWidth, rectHeight)
        let text = strings[(index)+(4*i)]
        let value = values[(index)+(4*i)]
        this.addFormatedText({
          text: value.toString(),
          x: rectXCoord,
          y: rectYCoord,
          color: 'black',
          bold: true,
          textAlign: "left",
          size: 20,
        })
        this.addFormatedText({
          text: text,
          x: rectXCoord,
          y: rectYCoord + rectHeight - this.pdf.getLineHeight(),
          color: 'black',
          textAlign: "left",
          size: 12,
          maxLineWidth: rectWidth - this.horizontalMargin
        })
      }
      currentLine += this.formattedPageHeigth/10 //rectHeight
    }
    currentLine += this.pdf.getLineHeight()/2
    return currentLine
  }

  chart
  async getChart(currentLine, logsInsidePeriod, graphicHeight) { 
    // Si en anual o historico
    let chartTitle = "Horas por mes"
    currentLine = this.addFormatedText({
      text: chartTitle,
      x: 0,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 16
    })
    currentLine += this.pdf.getLineHeight()
    // const chartData = this.getChartData(logsInsidePeriod)
    const chartData = []
    let labels = []
    let values = []
    chartData.forEach(data => {
      labels.push(data.label)
      values.push(data.value)
    });
    const canvas = document.getElementById("pdfChart") as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')
    let rel = 1
    const pdf = this.pdf
    // const horizontalMargin = this.horizontalMargin
    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          borderWidth: 1
        }]
      },
      plugins: [{
        id: 'custom_canvas_background_color',
        beforeDraw: (chart) => {
          rel = chart.width / chart.height
          const ctx = chart.canvas.getContext('2d');
          ctx.save();
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, chart.width, chart.height);
          ctx.restore();
        }
      }],
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        animation: false,
        plugins: {
          legend: {
            display: false
          }
        }
      }
    })
    const image = canvas.toDataURL("image/jpeg", 1.0)
    const graphicWidth = graphicHeight * rel
    const xPosition = (this.pageWidth / 2) - (graphicWidth / 2)
    pdf.addImage(image, 'JPEG', xPosition, currentLine, graphicWidth, graphicHeight)
    return currentLine + graphicHeight
  }

  students = [0]
  ritmoMedio = []
  ritmoBajo = []
  ritmoOptimo = []
  sinPlan = []

  async generalProgressbar(currentLine) {
    currentLine = this.addFormatedText({
      text: "Ritmo de usuarios",
      x: 0,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 16
    })
    currentLine += this.pdf.getLineHeight()
    let pdf = `
    <div style="display: flex; max-width: ${this.formattedPageWidth}mm; margin: 0 auto; gap: 1rem; align-items: center; justify-content: center; margin-top: 8px;">
        <div style="display: flex; overflow: hidden; height: 12px; max-height: 12px; width: 100%; background-color: #D5DCE0; border-radius: 6px">
            <div style="width: ${this.ritmoOptimo.length*100 / this.students.length}%; height: 20px; min-height: 20px; background-color: #6d05b0">
            </div>
            <div style="width: ${this.ritmoMedio.length*100 / this.students.length}%; height: 20px; min-height: 20px; background-color: #00BF9C">
            </div>
            <div style="width: ${this.ritmoBajo.length*100 / this.students.length}%; height: 20px; min-height: 20px; background-color: #ED4758">
            </div>
        </div>
    </div>
  `
    await this.pdf.html(pdf, {
      callback: (doc) => {
        return doc
      },
      y: this.pageHeigth + currentLine,
      windowWidth: 795, //px  (210mm = 795px)
      width: 210,       //unit of the instance
    });
    currentLine += this.pdf.getLineHeight()/4
    this.addFormatedText({
      text: `${this.ritmoOptimo.length} Ritmo óptimo`,
      x: 0,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 10
    })
    this.addFormatedText({
      text: `${this.ritmoMedio.length} Ritmo medio`,
      x: 50,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 10
    })
    this.addFormatedText({
      text: `${this.ritmoBajo.length} Ritmo bajo`,
      x: 100,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 10
    })
    currentLine = this.addFormatedText({
      text: `${this.sinPlan.length} Sin asignaciones`,
      x: 150,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 10
    })
    return currentLine
  }

  companyPhoto

  addLogoAndDate() {
    let currentLine = 0
    const logoWidth = 5
    const logoHeight = 5
    const logoXStartingPosition = this.formattedPageWidth - logoWidth
    const logoYStartingPosition = this.verticalMargin
    this.pdf.addImage(this.companyPhoto, 'PNG', logoXStartingPosition , logoYStartingPosition, logoWidth, logoHeight)
    const dateText = "Reporte de capacitación histórico"
    currentLine = this.addFormatedText({
      text: dateText,
      x: logoXStartingPosition - logoWidth - 5,
      y: currentLine,
      color: 'black',
      textAlign: "right",
      size: 8
    })
    return currentLine
  }

  async firebasePhotoToImage(photoURL: string): Promise<HTMLImageElement> {
    const format = await this.getImageFormat(photoURL);
    console.log(format)
    if (format === 'PNG' || format === 'JPEG') {
        return this.loadImageDirectly(photoURL);
    } else {
        const dataUrl = format === 'JPEG' ? photoURL : await this.convertSVGtoDataURL(photoURL);
        return this.loadImageFromDataUrl(dataUrl);
    }
  }

  async getImageFormat(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('HEAD', url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    const contentType = xhr.getResponseHeader('Content-Type');
                    if (contentType) {
                        if (contentType.includes('image/png')) {
                            resolve('PNG');
                        } else if (contentType.includes('image/jpeg')) {
                            resolve('JPEG');
                        } else {
                            resolve('UNKNOWN');
                        }
                    } else {
                        reject("No se pudo determinar el tipo de contenido");
                    }
                } else {
                    reject("Error en la solicitud");
                }
            }
        };
        xhr.send();
    });
  }


  async convertSVGtoDataURL(svgUrl: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Añadir esto antes de definir src
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = function() {
            reject("Error al cargar el SVG");
        };

        img.src = svgUrl;
    });
  }

  async loadImageDirectly(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Añadir esto antes de definir src
        img.onload = function() {
            resolve(img);
        };
        img.onerror = function() {
            reject("Error al cargar la imagen");
        };
        img.src = url;
    });
  }

  async loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Añadir esto antes de definir src
        img.onload = function() {
            resolve(img);
        };
        img.onerror = function() {
            reject("Error al cargar la imagen desde Data URL");
        };
        img.src = dataUrl;
    });
  }

}
