import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserComponent } from 'projects/predyc-business/src/app/business-pages/management/my-team/student/create-user/create-user.component';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-enterprise-students-list',
  templateUrl: './enterprise-students-list.component.html',
  styleUrls: ['./enterprise-students-list.component.css']
})
export class EnterpriseStudentsListComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>

  constructor(
    private userService: UserService,
    public dialogService: DialogService,
    private modalService: NgbModal,
  ){}


  displayedColumns: string[] = [
    "displayName",
    "email",
    "delete",
  ];

  dataSource = new MatTableDataSource<User>();

  userSubscription: Subscription

  addingStudent: boolean = false;
  newStudent: User

  ngOnInit() {
    this.userSubscription = this.userService.getStudentUsersByEnterpriseRef$(this.enterpriseRef).subscribe(students => {
      this.dataSource.data = students
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

  deleteAdmin(user: User){

  }



  ngOnDestroy() {
    if (this.userSubscription) this.userSubscription.unsubscribe()
  }


}

