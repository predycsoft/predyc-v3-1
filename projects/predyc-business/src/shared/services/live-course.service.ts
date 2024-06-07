import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { LiveCourseByStudent } from 'projects/shared/models/live-course-by-student.model';
import { LiveCourse, LiveCourseJson, LiveCourseTemplate } from 'projects/shared/models/live-course.model';
import { Session, SessionJson, SessionTemplate } from 'projects/shared/models/session.model';
import { User } from 'projects/shared/models/user.model';
import { Observable, catchError, combineLatest, firstValueFrom, forkJoin, from, map, mergeMap, of, switchMap, toArray } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LiveCourseService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  // getLiveCourseSonById$(liveCourseId: string, liveCourseSonId: string): Observable<LiveCourseSon> {
  //   return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).doc(liveCourseSonId).valueChanges()
  // }

  getLiveCoursesByStudentByLivecourseSon$(liveCourseRef: DocumentReference<LiveCourse>): Observable<LiveCourseByStudent[]> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection, (ref) =>ref.where("liveCourseRef", "==", liveCourseRef)).valueChanges();
  }

  async createLiveCourseByStudent(liveCourseByStudent: LiveCourseByStudent): Promise<void> {
    const liveCourseByStudentRef = this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc().ref;
		await liveCourseByStudentRef.set({...liveCourseByStudent.toJson(), id: liveCourseByStudentRef.id}, { merge: true });
  }

  updateIsAttendingLiveCourseByStudent(liveCourseByStudentId: string, isAttending: boolean): Promise<void> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc(liveCourseByStudentId).update({
      isAttending: isAttending
    })
  }

  getSessionsTemplatesByLiveCourseTemplateRef$(liveCourseTemplateRef: DocumentReference): Observable<SessionTemplate[]> {
    return this.afs.collection<SessionTemplate>(SessionTemplate.collection, (ref) =>
      ref.where("liveCourseTemplateRef", "==", liveCourseTemplateRef).orderBy("orderNumber", "asc")
    ).valueChanges();
  }

  getSessionsByLiveCourseRef$(liveCourseRef: DocumentReference): Observable<Session[]> {
    return this.afs.collection<Session>(Session.collection, (ref) =>
      ref.where("liveCourseRef", "==", liveCourseRef).orderBy("orderNumber", "asc")
    ).valueChanges();
  }

  // DELETE THIS
  // getLiveCourseWithSessionsById$(liveCourseTemplateId: string, liveCourseId: string | null): Observable<{ liveCourse: any, sessions: any[] }> {
  //   const liveCourseRef = this.getLiveCourseTemplateRefById(liveCourseTemplateId);
  //   let liveCourseSonRef = null;
  //   if (liveCourseId) liveCourseSonRef = this.getLiveCourseRefById(liveCourseId);
  
  //   return this.afs.doc<LiveCourseTemplate>(liveCourseRef).valueChanges().pipe(
  //     switchMap((liveCourseTemplate: any | undefined) => {
  //       if (!liveCourseTemplate) {
  //         throw new Error(`LiveCourseTemplate with id ${liveCourseTemplateId} not found`);
  //       }
  
  //       // When the sons information is wanted
  //       if (liveCourseId) {
  //         return this.afs.collection(LiveCourseTemplate.collection).doc(liveCourseTemplateId).collection(LiveCourse.collection).doc(liveCourseId).valueChanges()
  //         .pipe(
  //           switchMap((liveCourseSon: LiveCourse | undefined) => {
  //             // Get "meetingLink" and "identifierText"
  //             if (liveCourseSon) {
  //               liveCourseTemplate.meetingLink = liveCourseSon.meetingLink;
  //               liveCourseTemplate.identifierText = liveCourseSon.identifierText;
  //               liveCourseTemplate.emailLastDate = liveCourseSon.emailLastDate;
  //             }  

  //             return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
  //               mergeMap((sessions: any[]) => { // Base sessions
  //                 const sessionObservables = sessions.map(session => {
  //                   return this.afs.collection<SessionTemplate>(SessionTemplate.collection).doc(session.id)
  //                     .collection(SessionSon.subCollection, ref => ref.where("liveCourseSonRef", "==", liveCourseSonRef)).valueChanges().pipe(
  //                       map(sessionSon => {
  //                         const sessionSonData = sessionSon[0];
  //                         session.date = sessionSonData?.date;
  //                         session.weeksToKeep = sessionSonData?.weeksToKeep;
  //                         session.sonId = sessionSonData?.id;
  //                         session.sonFiles = sessionSonData?.sonFiles;
  //                         session.vimeoId1 = sessionSonData?.vimeoId1;
  //                         session.vimeoId2 = sessionSonData?.vimeoId2;
  //                         return session;
  //                       }),
  //                       catchError(err => {
  //                         console.error('Error fetching sessionSon data', err);
  //                         return of(session); // Continúa incluso si hay un error
  //                       })
  //                     );
  //                 });
                  
  //                 return combineLatest(sessionObservables).pipe(
  //                   map(sessionsWithSons => sessionsWithSons.filter(session => session !== null))
  //                 );
  //               }),
  //               map((sessions: SessionTemplate[]) => ({
  //                 liveCourseTemplate,
  //                 sessions
  //               }))
  //             );
  //           })
  //         );
  //       } 
  //       // Just return base live course with base sessions info
  //       else {
  //         return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
  //           map((sessions: SessionTemplate[]) => ({
  //             liveCourseTemplate,
  //             sessions
  //           }))
  //         );
  //       }
  //     }),
  //     catchError(err => {
  //       console.error('Error in getLiveCourseWithSessionsById$', err);
  //       throw err;
  //     })
  //   );
  // }

  getLiveCourseTemplateWithSessionsTemplateById$(liveCourseTemplateId: string): Observable<{ liveCourseTemplate: LiveCourseTemplate, sessionsTemplates: SessionTemplate[] }> {
    const liveCourseTemplateRef = this.getLiveCourseTemplateRefById(liveCourseTemplateId);
  
    return this.afs.doc<LiveCourseTemplate>(liveCourseTemplateRef).valueChanges().pipe(
      switchMap((liveCourseTemplate: LiveCourseTemplate) => {
        if (!liveCourseTemplate) throw new Error(`LiveCourseTemplate with id ${liveCourseTemplateId} not found`);
        // Retrieve session templates related to the live course template
        return this.getSessionsTemplatesByLiveCourseTemplateRef$(liveCourseTemplateRef).pipe(
          map((sessionsTemplates: SessionTemplate[]) => ({
            liveCourseTemplate,
            sessionsTemplates
          }))
        );
      }),
      catchError(err => {
        console.error('Error in getLiveCourseWithSessionsById$', err);
        throw err;
      })
    );
  }

  getLiveCourseWithSessionsById$(liveCourseId: string): Observable<{ liveCourse: LiveCourse, sessions: Session[] }> {
    const liveCourseRef = this.getLiveCourseRefById(liveCourseId);
  
    return this.afs.doc<LiveCourse>(liveCourseRef).valueChanges().pipe(
      switchMap((liveCourse: LiveCourse) => {
        if (!liveCourse) throw new Error(`LiveCourse with id ${liveCourseId} not found`);
        return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
          map((sessions: Session[]) => ({
            liveCourse,
            sessions
          }))
        );
      }),
      catchError(err => {
        console.error('Error in getLiveCourseWithSessionsById$', err);
        throw err;
      })
    );
  }

  getAllLiveCoursesTemplates$(): Observable<LiveCourseTemplate[]> {
    return this.afs.collection<LiveCourseTemplate>(LiveCourseTemplate.collection).valueChanges();
  }

  getAllLiveCourses$(): Observable<LiveCourse[]> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).valueChanges();
  }

  getAllLiveCoursesTemplatesWithSessionsTemplates$(): Observable<{ liveCourseTemplate: LiveCourseTemplate, sessionsTemplates: SessionTemplate[] }[]> {
    return this.getAllLiveCoursesTemplates$().pipe(
      switchMap((liveCoursesTemplates: LiveCourseTemplate[]) => {
        const coursesWithSessions$ = liveCoursesTemplates.map((liveCourseTemplate: LiveCourseTemplate) => {
          const liveCourseRef = this.afs.collection(LiveCourseTemplate.collection).doc(liveCourseTemplate.id).ref;
          return this.getSessionsTemplatesByLiveCourseTemplateRef$(liveCourseRef).pipe(
            map((sessionsTemplates: SessionTemplate[]) => ({
              liveCourseTemplate,
              sessionsTemplates
            }))
          );
        });
        return combineLatest(coursesWithSessions$);
      })
    );
  }

  getAllLiveCoursesWithSessions$(): Observable<{ liveCourse: LiveCourse, sessions: Session[] }[]> {
    return this.getAllLiveCourses$().pipe(
      switchMap((liveCourses: LiveCourse[]) => {
        const coursesWithSessions$ = liveCourses.map((liveCourse: LiveCourse) => {
          const liveCourseRef = this.getLiveCourseRefById(liveCourse.id);
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

  async saveLiveCourseTemplate(newLiveCourseTemplate: LiveCourseTemplate): Promise<void> {
    try {
      // console.log("test saveCourse", newLiveCourse);
      let liveCourseTemplateId = newLiveCourseTemplate.id
      if (!liveCourseTemplateId) {
        liveCourseTemplateId = (this.afs.collection(LiveCourse.collection).doc().ref).id
        newLiveCourseTemplate.id = liveCourseTemplateId
      }
      const dataToSave = typeof newLiveCourseTemplate.toJson === "function" ? newLiveCourseTemplate.toJson() : newLiveCourseTemplate;

      await this.afs.collection(LiveCourseTemplate.collection).doc(liveCourseTemplateId).set(dataToSave, { merge: true });
    } catch (error) {
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  async saveSessionTemplate(newSessionTemplate: SessionTemplate): Promise<void> {
    try {
      // console.log("test saveCourse", newSession);
      let sessionTemplateId = newSessionTemplate.id
      if (!newSessionTemplate) {
        sessionTemplateId = (this.afs.collection(Session.collection).doc().ref).id
        newSessionTemplate.id = sessionTemplateId
      }
      const dataToSave = typeof newSessionTemplate.toJson === "function" ? newSessionTemplate.toJson() : newSessionTemplate;

      await this.afs.collection(SessionTemplate.collection).doc(sessionTemplateId).set(dataToSave, { merge: true });
    } catch (error) {
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  getLiveCourseTemplateRefById(liveCourseTemplateId: string): DocumentReference<LiveCourseTemplate> {
    return this.afs.collection<LiveCourseTemplate>(LiveCourseTemplate.collection).doc(liveCourseTemplateId).ref
  }

  getLiveCourseRefById(liveCourseId: string): DocumentReference<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).ref
  }

  getSessionTemplateRefById(sessionTemplateId: string): DocumentReference<SessionTemplate> {
    return this.afs.collection<SessionTemplate>(SessionTemplate.collection).doc(sessionTemplateId).ref
  }

  // getLiveCourseSonRefById(liveCourseId: string, liveCourseSonId: string): DocumentReference<LiveCourseSon> {
  //   return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).doc(liveCourseSonId).ref
  // }

  // // getLiveCourseSonRefById(liveCourseSonId: string): DocumentReference<LiveCourseSon> {
  // //   return this.afs.collectionGroup<LiveCourseSon>(LiveCourseSon.subCollection).get()
  // // }


  async saveLiveCourse(newLiveCourse: LiveCourse): Promise<string> {
    try {
      // console.log("test saveCourse", newLiveCourse);
      let liveCourseId = newLiveCourse.id
      if (!liveCourseId) {
        liveCourseId = (this.afs.collection(LiveCourse.collection).doc().ref).id
        newLiveCourse.id = liveCourseId
      }
      const dataToSave = typeof newLiveCourse.toJson === "function" ? newLiveCourse.toJson() : newLiveCourse;

      await this.afs.collection(LiveCourse.collection).doc(liveCourseId).set(dataToSave, { merge: true });
      return liveCourseId
    } catch (error) {
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  async saveSession(newSession: Session): Promise<void> {
    try {
      // console.log("test saveCourse", newSessionSon);
      let sessionId = newSession.id
      if (!newSession) {
        sessionId = (this.afs.collection(Session.collection).doc().ref).id
        newSession.id = sessionId
      }
      const dataToSave = typeof newSession.toJson === "function" ? newSession.toJson() : newSession;

      await this.afs.collection(Session.collection).doc(sessionId).set(dataToSave, { merge: true });
    } catch (error) {
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  // getLiveCourseSonsByLiveCourseId$(liveCourseId: string): Observable<LiveCourseSon[]> {
  //   return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).valueChanges()
  // }

  // getSessionSonsBySessionId$(sessionId: string): Observable<SessionSon[]> {
  //   return this.afs.collection<Session>(Session.collection).doc(sessionId).collection<SessionSon>(SessionSon.subCollection).valueChanges()
  // }

  async updateLiveCourseMeetingLinkAndIdentifierText(liveCourseId: string,  meetingLink: string, identifierText: string): Promise<any> {
    await this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).update({
      meetingLink: meetingLink,
      identifierText: identifierText
    })
  }

  async updateSessionData(sessionId: string, data: any) {
    await this.afs.collection<Session>(Session.collection).doc(sessionId).update({
      date: data.date ? data.date : null,
      weeksToKeep: data.weeksToKeep ? data.weeksToKeep : null,
      vimeoId1: data.vimeoId1,
      vimeoId2: data.vimeoId2,
    })
  }

  async deleteSession(sessionTemplateId: string): Promise<void> {
    // Delete sub collection
    // await this.deleteSessionSons(sessionId)
    // Delete collection
    await this.afs.collection<SessionTemplate>(SessionTemplate.collection).doc(sessionTemplateId).delete()
  }

  // async deleteSessionSons(sessionId: string): Promise<void> {
  //   const subCollectionRef = this.afs.collection<Session>(Session.collection).doc(sessionId).collection<SessionSon>(SessionSon.subCollection);
  //   const batch = this.afs.firestore.batch();
  
  //   const snapshot = await firstValueFrom(subCollectionRef.get());

  //   if (snapshot.docs) {
  //     snapshot.docs.forEach(doc => {
  //       batch.delete(doc.ref);
  //     });
  //     return await batch.commit();
  //   }
  //   return null
  // }

  

}
