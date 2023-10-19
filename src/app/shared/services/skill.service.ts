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
    this.getSkills()
  }

  private skillsSubject = new BehaviorSubject<Skill[]>([]);
  private skill$ = this.skillsSubject.asObservable();
  private categoryRef: DocumentReference
  private enterpriseRef: DocumentReference


  async addSkill(newSkill: Skill): Promise<void> {
    try {
      console.log('skill add',newSkill)
      const ref = this.afs.collection<Skill>(Skill.collection).doc().ref;
      await ref.set({...newSkill.toJson(), id: ref.id}, { merge: true });
      newSkill.id = ref.id;
      this.alertService.succesAlert('Has agregado un nuevo skill exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  // Arguments could be pageSize, sort, currentPage
  // getSkills() {
  //   this.afs.collection<Skill>(Skill.collection).valueChanges().subscribe({
  //     next: skill => {
  //       this.skillsSubject.next(skill)
  //     },
  //     error: error => {
  //       console.log(error)
  //       this.alertService.errorAlert(JSON.stringify(error))
  //     }
  //   })

  // }

  // Arguments could be pageSize, sort, currentPage
  getSkills() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        this.enterpriseRef =this.enterpriseService.getEnterpriseRef();
        // console.log('enterprise',this.enterpriseRef)
        // Query para traer por enterprise match
        const enterpriseMatch$ = this.afs.collection<Skill>(Skill.collection, ref => 
          ref.where('enterprise', '==', this.enterpriseRef)
        ).valueChanges();

        // Query para traer donde enterprise está vacío
        const enterpriseEmpty$ = this.afs.collection<Skill>(Skill.collection, ref => 
          ref.where('enterprise', '==', null) // Suponiendo que el valor vacío es null. Ajusta según tu caso.
        ).valueChanges();

        // Combinar ambos queries
        combineLatest([enterpriseMatch$, enterpriseEmpty$])
          .pipe(
            map(([matched, empty]) => [...matched, ...empty])
          )
          .subscribe({
            next: skills => {
              this.skillsSubject.next(skills);
            },
            error: error => {
              console.log(error);
              this.alertService.errorAlert(JSON.stringify(error));
            }
          });
      }
    })
    
  }

  getSkillsObservable(): Observable<Skill[]> {
    return this.skill$
  }

  public getSkill(id: string) {
    return this.skillsSubject.value.find(x => x.id === id)
  }

  async deleteSkill(skillId: string): Promise<void> {
    try {
      if (!skillId) throw new Error('El ID de la competencia no puede ser nulo o indefinido');
  
      await this.afs.collection(Skill.collection).doc(skillId).delete();
      console.log('Has eliminado la competencia exitosamente.');
      // Puedes descomentar la siguiente línea si quieres mostrar una alerta de éxito al usuario
      // this.alertService.succesAlert('Has eliminado una competencia exitosamente.');
      
    } catch (error) {
      console.error('Error al eliminar la competencia: ', error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }
}
