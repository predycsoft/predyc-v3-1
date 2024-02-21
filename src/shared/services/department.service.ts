import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Observable, switchMap } from 'rxjs';
import { Department } from '../models/department.model';
import { Enterprise } from '../models/enterprise.model';
import { EnterpriseService } from './enterprise.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService
  ) { }

  public async add(department: Department) {
    const ref = this.afs.collection<Department>(Department.collection).doc().ref;
    await ref.set({...department.toJson(), id: ref.id}, { merge: true });
    department.id = ref.id;
  }

  public getDepartments$(): Observable<Department[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
            
        return this.afs.collection<Department>(Department.collection, ref=> ref.where('enterpriseRef', '==', enterpriseRef)).valueChanges()
      })
    )
    
  }

  public getDepartmentRefById(id: string): DocumentReference<Department> {
    return this.afs.collection<Department>(Department.collection).doc(id).ref
  }
}
