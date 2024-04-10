import { Injectable } from '@angular/core';
import { User } from 'projects/shared/models/user.model';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import { BehaviorSubject, firstValueFrom, Observable, of } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';

import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Curso } from 'projects/shared/models/course.model';
import { Modulo } from 'projects/shared/models/module.model';
import { Clase } from 'projects/shared/models/course-class.model';
import { CourseByStudent, CourseByStudentJson } from 'projects/shared/models/course-by-student.model';
import { UserService } from './user.service';
import { ProfileService } from './profile.service';
import { ClassByStudent } from 'projects/shared/models/class-by-student.model';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model'
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { Product } from 'projects/shared/models/product.model';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';

@Injectable({
  providedIn: 'root'
})
export class CourseService {

  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private profileService: ProfileService,
    private alertService: AlertsService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
		private productService: ProductService,
  ) 
  {
    this.getCourses();
    //this.fixCoursesCustomURL();
    
  }

  private coursesSubject = new BehaviorSubject<Curso[]>([]);
  private course$ = this.coursesSubject.asObservable();

  private enterpriseRef: DocumentReference




  
  async fixCoursesCustomURL(){

    console.log('fixCoursesCustomURL')

    const batch = this.afs.firestore.batch();
  
    // Referencia a la colección de 'skill'
    const collectionRef = this.afs.collection(Curso.collection).ref;
    
    // Obtiene todos los documentos de la colección 'skill'
    const snapshot = await collectionRef.get();
    
    // Itera sobre cada documento y actualiza el campo 'enterprise' a null
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { customUrl: ""});
    });
  
    // Ejecuta el batch write
    await batch.commit();
    
  }

  
  async fixClasses() {
    console.log('fix classes')
    // Referencia a la colección de 'class'
    const classCollectionRef = this.afs.collection('class').ref;
  
    // Obtiene todos los documentos de la colección 'class'
    const classSnapshot = await classCollectionRef.get();
  
    const batch = this.afs.firestore.batch();
  
    for (const doc of classSnapshot.docs) {
      const classData = doc.data();
      // Verifica si el documento tiene un instructorRef
      if (classData['instructorRef']) {
        try {
          // Obtiene el documento del instructor
          const instructorDoc = await classData['instructorRef'].get();
          if (instructorDoc.exists) {
            const instructorData = instructorDoc.data();
            // Verifica si el instructor tiene un enterpriseRef
            console.log('instructorData',instructorData)
            batch.update(doc.ref, { enterpriseRef: instructorData.enterpriseRef });
          }
        } catch (error) {
          console.error("Error al obtener el documento del instructor:", error);
        }
      }
    }
  
    // Ejecuta el batch write
    await batch.commit();
  }
  


  async saveCourse(newCourse: Curso): Promise<void> {
    try {
      try {
        console.log('test saveCourse',newCourse)
        delete newCourse['modules'];
        const dataToSave = typeof newCourse.toJson === 'function' ? newCourse.toJson() : newCourse;

        await this.afs.collection(Curso.collection).doc(newCourse?.id).set(dataToSave, { merge: true });
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
  
          // Fetch all classes once
          const allClasses$ = this.afs.collection<Clase>(Clase.collection).valueChanges();
  
          // Query to get by enterprise match
          const enterpriseMatch$ = this.afs.collection<any>(Curso.collection, ref => 
            ref.where('enterpriseRef', '==', this.enterpriseRef)
          ).valueChanges();
  
          // Query to get where enterprise is empty
          const enterpriseEmpty$ = this.afs.collection<Curso>(Curso.collection, ref => 
            ref.where('enterpriseRef', '==', null)
          ).valueChanges();
  
          this.course$ = combineLatest([enterpriseMatch$, enterpriseEmpty$, allClasses$]).pipe(
            map(([matched, empty, allClasses]) => {
              // Combine matched and empty courses
              const combinedCourses = [...matched, ...empty];
  
              // Process each course
              return combinedCourses.map(course => {
                // Fetch modules for each course
                const modules$ = this.afs.collection(`${Curso.collection}/${course.id}/${Modulo.collection}`).valueChanges();
  
                return modules$.pipe(
                  map(modules => {
                    // For each module, find and attach the relevant classes
                    const modulesWithClasses = modules.map(module => {
                      const classes = module['clasesRef'].map(claseRef => 
                        allClasses.find(clase => clase.id === claseRef.id)
                      );
  
                      return { ...module as Modulo, clases: classes };
                    });
  
                    return { ...course, modules: modulesWithClasses };
                  })
                );
              });
            }),
            switchMap(courseModulesObservables => combineLatest(courseModulesObservables))
          );
  
          // Subscribing to the final Observable
          this.course$.subscribe({
            next: courses => {
              this.coursesSubject.next(courses);
            },
            error: error => {
              console.error(error);
              this.alertService.errorAlert(JSON.stringify(error));
            }
          });
        }
      });
    } catch (error) {
      console.error(error);
      // Handle the error appropriately
    }
  }
  

  __getCourses() {
    try {
      this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
        if (isLoaded) {
          
          this.enterpriseRef = this.enterpriseService.getEnterpriseRef();
      
          // Query to get by enterprise match
          const enterpriseMatch$ = this.afs.collection<any>(Curso.collection, ref => 
            ref.where('enterpriseRef', '==', this.enterpriseRef).where('proximamente','==', false)
          ).valueChanges();
      
          // Query to get where enterprise is empty
          const enterpriseEmpty$ = this.afs.collection<any>(Curso.collection, ref => 
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

  // Funciones de diego

  getCourses$(): Observable<Curso[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
            
        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs.collection<Curso>(Curso.collection, ref =>
          ref.where('enterpriseRef', '==', enterpriseRef)
        ).valueChanges({ idField: 'id' });
      
        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs.collection<Curso>(Curso.collection, ref =>
          ref.where('enterpriseRef', '==', null)
        ).valueChanges({ idField: 'id' });
      
        // Combine both queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$]).pipe(
          map(([matched, empty]) => [...matched, ...empty]),
        )
      })
    )
  }

  getClassesEnterprise$(): Observable<any[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
            
        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs.collection<Clase>(Clase.collection, ref =>
          ref.where('enterpriseRef', '==', enterpriseRef)
        ).valueChanges({ idField: 'id' });
      
        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs.collection<Clase>(Clase.collection, ref =>
          ref.where('enterpriseRef', '==', null)
        ).valueChanges({ idField: 'id' });
      
        // Combine both queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$]).pipe(
          map(([matched, empty]) => [...matched, ...empty]),
        )
      })
    )
  }


  public async getCourseById(id: string): Promise<Curso> {
    return await firstValueFrom(this.afs.collection<Curso>(Curso.collection).doc(id).valueChanges())
  }

  // ---- courseByStudent Collection methods
  getCoursesByStudent$(userRef: DocumentReference<User>): Observable<CourseByStudent[]> {
    return this.afs.collection<CourseByStudent>(CourseByStudent.collection, ref => ref.where('userRef', '==', userRef)).valueChanges()
  }

  async getCourseByStudent(userRef: DocumentReference<User>, courseRef: DocumentReference<Curso>): Promise<CourseByStudent> {
    const courseByStudent = await firstValueFrom(this.afs.collection<CourseByStudent>(CourseByStudent.collection, ref => ref.
      where('userRef', '==', userRef).where('courseRef', '==', courseRef) ).valueChanges())
    return courseByStudent ? courseByStudent[0] : null
  }

  getCourseByStudentRef(id: string): DocumentReference<CourseByStudent> {
    return this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc(id).ref
  }

  async saveCourseByStudent(courseRef: DocumentReference, userRef: DocumentReference, dateStartPlan: Date, dateEndPlan: Date, isExtraCourse: boolean): Promise<CourseByStudent> {
    const ref = this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc().ref;
    const courseByStudent = {
      id: ref.id,
      userRef: userRef,
      courseRef: courseRef,
      dateStartPlan: dateStartPlan,
      dateEndPlan: dateEndPlan,
      progress: 0,
      dateStart: null,
      dateEnd: null,
      active: true,
      finalScore: 0,
      isExtraCourse: isExtraCourse
    } as CourseByStudent;
  
    await this.afs.collection(CourseByStudent.collection).doc(courseByStudent.id).set(courseByStudent);
    console.log("Course by student doc saved");
  
    return courseByStudent; // Devuelve el objeto recién insertado
  }
  
  getActiveCoursesByStudent$(userRef: DocumentReference<User>): Observable<CourseByStudent[]> {
    return this.afs.collection<CourseByStudent>(CourseByStudent.collection, ref => ref.
      where('userRef', '==', userRef).
      where('active', '==', true)
    ).valueChanges()
  }



  async getActiveCoursesByStudent(userRef: DocumentReference<User>): Promise<CourseByStudent[]> {
    const querySnapshot: QuerySnapshot<CourseByStudent> = await this.afs.collection<CourseByStudent>(CourseByStudent.collection).ref
      .where('userRef', '==', userRef).where('active', '==', true).get()
    const courses = querySnapshot.docs.map(doc => doc.data())
    return courses
  }

  async setCourseByStudentActive(courseByStudentId: string, startDate: any, endDate: any) { 
    await this.afs.collection(CourseByStudent.collection).doc(courseByStudentId).set({
      active: true,
      dateStartPlan: startDate,
      dateEndPlan: endDate,
      isExtraCourse: startDate ? false : true
    }, { merge: true });
    console.log(`${courseByStudentId} has been activated`)
  }
  

  async setCoursesByStudentInactive(userRef: DocumentReference<User>) {
    this.afs.collection<CourseByStudent>(CourseByStudent.collection, ref => 
      ref.where('userRef', '==', userRef).where('active', '==', true)
    ).get().subscribe(querySnapshot => {

      const updatePromises = querySnapshot.docs.map(doc => {
        return doc.ref.set({ active: false, dateStartPlan: null, dateEndPlan: null }, { merge: true });
      });
      
      Promise.all(updatePromises).then(() => {
        console.log('Todos los documentos han establecido como inactivos.');
      }).catch(error => {
        console.error('Error al actualizar los documentos:', error);
      });
    });
  }

  async setCourseByStudentAsExtracourse(courseByStudentId: string) { 
    await this.afs.collection(CourseByStudent.collection).doc(courseByStudentId).set({
      isExtraCourse: true,
    }, { merge: true });
    console.log(`${courseByStudentId} has been setted as extra course`)
  }

  async updateStudyPlans(changesInStudyPlan: {added: string[], removed: string[], profileId: string}): Promise<boolean> {
    try {
      const enterpriseRef = this.enterpriseService.getEnterpriseRef()
      const profileRef = this.profileService.getProfileRefById(changesInStudyPlan.profileId)
      // console.log(enterpriseRef, profileRef)
      const querySnapshot: QuerySnapshot<User> = await this.afs.collection<User>(User.collection).ref.where('profile', '==', profileRef).get() as QuerySnapshot<User>;
      const users = querySnapshot.docs.map(doc => doc.data())
      // console.log("users", users)
      const batch = this.afs.firestore.batch();
      for (let user of users) {
        // console.log(`***** User to update ${user.name} - ${user.uid} *****`)
        // console.log("changesInStudyPlan", changesInStudyPlan)
        const userRef = this.userService.getUserRefById(user.uid)
        const userCoursesSnapshot: QuerySnapshot<CourseByStudentJson> = await this.afs.collection(CourseByStudent.collection).ref.where('userRef', '==', userRef).get() as QuerySnapshot<CourseByStudentJson>
        const userCourses = userCoursesSnapshot.docs.map(doc => doc.data())
        const studyPlanItems = userCourses.filter(course => course.active).sort((a, b) => {
          return a.dateEndPlan - b.dateEndPlan;
        })
        // console.log("studyPlanItems", studyPlanItems)
  
        // If extraCourse, dates are null
        let startDateForCourse = !studyPlanItems[0].isExtraCourse ? studyPlanItems[0].dateStartPlan.seconds * 1000 : null
  
        const userRemovedCourses = studyPlanItems.filter(course => changesInStudyPlan.removed.includes(course.courseRef.id))
        // console.log('userRemovedCourses', userRemovedCourses)
        const userOtherCourses = studyPlanItems.filter(course => !changesInStudyPlan.removed.includes(course.courseRef.id))
        // console.log('userOtherCourses', userOtherCourses)
  
        // Disable removed courses
        for (let course of userRemovedCourses) {
          const courseJson = {
            ...course,
            active: false,
            dateStartPlan: null,
            dateEndPlan: null
          }
          console.log(`Removed course ${course.courseRef.id} - Saved in ${courseJson.id}`, courseJson)
          batch.update(this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc(courseJson.id).ref, courseJson);
        }
  
        // Repair startDate and endDate for remaining items in studyPlan
        for (let course of userOtherCourses) {
          const courseDuration = (await course.courseRef.get()).data().duracion
          const dateEndPlan = startDateForCourse ? this.calculatEndDatePlan(startDateForCourse, courseDuration, user.studyHours) : null
          const courseJson = {
            ...course,
            dateStartPlan: startDateForCourse ? new Date(startDateForCourse) : null,
            dateEndPlan: dateEndPlan ? new Date(dateEndPlan) : null
          }
          console.log(`Repaired course ${course.courseRef.id} - Saved in ${courseJson.id}`, courseJson)
          batch.update(this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc(courseJson.id).ref, courseJson);
          startDateForCourse = dateEndPlan
        }
  
        // Add new courses at the end of studyPlan
        const userCoursesIds = userCourses.map(course => course.courseRef.id)
        for (let item of changesInStudyPlan.added) {
          const courseDuration = (await firstValueFrom(this.afs.collection<Curso>(Curso.collection).doc(item).get())).data().duracion
          const dateEndPlan = startDateForCourse ? this.calculatEndDatePlan(startDateForCourse, courseDuration, user.studyHours) : null
          if (userCoursesIds.includes(item)) {
            // Course already exist for user
            const course = userCourses.find(course => course.courseRef.id === item)
            const courseJson = {
              ...course,
              dateStartPlan: startDateForCourse ? new Date(startDateForCourse) : null,
              dateEndPlan: dateEndPlan ? new Date(dateEndPlan) : null,
              active: true,
              isExtraCourse: startDateForCourse ? false : true
            }
            console.log(`Activated course ${item} - Saved in ${courseJson.id}`, courseJson)
            batch.update(this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc(courseJson.id).ref, courseJson);
          } else {
            // New course for student
            const docRef = this.afs.collection<CourseByStudentJson>(CourseByStudent.collection).doc().ref;
            const courseJson = {
              id: docRef.id,
              userRef: userRef,
              courseRef: this.afs.collection<Curso>(Curso.collection).doc(item).ref,
              dateStartPlan: startDateForCourse ? new Date(startDateForCourse) : null,
              dateEndPlan: dateEndPlan ? new Date(dateEndPlan) : null,
              progress: 0,
              dateStart: null,
              dateEnd: null,
              active: true,
              finalScore: 0,
              isExtraCourse: startDateForCourse ? false : true,
            }
            console.log(`Added course ${item} - Saved in ${courseJson.id}`, courseJson)
            batch.set(docRef, courseJson);
          }
          startDateForCourse = dateEndPlan
        }
      }
      await batch.commit();
      return true
    } catch (error) {
      console.error(error)
      return false
    }

  }

  calculatEndDatePlan(startDate: number, courseDuration: number, hoursPermonth: number): number {
    const monthDays = this.getDaysInMonth(startDate)
    return startDate + (24 * 60 * 60 * 1000) * Math.ceil((courseDuration / 60) / (hoursPermonth / monthDays));
  }

  getDaysInMonth(timestamp: number) {
    const date = new Date(timestamp)

    // Create a new date object for the first day of the next month
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    // Subtract one day to get the last day of the required month
    nextMonth.setDate(nextMonth.getDate() - 1);

    // Return the day of the month, which is the number of days in that month
    return nextMonth.getDate();
  }


  // ---- classeByStudent Collection methods
  getAllClassesByStudent$(userRef: DocumentReference<User>): Observable<ClassByStudent[]> {
    return this.afs.collection<ClassByStudent>(ClassByStudent.collection, ref => ref.where('userRef', '==', userRef)).valueChanges()
  }

  getClassesByStudent$(userRef: DocumentReference<User>): Observable<ClassByStudent[]> {
    return this.afs.collection<ClassByStudent>(ClassByStudent.collection, ref => ref.where('userRef', '==', userRef).where('completed', '==', true)).valueChanges()
  }


  // ---- classeByStudent Collection methods
  getClassesByStudentDatefilterd$(userRef: DocumentReference<User>,dateIni = null ,dateEnd = null): Observable<ClassByStudent[]> {
    return this.afs.collection<ClassByStudent>(ClassByStudent.collection, ref => {
      let query = ref.where('userRef', '==', userRef)
                      .where('completed', '==', true);
      
      if (dateIni) {
        query = query.where('dateEnd', '>=', dateIni);
      }
      if (dateEnd) {
        query = query.where('dateEnd', '<=', dateEnd);
      }
      return query;
    }).valueChanges();
  }

  getCertificatestDatefilterd$(userRef: DocumentReference<User>,dateIni = null ,dateEnd = null): Observable<any[]> {
    return this.afs.collection<any>('userCertificate', ref => {
      let query = ref.where('usuarioId', '==', userRef.id);
      
      if (dateIni) {
        query = query.where('date', '>=', dateIni);
      }
      if (dateEnd) {
        query = query.where('date', '<=', dateEnd);
      }
      return query;
    }).valueChanges();
  }

  getActiveCoursesByStudentDateFiltered$(userRef: DocumentReference<User>,dateIni = null,dateEnd = null): Observable<CourseByStudent[]> {
    return this.afs.collection<CourseByStudent>(CourseByStudent.collection, ref => {
      let query = ref.where('userRef', '==', userRef)
                      .where('active', '==', true);
      
      if (dateIni) {
        query = query.where('dateStartPlan', '>=', dateIni);
      }
      if (dateEnd) {
        query = query.where('dateStartPlan', '<=', dateEnd);
      }
      return query;
    }).valueChanges();
  }


  getClass$(classId: string): Observable<Clase> {
    return this.afs.collection<Clase>(Clase.collection).doc(classId).valueChanges()
  }

  getClasses$(): Observable<Clase[]> {
    return this.afs.collection<Clase>(Clase.collection).valueChanges()
  }

  async getClass(classId: string): Promise<Clase> {
    return (await firstValueFrom(this.afs.collection<Clase>(Clase.collection).doc(classId).get())).data()
  }

  getClassesByEnterprise$(): Observable<any[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return of([])
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        return this.afs.collection<User>(User.collection, ref => ref.where('enterprise', '==', enterpriseRef)).valueChanges()
      }),
      switchMap(users => {
        if (users.length === 0) {
          return of([]);
        }
        const observableArray = []
        users.forEach(user => {
          observableArray.push(
            this.afs.collection("classesByStudent", ref => ref.where('userRef', '==', this.userService.getUserRefById(user.uid)).where('completed', '==', true)).valueChanges()
          )
        })
        return combineLatest(observableArray)
      }),
      map(arraysOfClasses => arraysOfClasses.flat())
    )
  }

  getClassesByStudentThrougCoursesByStudent$(courseByStudentRef: DocumentReference<CourseByStudent>): Observable<ClassByStudent[]> {
    return this.afs.collection<ClassByStudent>(ClassByStudent.collection, ref => 
      ref.where('coursesByStudentRef', '==', courseByStudentRef).where('completed', '==', true)
    ).valueChanges()
  }

  async getCourseIdMappings(): Promise<{ [key: string]: string }> {
    // Object to store the mapping
    let idMappings: { [key: string]: string } = {};
  
    const coursesSnapshot = await firstValueFrom(this.afs.collection<Curso>(Curso.collection).get());
  
    coursesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.idOld && data.id) {
        idMappings[data.idOld] = data.id;
      }
    });
    return idMappings;
  }
  

}
