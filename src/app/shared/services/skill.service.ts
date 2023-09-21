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


@Injectable({
  providedIn: 'root'
})
export class SkillService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {
    //this.getCateogies()
    // this.enterpriseService.getEnterpriseObservable().subscribe(enterprise => {
    //   if (!enterprise) {
    //     return
    //   }
    //   this.enterpriseRef = this.afs.collection<Enterprise>(Enterprise.collection).doc(enterprise.id).ref
    //   this.getSkills()
    // })
    this.getSkills()

  }

  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  private skill$ = this.skillsSubject.asObservable();
  private categoryRef: DocumentReference
  private enterpriseRef: DocumentReference


  async addSkill(newSkill: Skill): Promise<void> {
    try {
      try {
        await this.afs.collection(Skill.collection).doc(newSkill?.id).set(newSkill.toJson());
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una nueva competencia exitosamente.')
      //this.alertService.succesAlert('Has agregado una nueva categoria exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  // Arguments could be pageSize, sort, currentPage
  getSkills() {
    this.afs.collection<Skill>(Skill.collection).valueChanges().subscribe({
      next: skill => {
        this.skillsSubject.next(skill)
      },
      error: error => {
        console.log(error)
        this.alertService.errorAlert(JSON.stringify(error))
      }
    })

  }

  getSkillsObservable(): Observable<Skill[]> {
    return this.skill$
  }
}
