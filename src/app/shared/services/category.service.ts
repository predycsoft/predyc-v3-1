import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { UtilsService } from './utils.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from '../models/enterprise.model';

import { Category } from '../models/category.model';

import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private utilsService: UtilsService,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {
    //this.getCateogies()
    this.enterpriseService.getEnterpriseObservable().subscribe(enterprise => {
      if (!enterprise) {
        return
      }
      this.enterpriseRef = this.afs.collection<Enterprise>(Enterprise.collection).doc(enterprise.id).ref
      this.getCategories()
    })
  }

  private categorySubject = new BehaviorSubject<Category[]>([]);
  private category$ = this.categorySubject.asObservable();
  private categoryRef: DocumentReference
  private enterpriseRef: DocumentReference


  async addCategory(newCategory: Category): Promise<void> {
    try {
      try {
        await this.afs.collection(Category.collection).doc(newCategory?.id).set(newCategory.toJson());
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una nueva categoria exitosamente.')
      //this.alertService.succesAlert('Has agregado una nueva categoria exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  // Arguments could be pageSize, sort, currentPage
  getCategories() {
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
  }

  getCategoriesObservable(): Observable<Category[]> {
    return this.category$
  }
}
