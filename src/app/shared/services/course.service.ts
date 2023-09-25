import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from '../models/enterprise.model';

import { Category } from '../models/category.model';

import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Skill } from '../models/skill.model';
import { Curso } from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {

  }

  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  private skill$ = this.skillsSubject.asObservable();

  private enterpriseRef: DocumentReference


  async saveCourse(newCourse: Curso): Promise<void> {
    try {
      try {
        await this.afs.collection(Curso.collection).doc(newCourse?.id).set(newCourse, { merge: true });
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una nuevo curso exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

}
