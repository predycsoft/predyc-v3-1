import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserComponent } from 'projects/predyc-business/src/app/business-pages/management/my-team/student/create-user/create-user.component';
import { Department } from 'projects/shared/models/department.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Profile } from 'projects/shared/models/profile.model';
import { User } from 'projects/shared/models/user.model';
import { DepartmentService } from 'projects/predyc-business/src/shared/services/department.service';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Subscription, combineLatest, forkJoin, map, switchMap, take } from 'rxjs';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import * as XLSX from 'xlsx-js-style';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { timestampToDateNumbers } from 'projects/shared/utils';
import Swal from 'sweetalert2';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { Subscription as SubscriptionClass } from "shared";
import { Router } from '@angular/router';



interface studentInList {
  displayName: string,
  departmentName: string,
  profileName: string,
  email: string,
  status: string,
}

@Component({
  selector: 'app-enterprise-students-list',
  templateUrl: './enterprise-students-list.component.html',
  styleUrls: ['./enterprise-students-list.component.css']
})
export class EnterpriseStudentsListComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>

  constructor(
    private userService: UserService,
    private profileService: ProfileService,
    private departmentService: DepartmentService,
    public dialogService: DialogService,
    private modalService: NgbModal,
    public icon: IconService,
    private fb: FormBuilder,
    private alertService: AlertsService,
    private router: Router,

  ){}


  displayedColumns: string[] = [
    "displayName",
    "role",
    "department",
    // "profile",
    "email",
    "status"
    // "delete",
  ];

  dataSource = new MatTableDataSource<studentInList>();

  userSubscription: Subscription
  combinedSubscription: Subscription

  profiles: Profile[]
  departments: Department[]

  addingStudent: boolean = false;
  newStudent: User




  ngOnInit() {
    this.combinedSubscription = combineLatest([
      this.profileService.getProfiles$(),
      this.departmentService.getDepartments$(),
      this.userService.getUsersByEnterpriseRef$(this.enterpriseRef),
    ]).pipe(
      switchMap(([profiles, departments, users]) => {
        // Mapear cada usuario a un observable que obtiene sus suscripciones
        const usersWithSubscriptionsObservables = users.map(user => {
          const userRef = this.userService.getUserRefById(user.uid);
          return this.userService.getSubscriptionByStudentDateFiltered$(userRef).pipe(
            take(1),
            map(subscriptions => ({
              user,
              subscriptions,
            }))
          );
        });
  
        // Esperar a que todos los observables de usuarios con sus suscripciones se completen
        return forkJoin(usersWithSubscriptionsObservables).pipe(
          map(usersWithSubscriptions => {
            return usersWithSubscriptions.map(({ user, subscriptions }) => {
              const userProfileName = user?.profile ? profiles?.find(profile => profile?.id === user?.profile?.id)?.name : "Sin asignar";
              const userDepartmentName = user?.departmentRef ? departments?.find(department => department?.id === user?.departmentRef?.id)?.name : "Sin asignar";
  
              // Aquí puedes acceder a las suscripciones del usuario y usarlas como necesites
              // Por ejemplo, calculando el estado de sus suscripciones, etc.

              const activeSubscriptions = subscriptions.filter(
                (x) => x.status === SubscriptionClass.STATUS_ACTIVE
              );

              console.log('activeSubscriptions',activeSubscriptions,subscriptions)

              const status =
                activeSubscriptions.length > 0
                  ? SubscriptionClass.STATUS_ACTIVE
                  : SubscriptionClass.STATUS_INACTIVE;
  
              return {
                displayName: user.displayName,
                departmentName: userDepartmentName,
                profileName: userProfileName,
                role: user.role,
                email: user.email,
                id:user.uid,
                status: SubscriptionClass.statusToDisplayValueDict[status],
                //subcription: subscriptions
                // Agrega aquí cualquier información adicional de suscripciones que necesites
              };
            });
          })
        );
      })
    ).subscribe((studentsInList) => {
      this.dataSource.data = studentsInList;
      console.log('studentsInList', studentsInList);
    });
  }

  openCreateUserModal(): NgbModalRef {
    let openModal = false
    let isNewUser = false
    openModal = true, isNewUser = true

    if (openModal) {
      const modalRef = this.modalService.open(CreateUserComponent, {
        animation: true,
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false 
      })
      modalRef.componentInstance.enterpriseRef = this.enterpriseRef;
      return modalRef
    }
    else return null
  }


  async addAdmin() {
    this.addingStudent = true
    this.newStudent = User.getEnterpriseAdminUser(this.enterpriseRef)
  }
  
  async saveAdmin() {
    // console.log("newStudent", this.newStudent)
    this.newStudent.displayName = this.newStudent.name
    this.addingStudent = false
    try {
      await this.userService.addUser(this.newStudent)
      this.dialogService.dialogExito();
    } catch (error) {
      this.dialogService.dialogAlerta("Hubo un error al guardar el nuevo administrador. Inténtalo de nuevo.");
    }

  }

  deleteStudent(user: User){

  }

  downloadTemplate() {
    // Construye la URL hacia el documento en la carpeta assets
    const url = 'assets/files/plantilla carga estudiantes.xlsx';
  
    // Crea un elemento <a> temporalmente
    const a = document.createElement('a');
    a.href = url;
    //a.download = 'NombreDelArchivoDescargado.docx'; // Puedes especificar el nombre del archivo para la descarga
    document.body.appendChild(a); // Agrega el enlace al documento
    a.click(); // Simula un clic en el enlace para iniciar la descarga
    document.body.removeChild(a); // Elimina el enlace del documento
  }

  uploadUsers(evt) {


    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      let data = XLSX.utils.sheet_to_json(ws);

      let enterpriseRef = this.enterpriseRef

      Swal.fire({
        title: 'Generando usuarios...',
        text: 'Por favor, espera.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      });

      try {
        for (let student of data){
          let userForm: FormGroup
          userForm = this.fb.group({
            displayName: [null, [Validators.required]],
            isActive:true,
            name: [null],
            profile: [null],
            photoUrl: [null],
            phoneNumber: [null, [Validators.pattern(/^\d*$/)]],
            department: [null],
            country: [null],
            birthdate: [null],
            email: [null, [Validators.required, Validators.email]],
            job: [null],
            enterprise: [null],
            hiringDate: [null],
            experience: [null],
            role:['student']
          });

          userForm.patchValue({
            displayName: student['Nombre']?student['Nombre']:null,
            name: student['Nombre']?student['Nombre']:null,
            phoneNumber: student['Teléfono']?student['Teléfono']:null,
            country: student['País']?student['País']:null,
            email: student['Correo']?student['Correo']:null,
            experience: student['Años Experiencia']?student['Años Experiencia']:null,
            enterprise: enterpriseRef
          });
  
          this.timestampToFormFormat(userForm,student['Fecha Nacimiento (YYYY/MM/DD)'], "birthdate")
          this.timestampToFormFormat(userForm,student['Fecha Ingreso (YYYY/MM/DD)'], "hiringDate")
          if(userForm.valid){
            const formData = userForm.getRawValue()
            console.log(formData)
            await this.userService.addUser(formData)
          }
        }
        Swal.close();
        this.alertService.succesAlert("Usuarios generados existosamente")
      }
      catch (error){
        Swal.close();
        this.alertService.errorAlert(error)

      }
    };
    reader.readAsBinaryString(target.files[0]); 



  }


  timestampToFormFormat(userForm,timestampIn: string, property: ("birthdate" | "hiringDate")) {

    if(!timestampIn){
      return null
    }

    let timestamp = new Date(timestampIn).getTime()
    console.log(timestamp,timestampIn)
    const date = timestampToDateNumbers(timestamp)
    userForm.get(property)?.setValue({
      day: date.day, month: date.month, year: date.year
    });
  }


  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe()
  }

  goToStudent(data){
    console.log(data)

    this.router.navigate([`admin/students/${data.id}`])

    
  }


}

