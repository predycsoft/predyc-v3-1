import { Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { LiveCourseByStudent } from "projects/shared/models/live-course-by-student.model";
import { Observable, Subscription, combineLatest, firstValueFrom, map, switchMap } from "rxjs";
import { AngularFirestore, DocumentReference } from "@angular/fire/compat/firestore";
import { User, UserJson } from "projects/shared/models/user.model";
import { LiveCourse } from "projects/shared/models/live-course.model";
import { LiveCourseService } from "projects/predyc-business/src/shared/services/live-course.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import Swal from "sweetalert2";
import * as XLSX from "xlsx-js-style";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { DialogAssignLiveCoursesComponent } from "./dialog-assign-live-courses/dialog-assign-live-courses.component";
import { CreateUserComponent } from "projects/predyc-business/src/app/business-pages/management/my-team/student/create-user/create-user.component";
import { environment } from "projects/predyc-business/src/environments/environment";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { capitalizeFirstLetter } from "projects/shared";
import { titleCase } from "shared";
import { DatePipe } from "@angular/common";

interface DataToShow {
  liveCourseByStudentId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  userRef: DocumentReference;
  diagnosticTestScore: number;
  finalTestScore: number;
  certificateId: string;
  isAttending: boolean;
  isActive: boolean;
  companyName: string;
}

@Component({
  selector: "app-live-course-student-list",
  templateUrl: "./live-course-student-list.component.html",
  styleUrls: ["./live-course-student-list.component.css"],
})
export class LiveCourseStudentListComponent {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    public liveCourseService: LiveCourseService,
    public userService: UserService,
    private modalService: NgbModal,
    private fireFunctions: AngularFireFunctions,
    private datePipe: DatePipe,
    // test
    private afs: AngularFirestore
  ) {}

  @Input() liveCourseTemplateId: string;
  @Input() liveCourseId: string;
  @Input() courseDetails: any;

  @Output() userEmailsChanged = new EventEmitter<string[]>();

  displayedColumns: string[] = ["userName", "userEmail", "enterprise", "diagnosticTest", "finalTest", "certificate", "attendance", "status"];

  dataSource = new MatTableDataSource<DataToShow>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  queryParamsSubscription: Subscription;
  pageSize: number = 7;
  totalLength: number;

  showSaveButton: boolean = false;

  liveCourseServiceSubscription: Subscription;

  userEmails: string[] = [];

  liveCourseRef: DocumentReference<LiveCourse>;

  environment = environment;

  ngOnInit() {
    this.liveCourseRef = this.liveCourseService.getLiveCourseRefById(this.liveCourseId);
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      const page = Number(params["page"]) || 1;
      this.performSearch(page);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(page: number) {
    this.liveCourseServiceSubscription = this.liveCourseService
      .getLiveCoursesByStudentByLivecourse$(this.liveCourseRef)
      .pipe(
        switchMap((liveCoursesByStudent) => {
          const userObservables: Observable<DataToShow>[] = liveCoursesByStudent.map((liveCourseByStudent) => {
            return this.userService.getUser$(liveCourseByStudent.userRef.id).pipe(
              switchMap((userData) => {
                return this.liveCourseService.getLiveCourseUserCertificate$(this.liveCourseId, userData.uid).pipe(
                  map((certificateData) => {
                    const certificate = certificateData.length > 0 ? certificateData[0] : null;
                    return {
                      liveCourseByStudentId: liveCourseByStudent.id,
                      userEmail: userData.email,
                      userName: userData.displayName,
                      userPhone: userData.phoneNumber,
                      userRef: liveCourseByStudent.userRef,
                      companyName: liveCourseByStudent.companyName,
                      diagnosticTestScore: liveCourseByStudent.diagnosticTestScore,
                      finalTestScore: liveCourseByStudent.finalTestScore,
                      certificateId: certificate ? certificate.id : null,
                      isAttending: liveCourseByStudent.isAttending,
                      isActive: liveCourseByStudent.isActive,
                    };
                  })
                );
              })
            );
          });

          return combineLatest(userObservables);
        })
      )
      .subscribe((dataTosShow) => {
        //   console.log("dataTosShow", dataTosShow);
        this.paginator.pageIndex = page - 1;
        this.dataSource.data = dataTosShow;
        this.totalLength = dataTosShow.length;
        // Emit the user emails
        this.userEmails = dataTosShow.map((data) => data.userEmail);
        this.userEmailsChanged.emit(this.userEmails);
      });
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: "merge",
    });
  }

  onCompanyNameInput(event: Event, data: DataToShow) {
    const inputElement = event.target as HTMLInputElement;
    data.companyName = inputElement.value;
  }

  async saveCompanyName(event: Event, data: DataToShow): Promise<void> {
    try {
      await this.liveCourseService.updateCompanyNameLiveCourseByStudent(data.liveCourseByStudentId, data.companyName);
      console.log("Company name saved")
    } catch (error) {
      console.error("ERROR: ", error)
    }
  }

  async onAttendanceChange(event: Event, data: DataToShow) {
    const target = event.target as HTMLInputElement;
    const newValue = target.checked;
    await this.liveCourseService.updateIsAttendingLiveCourseByStudent(data.liveCourseByStudentId, newValue);
    console.log("Attendance updated:", data);

  }

  changeStatus(liveCourseByStudentId: string, isActive: boolean) {
    Swal.fire({
      title: isActive ? "Agregaremos al usuario al curso en vivo" : "Eliminaremos al usuario del curso en vivo",
      text: "¿Deseas continuar?",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Guardar",
      confirmButtonColor: "var(--blue-5)",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await this.liveCourseService.updateIsActiveLiveCourseByStudent(liveCourseByStudentId, isActive);
      } else {
      }
    });
  }

  onSelect(data) {}

  async downloadExcel() {
    const columnTitles = ["Correo del estudiante", "Nombre del estudiante", "Ex. Diagnóstico", "Ex. Final", "Certificado", "Asistencia"];

    // PRINCIPAL SHEET
    const dataToExport = this.dataSource.data.map((row) => {
        const obj = {};
        obj[columnTitles[0]] = row.userEmail;
        obj[columnTitles[1]] = titleCase(row.userName);
        obj[columnTitles[2]] = row.diagnosticTestScore ? row.diagnosticTestScore : "No ha presentado";
        obj[columnTitles[3]] = row.finalTestScore ? row.finalTestScore : "No ha presentado";
        obj[columnTitles[4]] = row.certificateId ? `${environment.predycUrl}/certificado/${row.certificateId}` : "No disponible";
        obj[columnTitles[5]] = row.isAttending ? "Sí" : "No";
        return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Set the width for each column
    const columnWidths = columnTitles.map((title) => ({ wch: title.length + 4 }));
    columnWidths[3] = { wch: 16 }; // for "fin" column
    worksheet["!cols"] = columnWidths;

    // Set style to title row
    Object.keys(worksheet).forEach(cell => {
      if (cell[0] !== '!') {
        worksheet[cell].s = {
          alignment: { horizontal: "center",}
        }
        const cellAddress = XLSX.utils.decode_cell(cell);
        if (cellAddress.r === 0) {
          worksheet[cell].s = {
            font: { 
              // italic: true,
              sz: 13,
              bold: true 
            },
            alignment: { horizontal: "center",}
          };
        }
      }
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");

    // STUDENTS SHEETS
    const allUsersTests = await this.getUsersTestsData()
    const userColumnTitles = ["Tipo de pregunta", "Texto de la pregunta", "Opc. Selec.", "Opc. Correc.", "Resultado"];
    let sheetIndex = 1
    this.dataSource.data.forEach((row) => {
      const userTests = allUsersTests.filter(x => x.userRef.id === row.userRef.id)
      console.log("userTests", userTests)

      const diagnosticTestsRows = []
      const finalTestsRows = []
      if (userTests.length > 0) {
        const userDiagnosticTest = userTests.find(x => x.type === "test")
        const userFinalTest = userTests.find(x => x.type === "final-test")
        if (userDiagnosticTest) {
          const diagnosticTestQuestions = userDiagnosticTest.questions
          const diagnosticTestAnswers = userDiagnosticTest.answers
          diagnosticTestsRows.push(...this.processQuestions(diagnosticTestQuestions, diagnosticTestAnswers));
        }
        if (userFinalTest) {
          const finalTestQuestions = userFinalTest.questions
          const finalTestAnswers = userFinalTest.answers
          finalTestsRows.push(...this.processQuestions(finalTestQuestions, finalTestAnswers));
        }          
        
        console.log("userDiagnosticTest", userDiagnosticTest)
        console.log("userFinalTest", userFinalTest)
      }

      const studentData = [
        ["Examen Diagnostico", "", "", "", ""],
        userColumnTitles,
        ...diagnosticTestsRows,
        [],
        [],
        ["Examen Final", "", "", "", ""],
        userColumnTitles,
        ...finalTestsRows,
      ];

      const studentWorksheet = XLSX.utils.aoa_to_sheet(studentData);

      // Set the width for each column
      const columnWidths = userColumnTitles.map((title) => ({ wch: title.length + 8 }));
      studentWorksheet["!cols"] = columnWidths;

      // Set styles to cells 
      Object.keys(studentWorksheet).forEach(cell => {
        if (cell[0] !== '!') {
          // Set style to "Examen Diagnostico" and "Examen Final" cells
          if (cell === "A1" || cell === "A8") {
            studentWorksheet[cell].s = {
              font: { 
                sz: 15,
                bold: true 
              }
            };
          } 
          else {
            studentWorksheet[cell].s = {
              alignment: { 
                vertical: "center",
                wrapText: true, // To be able to see line breaks
              }
            };
            // Set style to titles rows
            const cellAddress = XLSX.utils.decode_cell(cell);
            if (cellAddress.r === 1 || cellAddress.r === 8) {
              studentWorksheet[cell].s = {
                // ...studentWorksheet[cell].s,
                font: { 
                  italic: true,
                  sz: 13,
                  bold: true 
                },
                alignment: {
                  horizontal: "center",
                }
              };
            }
          }
        }
      });

      // Ensure the sheet name is valid by replacing any invalid characters
      const sheetName = row.userName.replace(/[\[\]:*?/\\]/g, '_').substring(0, 31);
      XLSX.utils.book_append_sheet(workbook, studentWorksheet, `${sheetIndex}-${sheetName}`);
      sheetIndex++;
    });

    XLSX.writeFile(workbook, "Estudiantes.xlsx");
  }

  processQuestions(questions, answers) {
    console.log("answers", answers)
    return questions.map(question => {
      const answer = answers.find(x => x.id === question.id)
      console.log("answer", answer)
      let questionTextValue: string = `Pregunta: "${answer.text}"\n`;
      let questionOpSelected = "";
      let questionOpCorrect = "";
      let optionIndex = 1
      question.options.forEach(option => {
        questionTextValue = `${questionTextValue}\n${optionIndex}) ${option.text}`;
        if (option.isCorrect) questionOpCorrect = `${questionOpCorrect}\n${optionIndex}) ${option.text}`;
        const optionAnswer = answer.answerItems.find(x => x.text === option.text) // the selected option is saved in answers field
        if (optionAnswer && optionAnswer.answer) questionOpSelected = `${questionOpSelected}\n${optionIndex}) ${option.text}`;
        optionIndex++
      });

      return [
          question.newTrueFalseFormat ? "Verdadero o falso" : question.type.displayName,
          questionTextValue.trim(),
          questionOpSelected.trim(),
          questionOpCorrect.trim(),
          questionOpCorrect.trim() === questionOpSelected.trim() ? "Correcta" : "Incorrecta"
      ];
    });
  };

  async getUsersTestsData() {
    const usersData = this.dataSource.data
    const usersRefsArray = usersData.map( x => x.userRef)
    const allUsersTests = await this.liveCourseService.getUsersTestsData(this.liveCourseRef, usersRefsArray)
    console.log("allUsersTests", allUsersTests)
    return allUsersTests
  }

  openModal() {
    const modalRef = this.modalService.open(DialogAssignLiveCoursesComponent, {
      animation: true,
      centered: true,
      size: "",
      backdrop: "static",
      keyboard: false,
    });

    modalRef.componentInstance.emailsAssigned = this.userEmails;

    modalRef.componentInstance.userSelected.subscribe((user: User) => {
      this.handleUserSelected(user);
    });
  }

  async handleUserSelected(user: User) {
    console.log("Selected user:", user);
    if (user) await this.assignLiveCourse(user.uid, user.email,user);
    else this.openCreateUserModal();
  }

  async assignLiveCourse(userId: string, userEmail: string,user:User) {
    const userRef = this.userService.getUserRefById(userId);
    const liveCourseByStudent = new LiveCourseByStudent("", true, null, false, userRef, this.liveCourseRef, false, false, null, false, null, true, true);
    try {
      await this.liveCourseService.createLiveCourseByStudent(liveCourseByStudent);
      console.log("***liveCourseByStudent created***");
      await this.sendEmail(userEmail,user)
    } catch (error) {
      console.log("XXXerror creating liveCourseByStudentXXX", error);
    }
  }

  async openCreateUserModal(): Promise<NgbModalRef> {
    const modalRef = this.modalService.open(CreateUserComponent, {
      animation: true,
      centered: true,
      size: "lg",
      backdrop: "static",
      keyboard: false,
    });

    modalRef.result.then(async (userData) => {
      // console.log("userData", userData)
      await this.assignLiveCourse(userData.uid, userData.email,userData);
    });

    return modalRef;
  }

  async sendEmail(userEmail: string,user) {

    const firma = `
    <p style="margin: 5px 0;">Saludos cordiales,</p>
    <p style="margin: 5px 0; color: #073763;">L.T. Daniela Rodríguez</p>
    <p style="margin: 5px 0;">Coordinadora en Capacitación</p>
    <p style="margin: 5px 0;">Tel: 442 169 2090</p>
    <img src="https://predictiva21.com/wp-content/uploads/2024/06/PbP21-logo-1.webp" alt="Predyc" style="width: 150px; height: auto;">`;    
    const styleMail = `
    <style>
      table {
        max-width: 100%;
        border-collapse: collapse;
      }
      th, td {
        border: 1px solid #dddddd;
        text-align: left;
        padding: 8px;
      }
      th {
        background-color: #f2f2f2;
      }
      .high {
        color: green;
      }
      .medium {
        color: orange;
      }
      .low {
        color: red;
      }
      .no-iniciado, .no-plan {
        color: gray;
      }
      .month-row {
        border: none;
        padding-top: 20px;
        font-weight: bold;
      }
      .month-name {
        padding-top: 20px;
        font-weight: bold;
        border: none;
        text-align: left;
      }
    </style>`;


    console.log("userEmail", userEmail,this.courseDetails,user)
    let sender = "capacitacion@predyc.com"
    let recipients = [userEmail]
    // let recipients = ["diegonegrette42@gmail.com"]
    let subject = `Has sido inscrito en un curso en vivo`
    let startDate = this.courseDetails.sessions[0].dateFormatted
    let formattedDate = this.datePipe.transform(startDate, 'd \'de\' MMMM', 'es');
    let htmlContent = `<p>Estimado <strong>${titleCase(user.name)}</strong></p> 
    <p>Mi nombre es Daniela Rodríguez, Coordinadora de Capacitación en <a href="https://predictiva21.com/">Predictiva21</a>,  me gustaría guiarlo en los pasos para que pueda acceder al aula virtual del curso, donde podrá ver las sesiones en vivo, exámenes, material descargable y certificado.</p>
    <p>El curso <strong>${this.courseDetails.title}</strong> se llevará a cabo en un total de ${Math.round(this.courseDetails.duration / 60)} horas, desde el <strong>${formattedDate}</strong> en ${this.courseDetails.sessions.length} sesiones de la siguiente manera:</p>
    <ul>` 

    this.courseDetails.sessions.forEach(session => {
      let sessionDate = this.datePipe.transform(session.dateFormatted, 'd \'de\' MMMM \'a las\' HH:mm \'hrs\'', 'es');
      htmlContent += `<li>${session.title} - ${sessionDate} hora CDMX (México)</li>`;
    });

    let gmail = userEmail.includes("@gmail.com");

    htmlContent += `</ul><br>
    <p><strong>Por favor sigue estos sencillos pasos: <strong></p>
    <p><strong>Paso 1: </strong>Ingresa desde tu computador a nuestra plataforma <a href="https://predyc-user.web.app/auth/login">Predyc</a> e inicia sesión con tu correo ${userEmail} ${gmail? '(clic en botón continuar con Google)': 'y las credenciales que te llegarón anteriormente'}</p>
    <p><strong>Paso 2: </strong>Ve a la seccion "Cursos en vivo" donde deberas ver en la lista este curso (${this.courseDetails.title})</p>
    <br>
    <p>¡Listo! El curso está disponible en la sección “Cursos en vivo”</p>
    <p>El link a las sesiones y el material del curso estarán disponibles 20 minutos antes del inicio.</p><br>
    
    <p><strong>Recomendaciones para las sesiones en vivo:</strong></p>

    <ul>
      <li>Conéctate 15 minutos antes para que puedas verificar tu configuración de audio. El inicio de las sesiones se hará a la hora programada.</li>
      <li>Una vez iniciada la clase colócate en mute, si deseas realizar una consulta activa tu micrófono y hazla, al culminar tu consulta vuelve a colocar el mute.</li>
      <li>sulta vuelve a colocar el mute.
      Si pierdes una sesión no te preocupes, todas nuestras clases son grabadas. El enlace de la grabación aparecerá al día siguiente y estará activo por un tiempo determinado.</li>
    </ul>
    <br>

    <p><strong>Nota: Si tienes restricciones por parte de tu organización para acceder a alguna página web desde tu computador, puedes acceder desde tu teléfono móvil o cualquier otro dispositivo electrónico.</strong></p>
    <br>
    <p>Recuerde que si tiene alguna duda en el proceso puede contactarnos por este medio.</p><br>`;

    const htmlContentFinal = ` <!DOCTYPE html><html><head>${styleMail}</head><body>${htmlContent}${firma}</body></html>`;

    try {
      await firstValueFrom(this.fireFunctions.httpsCallable('sendMailHTML')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        cc:["capacitacion@predyc.com"],
        htmlContent: htmlContentFinal,
      }));
      console.log("Email enviado")
    } catch (error) {
      console.error("Hubo un error al enviar el email", error)
    }
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
  }

}
