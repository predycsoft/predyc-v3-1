import { Component, OnInit } from '@angular/core';
import { MatDialog,MatDialogRef } from '@angular/material/dialog';
import Chart from 'chart.js/auto';
import { format, subDays, subMonths } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DialogProgresoReporteComponent } from 'src/app/dialogs/dialog-progreso-reporte/dialog-progreso-reporte.component';
import { GeneralService } from 'src/app/empresa/general.service';
import { font, font2 } from 'src/app/global/font-constants';
import { Log, Student } from 'src/app/global/general-classes';
import { DialogService } from 'src/app/services/dialog.service';
import { IconService } from 'src/app/services/icon.service';



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

@Component({
  selector: 'app-dialog-descargar-reporte',
  templateUrl: './dialog-descargar-reporte.component.html',
  styleUrls: ['./dialog-descargar-reporte.component.css']
})
export class DialogDescargarReporteComponent implements OnInit {

  constructor(
    private dialogService: DialogService,
    private dialog: MatDialog,
    public icon: IconService,
    private general: GeneralService,
    public dialogRef: MatDialogRef<DialogDescargarReporteComponent>
  ) { }

  async ngOnInit() {
    this.getFirstDays()
    this.loaded = false
    this.general.empresa.subscribe(async empresa => {
      this.loaded = false
      if (!empresa) {
        return
      }
      this.empresa = empresa
      this.companyPhoto = await this.firebasePhotoToImage(this.empresa.foto)
      this.general.getStudents().subscribe((students) => {
        this.students = students
        console.log("this.students")
        console.log(this.students)
        this.logs = this.general.getTeamLogs().sort((a, b) => a.timestamp - b.timestamp); //Del mas viejo al mas nuevo
        console.log("this.logs")
        console.log(this.logs)
        this.general.getSubscriptions().subscribe(subscription => {
          this.students.forEach(user => {
            let sub = subscription.find(x => x.userId == user.uid)
            if (sub) {
              user.status = sub.status
            }
          })
        })
        let pages = []
        this.students.forEach(student => {
          if (student.studyPlan.length > 0) {
            pages.push(student.uid)
          }
        })
        // this.pages = pages.slice(0,2)
        this.pages = pages
        console.log(this.pages)
        this.loaded = true
      })
    })
  }

  empresa
  companyPhoto
  students: Student[] = []
  pages = ["portada","general"]
  predycBusinessImg = 'assets/images/design/predycBusiness.png';
  logo = "assets/images/logos/logo.png"
  defaultUserImage = "assets/images/default/default-user-image.jpg"
  selectedPeriod: string
  today = new Date()
  hoy: number = Date.now()
  oneDay: number = 86400000
  startWeekDate: number
  startMonthDate: number
  startYearDate: number
  startDate: number
  endDate = this.hoy

  // startDate = 1680321600000 //1 abril
  // endDate = 1683691200000 //10 mayo


  showButton = true

  loaded = false

  ritmoOptimo
  ritmoMedio
  ritmoBajo
  sinPlan

  activeStudents
  certificates
  enrolledCourses

  horasTotales
  logs: Log[] = []
  logsInsidePeriod: Log[] = []
  horasPromedioPorEstudiante
  horasPromedioEnPeriodo

  completedCourses
  delayedCourses
  averageGrade
  generalProgress

  getGeneralStats(startDate, endDate, selectedPeriod) {
    this.selectedPeriod = selectedPeriod
    //Valores que no varian segun el periodo
    this.activeStudents = this.students.filter(x => x.uid && x.status)
    let allCourses = []
    this.students.forEach(student => {
      student.studyPlan.forEach(course => {
        allCourses.push(course)
      });
    });
    const allCompletedCourses = allCourses.filter(x=> x.fechaCompletacion)
    this.generalProgress = allCourses.length > 0 ?
    allCompletedCourses.length * 100 / allCourses.length: 0
    this.ritmoOptimo = this.students.filter(x => x.performance == "high")
    this.ritmoMedio = this.students.filter(x => x.performance == "medium")
    this.ritmoBajo = this.students.filter(x => x.performance == "low")
    this.sinPlan = this.students.filter(x => x.studyPlan.length == 0)
    //Valores que varian segun el periodo
    let customPeriodTime = 0
    let completedCourses = 0
    let averageGrades = []
    let enrolledCourses = []
    if (this.logs.length > 0) {
      // Si se selecciono la opcion de "historico", se toman encuenta todos los logs.
      this.logsInsidePeriod = this.startDate == 0? this.logs: this.general.getCustomChartData(this.logs, startDate, endDate)
      console.log("logs inside custom time")
      console.log(this.logsInsidePeriod)
      this.logsInsidePeriod.forEach(item => customPeriodTime += item.tiempo);
      this.students.forEach(student => {
        let studyPlanInsidePeriod = student.studyPlan.filter(x => x.fechaInicio >= this.startDate && x.fechaInicio < this.endDate)
        let totalGrade = 0;
        studyPlanInsidePeriod.forEach(item => {
          enrolledCourses.push(item)
          if (item.fechaCompletacion && item.fechaCompletacion >= startDate && item.fechaCompletacion <= endDate) {
            let puntaje = item.puntaje
            if (puntaje == 0) {
              puntaje = this.general.getNotaInexistente(this.logsInsidePeriod, item)
            }
            totalGrade += puntaje
            completedCourses++;
          }
        })
        const studentGrade = completedCourses > 0 ? totalGrade/completedCourses : 0;
        averageGrades.push(studentGrade)
      })
    }
    this.horasTotales = customPeriodTime / 60
    this.horasPromedioPorEstudiante = this.students.length >0 ? this.horasTotales / this.students.length : 0
    this.horasPromedioEnPeriodo = this.getHorasPromedioEnPeriodo(this.horasTotales, this.logsInsidePeriod, startDate, endDate)
    this.completedCourses = completedCourses
    this.enrolledCourses = enrolledCourses.filter(x => x.fechaInicio >= this.startDate)
    this.averageGrade = averageGrades.length > 0 ?
    (averageGrades.reduce((a, b) => a + b, 0)) / averageGrades.length : 0

  }
  getStudentStats(logsInsidePeriod, studyPlan, startDate, endDate) {

    const progress = studyPlan.length > 0 ? this.general.calculateProgress(studyPlan) : 0
    let customPeriodTime = 0
    let totalGrade = 0;
    
    let completedCourses = 0       
    let delayedCourses = 0         
    let inProgressCourses = 0      
    let enrolledCourses = []       
    let horasTotales = 0           
    let horasPromedioEnPeriodo = 0 
    let certificates = 0           
    let averageGrade = 0           
    if (logsInsidePeriod.length > 0) {
      logsInsidePeriod.forEach(item => customPeriodTime += item.tiempo);
      if (studyPlan.length > 0) {
        studyPlan.forEach(item => {
          enrolledCourses.push(item)
          if (item.fechaCompletacion && item.fechaCompletacion >= startDate && item.fechaCompletacion <= endDate) {
            let puntaje = item.puntaje
            if (puntaje == 0) {
              puntaje = this.general.getNotaInexistente(logsInsidePeriod, item)
            }
            totalGrade += puntaje
            completedCourses++;
          }
          else if (!item.fechaCompletacion) {
            if (item.fechaFin >= startDate && item.fechaFin < endDate) {
              delayedCourses++
            }
            else if(item.fechaFin > endDate && item.progreso > 0) {
              inProgressCourses++
            }
          }
        })
      }
    }
    horasTotales = customPeriodTime / 60 
    horasPromedioEnPeriodo = this.getHorasPromedioEnPeriodo(horasTotales, logsInsidePeriod, startDate, endDate)
    certificates = completedCourses
    averageGrade = completedCourses > 0 ? totalGrade/completedCourses : 0;
    return {progress, completedCourses, delayedCourses, inProgressCourses, enrolledCourses, horasTotales, horasPromedioEnPeriodo, certificates, averageGrade}
  }

  getHorasPromedioEnPeriodo(horasTotales, logs, startDate, endDate) {
    let horasPromedioEnPeriodo
    //Si se selecciono "semanal" o "mensual"
    if(startDate != 0 && this.getYear(startDate) == this.getYear(endDate)) {
      const daysBetweenDates = Math.floor((endDate-startDate)/this.oneDay) + 1
      horasPromedioEnPeriodo = horasTotales / daysBetweenDates
    }
    else {
      let monthsBetweenDates = 12
      //Si se selecciono hitorico, se busca el primer log para calcular la diferencia en meses
      if (startDate == 0 && logs.length > 0) {
        const monthDiff = new Date (endDate).getMonth() - new Date (logs[0].timestamp).getMonth();
        const yearDiff = new Date (endDate).getFullYear() - new Date (logs[0].timestamp).getFullYear();
        monthsBetweenDates = monthDiff + yearDiff * 12 + 1 // +1 para tomar en cuenta el primer mes 
      }
      horasPromedioEnPeriodo = horasTotales / monthsBetweenDates
    }
    return horasPromedioEnPeriodo
  }

  getFirstDays() {
    let prevWeek = new Date(this.hoy - 6*this.oneDay)
    // Para tener la fecha en la misma referencia que las demas (00:00).
    let prevWeekDate = new Date(prevWeek.getUTCFullYear(), prevWeek.getUTCMonth(), prevWeek.getUTCDate()).getTime()
    this.startWeekDate = prevWeekDate
    const prevMonthDate = new Date(this.today.getUTCFullYear(), this.today.getUTCMonth()- 1, this.today.getUTCDate()+1).getTime()
    this.startMonthDate = prevMonthDate
    const prevYearDate = new Date(this.today.getUTCFullYear() - 1, this.today.getUTCMonth(), this.today.getUTCDate()).getTime()
    this.startYearDate = prevYearDate
    // console.log("this.startWeekDate")
    // console.log(this.startWeekDate)
    // console.log(new Date(this.startWeekDate))
    // console.log("prevMonthDate")
    // console.log(prevMonthDate)
    // console.log(new Date(prevMonthDate))
    // console.log("prevYearDate")
    // console.log(prevYearDate)
    // console.log(new Date(prevYearDate))
  }

  getDay(inputDate) {
    let date = new Date(inputDate)
    return date.getDate()
  }

  getMonth(inputDate) {
    let date = new Date(inputDate)
    return this.general.getFullMonthString(date.getMonth())
  }

  getYear(inputDate) {
    let date = new Date(inputDate)
    return date.getFullYear()
  }

  getUser(uid: string): Student{
    return this.students.find(x => x.uid == uid)
  }
  getUserStatus(uid: string) {
    const user = this.getUser(uid)
    const completed = user.studyPlan.filter(x => x.fechaCompletacion).length
    const delayed = user.studyPlan.filter(x => x.fechaFin < this.hoy && !x.fechaCompletacion).length
    const inProgress = user.studyPlan.filter(x => x.fechaFin > Date.now() && !x.fechaCompletacion && x.progreso > 0).length
    return {completed, delayed, inProgress}
  }
  getStatus(curso) {
    if (curso.fechaCompletacion) {
      return "Completado"
    } else {
      if (!curso.fechaFin) {
        return "Pendiente"
      } else {
        if (curso.fechaFin < this.endDate) {
          return "Atrasado"
        } else {
          return "Pendiente"
        }
      }
    }
  }

  getStartIndex(page, i): number {
    const arr = this.pages.slice(0, i)
    const numberOfRep = arr.filter(x => x==page).length
    // console.log(`Pagina ${numberOfRep + 1} de ${this.getUser(page).name} `)
    const firstNumber = 12* numberOfRep
    // console.log(`firstNumber = ${firstNumber}`)
    return firstNumber
  }
  getEndIndex(page, i): number {
    const arr = this.pages.slice(0, i)
    const numberOfRep = arr.filter(x => x==page).length
    const finalNumber = 24* numberOfRep < this.getUser(page).studyPlan.length? 24* numberOfRep: this.getUser(page).studyPlan.length
    // console.log(`finalNumber = ${finalNumber}`)
    return finalNumber
  }

  completedThisMonth(course) {
    if (course.fechaCompletacion) {
      return new Date(course.fechaCompletacion).getMonth() == new Date(this.hoy).getMonth()
    }
    return false
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
    console.log(this.selectedPeriod)
    const dialog = this.dialog.open(DialogProgresoReporteComponent, {
      disableClose: true
    })
    try {
      this.indice = 0
      this.extraPages = 0
      this.pdf = new jsPDF("p", "mm", "a4") as jsPDF
      this.space = this.pdf.getCharSpace()
      this.pageHeigth = this.pdf.internal.pageSize.height //297mm
      this.pageWidth = this.pdf.internal.pageSize.width //210mm
      this.formattedPageHeigth = this.pageHeigth - 2*this.verticalMargin //286.6mm
      this.formattedPageWidth = this.pageWidth - 2*this.horizontalMargin //201mm
      this.pdf.setLineHeightFactor(1)
      // this.pdf.setLineWidth(40)
      this.addFonts()
      this.addCover()
      dialog.componentInstance.loading = Math.ceil(100/(this.pages.length + 2))
      // this.salto(this.pdf)
      await this.addGeneralPage()
      dialog.componentInstance.loading = Math.ceil((2 * 100)/(this.pages.length + 2))
      for (let index = 0; index < this.pages.length; index++) {
        const student = this.pages[index];
        await this.studentPage(student, index)
        dialog.componentInstance.loading = Math.ceil(((index + 3) * 100)/(this.pages.length + 2))
      }
      dialog.close()
      this.pdf.save(`Reporte ${this.selectedPeriod} de ${this.empresa.nombre}.pdf`)
    }catch(err) {
      dialog.close()
      console.log(err)
      this.dialogService.dialogAlerta("Debes completar la información de tu proyecto para descargar el reporte")
    }

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

  addLogoAndDate() {
    let currentLine = 0
    const logoWidth = 5
    const logoHeight = 5
    const logoXStartingPosition = this.formattedPageWidth - logoWidth
    const logoYStartingPosition = this.verticalMargin
    this.pdf.addImage(this.companyPhoto, 'PNG', logoXStartingPosition , logoYStartingPosition, logoWidth, logoHeight)
    const dateText = this.startDate == 0? "Reporte de capacitación histórico" :
    `Reporte de capacitación ${this.timestampToDateFormat(this.startDate)} - ${this.timestampToDateFormat(this.endDate)}` 
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
      text: this.empresa.nombre,
      x: this.formattedPageWidth / 2,
      y: currentLine,
      color: 'white',
      textAlign: "center"
    })
    let dateInCoverPage = ""
    // Si es semanal o mensual
    if (this.startDate != 0 && this.getYear(this.startDate) == this.getYear(this.endDate)) {
      dateInCoverPage = `${this.getDay(this.startDate)}-${this.getMonth(this.startDate)} /${ this.getDay(this.endDate)}-${this.getMonth(this.endDate)} | ${this.getYear(this.startDate)} `
    }
    // Si es anual
    else if (this.startDate != 0 && this.getYear(this.startDate) != this.getYear(this.endDate)) {
      dateInCoverPage = `${this.getDay(this.startDate)}-${this.getMonth(this.startDate)}-${this.getYear(this.startDate)} / ${this.getDay(this.endDate)}-${this.getMonth(this.endDate)}-${this.getYear(this.endDate)}`
    }
    // Si es historico
    else if (this.startDate == 0) {
      dateInCoverPage = "Histórico"
    }
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
    // Si es semanal o mensual
    if (this.startDate != 0 && this.getYear(this.startDate) == this.getYear(this.endDate) ) {
      generalPageTitle += `del ${this.getDay(this.startDate)} de ${this.getMonth(this.startDate)} al ${this.getDay(this.endDate)} de ${this.getMonth(this.endDate)} del ${this.getYear(this.startDate)}`
    }
    // Si es anual
    else if (this.startDate != 0 && this.getYear(this.startDate) != this.getYear(this.endDate)) {
      generalPageTitle += `del ${this.getDay(this.startDate)} de ${this.getMonth(this.startDate)} del ${this.getYear(this.startDate)} al ${this.getDay(this.endDate)} de ${this.getMonth(this.endDate)} del ${this.getYear(this.endDate)}`
    }
    // Si es historico
    else if (this.startDate == 0) {
      generalPageTitle += "histórico"
    }
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
      text: this.empresa.nombre,
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
      `Horas promedio por ${(this.selectedPeriod == "semanal" || this.selectedPeriod == "mensual") ? "día" : "mes"}`,
      "Certificados emitidos en el período", 
      "Cursos inscritos en el período", 
      "Calificación promedio en el período", 
      "Progreso del plan general actualmente"
    ]
    const values = [
      this.activeStudents.length,    // No depende el periodo
      this.horasTotales.toFixed(2), 
      this.horasPromedioPorEstudiante.toFixed(2), 
      this.horasPromedioEnPeriodo.toFixed(2), 
      this.completedCourses, 
      this.enrolledCourses.length, 
      this.averageGrade.toFixed(2), 
      `${this.generalProgress.toFixed(0)} %` // No depende el periodo
    ]
    currentLine = this.generalCoursesData(strings, values, currentLine) 
    // CHARTS
    const graphicHeight = 90
    currentLine = await this.getChart(currentLine, this.logsInsidePeriod, graphicHeight)

    // PROGRESS BAR
    currentLine = await this.generalProgressbar(currentLine)
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
  getChartData(logsInsidePeriod) {
    let index = 0
    let flag = 0
    if (this.startDate != 0 && this.getYear(this.startDate) == this.getYear(this.endDate)) {
      const daysBetweenDates = Math.floor((this.endDate-this.startDate)/this.oneDay)
      index = daysBetweenDates
      flag = 1
    }
    else {
      let monthsBetweenDates = 11
      //Si se selecciono hitorico, se busca el primer log para calcular la diferencia en meses
      if (this.startDate == 0 && logsInsidePeriod.length > 0) {
        const monthDiff = new Date (this.endDate).getMonth() - new Date (logsInsidePeriod[0].timestamp).getMonth();
        const yearDiff = new Date (this.endDate).getFullYear() - new Date (logsInsidePeriod[0].timestamp).getFullYear();
        monthsBetweenDates = monthDiff + yearDiff * 12
      }
      index = monthsBetweenDates
      flag = 2
    }

    let data = []
    let now = new Date();
    for(let i = 0; i <= index; i++) {
      let day = subDays(now, i);
      let month = subMonths(now, i);
      let label = ""
      let value = logsInsidePeriod.reduce((total, log) => {
        let logDate = new Date(log.timestamp);
        if (flag == 1){
          label = format(day, 'dd');
          if(logDate.getDate() === day.getDate() && logDate.getMonth() === day.getMonth() && logDate.getFullYear() === day.getFullYear()) {
            return total + (log.tiempo/60);
          }
        }
        else {
          label = format(month, 'MMM-yy');
          if(logDate.getMonth() === month.getMonth() && logDate.getFullYear() === month.getFullYear()) {
            return total + (log.tiempo/60);
          }
        }
        return total;
      }, 0);
      data.unshift({value, label});
    }
    let max = 0
    let horasObjetivo = 1
    max = horasObjetivo
    let max2 = data.reduce((max2, item) => item.value > max2 ? item.value : max2, data[0].value);
    if(max2 > max){
        max = max2;
    }
    return data
  }

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

  async studentPage(student, index) {
    this.pdf.addPage("a4", "p")
    let currentLine = 0
    currentLine = this.addLogoAndDate()
    currentLine += 10
    const studentPhoto = this.getUser(student).photoURL? this.getUser(student).photoURL: this.defaultUserImage
    console.log(studentPhoto)
    const image = await this.firebasePhotoToImage(studentPhoto)
    console.log(image);
    const photoWidth = 21
    const photoHeight = 21
    const photoXStartingPosition = this.horizontalMargin
    const photoYStartingPosition = currentLine
    this.pdf.addImage(image, 'PNG', photoXStartingPosition , photoYStartingPosition, photoWidth, photoHeight)
    currentLine = this.addFormatedText({
      text: `${this.getUser(student).name}`,
      x: photoWidth + 8,
      y: currentLine - 5,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 18
    })
    currentLine = this.addFormatedText({
      text: `${this.getUser(student).job}`,
      x: photoWidth + 8,
      y: currentLine,
      color: 'black',
      textAlign: "left",
      size: 16
    })
    currentLine += this.pdf.getLineHeight()/2 + 5
    this.pdf.line(this.horizontalMargin, currentLine, this.formattedPageWidth, currentLine)
    // Student info
    const studyPlanInsidePeriod = this.getUser(student).studyPlan.filter(x => x.fechaInicio >= this.startDate && x.fechaInicio < this.endDate)
    let logsInsidePeriod: Log[] = []
    if (this.getUser(student).logs.length > 0) {
      // Si se selecciono la opcion de "historico", se toman encuenta todos los logs.
      const studentLogs = this.getUser(student).logs.sort((a, b) => a.timestamp - b.timestamp) //Del mas viejo al mas nuevo

      logsInsidePeriod = this.startDate == 0? studentLogs: this.general.getCustomChartData(studentLogs, this.startDate, this.endDate)
    }
    console.log(`${this.getUser(student).name} logs inside custom time`)
    console.log(logsInsidePeriod)
    const studentStats = this.getStudentStats(logsInsidePeriod, studyPlanInsidePeriod, this.startDate, this.endDate)
    //PROGRESS BAR
    currentLine = await this.studentProgressbar(studentStats, currentLine, index)
    currentLine += 5
    //DATA DISTRIBUTED IN RECTANGLES 
    const strings = [
      "Cursos completados", 
      "Cursos con retraso", 
      "Cursos en progreso", 
      "Cursos inscritos", 
      "Horas de formación totales", 
      `Horas promedio por ${(this.selectedPeriod == "semanal" || this.selectedPeriod == "mensual") ? "día" : "mes"}`,
      "Certificados emitidos", 
      "Calificación promedio"
    ]   
    const values = [
      studentStats.completedCourses,
      studentStats.delayedCourses,
      studentStats.inProgressCourses,
      studentStats.enrolledCourses.length,
      studentStats.horasTotales.toFixed(2),
      studentStats.horasPromedioEnPeriodo.toFixed(2),
      studentStats.completedCourses,
      studentStats.averageGrade.toFixed(2),
    ]

    currentLine = this.studentCoursesData(strings, values, currentLine) 
    currentLine += 5
    // CHARTS
    const graphicHeight = 80
    currentLine = await this.getChart(currentLine, logsInsidePeriod, graphicHeight)
    currentLine += 5
    // STUDYPLAN TABLE
    if (studyPlanInsidePeriod.length > 0) {
      this.studentStudyPlanTable(studyPlanInsidePeriod, currentLine)
    }
    else {
      this.pdf.line(this.horizontalMargin, currentLine, this.formattedPageWidth, currentLine)
      currentLine = this.addFormatedText({
        text: "El plan de estudio del estudiante no posee cursos que hayan iniciado en el período seleccionado",
        x: this.formattedPageWidth / 2,
        y: currentLine,
        color: 'black',
        bold: true,
        textAlign: "center",
        size: 24
      })
    }
  }

  async studentProgressbar(studentStats, currentLine, index) {
    currentLine = this.addFormatedText({
      text: "Progreso general",
      x: 0,
      y: currentLine,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 16
    })
    currentLine += this.pdf.getLineHeight()/2
    let pdf = `
    <div style="display: flex; max-width: ${this.formattedPageWidth}mm; margin: 0 auto; gap: 1rem; align-items: left; justify-content: left; margin-top: 8px;">
      <div style="display: flex; overflow: hidden; height: 12px; max-height: 12px; width: ${this.formattedPageWidth- 20}mm; background-color: #D5DCE0; border-radius: 6px">
          <div style="width: ${studentStats.completedCourses * 100 / studentStats.enrolledCourses.length}%; height: 20px; min-height: 20px; background-color: #00BF9C">
          </div>
          <div style="width: ${studentStats.delayedCourses * 100 / studentStats.enrolledCourses.length}%; height: 20px; min-height: 20px; background-color: #ED4758">
          </div>
          <div style="width: ${studentStats.inProgressCourses * 100/studentStats.enrolledCourses.length}%; height: 20px; min-height: 20px; background-color: #008CE3">
          </div>
      </div>
    </div>
    `
    await this.pdf.html(pdf, {
      callback: (doc) => {
        return doc
      },
      y: this.pageHeigth*(2 + index + this.extraPages) + currentLine, //"2" because of cover and general pages. extraPages because of extra tables
      windowWidth: 795, //px  (210mm = 795px)
      width: 210,       //unit of the instance
    });
    currentLine = this.addFormatedText({
      text: `${studentStats.progress.toFixed(0)} %`, // REVISAR
      x: this.formattedPageWidth - 18,
      y: currentLine - this.pdf.getLineHeight()/4,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 14
    })
    return currentLine
  }
  studentCoursesData(strings, values, currentLine) {
    for (let i = 0; i < 2; i++) {
      for (let index = 0; index < 4; index++) {
        let rectXCoord = this.horizontalMargin + index*this.formattedPageWidth/4
        let rectYCoord = currentLine
        let rectWidth = this.formattedPageWidth/4
        let rectHeight = this.formattedPageHeigth/10
        // this.pdf.rect(rectXCoord, rectYCoord, rectWidth, rectHeight, null)
        let text = strings[(index)+(4*i)]
        let value = values[(index)+(4*i)]
        this.addFormatedText({
          text: value.toString(),
          x: rectXCoord,
          y: rectYCoord,
          color: 'black',
          bold: true,
          textAlign: "left",
          size: 20
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
    return currentLine
  }

  studentStudyPlanTable(studyPlan, currentLine) {
    let hTable = currentLine
    const head = [["Nombre", "Duración (horas)", "Progreso", "Fecha fin asignada", "Fecha de completación", "Estatus", "Calificación"]]
    let tableData = []
    for (let index = 0; index < studyPlan.length; index++) {
      const course = studyPlan[index];
      const courseInfo = [
        course.cursoTitulo, 
        (course.duracion/60).toFixed(2), 
        `${course.progreso} %`, 
        this.timestampToDateFormat(course.fechaFin), 
        this.timestampToDateFormat(course.fechaCompletacion), 
        this.getStatus(course), course.puntaje
      ]
      tableData.push(courseInfo)
    }
    autoTable(this.pdf, {
      theme: "striped",
      margin: {
        top: 20, // Al dividir la tabla en mas de una pagina, esta sera la posicion de la 2da en adelante
        left: this.horizontalMargin,
      },
      head: head,
      headStyles :{halign: 'center', valign: 'middle'},
      // showHead: "firstPage",
      body: tableData,
      rowPageBreak: "avoid",
      pageBreak: "auto",
      tableWidth: this.formattedPageWidth,
      styles: {
        // font: "calibri",
        fontSize: 8 
      },
      startY: currentLine,
      columnStyles: {
        0: { halign: 'left', valign: 'middle', cellWidth: 65 },
        1: { halign: 'center', valign: 'middle', cellWidth: 20 },
        2: { halign: 'center', valign: 'middle', cellWidth: 20 },
        3: { halign: 'center', valign: 'middle', cellWidth: 25 },
        4: { halign: 'center', valign: 'middle', cellWidth: 25 },
        5: { halign: 'center', valign: 'middle', cellWidth: 25 },
        6: { halign: 'center', valign: 'middle', cellWidth: 20 }
      },
      didDrawPage: (data) => {
        const limitTableHeight = 274
        if (data.cursor.y > limitTableHeight) {
          // console.log(`Se añadio una pagina debido a la altura de la tabla`)
          this.extraPages += 1
        }
        if (data.pageNumber > 1) {
          // Añadimos logo y fecha a la pagina
          this.addLogoAndDate()
        }
      }
    })
  }

  chart
  async getChart(currentLine, logsInsidePeriod, graphicHeight) { 
    // Si en anual o historico
    let chartTitle = "Horas por mes"
    // Si es semanal o mensual
    if (this.selectedPeriod == "semanal" || this.selectedPeriod == "mensual") {
      chartTitle = "Horas por día"
    }
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
    const chartData = this.getChartData(logsInsidePeriod)
    let labels = []
    let values = []
    chartData.forEach(data => {
      labels.push(data.label)
      values.push(data.value)
    });
    const canvas = document.getElementById("myChart") as HTMLCanvasElement;
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

  timer(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  timestampToDateFormat(date) {
    let result = "N/A"
    if (date) {
      result = new Date(date).toLocaleString("es-ES", { day: "numeric", month: "numeric", year: "numeric"})
    }
    return result
  }

  async _firebasePhotoToImage(photo) {
    const elem = new Image()
    elem.src = photo
    for (let index = 0; index < 10; index++) {
      await this.timer(500)
      if(elem.width) {
        break
      }
    }
    return elem
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









  closeModal(){
    this.dialogRef.close();

  }




}
