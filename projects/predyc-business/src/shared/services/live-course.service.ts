import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { LiveCourseByStudent } from 'projects/shared/models/live-course-by-student.model';
import { LiveCourse } from 'projects/shared/models/live-course.model';
import { Session } from 'projects/shared/models/session.model';
import { User } from 'projects/shared/models/user.model';
import { Observable, combineLatest, forkJoin, map, mergeMap, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiveCourseService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  getLiveCoursesByStudentByUserRef$(userRef: DocumentReference<User>): Observable<LiveCourseByStudent[]> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection, (ref) =>ref.where("userRef", "==", userRef)).valueChanges();
  }

  getLiveCourseById$(liveCourseId: string): Observable<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).valueChanges();
  }

  getSessionsByLiveCourseRef$(liveCourseRef: DocumentReference): Observable<Session[]> {
    return this.afs.collection<Session>(Session.collection, (ref) =>ref.where("liveCourseRef", "==", liveCourseRef)).valueChanges();
  }

  getLiveCourseWithSessionsById$(liveCourseId: string): Observable<{ liveCourse: LiveCourse, sessions: Session[] }> {
    const liveCourseRef = this.afs.collection(LiveCourse.collection).doc(liveCourseId).ref; 
    return this.afs.doc<LiveCourse>(liveCourseRef).valueChanges().pipe(
      switchMap((liveCourse: LiveCourse | undefined) => {
        if (liveCourse) {
          return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
            map((sessions: Session[]) => ({
              liveCourse,
              sessions
            }))
          );
        } else {
          throw new Error(`LiveCourse with id ${liveCourseId} not found`);
        }
      })
    );
  }

  getAllLiveCourses$(): Observable<LiveCourse[]> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).valueChanges();
  }

  getAllLiveCoursesWithSessions$(): Observable<{ liveCourse: LiveCourse, sessions: Session[] }[]> {
    return this.getAllLiveCourses$().pipe(
      switchMap((liveCourses: LiveCourse[]) => {
        const coursesWithSessions$ = liveCourses.map((liveCourse: LiveCourse) => {
          const liveCourseRef = this.afs.collection(LiveCourse.collection).doc(liveCourse.id).ref;
          return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
            map((sessions: Session[]) => ({
              liveCourse,
              sessions
            }))
          );
        });
        return combineLatest(coursesWithSessions$);
      })
    );
  }

  async saveLiveCourse(newLiveCourse: LiveCourse): Promise<void> {
    try {
      // console.log("test saveCourse", newLiveCourse);
      const dataToSave = typeof newLiveCourse.toJson === "function" ? newLiveCourse.toJson() : newLiveCourse;

      await this.afs.collection(LiveCourse.collection).doc(newLiveCourse.id).set(dataToSave, { merge: true });
    } catch (error) {
      console.log(error);
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  async saveLiveCourseSession(newSession: Session): Promise<void> {
    try {
      // console.log("test saveCourse", newSession);
      const dataToSave = typeof newSession.toJson === "function" ? newSession.toJson() : newSession;

      await this.afs.collection(Session.collection).doc(newSession.id).set(dataToSave, { merge: true });
    } catch (error) {
      console.log(error);
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  getLiveCourseRefById(liveCourseId: string): DocumentReference<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).ref
  }

  getSessionRefById(sessionId: string): DocumentReference<Session> {
    return this.afs.collection<Session>(Session.collection).doc(sessionId).ref
  }

}
