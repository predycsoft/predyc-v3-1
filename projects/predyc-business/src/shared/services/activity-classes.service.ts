import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
import { BehaviorSubject, catchError, combineLatest, defaultIfEmpty, firstValueFrom, forkJoin, map, Observable, of, Subscription, switchMap, zip } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';

import { Skill } from 'projects/shared/models/skill.model';
import { Clase } from 'projects/shared/models/course-class.model';

import { Activity } from 'projects/shared/models/activity-classes.model';
import { Question } from 'projects/shared/models/activity-classes.model';
import { Profile } from 'projects/shared/models/profile.model';
import { CourseService } from './course.service';





@Injectable({
  providedIn: 'root'
})
export class ActivityClassesService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService,
    private courseService : CourseService
  ) {
    this.enterpriseService.enterpriseLoaded$.subscribe(enterpriseIsLoaded => {
      if (enterpriseIsLoaded) {
        this.getActivities();
      }
    })
  }

  private activitiesSubject = new BehaviorSubject<Activity[]>([]);
  public activities$ = this.activitiesSubject.asObservable();
  activityCollectionSubscription: Subscription
  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  


  async addActivity(newActivity: Activity): Promise<void> {
    const ref = this.afs.collection<Activity>(Activity.collection).doc().ref;
    await ref.set({ ...newActivity.toJson(), id: ref.id }, { merge: true });
    newActivity.id = ref.id;
  }

  async addQuestion(activityId: string, newQuestion: Question): Promise<void> {
    const ref = this.afs.collection<Question>(Activity.collection)
      .doc(activityId).collection(Question.collection).doc().ref;
    await ref.set({ ...newQuestion, id: ref.id }, { merge: true });
    newQuestion.id = ref.id;
  }

  

  async saveActivity(newActivity: Activity): Promise<void> {
    try {
      // console.log('saveActivity',newActivity)
      let ref: DocumentReference;
      if (newActivity.id) {
        ref = this.afs.collection<Activity>(Activity.collection).doc(newActivity.id).ref;
      } else {
        ref = this.afs.collection<Activity>(Activity.collection).doc().ref;
        newActivity.id = ref.id;
      }
      const dataToSave = typeof newActivity.toJson === 'function' ? newActivity.toJson() : newActivity;
      await ref.set(dataToSave, { merge: true });
      newActivity.id = ref.id;
  } catch (error) {
      newActivity.id = null;
      console.log('error',error,newActivity)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async saveQuestion(newQuestion: Question, idActivity): Promise<void> {
    // console.log('saveQuestion', newQuestion)
    try {
      let ref: DocumentReference;
      if (!newQuestion.id) {
        // console.log('crear pregunta')
        // If there's no ID, create a new document and assign the ID
        ref = this.afs.collection(Activity.collection)
                      .doc(idActivity)
                      .collection(Question.collection)
                      .doc().ref;
        newQuestion.id = ref.id;
      } else {
        // If an ID exists, just reference the existing document
        // console.log('actualizar pregunta')
        ref = this.afs.collection(Activity.collection)
                      .doc(idActivity)
                      .collection(Question.collection)
                      .doc(newQuestion.id).ref;
      }
      
      const dataToSave = newQuestion;
  
      // console.log('ref question', ref, dataToSave)
      // Save or update the question document in Firestore
      await ref.set({ ...dataToSave, id: ref.id }, { merge: true });
      
      console.log('Has agregado una pregunta exitosamente.')
    } catch (error) {
      console.log(error)
      newQuestion.id = null; // Reset the ID in case of error
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async removeQuestions(QuestionsIds: string[], idActivity: string): Promise<void> {
    try {
      // Obtener la referencia a la subcolección de preguntas para la actividad dada
      const questionsCollectionRef = this.afs.collection(Activity.collection)
                                              .doc(idActivity)
                                              .collection(Question.collection);
  
      // Obtener todas las preguntas para la actividad dada
      const snapshot = await questionsCollectionRef.ref.get();
  
      // Filtrar y eliminar preguntas que no están en QuestionsIds
      snapshot.docs.forEach(doc => {
        if (!QuestionsIds.includes(doc.id)) {
          console.log(`Eliminando pregunta con ID ${doc.id}...`);
          questionsCollectionRef.doc(doc.id).delete()
            .then(() => console.log(`Pregunta con ID ${doc.id} eliminada.`))
            .catch(error => console.error(`Error eliminando pregunta con ID ${doc.id}: `, error));
        }
      });
  
      console.log('Proceso de eliminación completado.');
    } catch (error) {
      console.error('Error al eliminar preguntas:', error);
      this.alertService.errorAlert(JSON.stringify(error)); // Asegúrate de tener un servicio de alertas o maneja el error como prefieras
    }
  }
  
  
  

  getQuestionsCourses(courseIds: string[]): Observable<any> {
    // Convert string IDs to DocumentReferences
    const courseRefs: DocumentReference[] = courseIds.map(id => this.afs.doc(`course/${id}`).ref);

    return this.afs.collection('activity', ref => ref.where('coursesRef', 'array-contains-any', courseRefs))
    .get()
    .pipe(
      switchMap(activitiesSnap => {
        const questionsObservables = activitiesSnap.docs.map(activityDoc => {
          return this.afs.collection(`activity/${activityDoc.id}/question`).valueChanges();
        });
        
        if (questionsObservables.length > 0) {
          return zip(...questionsObservables);
        }
        return of([]);
      }),
      map(questionsArray => {
        // Flatten the array
        return [].concat(...questionsArray);
      })
    );
  }

  getActivityAndQuestionsForCourse(courseId: string): Observable<any[]> {

    const courseRef = this.courseService.getCourseRefById(courseId);
    console.log('courseRef getActivityAndQuestionsForCourse',courseRef);
    return this.afs.collection('activity', ref => 
      ref.where('coursesRef', 'array-contains', courseRef)
          .where('type', '==', 'regular')
      )
    .get()
    .pipe(
      switchMap(activitiesSnap => {
        const activities = activitiesSnap.docs.map(doc => doc.data());
        const questionsObservables = activitiesSnap.docs.map(activityDoc => {
          return this.afs.collection(`${Activity.collection}/${activityDoc.id}/${Question.collection}`).valueChanges();
        });
        if (questionsObservables.length > 0) {
          return zip(...questionsObservables).pipe(
            map(questionsArray => {
              return activities.map((activity, index) => {
                return {
                  ...activity as Activity,
                  questions: questionsArray[index]
                }
              });
            })
          );
        }
        // In case no questions are found, return the activities as they are
        return of(activities);
      })
    );
  }

  deleteQuestion(idActivity: string, idQuestion: string) {
    // Access the specific 'question' document within the 'activity' document
    const questionRef = this.afs.doc(`activity/${idActivity}/question/${idQuestion}`);
  
    // Delete the document
    return questionRef.delete();
  }

  getActivityProfile(idProfile) {
    const profileRef: DocumentReference = this.afs.doc(`profile/${idProfile}`).ref;
    // Fetch activity using the profileRef
    return this.afs.collection('activity', ref => ref.where('profileRef', '==', profileRef))
      .valueChanges() // or .get() based on your needs
      .pipe(
        switchMap(activities => {
          if (activities && activities.length > 0) {
            const activity = activities[0] as Activity; // Assuming only one activity matches
            // Fetch questions of the matched activity
            return this.afs.collection(`${Activity.collection}/${activity.id}/${Question.collection}`).valueChanges()
              .pipe(
                map(questions => {
                  return { ...activity as any, questions };
                })
              );
          }
          return of(null); // or you can return an empty object or handle it another way
        })
      );
  }

  getActivityCoruse(idCourse) {
    const courseRef: DocumentReference = this.afs.doc(`course/${idCourse}`).ref;
    // Fetch activity using the courseRef
    // console.log('courseRef getActivityCoruse',courseRef)
    return this.afs.collection('activity', ref => 
      ref.where('coursesRef', 'array-contains', courseRef)
      .where('type', '==', 'test')
      )
      .valueChanges() // or .get() based on your needs
      .pipe(
        switchMap(activities => {
          if (activities && activities.length > 0) {
            const activity = activities[0] as Activity; // Assuming only one activity matches
            // Fetch questions of the matched activity
            return this.afs.collection(`${Activity.collection}/${activity.id}/${Question.collection}`).valueChanges()
              .pipe(
                map(questions => {
                  return { ...activity as any, questions };
                })
              );
          }
          return of(null); // or you can return an empty object or handle it another way
        })
      );
  }

  getActivityById(idActivity: string): Observable<any> {
    const activityDocRef = this.afs.doc<Activity>(`${Activity.collection}/${idActivity}`);
  
    return activityDocRef.snapshotChanges().pipe(
      switchMap(doc => {
        const activity = { id: doc.payload.id, ...doc.payload.data() as Activity };
  
        // Asumiendo que cada actividad tiene una subcolección de preguntas
        return this.afs.collection<Question>(`${Activity.collection}/${idActivity}/${Question.collection}`).snapshotChanges().pipe(
          map(actions => {
            const questions = actions.map(a => {
              return { id: a.payload.doc.id, ...a.payload.doc.data() as Question };
            });
            // Combinar los datos de la actividad con sus preguntas
            return { ...activity, questions };
          })
        );
      })
    );
  }

  getActivityResults(idActivity: string): Observable<any> {
    const activityDocRef = this.afs.doc<Activity>(`${Activity.collection}/${idActivity}`).ref;
    console.log('getActivityResults',activityDocRef)
    return this.afs.collection<any>('profileTestsByStudent', (ref) =>ref.where("activityRef", "==", activityDocRef)).valueChanges({ idField: "id" })

  }

  getActivities() {
    if (this.activityCollectionSubscription) {
      console.log("Has to unsubscribe before")
      this.activityCollectionSubscription.unsubscribe();
    }
    this.activityCollectionSubscription = this.afs.collection<Activity>(Activity.collection, ref => 
      ref
        .where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
        .orderBy('updatedAt', 'desc')
      ).valueChanges().subscribe(activities => {
      console.log("New activities", activities)
      this.activitiesSubject.next(activities)
    })
  }

  getActivitesSubjectValue() {
    return this.activitiesSubject.value
  }

  async deleteActivity(activityId: string) {
    try {
      // Verificar si hay una subcolección
      const subcollectionRef = this.afs.collection(Activity.collection).doc(activityId).collection(Activity.questionSubCollection);
      const subcollectionSnapshot = await firstValueFrom(subcollectionRef.get());
      if (!subcollectionSnapshot.empty) {
        // Si existe la eliminamos
        await this.deleteSubcollection(activityId, subcollectionSnapshot);
        console.log("subcoleccion eliminada")
      }
      // Eliminamos el documento principal
      await this.afs.collection(Activity.collection).doc(activityId).delete();
      console.log("Actividad eliminada")
      this.alertService.infoAlert('Has eliminado la actividad exitosamente.')

    } catch (error) {
      console.error(error);
    }
  }

  async deleteSubcollection(activityId: string, subcollectionSnapshot: any): Promise<void> {
    subcollectionSnapshot.forEach(async doc => {
      console.log("doc", doc)
      await this.afs.collection(Activity.collection).doc(activityId).collection(Activity.questionSubCollection).doc(doc.id).delete();
    });
  }

  getActivityCertifications(): Observable<any> {
    return this.afs.collection(Activity.collection, ref => ref.where('type', '==', 'testCertification'))
      .valueChanges({ idField: 'id' })
      .pipe(
        switchMap(activities => {
          console.log('Actividades encontradas:', activities);
          if (activities.length > 0) {
            const questionsObservables = activities.map(activity =>
              this.afs.collection(`${Activity.collection}/${activity.id}/${Question.collection}`)
                .valueChanges({ idField: 'id' })
                .pipe(
                  defaultIfEmpty([]), // Asegurar que cada observable emite al menos un valor.
                  map(questions => ({ ...activity, questions }))
                )
            );
            return combineLatest(questionsObservables); // Emitir cada vez que cualquier observable emite
          }
          return of([]); // No hay actividades, devuelve un arreglo vacío
        })
      );
  }
  
  

  





}
