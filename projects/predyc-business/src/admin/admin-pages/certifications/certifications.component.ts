import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Router } from '@angular/router';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { LiveCourseByStudent } from 'projects/shared/models/live-course-by-student.model';
import { LiveCourse } from 'projects/shared/models/live-course.model';
import { Session } from 'projects/shared/models/session.model';
import { User } from 'projects/shared/models/user.model';

@Component({
  selector: 'app-certifications',
  templateUrl: './certifications.component.html',
  styleUrls: ['./certifications.component.css']
})
export class CertificationsComponent {

  constructor(
    public icon: IconService,
    private router: Router,
    // testing
    private afs: AngularFirestore,
    private userService: UserService,

  ) {}


  newCertificate() {
    this.router.navigate(["/admin/certifications/form"])
  }

  async createTestSessions() {
    console.log("started")
    let liveCourse = new LiveCourse("", "Pepsi", "Curso de prueba", "", "", "Descripcion del curso de prueba", null)
    const liveCourseRef = this.afs.collection<LiveCourse>(LiveCourse.collection).doc().ref;
    await liveCourseRef.set({...liveCourse.toJson(), id: liveCourseRef.id}, { merge: true });
    liveCourse.id = liveCourseRef.id;

    let session = new Session("", "Sesion de prueba", new Date(1716879999999), "Descripcion de la sesion de prueba", liveCourseRef)
    const sessionRef = this.afs.collection<Session>(Session.collection).doc().ref;
    await sessionRef.set({...session.toJson(), id: sessionRef.id}, { merge: true });
    session.id = sessionRef.id;

    const querySnapshot = await this.afs.collection(User.collection).ref.where("email", "==", "aleja.c@test.com").get();
    let userRef = null
    if (!querySnapshot.empty) userRef = querySnapshot.docs[0].ref

    let liveCourseByStudent = new LiveCourseByStudent("", false, userRef, liveCourseRef)
    const liveCourseByStudentRef = this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc().ref;
    await liveCourseByStudentRef.set({...liveCourseByStudent.toJson(), id: liveCourseByStudentRef.id}, { merge: true });
    liveCourseByStudent.id = liveCourseByStudentRef.id;
    console.log("Finished")
  }

}
