import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Department } from '../models/department.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { EnterpriseService } from './enterprise.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  private departmentsLoaded: Promise<void>
  private departmentSubject = new BehaviorSubject<Department[]>([]);
  private departments$ = this.departmentSubject.asObservable();

  private departmentsLoadedSubject = new BehaviorSubject<boolean>(false)
  public departmentsLoaded$ = this.departmentsLoadedSubject.asObservable();



  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,

  ) {
   }

  public async loadDepartmens() {

    this.enterpriseService.enterpriseLoaded$.subscribe(enterpriseIsLoaded => {
      if (enterpriseIsLoaded) {
        this.getDepartments()
        this.departmentsLoaded = new Promise<void>((resolve) => {
          this.departments$.subscribe(async (departments) => {
            if (departments.length>0) {
              resolve();
              if (!this.departmentsLoadedSubject.value) {
                this.departmentsLoadedSubject.next(true)
                console.log("Los departamentos fueron cargados", departments)
              }
            }
          });
        });
      }
    })
  }

  private getDepartments() {
    this.afs.collection<Department>(Department.collection, ref => 
      ref
      .where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
      .orderBy('name', 'asc')
      ).valueChanges().subscribe({
      next: department => {
        this.departmentSubject.next(department)
      },
      error: error => {
        console.log(error)
        this.alertService.errorAlert(JSON.stringify(error))
      }
    })
  }

  public getDepartmentsObservable(): Observable<Department[]> {
    return this.departments$
  }

  public whenDepartmentsLoaded(): Promise<void> {
    return this.departmentsLoaded;
  }

  public getDepartment(id: string): Department {
    return this.departmentSubject.value.find(x => x.id === id)
  }

  async addDepartment(newDepartment: Department): Promise<void> {
      try {
        const ref = this.afs.collection<Department>(Department.collection).doc().ref;
        await ref.set({...newDepartment.toJson(), id: ref.id}, { merge: true });
        newDepartment.id = ref.id;
        console.log('Has agregado una departamento exitosamente.')
        //await this.afs.collection(Department.collection).doc(newDepartment?.id).set(newDepartment.toJson());
      } catch (error) {
        console.log(error)
        this.alertService.errorAlert(JSON.stringify(error))
      }
      //this.alertService.succesAlert('Has agregado una nueva categoria exitosamente.')
  }

  async saveDepartment(department: Department): Promise<boolean> {
    try {
      let ref: DocumentReference;
      // If department has an ID, then it's an update
      if (department.id) {
        ref = this.afs.collection<Department>(Department.collection).doc(department.id).ref;
      } else {
        // Else, it's a new profile
        ref = this.afs.collection<Department>(Department.collection).doc().ref;
        department.id = ref.id; // Assign the generated ID to the profile
      }
      await ref.set(department.toJson(), { merge: true });
      department.id = ref.id; // Assign the generated ID to the profile
      console.log('Operation successful.')
      return true; // Return true if successful
    } catch (error) {
      department.id = null; // Assign the generated ID to the profile
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
      return false; // Return true if successful
    }
  }

  async deleteDepartment(departmentId: string): Promise<boolean> {
    try {
      await this.afs.collection(Department.collection).doc(departmentId).delete();
      return true
    } catch (error) {
      console.error(error);
      return false
      // Manejar el error, por ejemplo, mostrando un alerta al usuario.
    }
  }

  getDepartmentByProfileId(profileId: string) {
    // Encuentra el primer departamento que contiene el profileId en su array de profilesRef
    const department = this.departmentSubject.value.find(dep => 
      dep.profilesRef.some(docRef => docRef.id === profileId)
    );
      console.log("department by profile id", department)
    return department;
  }

}
