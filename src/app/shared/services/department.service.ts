import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Department } from '../models/department.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { EnterpriseService } from './enterprise.service';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {

  private departmentsLoaded: Promise<void>
  private departmentSubject = new BehaviorSubject<Department[]>([]);
  private departments$ = this.departmentSubject.asObservable();

  constructor(
    private alertService: AlertsService,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,

  ) {
   }

  public async loadDepartmens() {

    console.log("Se instancio el user service")
    this.enterpriseService.enterpriseLoaded$.subscribe(enterpriseIsLoaded => {
      if (enterpriseIsLoaded) {
        this.getDepartments()
        this.departmentsLoaded = new Promise<void>((resolve) => {
          this.departments$.subscribe(async (department) => {
            if (department) {
              resolve();
            }
          });
        });
      }
    })
  }

  private getDepartments() {
    this.afs.collection<Department>(Department.collection, ref => ref.where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())).valueChanges().subscribe({
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

  public async getDepartment(id: string): Promise<Department | undefined> {
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


}
