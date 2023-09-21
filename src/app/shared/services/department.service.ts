import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Department } from '../models/department.model';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';

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
  ) {
   }

  public async loadDepartmens() {
    this.getDepartments()
    this.departmentsLoaded = new Promise<void>((resolve) => {
      this.departments$.subscribe(async (department) => {
        if (department) {
          resolve();
        }
      });
    });
  }

  private getDepartments() {
    this.afs.collection<Department>(Department.collection).valueChanges().subscribe({
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


}
