import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserComponent } from 'projects/predyc-business/src/app/business-pages/management/my-team/student/create-user/create-user.component';
import { Department } from 'projects/predyc-business/src/shared/models/department.model';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { Profile } from 'projects/predyc-business/src/shared/models/profile.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { DepartmentService } from 'projects/predyc-business/src/shared/services/department.service';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Subscription, combineLatest } from 'rxjs';

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
  ){}


  displayedColumns: string[] = [
    "displayName",
    "department",
    "profile",
    "email",
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
    this.combinedSubscription = combineLatest(
      [
        this.profileService.getProfiles$(),
        this.departmentService.getDepartments$(),
        this.userService.getStudentUsersByEnterpriseRef$(this.enterpriseRef),
      ]
    ).subscribe(([profiles, departments, users]) => {

      const studentsInList: studentInList[] = users.map(user => {
        const userProfileName = user.profile ? profiles.find(profile => profile.id === user.profile.id).name : "Sin asignar"
        const userDepartmentName = user.departmentRef ? departments.find(department => department.id === user.departmentRef.id).name : "Sin asignar"

        return {
          displayName: user.displayName,
          departmentName: userDepartmentName,
          profileName: userProfileName,
          email: user.email,
          status: user.status,
        }
      })
      this.dataSource.data = studentsInList

    })

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



  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe()
  }


}

