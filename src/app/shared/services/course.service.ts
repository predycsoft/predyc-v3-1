import { Injectable } from '@angular/core';
import { User } from '../../shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';
import { Enterprise } from '../models/enterprise.model';

import { Category } from '../models/category.model';

import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Skill } from '../models/skill.model';
import { Curso } from '../models/course.model';
import { Modulo } from '../models/module.model';
import { Clase } from '../models/course-class.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {
    this.getCourses();
  }

  private coursesSubject = new BehaviorSubject<Curso[]>([]);
  private course$ = this.coursesSubject.asObservable();

  private enterpriseRef: DocumentReference


  async saveCourse(newCourse: Curso): Promise<void> {
    try {
      try {
        await this.afs.collection(Curso.collection).doc(newCourse?.id).set(newCourse, { merge: true });
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una nuevo curso exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  _getCourses() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {

      
        this.enterpriseRef = this.enterpriseService.getEnterpriseRef();
      
        console.log('enterprise', this.enterpriseRef);
      
        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs.collection<Curso>(Curso.collection, ref =>
          ref.where('enterpriseRef', '==', this.enterpriseRef)
        ).valueChanges({ idField: 'id' });
      
        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs.collection<Curso>(Curso.collection, ref =>
          ref.where('enterpriseRef', '==', null)
        ).valueChanges({ idField: 'id' });
      
        // Combine both queries
        combineLatest([enterpriseMatch$, enterpriseEmpty$])
          .pipe(
            map(([matched, empty]) => [...matched, ...empty]),
            switchMap(courses => {
              if (!courses.length) return of([]); // Return an observable of an empty array if there are no courses.
              
              const coursesWithModules$ = courses.map(course => {
                return this.afs.collection(`${Curso.collection}/${course.id}/${Modulo.collection}`).valueChanges({ idField: 'moduleId' })
                  .pipe(
                    map(modules => ({ ...course, modules }))
                  );
              });
              return combineLatest(coursesWithModules$);
            })
          )
          .subscribe({
            next: courses => {
              this.coursesSubject.next(courses);
            },
            error: error => {
              console.log(error);
              this.alertService.errorAlert(JSON.stringify(error));
            }
          });
      }
    })
  }

  getCourses() {
    try {
      this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
        if (isLoaded) {
          
          this.enterpriseRef = this.enterpriseService.getEnterpriseRef();
      
          // Query to get by enterprise match
          const enterpriseMatch$ = this.afs.collection<Curso>(Curso.collection, ref => 
            ref.where('enterpriseRef', '==', this.enterpriseRef)
          ).valueChanges();
      
          // Query to get where enterprise is empty
          const enterpriseEmpty$ = this.afs.collection<Curso>(Curso.collection, ref => 
            ref.where('enterpriseRef', '==', null)
          ).valueChanges();
      
          this.course$ = combineLatest([enterpriseMatch$, enterpriseEmpty$])
            .pipe(
              map(([matched, empty]) => [...matched, ...empty]),
              switchMap(courses =>
                combineLatest(
                  courses.map(course =>
                    this.afs.collection(`${Curso.collection}/${course.id}/${Modulo.collection}`)
                      .valueChanges()
                      .pipe(
                        switchMap(modules =>
                          combineLatest(
                            modules.map(module =>
                              combineLatest(
                                module['clasesRef'].map(claseRef =>
                                  this.afs.doc<Clase>(`${Clase.collection}/${claseRef.id}`).valueChanges()
                                )
                              ).pipe(
                                map(clases => (Object.assign({}, module, { clases })))
                              )
                            )
                          )
                        ),
                        map(modulesWithClases => ({ ...course, modules: modulesWithClases }))
                      )
                  )
                )
              )
            );
      
          // Subscribing to the final Observable
          this.course$.subscribe({
            next: courses => {
              this.coursesSubject.next(courses);
            },
            error: error => {
              console.log(error);
              this.alertService.errorAlert(JSON.stringify(error));
            }
          });
        }
      })
    } catch (error) {
      console.error(error);
      // Handle the error appropriately
    }
  }
  getCoursesObservable(): Observable<Curso[]> {
    return this.course$
  }


  public getCourseRefById(id: string): DocumentReference<Curso> {
    return this.afs.collection<Curso>(Curso.collection).doc(id).ref
  }

}
