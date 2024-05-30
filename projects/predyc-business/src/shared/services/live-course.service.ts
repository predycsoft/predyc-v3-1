import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { LiveCourseByStudent } from 'projects/shared/models/live-course-by-student.model';
import { LiveCourse, LiveCourseSon, LiveCourseSonJson } from 'projects/shared/models/live-course.model';
import { Session, SessionSon, SessionSonJson } from 'projects/shared/models/session.model';
import { User } from 'projects/shared/models/user.model';
import { Observable, catchError, combineLatest, firstValueFrom, forkJoin, from, map, mergeMap, of, switchMap, toArray } from 'rxjs';

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

  getLiveCourseById(liveCourseId: string): Promise<LiveCourse> {
    return firstValueFrom(this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).valueChanges());
  }

  getSessionsByLiveCourseRef$(liveCourseRef: DocumentReference): Observable<Session[]> {
    return this.afs.collection<Session>(Session.collection, (ref) =>
      ref.where("liveCourseRef", "==", liveCourseRef).orderBy("orderNumber", "asc")
    ).valueChanges();
  }

  getLiveCourseWithSessionsById$(liveCourseId: string, liveCourseSonId: string | null): Observable<{ liveCourse: any, sessions: any[] }> {
    const liveCourseRef = this.getLiveCourseRefById(liveCourseId);
    let liveCourseSonRef = null;
    if (liveCourseSonId) liveCourseSonRef = this.getLiveCourseSonRefById(liveCourseId, liveCourseSonId);
  
    return this.afs.doc<LiveCourse>(liveCourseRef).valueChanges().pipe(
      switchMap((liveCourse: any | undefined) => {
        if (!liveCourse) {
          throw new Error(`LiveCourse with id ${liveCourseId} not found`);
        }
  
        // When the sons information is wanted
        if (liveCourseSonId) {
          return this.afs.collection(LiveCourse.collection).doc(liveCourseId).collection(LiveCourseSon.subCollection).doc(liveCourseSonId).valueChanges()
          .pipe(
            switchMap((liveCourseSon: LiveCourseSon | undefined) => {
              // Get "meetingLink" and "identifierText"
              if (liveCourseSon) liveCourse.meetingLink = liveCourseSon.meetingLink; liveCourse.identifierText = liveCourseSon.identifierText;

              return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
                mergeMap((sessions: any[]) => { // Base sessions
                  const sessionObservables = sessions.map(session => {
                    return this.afs.collection<Session>(Session.collection).doc(session.id)
                      .collection(SessionSon.subCollection, ref => ref.where("liveCourseSonRef", "==", liveCourseSonRef)).valueChanges().pipe(
                        map(sessionSon => {
                          const sessionSonData = sessionSon[0];
                          session.date = sessionSonData?.date;
                          session.weeksToKeep = sessionSonData?.weeksToKeep;
                          session.sonId = sessionSonData?.id;
                          return session;
                        }),
                        catchError(err => {
                          console.error('Error fetching sessionSon data', err);
                          return of(session); // Continúa incluso si hay un error
                        })
                      );
                  });
                  
                  return combineLatest(sessionObservables).pipe(
                    map(sessionsWithSons => sessionsWithSons.filter(session => session !== null))
                  );
                }),
                map((sessions: Session[]) => ({
                  liveCourse,
                  sessions
                }))
              );
            })
          );
        } 
        // Just return base live course with base sessions info
        else {
          return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
            map((sessions: Session[]) => ({
              liveCourse,
              sessions
            }))
          );
        }
      }),
      catchError(err => {
        console.error('Error in getLiveCourseWithSessionsById$', err);
        throw err;
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
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  getLiveCourseRefById(liveCourseId: string): DocumentReference<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).ref
  }

  getLiveCourseSonRefById(liveCourseId: string, liveCourseSonId: string): DocumentReference<LiveCourseSon> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).doc(liveCourseSonId).ref
  }

  getSessionRefById(sessionId: string): DocumentReference<Session> {
    return this.afs.collection<Session>(Session.collection).doc(sessionId).ref
  }

  getSessionSonRefById(sessionId: string, sessionSonId: string): DocumentReference<SessionSon> {
    return this.afs.collection<Session>(Session.collection).doc(sessionId).collection<SessionSon>(SessionSon.subCollection).doc(sessionSonId).ref
  }

  async saveLiveCourseSon(newLiveCourseSon: LiveCourseSonJson): Promise<string> {
    try {
      // console.log("test saveCourse", newLiveCourseSon);
      const liveCourseSonId = (this.afs.collection(LiveCourse.collection).doc(newLiveCourseSon.parentId).collection(LiveCourseSon.subCollection).doc().ref).id
      newLiveCourseSon.id = liveCourseSonId

      await this.afs.collection(LiveCourse.collection).doc(newLiveCourseSon.parentId).collection(LiveCourseSon.subCollection).doc(liveCourseSonId).set(newLiveCourseSon, { merge: true });
      return newLiveCourseSon.id
    } catch (error) {
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  async saveLiveCourseSessionSon(sessionId: string, newSessionSon: SessionSonJson): Promise<void> {
    try {
      // console.log("test saveCourse", newSessionSon);
      const sessionSonId = (this.afs.collection(Session.collection).doc(sessionId).collection(SessionSon.subCollection).doc().ref).id
      newSessionSon.id = sessionSonId

      await this.afs.collection(Session.collection).doc(sessionId).collection(SessionSon.subCollection).doc(sessionSonId).set(newSessionSon, { merge: true });
    } catch (error) {
      throw error;
    }
    // console.log("Has agregado una nuevo curso exitosamente.");
  }

  getLiveCourseSonsByLiveCourseId(liveCourseId: string): Promise<LiveCourseSon[]> {
    return firstValueFrom(this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).valueChanges())
  }
  getLiveCourseSonsByLiveCourseId$(liveCourseId: string): Observable<LiveCourseSon[]> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).valueChanges()
  }

  getSessionSonsBySessionId(sessionId: string): Promise<SessionSon[]> {
    return firstValueFrom(this.afs.collection<Session>(Session.collection).doc(sessionId).collection<SessionSon>(SessionSon.subCollection).valueChanges())
  }
  getSessionSonsBySessionId$(sessionId: string): Observable<SessionSon[]> {
    return this.afs.collection<Session>(Session.collection).doc(sessionId).collection<SessionSon>(SessionSon.subCollection).valueChanges()
  }

  getLiveCourseSonByIds(liveCourseId: string, liveCourseSonId: string): Observable<LiveCourseSon> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).doc(liveCourseSonId).valueChanges()
  }

  getLiveCourseSonByRef(liveCourseSonRef: DocumentReference<LiveCourseSon>): Observable<LiveCourseSon> {
    return this.afs.doc<LiveCourseSon>(liveCourseSonRef).valueChanges();
  }

  async updateLiveCourseSonMeetingLinkAndIdentifierText(liveCourseId: string, liveCourseSonId: string, meetingLink: string, identifierText: string): Promise<any> {
    await this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).collection<LiveCourseSon>(LiveCourseSon.subCollection).doc(liveCourseSonId).update({
      meetingLink: meetingLink,
      identifierText: identifierText
    })
  }

  async updateSessionSonDateAndWeeksToKeep(sessionId: string, sessionSonId: string, date: any, weeksToKeep: number) {
    await this.afs.collection<Session>(Session.collection).doc(sessionId).collection<SessionSon>(SessionSon.subCollection).doc(sessionSonId).update({
      date: date,
      weeksToKeep: weeksToKeep
    })
  }

}
