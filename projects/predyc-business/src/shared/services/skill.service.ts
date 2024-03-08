import { Injectable } from '@angular/core';
import { User } from 'projects/shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from 'projects/shared/models/enterprise.model';

import { Category } from 'projects/shared/models/category.model';

import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Skill } from 'projects/shared/models/skill.model';


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
    const ref = this.afs.collection<Skill>(Skill.collection).doc().ref;
    await ref.set({...newSkill.toJson(), id: ref.id}, { merge: true });
    newSkill.id = ref.id;
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

  getSkills$(): Observable<Skill[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
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
        return combineLatest([enterpriseMatch$, enterpriseEmpty$])
          .pipe(
            map(([matched, empty]) => [...matched, ...empty])
          )
      })
    )
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

  public getSkillRefById(id: string): DocumentReference<Skill> {
    return this.afs.collection<Skill>(Skill.collection).doc(id).ref
  }
}
