import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from 'projects/shared/models/enterprise.model';

import { Category, CategoryJson } from 'projects/shared/models/category.model';

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


  async addCategory(category: Category): Promise<string> {
    let categoryId: string = category.id;
  
    if (!categoryId) {
      categoryId = this.afs.createId();
      category.id = categoryId;
    }

    const ref = this.afs.collection<Category>(Category.collection).doc(categoryId).ref;
    await ref.set({...category.toJson()}, { merge: true });
    return categoryId
  }

  async deleteCategoryById(categoryId: string): Promise<void> {
    return await this.afs.collection(Category.collection).doc(categoryId).delete()
  }

  async saveCategories(categories: CategoryJson[]): Promise<CategoryJson[]> {
    const batch = this.afs.firestore.batch();
    const pillarsWithId: CategoryJson[] = [];

    categories.forEach((category) => {
      const docRef = this.afs.firestore.collection(Category.collection).doc();
      const updatedCategory = {
        ...category,
        id: docRef.id,
      };
      batch.set(docRef, updatedCategory, { merge: true });
      pillarsWithId.push(updatedCategory)
    });
    // Commit the batch write to Firestore
    try {
      await batch.commit();
      return pillarsWithId;
    } catch (error) {
      console.error("Error saving tags: ", error);
      throw error;
    }
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

  getCategoriesByIds(categorieIDs: string[]): Observable<CategoryJson[]> {
    if (!categorieIDs || categorieIDs.length === 0) {
      return of([]);
    }

    const categoryObservables = categorieIDs.map(tagId => this.afs.collection<Category>(Category.collection).doc(tagId).valueChanges());
    return combineLatest(categoryObservables)
  }

  getAllCategories$(): Observable<Category[]> {
    return this.afs.collection<Category>(Category.collection, ref => ref.orderBy("name", "asc")).valueChanges()
  }
}
