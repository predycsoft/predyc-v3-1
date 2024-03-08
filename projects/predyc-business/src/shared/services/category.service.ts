import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from 'projects/shared/models/enterprise.model';

import { Category } from 'projects/shared/models/category.model';

import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {
    this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.empresa = enterprise
      }
    })
    this.getCategories()
  }

  private categorySubject = new BehaviorSubject<Category[]>([]);
  private category$ = this.categorySubject.asObservable();
  private categoryRef: DocumentReference
  private enterpriseRef: DocumentReference
  private empresa


  async addCategory(newCategory: Category): Promise<void> {
    const ref = this.afs.collection<Category>(Category.collection).doc().ref;
    await ref.set({...newCategory.toJson(), id: ref.id}, { merge: true });
    newCategory.id = ref.id;
  }

  // Arguments could be pageSize, sort, currentPage
  getCategories() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (!isLoaded) {
        return
      }
      this.enterpriseRef =this.enterpriseService.getEnterpriseRef()

    // Query para traer por enterprise match
    const enterpriseMatch$ = this.afs.collection<Category>(Category.collection, ref => 
      ref.where('enterprise', '==', this.enterpriseRef)
          .orderBy('name')
    ).valueChanges();

    // Query para traer donde enterprise está vacío
    const enterpriseEmpty$ = this.afs.collection<Category>(Category.collection, ref => 
      ref.where('enterprise', '==', null) // Suponiendo que el valor vacío es null. Ajusta según tu caso.
          .orderBy('name')
    ).valueChanges();

    // Combinar ambos queries
    combineLatest([enterpriseMatch$, enterpriseEmpty$])
      .pipe(
        map(([matched, empty]) => [...matched, ...empty])
      )
      .subscribe({
        next: categories => {
          this.categorySubject.next(categories);
        },
        error: error => {
          console.log(error);
          this.alertService.errorAlert(JSON.stringify(error));
        }
      });
    })
  }

  getCategories$(): Observable<Category[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        this.enterpriseRef =this.enterpriseService.getEnterpriseRef()
    
        // Query para traer por enterprise match
        const enterpriseMatch$ = this.afs.collection<Category>(Category.collection, ref => 
          ref.where('enterprise', '==', this.enterpriseRef)
              .orderBy('name')
        ).valueChanges();
    
        // Query para traer donde enterprise está vacío
        const enterpriseEmpty$ = this.afs.collection<Category>(Category.collection, ref => 
          ref.where('enterprise', '==', null) // Suponiendo que el valor vacío es null. Ajusta según tu caso.
              .orderBy('name')
        ).valueChanges();
    
        // Combinar ambos queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$])
          .pipe(
            map(([matched, empty]) => [...matched, ...empty])
          )
      })
    )
  }

  getCategoriesObservable(): Observable<Category[]> {
    return this.category$
  }

  public getCategoryRefById(id: string): DocumentReference<Category> {
    return this.afs.collection<Category>(Category.collection).doc(id).ref
  }
}
