import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Chart } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Subscription, combineLatest, concatAll, filter, map, of, switchMap, take } from 'rxjs';
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
interface MonthlyDuration {
  label: string;
  value: number;
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

  ) {

    const today = new Date();


    this.maxDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1, // Los meses en JavaScript son de 0 a 11
      day: today.getDate()
    };


  }

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
  classes

  ngOnInit() { // estoy aqui
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

    this.reportform = new FormGroup({
      fechaInicio: new FormControl(null),
      fechafin: new FormControl(null),
    })
  }


  
  downloadReport() {
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


    console.log('fechas reporte',fechaInicio,fechaFin)


    this.userServiceSubscription = this.userService.getUsersReport$(null,null,null,null,fechaInicio,fechaFin).pipe(
      filter(user=>user !=null),take(1),
      switchMap(users => {
        const userCourseObservables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid);
          // Obtener cursos activos por usuario
          const coursesObservable = this.courseService.getActiveCoursesByStudentDateFiltered$(userRef,fechaInicio,fechaFin);
          // Obtener clases asociadas al usuario, independientemente de los cursos
          const classesObservable = this.courseService.getClassesByStudentDatefilterd$(userRef,fechaInicio,fechaFin);

          const allCoursesObservable = this.courseService.getActiveCoursesByStudent(userRef)

          const certificatesObservable = this.courseService.getCertificatestDatefilterd$(userRef,fechaInicio,fechaFin)
      
          return combineLatest([coursesObservable, classesObservable,certificatesObservable,allCoursesObservable]).pipe(
            map(([courses, classes,certificados,allCourses]) => {
              // Aquí tienes un objeto que incluye tanto los cursos como las clases asociadas a ese usuario
              // Cursos y clases están en sus propios objetos y no anidadas
              return { user, courses, classes,certificados,allCourses };
            })
          );
        });
        // Combina los observables de todos los usuarios con sus cursos y clases
        return combineLatest(userCourseObservables);
        })).subscribe(response => {
        console.log('datos reporte',response)
        const users: User[] = response.map(({user, courses,classes,certificados,allCourses}) => {
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
            displayName: user.displayName,
            department: department?.name ? department.name : '',
            departmentId: department?.id ? department.id : '',
            hours: hours, // Calculation pending
            targetHours: targetHours,
            targetHoursAllCourses:targetHoursAllCourses,
            profile: profileName,
            profileId: profile?.id ? profile.id : '',
            ratingPoints: ratingPoints,
            rhythm: userPerformance, // Calculation pending
            uid: user.uid,
            photoUrl: user.photoUrl,
            courses:coursesUser,
            clases:classesUser,
            certificados:certificados,
            allCourses:allcoursesUser
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
      this.extraPages = 2

      for (let index = 0; index < this.departments.length; index++) {
        const department = this.departments[index];
        let users = this.users.filter(x=>x.departmentId == department.id)
        if(users.length>0){
          let usersWithProfiles = users.filter(x=>x.profileId)
          if(usersWithProfiles.length>0){
            await this.addGeneralPage(usersWithProfiles,'department',department.name)
            this.extraPages ++
            // Agregar pagina por perfil
            let profiles = usersWithProfiles.map(user => {
              return user.profileId
            });
            profiles = [...new Set(profiles)];
            for (let index = 0; index < profiles.length; index++) {
              const profileId = profiles[index];
              const profile = this.profiles.find(x=> x.id == profileId)
              const usersProfile = usersWithProfiles.filter(x=>x.profileId == profileId)
              if(usersProfile.length>0){
                await this.addGeneralPage(usersProfile,'profile',profile.name,department.name)
                this.extraPages ++
                //Agregar paginas de los estudiantes del perfil

                for (let index = 0; index < usersProfile.length; index++) {
                  const student = usersProfile[index];
                  console.log('student',student)
                  await this.studentPage(student)
  
                }
                
              }
            }
          }
        }
      }

      let usersSinDepartamneto = this.users.filter(x=>x.departmentId =='')

      if(usersSinDepartamneto.length>0){

        let usersWithProfiles = usersSinDepartamneto.filter(x=>x.profileId)
        if(usersWithProfiles.length>0){
          await this.addGeneralPage(usersWithProfiles,'department','Sin Departamento')
          this.extraPages ++
          // Agregar pagina por perfil
          let profiles = usersWithProfiles.map(user => {
            return user.profileId
          });
          profiles = [...new Set(profiles)];
          for (let index = 0; index < profiles.length; index++) {
            const profileId = profiles[index];
            const profile = this.profiles.find(x=> x.id == profileId)
            const usersProfile = usersWithProfiles.filter(x=>x.profileId == profileId)
            if(usersProfile.length>0){
              await this.addGeneralPage(usersProfile,'profile',profile.name,'Sin Departamento')
              this.extraPages ++
              //Agregar paginas de los estudiantes del perfil
              for (let index = 0; index < usersProfile.length; index++) {
                const student = usersProfile[index];
                console.log('student',student)
                await this.studentPage(student)

              }



            }
          }

        }

      }

      
      // for (let index = 0; index < this.pages.length; index++) {
      //   const student = this.pages[index];
      //   await this.studentPage(student, index)
      // }
      this.pdf.save(`Reporte Histórico de ${this.enterprise.name}.pdf`)
    }catch(err) {
      console.log(err)
    }

  }


  obtenerUltimoDiaDelMes(fecha: number) {
    fecha = fecha * 1000;
    let fechaOriginal = new Date(fecha);
    const anio = fechaOriginal.getFullYear();
    const mes = fechaOriginal.getMonth();
    const ultimoDiaDelMes = new Date(anio, mes + 1, 0);
  
    // Establecer la hora a 23:59:59
    ultimoDiaDelMes.setHours(23, 59, 59);
  
    return ultimoDiaDelMes;
  }



  getRetardedCourses(courses){

    let respuesta = []
    let today = new Date()
    courses.forEach(curso => {

      // if(curso.completed){
      //   console.log('curso.progress.dateEnd.seconds',curso)
      //   if(new Date(curso.progress.dateEnd.seconds*1000)>this.obtenerUltimoDiaDelMes(curso.progress.dateEndPlan.seconds)){
      //     respuesta.push(curso)
      //   }
      // }
      //else{
        if(!curso.completed && today>this.obtenerUltimoDiaDelMes(curso.progress.dateEndPlan.seconds)){
          console.log()
          respuesta.push(curso)
        }
      //}
      
    });

    return respuesta


  }

  titleCase(str: string): string {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word => {
      return (word.charAt(0).toUpperCase() + word.slice(1));
    }).join(' ');
  }


  async studentProgressbar(studentStats, currentLine) {
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
          <div style="width: ${studentStats.completedCourses * 100 / studentStats.enrolledCourses}%; height: 20px; min-height: 20px; background-color: #00BF9C">
          </div>
          <div style="width: ${studentStats.delayedCourses * 100 / studentStats.enrolledCourses}%; height: 20px; min-height: 20px; background-color: #ED4758">
          </div>
          <div style="width: ${studentStats.inProgressCourses * 100 /studentStats.enrolledCourses}%; height: 20px; min-height: 20px; background-color: #008CE3">
          </div>
      </div>
    </div>`

    console.log('pdf',studentStats,pdf)

    await this.pdf.html(pdf, {
      callback: (doc) => {
        return doc
      },
      y: this.pageHeigth*(this.extraPages) + currentLine, //"2" because of cover and general pages. extraPages because of extra tables
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


  defaultUserImage = "assets/images/default/default-user-image.jpg"


  async studentPage(student) {
    this.pdf.addPage("a4", "p")
    let currentLine = 0
    currentLine = this.addLogoAndDate()
    currentLine += 10
    const studentPhoto = student.photoUrl?student.photoUrl: this.defaultUserImage
    console.log(studentPhoto)
    const image = await this.firebasePhotoToImage(studentPhoto)
    console.log(image);
    const photoWidth = 21
    const photoHeight = 21
    const photoXStartingPosition = this.horizontalMargin
    const photoYStartingPosition = currentLine
    this.pdf.addImage(image, 'PNG', photoXStartingPosition , photoYStartingPosition, photoWidth, photoHeight)
    currentLine = this.addFormatedText({
      text: `${this.titleCase(student.displayName)}`,
      x: photoWidth + 8,
      y: currentLine - 5,
      color: 'black',
      bold: true,
      textAlign: "left",
      size: 18
    })
    // currentLine = this.addFormatedText({
    //   text: `${this.getUser(student).job}`,
    //   x: photoWidth + 8,
    //   y: currentLine,
    //   color: 'black',
    //   textAlign: "left",
    //   size: 16
    // })
    currentLine = this.addFormatedText({
      text: this.titleCase(this.enterprise.name),
      x: photoWidth + 8,
      y: currentLine,
      color: 'black',
      textAlign: "left",
      size: 16
    })
    currentLine += this.pdf.getLineHeight()/2 + 5
    this.pdf.line(this.horizontalMargin, currentLine, this.formattedPageWidth, currentLine)
    // Student info
    const studyPlanInsidePeriod = student.courses


    let clases = this.getAllClasses([student])

    let promedioTiempo = this.calcularPromedioTiempoEstudioConClases(clases,[student])

    let coursesRetarded = this.getRetardedCourses(student.allCourses)


    console.log('revisar',student,coursesRetarded)


    //PROGRESS BAR

    let studentData = {
      completedCourses:student.allCourses.filter(x=>x.completed).length,
      delayedCourses:coursesRetarded.length,
      inProgressCourses:student.allCourses.filter(x=>!x.completed && x.progress.progress>0 ).length,
      enrolledCourses:student.allCourses.length,
      progress:this.getPlanProgress([student])
    }

    currentLine = await this.studentProgressbar(studentData, currentLine)

    this.extraPages++


    currentLine += 5
    //DATA DISTRIBUTED IN RECTANGLES 
    const strings = [
      "Cursos completados", 
      "Cursos con retraso", 
      "Cursos en progreso", 
      "Cursos inscritos", 
      "Horas de formación totales", 
      `Horas promedio por ${promedioTiempo.tiempo}`,
      "Certificados emitidos", 
      "Calificación promedio"
    ]   
    const values = [
      student.allCourses.filter(x=>x.completed).length,
      coursesRetarded.length,
      student.allCourses.filter(x=>!x.completed && x.progress.progress>0).length,
      student.allCourses.length,
      this.getTotalHours([student]),
      promedioTiempo?.valor? promedioTiempo?.valor : 0,
      student.certificados.length,
      this.getCalificacionPromedio([student])

    ]

    currentLine = this.studentCoursesData(strings, values, currentLine) 
    currentLine += 5
    // CHARTS
    const graphicHeight = 80
    //currentLine = await this.getChart(currentLine, logsInsidePeriod, graphicHeight)
    currentLine += 5
    // STUDYPLAN TABLE
    if (studyPlanInsidePeriod.length > 0) {
      //this.studentStudyPlanTable(studyPlanInsidePeriod, currentLine)
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

  studentStudyPlanTable(studyPlan, currentLine) {
    let hTable = currentLine
    const head = [["Nombre", "Duración (horas)", "Progreso", "Fecha fin asignada", "Fecha de completación", "Estatus", "Calificación"]]
    let tableData = []
    // for (let index = 0; index < studyPlan.length; index++) {
    //   const course = studyPlan[index];
    //   const courseInfo = [
    //     course.cursoTitulo, 
    //     (course.duracion/60).toFixed(2), 
    //     `${course.progreso} %`, 
    //     this.timestampToDateFormat(course.fechaFin), 
    //     this.timestampToDateFormat(course.fechaCompletacion), 
    //     this.getStatus(course), course.puntaje
    //   ]
    //   tableData.push(courseInfo)
    // }
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
      text: this.titleCase(this.enterprise.name),
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

  async addGeneralPage(users = this.users,type='general',name = null,parentName = null) {
    this.pdf.addPage("a4", "p")
    let currentLine = 0
    currentLine = this.addLogoAndDate()

    let addLinesTitle = 7

    let generalPageTitle = "Reporte de capacitación "

    if(type=='general'){
      generalPageTitle = "Reporte de capacitación "
    }
    else if (type == 'department'){
      generalPageTitle= ''
      if(name != 'Sin Departamento'){
        generalPageTitle = "Dpto: "
      }
      generalPageTitle += name
    }
    else if(type == 'profile'){
      generalPageTitle = "Perfil: "
      generalPageTitle += name
      addLinesTitle = 0
      currentLine = this.addFormatedText({
        text: `Dpto: ${parentName}`,
        x: 0,
        y: currentLine+7,
        color: 'black',
        bold: true,
        textAlign: "left",
        size: 16
      })
    }
    // Si es historico
    //generalPageTitle += "histórico"
    currentLine = this.addFormatedText({
      text: generalPageTitle,
      x: 0,
      y: currentLine + addLinesTitle,
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

    let fechaInicio
    let fechaFin

    if(this.startDate){
      fechaInicio = new Date(this.startDate.year,this.startDate.month-1,this.startDate.day)
    }
    if(this.endDate){
      fechaFin = new Date(this.endDate.year,this.endDate.month-1,this.endDate.day)
    }
    

    let promedioTiempo = this.calcularPromedioTiempoEstudioConClases(this.getAllClasses(users),users)
    let certificados  = this.getAllCertificates(users)
    let courses = this.getAllCoursesUsers(users)

    const strings = [
      "Estudiantes activos actualmente", 
      "Horas acumuladas del grupo en el período", 
      "Horas promedio por estudiante en el período", 
      `Horas promedio por ${promedioTiempo.tiempo}`,
      "Certificados emitidos en el período", 
      "Cursos inscritos en el período", 
      "Calificación promedio en el período", 
      "Progreso del plan general actualmente"
    ]
    const values = [
      users.length,    // No depende el periodo
      this.getTotalHours(users), 
      this.gethorasPromedioPorEstudiante(users), 
      promedioTiempo?.valor? promedioTiempo?.valor : 0, 
      certificados.length, 
      courses.length, 
      this.getCalificacionPromedio(users), 
      `${this.getPlanProgress(users)} %` // No depende el periodo
    ]

    console.log('values',values)

    
    currentLine = this.generalCoursesData(strings, values, currentLine) 
    // CHARTS
    const graphicHeight = 90
    const constCharData = this.getCharData(users)
    currentLine = await this.getChart(currentLine, constCharData, graphicHeight)


    //"no plan" | "high" | "medium" | "low" | "no iniciado"

    this.ritmoMedio =users.filter(x=>x.rhythm == 'medium')
    this.ritmoBajo =users.filter(x=>x.rhythm == 'low')
    this.ritmoOptimo =users.filter(x=>x.rhythm == 'high')
    this.sinPlan =users.filter(x=>x.rhythm == 'no plan')
    this.noIniciado =users.filter(x=>x.rhythm == 'no iniciado')

    // PROGRESS BAR

    if(type == 'general'){
      currentLine = await this.generalProgressbar(currentLine)
    }
    else {
      currentLine = await this.generalProgressbarDepartment(users,currentLine)
    }
  }


  getPlanProgress(usersData){


    console.log('getPlanProgress',usersData)

    let totalTimeExpected = 0;
    let totalTimeFinished = 0;

    usersData.forEach(usuario => {
      totalTimeExpected+=usuario?.targetHoursAllCourses ? usuario.targetHoursAllCourses: 0
      totalTimeFinished+=usuario?.hours ? usuario.hours: 0
    });

    if(totalTimeExpected == 0){
      return 0
    }

    let progresoPlan = (totalTimeFinished*100)/totalTimeExpected
    progresoPlan =  Math.round(progresoPlan * 10) / 10



    return progresoPlan


  }

  
  calcularPromedioTiempoEstudio(startDate: Date, endDate: Date, totalHorasEstudio: number): any {
    const unDia = 24 * 60 * 60 * 1000; // Milisegundos en un día
    const diferenciaEnDias = Math.round(Math.abs((endDate.getTime() - startDate.getTime()) / unDia));

    console.log('totalHorasEstudio',totalHorasEstudio)
    
    // Calcula el promedio según el periodo
    let promedio = 0;
    let unidadTiempo = '';
    
    if (diferenciaEnDias < 7) { // Menos de una semana
      promedio = totalHorasEstudio / diferenciaEnDias;
      unidadTiempo = 'día';
    } else if (diferenciaEnDias <= 30) { // Menos de un mes
      const semanas = diferenciaEnDias / 7;
      promedio = totalHorasEstudio / semanas;
      unidadTiempo = 'semana';
    } else { // Más de un mes
      const meses = diferenciaEnDias / 30;
      promedio = totalHorasEstudio / meses;
      unidadTiempo = 'mes';
    }
    
    // Redondea el promedio a 1 decimal
    promedio = Math.round(promedio * 10) / 10;

    let respueta = {
      tiempo:unidadTiempo,
      valor:promedio.toFixed(1)

    }
    
    return respueta;
  }

  calcularPromedioTiempoEstudioConClases(classes,users): any {

    
  if (classes.length === 0) {
    return "No hay clases para calcular el promedio.";
  }

  // Encuentra la fecha más antigua y la más reciente entre todas las clases
  const fechas = classes.map(clase => new Date(clase.dateEnd.seconds * 1000));

  const fechaInicio = new Date(Math.min(...fechas));
  const fechaFin = new Date(Math.max(...fechas));
  
  // Calcula el total de horas de estudio
  const totalHorasEstudio = this.getTotalHours(users)
  // Sigue el mismo procedimiento para calcular el promedio basado en el periodo
  const unDia = 24 * 60 * 60 * 1000; // Milisegundos en un día
  const diferenciaEnDias = Math.round(Math.abs((fechaFin.getTime() - fechaInicio.getTime()) / unDia));
  
  let promedio = 0;
  let unidadTiempo = '';
  
  if (diferenciaEnDias < 7) {
    promedio = totalHorasEstudio / diferenciaEnDias;
    unidadTiempo = 'día';
  } else if (diferenciaEnDias <= 30) {
    const semanas = diferenciaEnDias / 7;
    promedio = totalHorasEstudio / semanas;
    unidadTiempo = 'semana';
  } else {
    const meses = diferenciaEnDias / 30;
    promedio = totalHorasEstudio / meses;
    unidadTiempo = 'mes';
  }

  // Redondea el promedio a 1 decimal
  promedio = Math.round(promedio * 10) / 10;

  let respuesta = {
    tiempo:unidadTiempo,
    valor:promedio.toFixed(1)
  }

  return respuesta;
}



  getTotalHours(usersData){

    let amountHours = 0
    usersData.forEach(user => {
      user.clases.forEach(clase => {
        amountHours+=clase.duracion
      });
    });
    return Math.round((amountHours / 60) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal
  }

  gethorasPromedioPorEstudiante(usersData) {
    const promedio = usersData.length > 0 ? this.getTotalHours(usersData) / usersData.length : 0;
    // Redondea el promedio a 1 decimal
    return Math.round(promedio * 10) / 10;
  }



  
  getAllClasses(usersData){
    let allClasses = []
    usersData.forEach(user => {
      allClasses = allClasses.concat(user.clases);
    });
    return allClasses
  }

  getAllCertificates(usersData){
    let allCertificates = []
    usersData.forEach(user => {
      allCertificates = allCertificates.concat(user.certificados);
    });
    return allCertificates
  }

  getCalificacionPromedio(usersData){
    let allCertificates = []
    usersData.forEach(user => {
      allCertificates = allCertificates.concat(user.certificados);
    });

    let calificacion = 0

    if(allCertificates.length == 0 ){
      return 0
    }

    allCertificates.forEach(certificado => {
      calificacion+=certificado.puntaje
    });

    let promedio = calificacion/allCertificates.length

    promedio = Math.round(promedio * 10) / 10;

    return promedio
  }
  
  getAllCoursesUsers(usersData){
    let allCourses = []
    usersData.forEach(user => {
      allCourses = allCourses.concat(user.courses);
    });
    return allCourses
  }

  getCharData(usersData){

    let allClasses = this.getAllClasses(usersData)

    let arrayMeses = this.aggregateMonthlyDurations(allClasses)

    return arrayMeses
  }


  aggregateMonthlyDurations(classes: any[]): MonthlyDuration[] {
    const durationPerMonth: { [key: string]: number } = {};
  
    classes.forEach(cl => {
      const date = new Date(cl.dateEnd.seconds * 1000); // Suponiendo cl.dateEnd contiene segundos
      const month = date.toLocaleString('es', { month: 'short' }).slice(0, 3); // Obtiene las primeras 3 letras del mes
      const year = date.getFullYear().toString().slice(-2); // Obtiene los últimos 2 dígitos del año
  
      const label = `${month.charAt(0).toUpperCase() + month.slice(1)}-${year}`; // Formato Sep-23
  
      if (!durationPerMonth[label]) {
        durationPerMonth[label] = 0;
      }
      durationPerMonth[label] += cl.duracion; // Suma la duración en minutos
    });
  
    // Convierte el objeto a un arreglo de MonthlyDuration y ajusta los valores a horas, redondeando a 1 decimal usando Math.round
    return Object.entries(durationPerMonth).map(([label, value]): MonthlyDuration => ({
      label,
      value: Math.round((value / 60) * 10) / 10 // Convierte minutos a horas y redondea a 1 decimal
    }));
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
    const chartData = logsInsidePeriod
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
  noIniciado = []


  maxDate

  async generalProgressbarDepartment(users,currentLine) {


    let ritmoMedio =users.filter(x=>x.rhythm == 'medium')
    let ritmoBajo =users.filter(x=>x.rhythm == 'low')
    let ritmoOptimo =users.filter(x=>x.rhythm == 'high')
    let sinPlan =users.filter(x=>x.rhythm == 'no plan')
    let noIniciado =users.filter(x=>x.rhythm == 'no iniciado')

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
            <div style="width: ${ritmoOptimo.length*100 / users.length}%; height: 20px; min-height: 20px; background-color: #6d05b0">
            </div>
            <div style="width: ${ritmoMedio.length*100 / users.length}%; height: 20px; min-height: 20px; background-color: #00BF9C">
            </div>
            <div style="width: ${ritmoBajo.length*100 / users.length}%; height: 20px; min-height: 20px; background-color: #ED4758">
            </div>
        </div>
    </div>
  `
    await this.pdf.html(pdf, {
      callback: (doc) => {
        return doc
      },
      //y: this.pageHeigth + currentLine,
      y: this.pageHeigth*(this.extraPages) + currentLine, // extraPages because of extra tables
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
            <div style="width: ${this.ritmoOptimo.length*100 / this.users.length}%; height: 20px; min-height: 20px; background-color: #6d05b0">
            </div>
            <div style="width: ${this.ritmoMedio.length*100 / this.users.length}%; height: 20px; min-height: 20px; background-color: #00BF9C">
            </div>
            <div style="width: ${this.ritmoBajo.length*100 / this.users.length}%; height: 20px; min-height: 20px; background-color: #ED4758">
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
