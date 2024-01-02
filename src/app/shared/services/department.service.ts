import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { Department } from '../models/department.model';
import { Enterprise } from '../models/enterprise.model';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  constructor(
    private afs: AngularFirestore
  ) { }

  public async add(department: Department) {
    const ref = this.afs.collection<Department>(Department.collection).doc().ref;
    await ref.set({...department.toJson(), id: ref.id}, { merge: true });
    department.id = ref.id;
  }

  public getDepartments(enterpriseRef: DocumentReference<Enterprise>): Observable<Department[]> {
    return this.afs.collection<Department>(Department.collection, ref=> ref.where('enterpriseRef', '==', enterpriseRef)).valueChanges()
  }

  public getDepartmentRefById(id: string): DocumentReference<Department> {
    return this.afs.collection<Department>(Department.collection).doc(id).ref
  }
}
