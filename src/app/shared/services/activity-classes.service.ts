import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
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
      try {
        await this.afs.collection(Activity.collection).doc(newActivity?.id).set(newActivity, { merge: true });
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una actividad exitosamente.')
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


}
