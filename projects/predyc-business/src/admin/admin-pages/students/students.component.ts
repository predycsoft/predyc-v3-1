import { Component } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { CreateUserComponent } from "projects/predyc-business/src/app/business-pages/management/my-team/student/create-user/create-user.component"; //move to shared module
import { User } from "projects/shared/models/user.model";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-students",
  templateUrl: "./students.component.html",
  styleUrls: ["./students.component.css"],
})
export class StudentsComponent {
  constructor(private modalService: NgbModal, private userService: UserService, public icon: IconService, private fireFunctions: AngularFireFunctions) {}

  createParticularStudent() {
    this.openCreateUserModal(null);
  }

  estadisticas = {
    usuariosActivos: 0,
    usuariosInactivos: 0,
    usuariosTotales: 0,
  };

  newUser = null

  getUsers(users) {
    // console.log("usersGet", users);
    // Usuarios Activos
    // Usuarios Inactivos
    // Usuarios Totales

    let usuariosActivos = users.filter((x) => x.statusId == "active").length;
    let usuariosExpired = users.filter((x) => x.statusId == "expired").length;
    let usuariosInactivos = users.filter((x) => x.statusId == "inactive").length;
    let usuariosTotales = users.length;

    let respuesta = {
      usuariosActivos: usuariosActivos + usuariosExpired,
      usuariosInactivos: usuariosInactivos,
      usuariosTotales: usuariosTotales,
    };

    this.estadisticas = respuesta;
  }

  openCreateUserModal(student: User | null): NgbModalRef {
    let openModal = false;
    let isNewUser = false;
    if (student) {
      if (!student.profile) openModal = true;
    } else (openModal = true), (isNewUser = true);

    if (openModal) {
      const modalRef = this.modalService.open(CreateUserComponent, {
        animation: true,
        centered: true,
        size: "lg",
        backdrop: "static",
        keyboard: false,
      });
      if (!isNewUser) modalRef.componentInstance.studentToEdit = student;
      else modalRef.componentInstance.isParticularStudent = true;

      modalRef.result.then(async result => {
        // console.log("result", result)
        this.newUser = result
      }).catch(error => {
        console.log(error)
      })

      return modalRef;
    } else return null;
  }

  onStudentSelected(student) {
    const studentData: User = this.userService.getUser(student.uid);
    this.openCreateUserModal(studentData);
  }
}
