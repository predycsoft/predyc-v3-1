import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CreateUserComponent } from 'src/app/business-pages/management/my-team/student/create-user/create-user.component'; //move to shared module
import { User } from 'src/shared/models/user.model';
import { UserService } from 'src/shared/services/user.service';

@Component({
  selector: 'app-students',
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.css']
})
export class StudentsComponent {

  constructor(
    private modalService: NgbModal,
    private userService: UserService,
  ) {}

  createNewStudent() {
    this.openCreateUserModal(null)
  }

  openCreateUserModal(student: User | null): NgbModalRef {
    let openModal = false
    let isNewUser = false
    if (student) {
      if (!student.profile) openModal = true  
    }
    else openModal = true, isNewUser = true

    if (openModal) {
      const modalRef = this.modalService.open(CreateUserComponent, {
        animation: true,
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false 
      })
      if (!isNewUser) modalRef.componentInstance.studentToEdit = student;
      return modalRef
    }
    else return null
  }

  onStudentSelected(student) {
    const studentData: User = this.userService.getUser(student.uid)
    this.openCreateUserModal(studentData)
  }

}
