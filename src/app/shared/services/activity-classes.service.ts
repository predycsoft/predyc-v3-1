import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, map, Observable, of, switchMap, zip } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';

import { Skill } from '../models/skill.model';
import { Clase } from '../models/course-class.model';

import { Activity } from '../models/activity-classes.model';
import { Question } from '../models/activity-classes.model';


@Injectable({
  providedIn: 'root'
})
export class ActivityClassesService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {

  }
  private skillsSubject = new BehaviorSubject<Skill[]>([]);

  async saveActivity(newActivity: Activity): Promise<void> {
    try {

      let ref: DocumentReference;
      if (newActivity.id) {
        ref = this.afs.collection<Activity>(Activity.collection).doc(newActivity.id).ref;
      } else {
        ref = this.afs.collection<Activity>(Activity.collection).doc().ref;
      }
      //const ref = this.afs.collection<Activity>(Activity.collection).doc().ref;
      const dataToSave = typeof newActivity.toJson === 'function' ? newActivity.toJson() : newActivity;
      await ref.set({ ...dataToSave, id: ref.id }, { merge: true });
      newActivity.id = ref.id;
      console.log("Activity added succesfully")
      this.alertService.succesAlert('Has agregado una actividad exitosamente.')
  } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async saveQuestion(newQuestion: Question,idActivity): Promise<void> {
    try {
      try {
        await this.afs.collection(Activity.collection) // Referenciamos la colección principal
        .doc(idActivity) // Referenciamos el documento principal
        .collection(Question.collection) // Referenciamos la subcolección
        .doc(newQuestion.id) // Referenciamos el documento en la subcolección, o .add() para crear uno con ID automático
        .set(newQuestion, { merge: true }); // Guardamos/actualizamos el documento en la subcolección
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una pregunta exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
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

  deleteQuestion(idActivity: string, idQuestion: string) {
    // Access the specific 'question' document within the 'activity' document
    const questionRef = this.afs.doc(`activity/${idActivity}/question/${idQuestion}`);
  
    // Delete the document
    return questionRef.delete();
  }


}
