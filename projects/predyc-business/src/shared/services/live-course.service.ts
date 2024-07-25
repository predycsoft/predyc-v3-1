import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import { LiveCourseByStudent } from 'projects/shared/models/live-course-by-student.model';
import { LiveCourse, LiveCourseJson, LiveCourseTemplate } from 'projects/shared/models/live-course.model';
import { LiveDiplomado } from 'projects/shared/models/live-diplomado.model';
import { Session, SessionJson, SessionTemplate } from 'projects/shared/models/session.model';
import { User } from 'projects/shared/models/user.model';
import { Observable, catchError, combineLatest, firstValueFrom, forkJoin, from, map, mergeMap, of, switchMap, toArray } from 'rxjs';
import { Question } from 'shared';

@Injectable({
  providedIn: 'root'
})
export class LiveCourseService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  getLiveCourseById$(liveCourseId: string): Observable<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).valueChanges()
  }

  getLiveCoursesByStudentByLivecourse$(liveCourseRef: DocumentReference<LiveCourse>): Observable<LiveCourseByStudent[]> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection, (ref) =>ref.where("liveCourseRef", "==", liveCourseRef)).valueChanges();
  }

  async updateCompanyNameLiveCourseByStudent(liveCourseByStudentId: string, companyName: string): Promise<void> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc(liveCourseByStudentId).update({
      companyName: companyName
    })
  }

  async createLiveCourseByStudent(liveCourseByStudent: LiveCourseByStudent): Promise<void> {
    const liveCourseByStudentRef = this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc().ref;
		await liveCourseByStudentRef.set({...liveCourseByStudent.toJson(), id: liveCourseByStudentRef.id}, { merge: true });
  }

  async updateIsAttendingLiveCourseByStudent(liveCourseByStudentId: string, isAttending: boolean): Promise<void> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc(liveCourseByStudentId).update({
      isAttending: isAttending
    })
  }

  async updateIsActiveLiveCourseByStudent(liveCourseByStudentId: string, isActive: boolean): Promise<void> {
    return this.afs.collection<LiveCourseByStudent>(LiveCourseByStudent.collection).doc(liveCourseByStudentId).update({
      isActive: isActive
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
      if (!sessionTemplateId) {
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
      if (!sessionId) {
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

  getLiveCourseTemplateRefById(liveCourseTemplateId: string): DocumentReference<LiveCourseTemplate> {
    return this.afs.collection<LiveCourseTemplate>(LiveCourseTemplate.collection).doc(liveCourseTemplateId).ref
  }

  getLiveCourseRefById(liveCourseId: string): DocumentReference<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).ref
  }

  getSessionTemplateRefById(sessionTemplateId: string): DocumentReference<SessionTemplate> {
    return this.afs.collection<SessionTemplate>(SessionTemplate.collection).doc(sessionTemplateId).ref
  }

  async updateLiveCourseMeetingLinkAndIdentifierText(liveCourseId: string,  meetingLink: string, identifierText: string): Promise<any> {
    await this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).update({
      meetingLink: meetingLink,
      identifierText: identifierText
    })
  }

  async updateLiveCourseCanTakeTest(liveCourseId: string,  canTake: boolean, isFinalTest: boolean): Promise<any> {
    if (isFinalTest) {
      await this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).update({
        canTakeFinalTest: canTake,
      })
    }
    // diagnostic tes
    else {
      await this.afs.collection<LiveCourse>(LiveCourse.collection).doc(liveCourseId).update({
        canTakeDiagnosticTest: canTake,
      })
    }
  }

  async updateSessionData(sessionId: string, data: any) {
    await this.afs.collection<Session>(Session.collection).doc(sessionId).update({
      date: data.date ? data.date : null,
      weeksToKeep: data.weeksToKeep ? data.weeksToKeep : null,
      vimeoId1: data.vimeoId1,
      vimeoId2: data.vimeoId2,
    })
  }

  async deleteSession(sessionId: string, isTemplate: boolean): Promise<void> {
    if (isTemplate) await this.afs.collection<SessionTemplate>(SessionTemplate.collection).doc(sessionId).delete()
    else await this.afs.collection<Session>(Session.collection).doc(sessionId).delete()
  }

  getLiveCourseUserCertificate$(courseId: string, userId: string): Observable<any[]> {
    return this.afs.collection('userCertificate', ref =>ref.where("liveCourseId", "==", courseId).where("usuarioId", "==", userId)).valueChanges()
  }

  async getUsersTestsData(courseRef: DocumentReference, userRefs: DocumentReference[]): Promise<any[]> {
    if (userRefs.length === 0) return [];
  
    const chunkSize = 10;
    const userChunks: DocumentReference[][] = [];
  
    for (let i = 0; i < userRefs.length; i += chunkSize) {
      userChunks.push(userRefs.slice(i, i + chunkSize));
    }
  
    const promises = userChunks.map(async chunk => {
      console.log("chunk", chunk)
      const querySnapshot = (await this.afs.collection<any>('coursesTestsByStudent')
      .ref.where('courseRef', '==', courseRef).where('userRef', 'in', chunk)
      .get());
  
      return querySnapshot.docs.map(doc => doc.data());
    });
  
    const results = await Promise.all(promises);
    return results.flat();
  }

  public getDiplomados$(): Observable<any[]> {
    // Query to get courses where enterpriseRef is empty
    return  this.afs.collection<any>('live-diplomado').valueChanges({ idField: 'id' });
  
  }

  public getDiplomado$(id: string): Observable<LiveDiplomado> {
    return this.afs.collection<LiveDiplomado>(LiveDiplomado.collection).doc(id).valueChanges()
  }


  public getCourseRefById(id: string): DocumentReference<LiveCourse> {
    return this.afs.collection<LiveCourse>(LiveCourse.collection).doc(id).ref;
  }

  async saveDiplomado(diplomado: LiveDiplomado): Promise<string> {
    let ref: DocumentReference;
    console.log('diplomado save',diplomado)
    // If diplomado has an ID, then it's an update
    if (diplomado?.id) {
      ref = this.afs.collection<LiveDiplomado>(LiveDiplomado.collection).doc(diplomado.id).ref;
    } else {
      // Else, it's a new profile
      ref = this.afs.collection<LiveDiplomado>(LiveDiplomado.collection).doc().ref;
      diplomado.id = ref.id; // Assign the generated ID to the diplomado
    }
    const dataToSave = typeof diplomado.toJson === 'function' ? diplomado.toJson() : diplomado;
    console.log('dataToSave diplomado',dataToSave)
    await ref.set(dataToSave, { merge: true });
    diplomado.id = ref.id; // Assign the generated ID to the profile
    return diplomado.id
  }

  parseDateString(date: string): Date {
    date = date.replace("T", "-");
    let parts = date.split("-");
    let timeParts = parts[3].split(":");

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(+parts[0], +parts[1] - 1, +parts[2], +timeParts[0], +timeParts[1]); // Note: months are 0-based
  }


  async saveLiveCourseComplete(activityClassesService,formValue,sessions,liveCourseDiagnosticTest = null,liveCourseFinalTest =null,idDiplomado = null){
    // console.log('Form Value:', formValue);
    // copy the template data
    const liveCourseTemplateData = { ...formValue.baseCourse };
    delete liveCourseTemplateData.sessions;
    // Save live course
    let diplomadoLiveRef = null
    if(idDiplomado){
      diplomadoLiveRef = this.afs.collection(LiveDiplomado.collection).doc(idDiplomado).ref;
    }

    let liveCourse: any = {
      ...liveCourseTemplateData,
      id: null,
      liveCourseTemplateRef: this.getLiveCourseTemplateRefById(liveCourseTemplateData.id),
      meetingLink: formValue.meetingLink,
      identifierText: formValue.identifyingText,
      emailLastDate: null,
      diplomadoLiveRef:diplomadoLiveRef
    };
    // console.log("liveCourse", liveCourse)
    const liveCourseId = await this.saveLiveCourse(liveCourse);
    const liveCourseRef = this.getLiveCourseRefById(liveCourseId);
    // Save first session with date
    const firstSessionDate = this.parseDateString(formValue.sessionsDates[sessions[0].id]);
    // copy the template data
    const sessionTemplateData = { ...sessions[0] };
    delete sessionTemplateData.liveCourseTemplateRef;
    const firstSession: any = {
      ...sessionTemplateData,
      id: null,
      date: firstSessionDate,
      liveCourseRef: liveCourseRef,
      sessionTemplateRef: this.getSessionTemplateRefById(sessionTemplateData.id),
      vimeoId1: null,
      vimeoId2: null,
      weeksToKeep: 2,
    };
    // console.log("firstSession", firstSession)
    await this.saveSession(firstSession);
    // Save rest of sessions without date
    for (let i = 1; i < sessions.length; i++) {
      const followingSessionTemplateData = { ...sessions[i] };
      delete followingSessionTemplateData.liveCourseTemplateRef;
      const followingSession: any = {
        ...followingSessionTemplateData,
        id: null,
        date: null,
        liveCourseRef: liveCourseRef,
        sessionTemplateRef: this.getSessionTemplateRefById(followingSessionTemplateData.id),
        vimeoId1: null,
        vimeoId2: null,
        weeksToKeep: 2,
      };
      // console.log("followingSession", followingSession)
      await this.saveSession(followingSession);
    }

    // Save tests
    if (liveCourseDiagnosticTest) {
      liveCourseDiagnosticTest.id = null;
      liveCourseDiagnosticTest.coursesRef = [liveCourseRef];
      const activityId = await activityClassesService.saveActivity(liveCourseDiagnosticTest);

      let questions: Question[] = [];
      questions = structuredClone(liveCourseDiagnosticTest.questions);
      for (let pregunta of questions) {
        delete pregunta["competencias_tmp"];
        delete pregunta["competencias"];
        delete pregunta["isInvalid"];
        delete pregunta["InvalidMessages"];
        delete pregunta["expanded_categorias"];
        delete pregunta["expanded"];
        delete pregunta["uploading_file_progress"];
        delete pregunta["uploading"];
        await activityClassesService.saveQuestion(pregunta, activityId);
      }
    }
    if (liveCourseFinalTest) {
      liveCourseFinalTest.id = null;
      liveCourseFinalTest.coursesRef = [liveCourseRef];
      const activityId = await activityClassesService.saveActivity(liveCourseFinalTest);

      let questions: Question[] = [];
      questions = structuredClone(liveCourseFinalTest.questions);
      for (let pregunta of questions) {
        delete pregunta["competencias_tmp"];
        delete pregunta["competencias"];
        delete pregunta["isInvalid"];
        delete pregunta["InvalidMessages"];
        delete pregunta["expanded_categorias"];
        delete pregunta["expanded"];
        delete pregunta["uploading_file_progress"];
        delete pregunta["uploading"];
        await activityClassesService.saveQuestion(pregunta, activityId);
      }
    }
  }

  public getLiveCoursesDiplomado$(diplomadoId: string): Observable<LiveCourse[]> {
    const diplomadoDocRef = this.afs.collection<LiveDiplomado>(LiveDiplomado.collection).doc(diplomadoId).ref;
    return this.afs.collection<LiveCourse>(LiveCourse.collection, ref => ref.where('diplomadoLiveRef', '==', diplomadoDocRef)).valueChanges();
  }

  getLiveCoursesWithSessionsByDiplomadoId$(diplomadoId: string): Observable<{ liveCourse: LiveCourse, sessions: Session[] }[]> {
    // Obtener la referencia del documento del diplomado
    const diplomadoRef = this.afs.doc<LiveDiplomado>(`${LiveDiplomado.collection}/${diplomadoId}`).ref;
  
    // Obtener los cursos en vivo asociados con el diplomado
    return this.afs.collection<LiveCourse>(LiveCourse.collection, ref => ref.where('diplomadoLiveRef', '==', diplomadoRef)).valueChanges().pipe(
      switchMap((liveCourses: LiveCourse[]) => {
        // Para cada curso en vivo, obtener las sesiones asociadas
        const coursesWithSessions$ = liveCourses.map((liveCourse: LiveCourse) => {
          const liveCourseRef = this.getLiveCourseRefById(liveCourse.id);
          return this.getSessionsByLiveCourseRef$(liveCourseRef).pipe(
            map((sessions: Session[]) => ({
              liveCourse,
              sessions
            }))
          );
        });
        // Combinar todos los observables de sesiones en un solo observable
        return combineLatest(coursesWithSessions$);
      })
    );
  }

  async updateLiveDiplomadoUsers(liveDiplomadoId: string, newUser: any): Promise<void> {
    console.log('updateLiveDiplomadoUsers')
    const liveDiplomadoByStudentRef = this.afs.collection('live-diplomado-by-student').doc();
  
    try {
      // Insertar el usuario directamente con las claves adicionales
      await liveDiplomadoByStudentRef.set({
        liveDiplomadoId,
        liveDiplomadoRef: this.afs.collection('live-diplomado').doc(liveDiplomadoId).ref,
        ...newUser
      });
    } catch (error) {
      console.error("Error adding user to live-diplomado-by-student: ", error);
      throw error;
    }
  }

  getUsersFromLiveDiplomado(liveDiplomadoId: string): Observable<any[]> {
    return this.afs.collection('live-diplomado-by-student', ref => ref.where('liveDiplomadoId', '==', liveDiplomadoId)).valueChanges();
  }

  async updateUserDiplomadoStatus(userId: string, liveDiplomadoId: string, active: boolean): Promise<void> {
    const liveDiplomadoByStudentRef = this.afs.collection('live-diplomado-by-student');
    const liveCourseRef = this.afs.collection(LiveCourse.collection);
    const liveCourseByStudentRef = this.afs.collection(LiveCourseByStudent.collection);
    const batch = this.afs.firestore.batch();
  
    // Constantes para las referencias
    const userRef = this.afs.doc(`${User.collection}/${userId}`).ref;
    const liveDiplomadoRef = this.afs.doc(`${LiveDiplomado.collection}/${liveDiplomadoId}`).ref;
  
    try {
      // Paso 1: Actualizar isActive en live-diplomado-by-student
      const liveDiplomadoSnapshot = await liveDiplomadoByStudentRef.ref
        .where('userRef', '==', userRef)
        .where('liveDiplomadoRef', '==', liveDiplomadoRef)
        .get();
  
      liveDiplomadoSnapshot.forEach(doc => {
        batch.update(doc.ref, { isActive: active });
      });
  
      // Paso 2: Buscar todos los live-course que tengan diplomadoLiveRef que haga match
      const liveCoursesSnapshot = await liveCourseRef.ref
        .where('diplomadoLiveRef', '==', liveDiplomadoRef)
        .get();
  
      const liveCourseIds = liveCoursesSnapshot.docs.map(doc => doc.id);
  
      // Paso 3: Buscar todos los registros en live-course-by-student que tengan userRef y liveCourseRef obtenidos en el paso anterior y actualizar isActive
      for (const liveCourseId of liveCourseIds) {
        const liveCourseRef = this.afs.doc(`${LiveCourse.collection}/${liveCourseId}`).ref;
        const liveCourseByStudentSnapshot = await liveCourseByStudentRef.ref
          .where('userRef', '==', userRef)
          .where('liveCourseRef', '==', liveCourseRef)
          .get();
  
        liveCourseByStudentSnapshot.forEach(doc => {
          batch.update(doc.ref, { isActive: active });
        });
      }
  
      // Commit del batch
      await batch.commit();
    } catch (error) {
      console.error('Error updating user diplomado status: ', error);
      throw error;
    }
  }
  
  
  
  

  

  

}
