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

interface DataToShow {
  liveCourseByStudentId: string;
  userEmail: string;
  userName: string;
  userPhone: string;
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

    // test
    private afs: AngularFirestore
  ) {}

  @Input() liveCourseTemplateId: string;
  @Input() liveCourseId: string;
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
      .getLiveCoursesByStudentByLivecourseSon$(this.liveCourseRef)
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

  downloadExcel() {
    const columnTitles = ["Correo del estudiante", "Nombre del estudiante", "Diagnostico", "Fin", "Certificado", "Asistencia"];

    const dataToExport = this.dataSource.data.map((row) => {
      const obj = {};
      obj[columnTitles[0]] = row.userEmail;
      obj[columnTitles[1]] = row.userName;
      obj[columnTitles[2]] = row.diagnosticTestScore ? row.diagnosticTestScore : "No ha presentado";
      obj[columnTitles[3]] = row.finalTestScore ? row.finalTestScore : "No ha presentado";
      obj[columnTitles[4]] = row.certificateId ? `${environment.predycUrl}/certificado/${row.certificateId}` : "No disponible";
      obj[columnTitles[5]] = row.isAttending ? "Sí" : "No";
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Set the width for each column
    const columnWidths = columnTitles.map((title) => ({ wch: title.length + 2 }));
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estudiantes");

    XLSX.writeFile(workbook, "Estudiantes.xlsx");
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
    if (user) await this.assignLiveCourse(user.uid, user.email);
    else this.openCreateUserModal();
  }

  async assignLiveCourse(userId: string, userEmail: string) {
    const userRef = this.userService.getUserRefById(userId);
    const liveCourseByStudent = new LiveCourseByStudent("", true, null, false, userRef, this.liveCourseRef, false, false, null, false, null, true, true);
    try {
      await this.liveCourseService.createLiveCourseByStudent(liveCourseByStudent);
      console.log("***liveCourseByStudent created***");
      await this.sendEmail(userEmail)
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
      await this.assignLiveCourse(userData.uid, userData.email);
    });

    return modalRef;
  }

  async sendEmail(userEmail: string) {
    console.log("userEmail", userEmail)
    let sender = "capacitacion@predyc.com"
    let recipients = [userEmail]
    // let recipients = ["diegonegrette42@gmail.com"]
    let subject = `Has sido inscrito en un curso en vivo` // get liveCourse data from parent component if needed 
    let text = `Te han asignado un curso en vivo. 
    \nAccede a la plataforma de predyc para ver toda la información.` 

    try {
      await firstValueFrom(this.fireFunctions.httpsCallable('sendMail')({
        sender: sender,
        recipients: recipients,
        subject: subject,
        text: text,
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
