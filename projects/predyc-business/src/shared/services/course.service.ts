import { Injectable } from "@angular/core";
import { User } from "projects/shared/models/user.model";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, DocumentReference, QuerySnapshot } from "@angular/fire/compat/firestore";
import { BehaviorSubject, firstValueFrom, forkJoin, Observable, of } from "rxjs";
import { EnterpriseService } from "./enterprise.service";
import { AlertsService } from "./alerts.service";
import { combineLatest } from "rxjs";
import { defaultIfEmpty, filter, map, switchMap, take, tap } from "rxjs/operators";
import { CourseRating, Curso, CursoJson } from "projects/shared/models/course.model";
import { Modulo } from "projects/shared/models/module.model";
import { Clase } from "projects/shared/models/course-class.model";
import { CourseByStudent, CourseByStudentJson } from "projects/shared/models/course-by-student.model";
import { UserService } from "./user.service";
import { ProfileService } from "./profile.service";
import { ClassByStudent } from "projects/shared/models/class-by-student.model";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";
import { Product } from "projects/shared/models/product.model";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { Activity, Question, StudyPlanClass } from "projects/shared/models";

@Injectable({
  providedIn: "root",
})
export class CourseService {
  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private profileService: ProfileService,
    private alertService: AlertsService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private productService: ProductService
  ) {

    //this.findAndDeleteNullUserIds()
    //this.findAndLogDuplicates()
    this.getCourses();
    //this.checkAndUpdateSkills()
    //this.removeCheater('q5B5fsOhjcOoMuLUcLg8KfVB13Q2');
    //this.fixCertificates()
    //this.fixCoursesCustomURL()
    //La última actividad fue hace this.findCoursesWithFinalScoreAndIncompleteProgress()
  }

  private coursesSubject = new BehaviorSubject<Curso[]>([]);
  private course$ = this.coursesSubject.asObservable();

  private enterpriseRef: DocumentReference;

  async _fixCoursesCustomURL() {
    console.log("fixCoursesCustomURL");

    const batch = this.afs.firestore.batch();

    // Referencia a la colección de 'skill'
    const collectionRef = this.afs.collection(Curso.collection).ref;

    // Obtiene todos los documentos de la colección 'skill'
    const snapshot = await collectionRef.get();

    // Itera sobre cada documento y actualiza el campo 'enterprise' a null
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { customUrl: "" });
    });

    // Ejecuta el batch write
    await batch.commit();
  }

  async fixCoursesCustomURL() {
    console.log("fixCoursesCustomURL");
  
    const batch = this.afs.firestore.batch();
  
    // Referencia a la colección de 'curso'
    const collectionRef = this.afs.collection(Curso.collection).ref;
  
    // Obtiene todos los documentos de la colección 'curso'
    const snapshot = await collectionRef.get();
  
    // Itera sobre cada documento y actualiza el campo 'customUrl' solo si está vacío o es undefined
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data['customUrl']) {
        batch.update(doc.ref, { customUrl: doc.id });
      }
    });
  
    // Ejecuta el batch write
    await batch.commit();
    console.log("end fixCoursesCustomURL");

  }

  async _fixClassByStudentDate() {
    console.log('fixClassByStudentDate');
    
    const collectionRef = this.afs.collection(ClassByStudent.collection).ref;
    
    // Obtiene todos los documentos de la colección 'ClassByStudent'
    const snapshot = await collectionRef.get();
  
    // Itera sobre cada documento y realiza las actualizaciones
    for (const doc of snapshot.docs) {
      let data = doc.data();
      if (typeof data['dateEnd'] === 'number' || typeof data['dateStart'] === 'number') {
        let updates: any = {};
        let dateStart;
        let dateEnd;
  
        if (data['dateEnd'] && typeof data['dateEnd'] === 'number') {
          dateEnd = new Date(data['dateEnd']);
          updates.dateEnd = dateEnd;
        }
        if (data['dateStart'] && typeof data['dateStart'] === 'number') {
          dateStart = new Date(data['dateStart']);
          updates.dateStart = dateStart;
        }
  
        if (Object.keys(updates).length > 0) {
          updates.adminFix = true;
          await doc.ref.update(updates);
          console.log('update', dateStart, dateEnd);
        }
      }
    }
  
    console.log('fixClassByStudentDate completed');
  }

  async __fixClassByStudentDate() {
    console.log('fixClassByStudentDate');
    const batch = this.afs.firestore.batch();
    const collectionRef = this.afs.collection(ClassByStudent.collection).ref;
  
    // Obtiene todos los documentos de la colección 'ClassByStudent'
    const snapshot = await collectionRef.get();
  
    snapshot.docs.forEach((doc) => {
      let data = doc.data();
      if (typeof data['dateEnd'] === 'number' || typeof data['dateStart'] === 'number') {
        let updates: any = {};
  
        if (data['dateEnd'] && typeof data['dateEnd'] === 'number') {
          updates.dateEnd = new Date(data['dateEnd']);
        }
        if (data['dateStart'] && typeof data['dateStart'] === 'number') {
          updates.dateStart = new Date(data['dateStart']);
        }
  
        if (Object.keys(updates).length > 0) {
          updates.adminFix = true;
          batch.update(doc.ref, updates);
          console.log('update', updates);
        }
      }
    });
  
    await batch.commit();
    console.log('fixClassByStudentDate completed');
  }

  async fixClassByStudentDate() {
    console.log('fixClassByStudentDate');
    const collectionRef = this.afs.collection(ClassByStudent.collection).ref;
    let lastDoc = null;
    let batchCount = 0;
  
    while (true) {
      let query = collectionRef.orderBy('__name__').limit(500);
  
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
  
      const snapshot = await query.get();
  
      if (snapshot.empty) {
        break; // No more documents
      }
  
      const batch = this.afs.firestore.batch();
  
      snapshot.docs.forEach((doc) => {
        let data = doc.data();
        if (typeof data['dateEnd'] === 'number' || typeof data['dateStart'] === 'number') {
          let updates: any = {};
  
          if (data['dateEnd'] && typeof data['dateEnd'] === 'number') {
            updates.dateEnd = new Date(data['dateEnd']);
          }
          if (data['dateStart'] && typeof data['dateStart'] === 'number') {
            updates.dateStart = new Date(data['dateStart']);
          }
  
          if (Object.keys(updates).length > 0) {
            batch.update(doc.ref, updates);
            console.log('update', updates);
          }
        }
      });
  
      await batch.commit();
      batchCount++;
      console.log(`Batch ${batchCount} committed`);
  
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
    }
  
    console.log('fixClassByStudentDate completed');
  }

  async fixCourseByStudentDate(){

    console.log('fixClassByStudentDate')
    const batch = this.afs.firestore.batch();

    const collectionRef = this.afs.collection(CourseByStudent.collection).ref;

    // Obtiene todos los documentos de la colección 'skill'
    const snapshot = await collectionRef.get();

    // Itera sobre cada documento y actualiza el campo 'enterprise' a null
    snapshot.docs.forEach((doc) => {
      let data = doc.data()
      if(data['progress']>=90 && !data['progressTime']){
        console.log('updated',data)
        batch.update(doc.ref, { progressTime: data['courseTime']});
      }
      else if(data['progress']<90 && data['progress']>0 && !data['progressTime']){
        let time = data['courseTime']*(data['progress']/100)
        console.log('updated',data)
        batch.update(doc.ref, { progressTime: time});
      }
  
    });

    await batch.commit();
    console.log('end fixClassByStudentDate')



  }

  async removeCheater(idUser: string) {
    console.log("removeCheater");
  
    const batch = this.afs.firestore.batch();
  
    // Referencia a la colección de 'classesByStudent'
    const collectionRef = this.afs.collection('classesByStudent').ref;
  
    // Obtén la referencia del documento del usuario
    const userRef = this.afs.collection('user').doc(idUser).ref;
  
    // Consulta para obtener los documentos donde 'userRef' sea el usuario especificado
    const snapshot = await collectionRef.where('userRef', '==', userRef).get();
  
    // Itera sobre cada documento y actualiza el campo 'cheater' a false
    snapshot.docs.forEach((doc) => {
      const classData = doc.data();
      console.log('removeCheater class', classData);
      batch.update(doc.ref, {
        cheater: false,
      });    
    });
  
    // Ejecuta el batch write
    await batch.commit();
    console.log("removeCheater classes updated");
  }

  async fixCertificates() {
    // Buscar en la colección coursesByStudent todos los registros con progress = 100
    const coursesByStudentSnapshot = await this.afs.collection('coursesByStudent', ref => ref.where('progress', '==', 100)).get().toPromise();
  
    // Iterar sobre cada documento en coursesByStudent
    for (const doc of coursesByStudentSnapshot.docs) {
      const courseByStudentData = doc.data();
      const userRef = courseByStudentData['userRef'];
      const courseRef = courseByStudentData['courseRef'];
  
      // Buscar en userCertificate si existe un registro con usuarioId igual a userRef.id y cursoId igual a courseRef.id
      const userCertificateSnapshot = await this.afs.collection('userCertificate', ref => 
        ref.where('usuarioId', '==', userRef.id)
           .where('cursoId', '==', courseRef.id)
      ).get().toPromise();
  
      // Si no existe un certificado, crear uno nuevo
      if (userCertificateSnapshot.empty) {
        // Obtener los datos del usuario desde la colección user
        const userDoc = await userRef.get();
        const userData = userDoc.data();

        //console.log('userData',userData,userRef,courseByStudentData)
  
        // Obtener los datos del curso desde la colección course
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
  
        // Obtener el puntaje, asignar un valor entre 75 y 100 si el puntaje es 0
        let finalScore = courseByStudentData['finalScore'];
        if (finalScore === 0) {
          finalScore = Math.floor(Math.random() * 26) + 75;  // Número aleatorio entre 75 y 100
        }

        if(userData && courseData){
          const certificado = {
            usuarioId: userRef.id,
            usuarioEmail: userData.email,
            usuarioNombre: userData.name,
            cursoId: courseRef.id,
            cursoTitulo: courseData.titulo,
            instructorId: courseData.instructorRef.id,
            instructorNombre: courseData.instructorNombre,
            puntaje: finalScore,
            completedAdmin: true,
            usuarioFoto: userData.photoUrl ? userData.photoUrl : null,
            date: courseByStudentData['dateEnd'] || new Date(),  // Usar dateEnd o la fecha actual si no está disponible
          };
          await this.saveCertificate(certificado);
        }
      }
    }
    console.log('finish create certificates')
  }

  async saveCertificate(certificate) {
    try {
      //console.log('certificate add',certificate)
      const ref = this.afs.collection<any>('userCertificate').doc().ref;
      await ref.set({...certificate, id: ref.id}, { merge: true });
      certificate.id = ref.id;
      console.log('newCertificate',certificate,ref.id)
    } catch (error) {
      //console.log(error)
    }

  }

  async deleteCompletedAdminClasses() {
    console.log("deleteCompletedAdminClasses");
  
    const batch = this.afs.firestore.batch();
  
    // Referencia a la colección de 'classesByStudent'
    const collectionRef = this.afs.collection('classesByStudent').ref;
  
    // Consulta para obtener los documentos donde 'completedAdmin' sea true
    const snapshot = await collectionRef.where('completedAdmin', '==', true).get();
  
    // Itera sobre cada documento y agrégalo al batch delete
    snapshot.docs.forEach((doc) => {
      const classData = doc.data();
      console.log('deleteCompletedAdminClasses',classData)
      batch.delete(doc.ref);
    });
  
    // Ejecuta el batch write
    await batch.commit();
  
    console.log("CompletedAdmin classes deleted");
  }

  async fixClasses() {
    console.log("fix classes");
    // Referencia a la colección de 'class'
    const classCollectionRef = this.afs.collection("class").ref;

    // Obtiene todos los documentos de la colección 'class'
    const classSnapshot = await classCollectionRef.get();

    const batch = this.afs.firestore.batch();

    for (const doc of classSnapshot.docs) {
      const classData = doc.data();
      // Verifica si el documento tiene un instructorRef
      if (classData["instructorRef"]) {
        try {
          // Obtiene el documento del instructor
          const instructorDoc = await classData["instructorRef"].get();
          if (instructorDoc.exists) {
            const instructorData = instructorDoc.data();
            // Verifica si el instructor tiene un enterpriseRef
            console.log("instructorData", instructorData);
            batch.update(doc.ref, {
              enterpriseRef: instructorData.enterpriseRef,
            });
          }
        } catch (error) {
          console.error("Error al obtener el documento del instructor:", error);
        }
      }
    }

    // Ejecuta el batch write
    await batch.commit();
  }

  async saveCourseP21(newCourse: Curso): Promise<void> {
    try {
      try {
        console.log("test saveCourse", newCourse);

        if(!newCourse.customUrl){
          newCourse.customUrl = newCourse.id
        }
        delete newCourse["modules"];
        const dataToSave =
          typeof newCourse.toJson === "function"
            ? newCourse.toJson()
            : newCourse;

        await this.afs
          .collection(Curso.collectionP21)
          .doc(newCourse?.id)
          .set(dataToSave, { merge: true });
      } catch (error) {
        console.log(error);
        throw error;
      }
      // console.log("Has agregado una nuevo curso exitosamente.");
    } catch (error) {
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }


  async saveCourse(newCourse: Curso): Promise<void> {
    try {
      try {
        console.log("test saveCourse", newCourse);

        if(!newCourse.customUrl){
          newCourse.customUrl = newCourse.id
        }
        delete newCourse["modules"];
        const dataToSave =
          typeof newCourse.toJson === "function"
            ? newCourse.toJson()
            : newCourse;

        await this.afs
          .collection(Curso.collection)
          .doc(newCourse?.id)
          .set(dataToSave, { merge: true });
      } catch (error) {
        console.log(error);
        throw error;
      }
      // console.log("Has agregado una nuevo curso exitosamente.");
    } catch (error) {
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }

  _getCourses() {
    this.enterpriseService.enterpriseLoaded$.subscribe((isLoaded) => {
      if (isLoaded) {
        this.enterpriseRef = this.enterpriseService.getEnterpriseRef();

        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs
          .collection<Curso>(Curso.collection, (ref) =>
            ref.where("enterpriseRef", "==", this.enterpriseRef)
          )
          .valueChanges({ idField: "id" });

        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs
          .collection<Curso>(Curso.collection, (ref) =>
            ref.where("enterpriseRef", "==", null)
          )
          .valueChanges({ idField: "id" });

        // Combine both queries
        combineLatest([enterpriseMatch$, enterpriseEmpty$])
          .pipe(
            map(([matched, empty]) => [...matched, ...empty]),
            switchMap((courses) => {
              if (!courses.length) return of([]); // Return an observable of an empty array if there are no courses.

              const coursesWithModules$ = courses.map((course) => {
                return this.afs
                  .collection(
                    `${Curso.collection}/${course.id}/${Modulo.collection}`
                  )
                  .valueChanges({ idField: "moduleId" })
                  .pipe(map((modules) => ({ ...course, modules })));
              });
              return combineLatest(coursesWithModules$);
            })
          )
          .subscribe({
            next: (courses) => {
              this.coursesSubject.next(courses);
            },
            error: (error) => {
              console.log(error);
              this.alertService.errorAlert(JSON.stringify(error));
            },
          });
      }
    });
  }

  getCourses() {
    try {
      this.enterpriseService.enterpriseLoaded$.subscribe((isLoaded) => {
        if (isLoaded) {
          this.enterpriseRef = this.enterpriseService.getEnterpriseRef();

          // Fetch all classes once
          const allClasses$ = this.afs
            .collection<Clase>(Clase.collection)
            .valueChanges();

          // Query to get by enterprise match
          const enterpriseMatch$ = this.afs
            .collection<any>(Curso.collection, (ref) =>
              ref.where("enterpriseRef", "==", this.enterpriseRef)
            )
            .valueChanges();

          // Query to get where enterprise is empty
          const enterpriseEmpty$ = this.afs
            .collection<Curso>(Curso.collection, (ref) =>
              ref.where("enterpriseRef", "==", null)
            )
            .valueChanges();

          this.course$ = combineLatest([
            enterpriseMatch$,
            enterpriseEmpty$,
            allClasses$,
          ]).pipe(
            map(([matched, empty, allClasses]) => {
              // Combine matched and empty courses
              const combinedCourses = [...matched, ...empty];

              // Process each course
              return combinedCourses.map((course) => {
                // Fetch modules for each course
                const modules$ = this.afs
                  .collection(
                    `${Curso.collection}/${course.id}/${Modulo.collection}`
                  )
                  .valueChanges();

                return modules$.pipe(
                  map((modules) => {
                    // For each module, find and attach the relevant classes
                    const modulesWithClasses = modules.map((module) => {
                      const classes = module["clasesRef"].map((claseRef) =>
                        allClasses.find((clase) => clase.id === claseRef.id)
                      );

                      return { ...(module as Modulo), clases: classes };
                    });

                    return { ...course, modules: modulesWithClasses };
                  })
                );
              });
            }),
            switchMap((courseModulesObservables) =>
              combineLatest(courseModulesObservables)
            )
          );

          // Subscribing to the final Observable
          this.course$.subscribe({
            next: (courses) => {
              this.coursesSubject.next(courses);
            },
            error: (error) => {
              console.error(error);
              this.alertService.errorAlert(JSON.stringify(error));
            },
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
      this.enterpriseService.enterpriseLoaded$.subscribe((isLoaded) => {
        if (isLoaded) {
          this.enterpriseRef = this.enterpriseService.getEnterpriseRef();

          // Query to get by enterprise match
          const enterpriseMatch$ = this.afs
            .collection<any>(Curso.collection, (ref) =>
              ref
                .where("enterpriseRef", "==", this.enterpriseRef)
                .where("proximamente", "==", false)
            )
            .valueChanges();

          // Query to get where enterprise is empty
          const enterpriseEmpty$ = this.afs
            .collection<any>(Curso.collection, (ref) =>
              ref.where("enterpriseRef", "==", null)
            )
            .valueChanges();

          this.course$ = combineLatest([
            enterpriseMatch$,
            enterpriseEmpty$,
          ]).pipe(
            map(([matched, empty]) => [...matched, ...empty]),
            switchMap((courses) =>
              combineLatest(
                courses.map((course) =>
                  this.afs
                    .collection(
                      `${Curso.collection}/${course.id}/${Modulo.collection}`
                    )
                    .valueChanges()
                    .pipe(
                      switchMap((modules) =>
                        combineLatest(
                          modules.map((module) =>
                            combineLatest(
                              module["clasesRef"].map((claseRef) =>
                                this.afs
                                  .doc<Clase>(
                                    `${Clase.collection}/${claseRef.id}`
                                  )
                                  .valueChanges()
                              )
                            ).pipe(
                              map((clases) =>
                                Object.assign({}, module, { clases })
                              )
                            )
                          )
                        )
                      ),
                      map((modulesWithClases) => ({
                        ...course,
                        modules: modulesWithClases,
                      }))
                    )
                )
              )
            )
          );

          // Subscribing to the final Observable
          this.course$.subscribe({
            next: (courses) => {
              this.coursesSubject.next(courses);
            },
            error: (error) => {
              console.log(error);
              this.alertService.errorAlert(JSON.stringify(error));
            },
          });
        }
      });
    } catch (error) {
      console.error(error);
      // Handle the error appropriately
    }
  }

  getCoursesObservable(): Observable<Curso[]> {
    return this.course$;
  }


  getCoursesObservableP21(): Observable<Curso[]> {
    return this.afs.collection<Curso>(Curso.collectionP21).valueChanges();
  }

   

  public getCourseRefById(id: string): DocumentReference<Curso> {
    return this.afs.collection<Curso>(Curso.collection).doc(id).ref;
  }

  // Funciones de diego

  getCourses$(enterpriseRefIn?): Observable<Curso[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return [];
        let enterpriseRef

        if(enterpriseRefIn){
          enterpriseRef = enterpriseRefIn

        }else{
          enterpriseRef = this.enterpriseService.getEnterpriseRef();
        }

        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs
          .collection<Curso>(Curso.collection, (ref) =>
            ref.where("enterpriseRef", "==", enterpriseRef)
          )
          .valueChanges({ idField: "id" });

        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs
          .collection<Curso>(Curso.collection, (ref) =>
            ref.where("enterpriseRef", "==", null)
          )
          .valueChanges({ idField: "id" });

        // Combine both queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$]).pipe(
          map(([matched, empty]) => [...matched, ...empty])
        );
      })
    );
  }


  getClassses$(): Observable<Clase[]> {
    return this.afs.collection<Clase>(Clase.collection).valueChanges();
  }

  getAllCourses$(instructorRef?): Observable<Curso[]> {

    if(instructorRef){
      return this.afs.collection<Curso>(Curso.collection ,ref =>
        ref.where('instructorRef', '==', instructorRef)
      ).valueChanges();
    }
    else{
      return this.afs.collection<Curso>(Curso.collection).valueChanges();

    }
  }


  getCourseActivitiesTry$(idCourse: string, idUser: string): Observable<any[]> {
    // Obtener referencias a los documentos de usuario y curso
    const userRef = this.afs.doc(`user/${idUser}`).ref;
    const courseRef = this.afs.doc(`course/${idCourse}`).ref;
  
    // Buscar en la colección coursesTestsByStudent
    return this.afs.collection<any>('coursesTestsByStudent', ref => 
      ref.where('userRef', '==', userRef)
         .where('courseRef', '==', courseRef)
    ).valueChanges();
  }

  getClassesEnterprise$(): Observable<any[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return [];
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();

        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs
          .collection<Clase>(Clase.collection, (ref) =>
            ref.where("enterpriseRef", "==", enterpriseRef)
          )
          .valueChanges({ idField: "id" });

        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs
          .collection<Clase>(Clase.collection, (ref) =>
            ref.where("enterpriseRef", "==", null)
          )
          .valueChanges({ idField: "id" });

        // Combine both queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$]).pipe(
          map(([matched, empty]) => [...matched, ...empty])
        );
      })
    );
  }

  async getClassesEnterprise(): Promise<any[]> {
    // Wait for the enterprise to be loaded
    const isLoaded = await firstValueFrom(this.enterpriseService.enterpriseLoaded$);
    if (!isLoaded) return [];
  
    const enterpriseRef = this.enterpriseService.getEnterpriseRef();
  
    const enterpriseMatchQuery = this.afs.collection<Clase>(Clase.collection).ref.where("enterpriseRef", "==", enterpriseRef);
    const enterpriseEmptyQuery = this.afs.collection<Clase>(Clase.collection).ref.where("enterpriseRef", "==", null);
  
    // Execute both queries in parallel and combine results
    const [enterpriseMatchSnapshot, enterpriseEmptySnapshot] = await Promise.all([
      enterpriseMatchQuery.get(),
      enterpriseEmptyQuery.get()
    ]);
  
    const enterpriseMatchData = enterpriseMatchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const enterpriseEmptyData = enterpriseEmptySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
    return [...enterpriseMatchData, ...enterpriseEmptyData];
  }

  public async getCourseById(id: string): Promise<Curso> {
    return await firstValueFrom(
      this.afs.collection<Curso>(Curso.collection).doc(id).valueChanges()
    );
  }

  // ---- courseByStudent Collection methods
  getCoursesByStudent$(userRef: DocumentReference<User>): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef)
      )
      .valueChanges();
  }

  getCoursesByStudentWithRef$(courseByStudentRef: DocumentReference<any>): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("id", "==", courseByStudentRef.id)
      )
      .valueChanges();
  }

  async getCourseByStudent(userRef: DocumentReference<User>,courseRef: DocumentReference<Curso>): Promise<CourseByStudent> {
    const courseByStudent = await firstValueFrom(
      this.afs
        .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
          ref
            .where("userRef", "==", userRef)
            .where("courseRef", "==", courseRef)
        )
        .valueChanges()
    );
    return courseByStudent ? courseByStudent[0] : null;
  }

  getCourseByStudentRef(id: string): DocumentReference<CourseByStudent> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection)
      .doc(id).ref;
  }

  async saveCourseByStudent(courseRef: DocumentReference, userRef: DocumentReference, dateStartPlan: Date, dateEndPlan: Date, isExtraCourse: boolean, idx: number ): Promise<CourseByStudent> {
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
      isExtraCourse: isExtraCourse,
      studyPlanOrder: idx + 1,
    } as CourseByStudent;

    await this.afs.collection(CourseByStudent.collection).doc(courseByStudent.id).set(courseByStudent);
    console.log("Course by student doc saved");

    return courseByStudent; // Devuelve el objeto recién insertado
  }

  getActiveCoursesByStudent$(
    userRef: DocumentReference<User>
  ): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef).where("active", "==", true)
      )
      .valueChanges();
  }

  getAllCoursesByStudent$(
    userRef: DocumentReference<User>
  ): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef)
      )
      .valueChanges();
  }



  getInActiveCoursesByStudent$(
    userRef: DocumentReference<User>
  ): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef).where("active", "==", false)
      )
      .valueChanges();
  }


  async getActiveCoursesByStudent(
    userRef: DocumentReference<User>
  ): Promise<CourseByStudent[]> {
    const querySnapshot: QuerySnapshot<CourseByStudent> = await this.afs
      .collection<CourseByStudent>(CourseByStudent.collection)
      .ref.where("userRef", "==", userRef)
      .where("active", "==", true)
      .get();
    const courses = querySnapshot.docs.map((doc) => doc.data());
    return courses;
  }

  async getCoursesByStudent(
    userRef: DocumentReference<User>
  ): Promise<CourseByStudent[]> {
    const querySnapshot: QuerySnapshot<CourseByStudent> = await this.afs
      .collection<CourseByStudent>(CourseByStudent.collection)
      .ref.where("userRef", "==", userRef)
      // .where("active", "==", true)
      .get();
    const courses = querySnapshot.docs.map((doc) => doc.data());
    return courses;
  }

  async setCourseByStudentActive(courseByStudentId: string, startDate: any, endDate: any) {
    await this.afs.collection(CourseByStudent.collection).doc(courseByStudentId).set(
      {
        active: true,
        dateStartPlan: startDate,
        dateEndPlan: endDate,
        isExtraCourse: startDate ? false : true,
      },
      { merge: true }
    );
    console.log(`${courseByStudentId} has been activated`);
  }

  async setCourseByStudentInactive(courseByStudentId: string) {
    await this.afs.collection(CourseByStudent.collection).doc(courseByStudentId).set(
      {
        active: false,
        dateStartPlan: null,
        dateEndPlan: null,
      },
      { merge: true }
    );
    console.log(`${courseByStudentId} has been desactivated`);
  }

  async setCoursesByStudentInactive(userRef: DocumentReference<User>) {
    this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef).where("active", "==", true)
      )
      .get()
      .subscribe((querySnapshot) => {
        const updatePromises = querySnapshot.docs.map((doc) => {
          return doc.ref.set(
            { active: false, dateStartPlan: null, dateEndPlan: null },
            { merge: true }
          );
        });

        Promise.all(updatePromises)
          .then(() => {
            console.log("Todos los documentos han establecido como inactivos.");
          })
          .catch((error) => {
            console.error("Error al actualizar los documentos:", error);
          });
      });
  }

  async setCourseByStudentAsExtracourse(courseByStudentId: string) {
    await this.afs
      .collection(CourseByStudent.collection)
      .doc(courseByStudentId)
      .set(
        {
          isExtraCourse: true,
        },
        { merge: true }
      );
    console.log(`${courseByStudentId} has been setted as extra course`);
  }

  async updateStudyPlans(changesInStudyPlan: {
    added: { id: string; studyPlanOrder: number }[];
    removed: { id: string; studyPlanOrder: number }[];
    studyPlan: any[];
    profileId: string;
  },profileHoursPerMonth): Promise<boolean> {
    try {
      const profileRef = this.profileService.getProfileRefById(
        changesInStudyPlan.profileId
      );
      // console.log(enterpriseRef, profileRef)
      const querySnapshot: QuerySnapshot<User> = (await this.afs
        .collection<User>(User.collection)
        .ref.where("profile", "==", profileRef)
        .get()) as QuerySnapshot<User>;
      const users = querySnapshot.docs.map((doc) => doc.data());
      // console.log("users", users)
      const batch = this.afs.firestore.batch();
      for (let user of users) {
        console.log(`***** User to update ${user.name} - ${user.uid} *****`);



        console.log("changesInStudyPlan", changesInStudyPlan);
        const userRef = this.userService.getUserRefById(user.uid);

        batch.update(userRef, { studyHours: profileHoursPerMonth});

        const userCoursesSnapshot: QuerySnapshot<CourseByStudentJson> =
          (await this.afs
            .collection(CourseByStudent.collection)
            .ref.where("userRef", "==", userRef)
            .get()) as QuerySnapshot<CourseByStudentJson>;
        const userCourses = userCoursesSnapshot.docs.map((doc) => doc.data());
        console.log("userCourses", userCourses);
        const studyPlanItems = userCourses
          .filter((course) => course.active)
          .sort((a, b) => {
            return a.dateEndPlan - b.dateEndPlan;
          });
        console.log("studyPlanItems", studyPlanItems);

        if (studyPlanItems.length > 0) {
          // If extraCourse, dates are null
          let startDateForCourse =
            studyPlanItems.length > 0 && !studyPlanItems[0].isExtraCourse
              ? studyPlanItems[0].dateStartPlan.seconds * 1000
              : null;
          const userRemovedCourses = studyPlanItems.filter((course) =>
            changesInStudyPlan.removed
              .map((item) => item.id)
              .includes(course.courseRef.id)
          );
          console.log("userRemovedCourses", userRemovedCourses);
          const userOtherCourses = studyPlanItems.filter(
            (course) =>
              !changesInStudyPlan.removed
                .map((item) => item.id)
                .includes(course.courseRef.id)
          );
          console.log("userOtherCourses", userOtherCourses);

          // Disable removed courses
          for (let course of userRemovedCourses) {
            const courseJson = {
              ...course,
              active: false,
              dateStartPlan: null,
              dateEndPlan: null,
            };
            console.log(
              `Removed course ${course.courseRef.id} - Saved in ${courseJson.id}`,
              courseJson
            );
            batch.update(
              this.afs
                .collection<CourseByStudent>(CourseByStudent.collection)
                .doc(courseJson.id).ref,
              courseJson
            );
          }

          const coursesInStudyPlan = [];
          changesInStudyPlan.studyPlan
            .sort((a, b) => a.studyPlanOrder - b.studyPlanOrder)
            .forEach((item) => {
              console.log(
                "item",
                item,
                userOtherCourses,
                changesInStudyPlan.added
              );
              const existingCourse = userOtherCourses.find(
                (x) => x.courseRef.id === item.id
              );
              const addedCourse = changesInStudyPlan.added.find(
                (x) => x.id === item.id
              );
              coursesInStudyPlan.push({
                studyPlanOrder: item.studyPlanOrder,
                existing: existingCourse ? true : false,
                courseId: existingCourse
                  ? existingCourse.courseRef.id
                  : addedCourse.id,
              });
            });
          console.log("coursesInStudyPlan", coursesInStudyPlan);
          const userCoursesIds = userCourses.map(
            (course) => course.courseRef.id
          );
          for (let item of coursesInStudyPlan) {
            let dateEndPlan = null;
            if (item.existing) {
              const course = userOtherCourses.find(
                (x) => x.courseRef.id === item.courseId
              );
              const courseDuration = (await course.courseRef.get()).data()
                .duracion;
              dateEndPlan = startDateForCourse
                ? this.calculatEndDatePlan(
                    startDateForCourse,
                    courseDuration,
                    //user.studyHours
                    profileHoursPerMonth
                  )
                : null;
              const courseJson = {
                ...course,
                dateStartPlan: startDateForCourse
                  ? new Date(startDateForCourse)
                  : null,
                dateEndPlan: dateEndPlan ? new Date(dateEndPlan) : null,
                studyPlanOrder: item.studyPlanOrder,
              };
              console.log(
                `Repaired course ${course.courseRef.id} - Saved in ${courseJson.id}`,
                courseJson
              );
              batch.update(
                this.afs
                  .collection<CourseByStudent>(CourseByStudent.collection)
                  .doc(courseJson.id).ref,
                courseJson
              );
            } else {
              const courseId = item.courseId;
              const courseDuration = (
                await firstValueFrom(
                  this.afs
                    .collection<Curso>(Curso.collection)
                    .doc(courseId)
                    .get()
                )
              ).data().duracion;
              dateEndPlan = startDateForCourse
                ? this.calculatEndDatePlan(
                    startDateForCourse,
                    courseDuration,
                    //user.studyHours
                    profileHoursPerMonth
                  )
                : null;
              if (userCoursesIds.includes(courseId)) {
                // Course already exist for user
                const course = userCourses.find(
                  (course) => course.courseRef.id === courseId
                );
                const courseJson = {
                  ...course,
                  dateStartPlan: startDateForCourse
                    ? new Date(startDateForCourse)
                    : null,
                  dateEndPlan: dateEndPlan ? new Date(dateEndPlan) : null,
                  active: true,
                  isExtraCourse: startDateForCourse ? false : true,
                  studyPlanOrder: item.studyPlanOrder,
                };
                console.log(
                  `Activated course ${item} - Saved in ${courseJson.id}`,
                  courseJson
                );
                batch.update(
                  this.afs
                    .collection<CourseByStudent>(CourseByStudent.collection)
                    .doc(courseJson.id).ref,
                  courseJson
                );
              } else {
                // New course for student
                const docRef = this.afs
                  .collection<CourseByStudentJson>(CourseByStudent.collection)
                  .doc().ref;
                const courseJson = {
                  id: docRef.id,
                  userRef: userRef,
                  courseRef: this.afs
                    .collection<Curso>(Curso.collection)
                    .doc(courseId).ref,
                  dateStartPlan: startDateForCourse
                    ? new Date(startDateForCourse)
                    : null,
                  dateEndPlan: dateEndPlan ? new Date(dateEndPlan) : null,
                  progress: 0,
                  dateStart: null,
                  dateEnd: null,
                  active: true,
                  finalScore: 0,
                  isExtraCourse: startDateForCourse ? false : true,
                  studyPlanOrder: item.studyPlanOrder,
                };
                console.log(
                  `Added course ${item} - Saved in ${courseJson.id}`,
                  courseJson
                );
                batch.set(docRef, courseJson);
              }
            }
            startDateForCourse = dateEndPlan;
          }
        }
      }
      await batch.commit();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async fixStudyPlanEnterprise() {
    const db = this.afs.firestore;

    try {
      // Paso 1: Traer todos los usuarios de la empresa
      const usersSnapshot = await db.collection("user").get();

      console.log("usersSnapshot", usersSnapshot);

      // Inicia un batch para las operaciones de actualización
      let batch = db.batch();

      for (const userDoc of usersSnapshot.docs) {
        // Paso 2: Actualizar el perfil de los usuarios a null
        batch.update(userDoc.ref, { profile: null });

        // Paso 3: Borrar las colecciones de clases y cursos
        // Para cada usuario, consulta sus cursos y clases
        const coursesSnapshot = await db
          .collection("coursesByStudent")
          .where("userRef", "==", userDoc.ref)
          .get();
        const classesSnapshot = await db
          .collection("classesByStudent")
          .where("userRef", "==", userDoc.ref)
          .get();
        const profileSnapshot = await db
          .collection("userProfile")
          .where("userRef", "==", userDoc.ref)
          .get();

        // Agregar operaciones de borrado al batch
        coursesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        classesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
        profileSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
      }

      // Comprometer el batch
      await batch.commit();
      console.log(
        "Todos los usuarios han sido actualizados y sus cursos y clases borradas."
      );
    } catch (error) {
      console.error(
        "Error al actualizar usuarios y borrar cursos y clases: ",
        error
      );
    }
  }

  calculatEndDatePlan(
    startDate: number,
    courseDuration: number,
    hoursPermonth: number
  ): number {
    const monthDays = this.getDaysInMonth(startDate);
    return (
      startDate +
      24 *
        60 *
        60 *
        1000 *
        Math.ceil(courseDuration / 60 / (hoursPermonth / monthDays))
    );
  }

  getDaysInMonth(timestamp: number) {
    const date = new Date(timestamp);

    // Create a new date object for the first day of the next month
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

    // Subtract one day to get the last day of the required month
    nextMonth.setDate(nextMonth.getDate() - 1);

    // Return the day of the month, which is the number of days in that month
    return nextMonth.getDate();
  }

  getCoursesByIds$(coursesIds: string[]): Observable<CursoJson[]> {
    if (!coursesIds || coursesIds.length === 0) {
      return of([]);
    }

    const courseObservables = coursesIds.map(courseId => this.afs.collection<CursoJson>(Curso.collection).doc(courseId).valueChanges());
    return combineLatest(courseObservables)
  }

  // ---- classeByStudent Collection methods
  getAllClassesByStudent$(
    userRef: DocumentReference<User>
  ): Observable<ClassByStudent[]> {
    return this.afs
      .collection<ClassByStudent>(ClassByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef)
      )
      .valueChanges();
  }

  getClassesByStudent$(
    userRef: DocumentReference<User>
  ): Observable<ClassByStudent[]> {
    return this.afs
      .collection<ClassByStudent>(ClassByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef).where("completed", "==", true)
      )
      .valueChanges();
  }

  // ---- classeByStudent Collection methods
  getClassesByStudentDatefilterd$(
    userRef: DocumentReference<User>,
    dateIni = null,
    dateEnd = null
  ): Observable<ClassByStudent[]> {
    return this.afs
      .collection<ClassByStudent>(ClassByStudent.collection, (ref) => {
        let query = ref
          .where("userRef", "==", userRef)
          .where("completed", "==", true);

        if (dateIni) {
          query = query.where("dateEnd", ">=", dateIni);
        }
        if (dateEnd) {
          query = query.where("dateEnd", "<=", dateEnd);
        }
        return query;
      })
      .valueChanges();
  }

  getCertificatestDatefilterd$(
    userRef: DocumentReference<User>,
    dateIni = null,
    dateEnd = null
  ): Observable<any[]> {
    return this.afs
      .collection<any>("userCertificate", (ref) => {
        let query = ref.where("usuarioId", "==", userRef.id);

        if (dateIni) {
          query = query.where("date", ">=", dateIni);
        }
        if (dateEnd) {
          query = query.where("date", "<=", dateEnd);
        }
        return query;
      })
      .valueChanges();
  }

  getActiveCoursesByStudentDateFiltered$(
    userRef: DocumentReference<User>,
    dateIni = null,
    dateEnd = null
  ): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) => {
        let query = ref
          .where("userRef", "==", userRef)
          .where("active", "==", true);

        if (dateIni) {
          query = query.where("dateStartPlan", ">=", dateIni);
        }
        if (dateEnd) {
          query = query.where("dateStartPlan", "<=", dateEnd);
        }
        return query;
      })
      .valueChanges();
  }

  getInactiveCoursesByStudentDateFiltered$(
    userRef: DocumentReference<User>,
    dateIni = null,
    dateEnd = null
  ): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) => {
        let query = ref
          .where("userRef", "==", userRef)
          .where("active", "==", false);
        if (dateIni) {
          query = query.where("dateStart", ">=", dateIni);
        }
        if (dateEnd) {
          query = query.where("dateStart", "<=", dateEnd);
        }
        return query;
      })
      .valueChanges();
  }


  getClass$(classId: string): Observable<Clase> {
    return this.afs
      .collection<Clase>(Clase.collection)
      .doc(classId)
      .valueChanges();
  }

  getClasses$(): Observable<Clase[]> {
    return this.afs.collection<Clase>(Clase.collection).valueChanges();
  }

  async getClass(classId: string): Promise<Clase> {
    const snapshot = await this.afs.collection<Clase>(Clase.collection).doc(classId).ref.get()
    return snapshot.data()
  }

  getClassesByEnterprise$(): Observable<any[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return of([]);
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        return this.afs.collection<User>(User.collection, (ref) =>ref.where("enterprise", "==", enterpriseRef)).valueChanges();
      }),
      switchMap((users) => {
        if (users.length === 0) {
          return of([]);
        }
        const observableArray = [];
        users.forEach((user) => {
          observableArray.push(
            this.afs.collection("classesByStudent", (ref) =>
              ref.where("userRef","==",this.userService.getUserRefById(user.uid)).where("completed", "==", true)
            ).valueChanges()
          );
        });
        return combineLatest(observableArray);
      }),
      map((arraysOfClasses) => arraysOfClasses.flat())
    );
  }

  async getClassesByEnterprise(): Promise<any[]> {
    
    const isLoaded = await firstValueFrom(this.enterpriseService.enterpriseLoaded$);
    if (!isLoaded) return [];

    const enterpriseRef = this.enterpriseService.getEnterpriseRef();

    const usersSnapshot = await this.afs.collection<User>(User.collection).ref.where("enterprise", "==", enterpriseRef).get();
    const users = usersSnapshot.docs.map(doc => doc.data() as User)

    if (users.length === 0) return [];
    // console.log("users docs", users.length)

    // Prepare an array of promises for each user's `classesByStudent` query
    const classPromises = users.map(user => 
      this.afs.collection("classesByStudent").ref
        .where("userRef", "==", this.userService.getUserRefById(user.uid))
        .where("completed", "==", true)
        .get()
        .then(snapshot => snapshot.docs.map(doc => doc.data())) // Extract data from each document
    );

    // Resolve all promises and flatten the results into a single array
    const classesByStudent = await Promise.all(classPromises);
    const flattenedClassesByStudent = classesByStudent.flat();

    // console.log("classesByStudent docs", flattenedClassesByStudent.length);
    return flattenedClassesByStudent;
  }

  getClassesByStudentThrougCoursesByStudent$(
    courseByStudentRef: DocumentReference<CourseByStudent>
  ): Observable<ClassByStudent[]> {
    return this.afs
      .collection<ClassByStudent>(ClassByStudent.collection, (ref) =>
        ref
          .where("coursesByStudentRef", "==", courseByStudentRef)
          .where("completed", "==", true)
      )
      .valueChanges();
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
    return idMappings;
  }

  getClassesByIds$(ids: string[]): Observable<Clase[]> {
    if (ids.length === 0) return of([]);
    
    const chunkSize = 10; 
    const idChunks = []; // Array of 10 elements arrays

    for (let i = 0; i < ids.length; i += chunkSize) {
      idChunks.push(ids.slice(i, i + chunkSize));
    }

    const observables = idChunks.map(chunk =>
      this.afs.collection<Clase>(Clase.collection, ref => ref.where('id', 'in', chunk)).valueChanges()
    );

    return combineLatest(observables).pipe(map(results => results.flat()));
  }

  async getClassesByIds(ids: string[]): Promise<Clase[]> {
    if (ids.length === 0) return [];

    const chunkSize = 10; // Firestore limits to 10 IDs in an `in` query
    const idChunks = [];

    // Split IDs into chunks
    for (let i = 0; i < ids.length; i += chunkSize) {
        idChunks.push(ids.slice(i, i + chunkSize));
    }

    // Map each chunk to a Firestore query
    const chunkPromises = idChunks.map(chunk => 
        this.afs.collection<Clase>(Clase.collection).ref
        .where('id', 'in', chunk).get().then(snapshot => snapshot.docs.map(doc => doc.data() as Clase))
    );

    // Resolve all chunk promises and flatten results
    const chunkResults = await Promise.all(chunkPromises);
    return chunkResults.flat();
}

  async updateCourseCompletionStatusTEST(idClass: string, idCourse: string, progress: number ,progressTime: number = 0, courseTime: number = 0, cheater: boolean = false) {
    //console.log('update progreso')
    await this.afs.collection("classesByStudent").doc(idClass)
    .update({
      cheater: cheater,
      completed: true,
      completedAdmin:true,
      dateStart: new Date,
      dateEnd: new Date
    });
    await this.afs.collection("coursesByStudent").doc(idCourse)
    .update({
      progress: progress,
      progressTime:progressTime,
      courseTime:courseTime
    });
  }


  async updateClassRemove(idClass: string) {
    //console.log('update progreso')
    await this.afs.collection("classesByStudent").doc(idClass)
    .update({
      cheater: false,
      completed: false,
      completedAdmin:false,
      dateStart: new Date,
      dateEnd: null
    });
  }

  async updateCourseCompletionStatusTESTRemove(idClass: string, idCourse: string, progress: number ,progressTime: number = 0, courseTime: number = 0, cheater: boolean = false) {
    //console.log('update progreso')
    await this.afs.collection("classesByStudent").doc(idClass)
    .update({
      cheater: cheater,
      completed: false,
      completedAdmin:false,
      removedAdmin:true,
      dateStart: new Date,
      dateEnd: null
    });
    await this.afs.collection("coursesByStudent").doc(idCourse)
    .update({
      progress: progress,
      progressTime:progressTime,
      courseTime:courseTime
    });
  }

  async enrollClassUser(userUid, clase, courseByStudentRef): Promise<DocumentReference<any>>{

    

    const userRef = this.afs.collection('user').doc(userUid).ref;
    const claseRef = this.afs.collection('class').doc(clase.id).ref;


    // Consulta para verificar si ya existe un registro en classesByStudent que haga match
    const existingClassSnapshot = await this.afs.collection('classesByStudent', ref => 
      ref.where('coursesByStudentRef', '==', courseByStudentRef)
        .where('classRef', '==', claseRef)
        .where('userRef', '==', userRef)
    ).get().toPromise();

    // Si se encuentra un registro, devolver la referencia del documento encontrado
    if (!existingClassSnapshot.empty) {
      return existingClassSnapshot.docs[0].ref;
    }

    const courseByStudent = (await firstValueFrom(this.afs.collection<CourseByStudent>(CourseByStudent.collection).doc(courseByStudentRef.id).get())).data();

    let classStudyPlan = new StudyPlanClass
    classStudyPlan.completed = false
    classStudyPlan.classRef = claseRef
    classStudyPlan.userRef = userRef
    classStudyPlan.coursesByStudentRef = courseByStudentRef; 
    //await this.saveStudyPlanClass(classStudyPlan)
    try {
      const ref = this.afs.collection<StudyPlanClass>(StudyPlanClass.collection).doc().ref;
      await ref.set({...classStudyPlan.toJson(), id: ref.id}, { merge: true });
      classStudyPlan.id = ref.id;
      clase.classByStudentData = classStudyPlan;

      if((clase.tipo =='actividad' || (clase.tipo =='lectura' ) || (clase.tipo =='corazones' ))){

        let date = new Date
        console.log('coursesByStudent.dateStart',courseByStudent.dateStart)
        if(!courseByStudent.dateStart){
          let idCourseStudent = courseByStudent.id
          this.afs.collection("coursesByStudent").doc(idCourseStudent).update({
            dateStart: date,
          });
       }
        this.afs.collection("classesByStudent").doc(classStudyPlan.id).update({
          dateStart: date
        });
      }
      return ref
    } catch (error) {
      console.log(error)
      return null
    }

  }


  async hideShowCourseStudent(courseByStudentId,hidden){

    await this.afs.collection("coursesByStudent").doc(courseByStudentId).update({
      hidden: hidden,
    });

  }

  async ActiveCourseStudent(courseByStudentId,hidden){

    await this.afs.collection("coursesByStudent").doc(courseByStudentId).update({
      active: hidden,
    });

  }

  async getCompletedClassesByDateRange(startDate: Date, endDate: Date): Promise<any[]> {
    try {
      const snapshot = await firstValueFrom(
        this.afs.collection(ClassByStudent.collection, ref => 
          ref.where('completed', '==', true)
             .where('dateEnd', '>=', startDate)
             .where('dateEnd', '<=', endDate)
             .where('hasSubscription','==',true)
        ).get()
      );
      console.log('datos getCompletedClassesByDateRange',snapshot)
      return snapshot.docs.map(doc => doc.data());
    } catch (error) {
      console.error('Error fetching completed classes:', error);
      throw new Error('Error fetching completed classes');
    }
  }

  async saveRoyalties(data: any) {
    await this.afs.collection('royalties').doc(data.id).set(
      {
        ...data
      },
      { merge: true }
    );
  }

  async fixClasesInstructors(){


    this.getCoursesObservable().pipe(filter((course) => course.length > 0),take(1)).subscribe(async (courses) => {
      let classes = []
      courses.forEach(course => {
        let classesCourse = []
        course['modules'].forEach(modulo => {
          modulo.clases.forEach(clase => {
            clase.idCurso = course.id
          });
          classes = classes.concat(modulo.clases);
          classesCourse = classes.concat(modulo.clases);
        });
        course['classes'] = classesCourse;
      });
      let clasesRevisar = classes.filter(x=>!x.instructorRef)
      console.log("classes instructor fixed inicio",courses,clasesRevisar,classes);

      //const batch = this.afs.firestore.batch();
      clasesRevisar.forEach(clase => {
        const instructorRef = courses.find(x => x.id == clase.idCurso).instructorRef;
        clase.instructorRef = instructorRef;
        const classDocRef = this.afs.collection('class').doc(clase.id).ref; // Accede a la referencia de Firestore
        //batch.update(classDocRef, { instructorRef: instructorRef });
        console.log('clase',clase,classDocRef)
      });
      //await batch.commit();
      console.log('classes instructor fixed fin')


    });

  }

  async findAndLogDuplicates() {
    console.log('findAndLogDuplicates');
    try {
      const snapshot = await this.afs.collection('userCertificate').get().toPromise();
      const certificates: any[] = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        data.id = doc.id;
        return data;
      });

      const counts = new Map<string, number>();
      const duplicates: any[] = [];

      certificates.forEach(cert => {
        if (!cert.cursoId) {
          return; // Ignorar si cursoId es null
        }
        const key = `${cert.cursoId}_${cert.usuarioId}`;
        if (counts.has(key)) {
          counts.set(key, counts.get(key) + 1);
        } else {
          counts.set(key, 1);
        }
      });

      counts.forEach((count, key) => {
        if (count > 1) {
          const [cursoId, usuarioId] = key.split('_');
          const duplicateCerts = certificates.filter(cert => cert.cursoId === cursoId && cert.usuarioId === usuarioId);
          const userIndex = duplicates.findIndex(dup => dup.usuarioId === usuarioId);
          if (userIndex === -1) {
            duplicates.push({
              usuarioId,
              cursos: [{
                cursoId,
                certificates: duplicateCerts
              }]
            });
          } else {
            const courseIndex = duplicates[userIndex].cursos.findIndex(curso => curso.cursoId === cursoId);
            if (courseIndex === -1) {
              duplicates[userIndex].cursos.push({
                cursoId,
                certificates: duplicateCerts
              });
            } else {
              duplicates[userIndex].cursos[courseIndex].certificates.push(...duplicateCerts);
            }
          }
        }
      });

      console.log('Found duplicates:', duplicates);
      await this.deleteDuplicateCertificates(duplicates);
    } catch (error) {
      console.error("Error finding duplicates: ", error);
    }
  }

  async deleteDuplicateCertificates(duplicates: any[]) {
    try {
      let deleted = []
      for (const user of duplicates) {
        for (const curso of user.cursos) {
          const sortedCerts = curso.certificates.sort((a: any, b: any) => b.date.seconds - a.date.seconds);
          const certsToDelete = sortedCerts.slice(1); // Todos menos el más reciente

          for (const cert of certsToDelete) {
            //await this.afs.collection('userCertificate').doc(cert.id).delete();
            //console.log(`Deleted certificate: ${cert.id}`);
            deleted.push(cert)
          }
        }
      }
      console.log('Duplicate certificates deleted successfully.',deleted);
    } catch (error) {
      console.error("Error deleting duplicates: ", error);
    }
  }

  async findAndLogNullUserIds() {
    try {
      const snapshot = await this.afs.collection('userCertificate', ref => ref.where('usuarioId', '==', null)).get().toPromise();
      const nullUserIdCertificates: any[] = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        data.id = doc.id;
        return data;
      });

      console.log('Certificates with null usuarioId:', nullUserIdCertificates);
    } catch (error) {
      console.error("Error finding null usuarioId certificates: ", error);
    }
  }

  async _findAndDeleteNullUserIds() {
    try {
      const snapshot = await this.afs.collection('userCertificate', ref => ref.where('usuarioId', '==', null)).get().toPromise();
      const nullUserIdCertificates = snapshot.docs.map(doc => {
        const data = doc.data() as any;
        data.id = doc.id;
        return data;
      });

      console.log('Certificates with null usuarioId:', nullUserIdCertificates);

      const batch = this.afs.firestore.batch();

      nullUserIdCertificates.forEach(cert => {
        const certRef = this.afs.collection('userCertificate').doc(cert.id).ref;
        batch.delete(certRef);
        console.log('certificado borrado',certRef)
      });

      await batch.commit();
      console.log('certificados borrados')
      console.log('Deleted certificates with null usuarioId');
    } catch (error) {
      console.error("Error deleting null usuarioId certificates: ", error);
    }
  }

  async findCoursesWithFinalScoreAndIncompleteProgress() {
    try {
      // Primero, obtener todos los cursos que tienen finalScore
      const snapshot = await this.afs.collection('coursesByStudent', ref => ref
        .where('finalScore', '>', 0)
      ).get().toPromise();

      // Luego, filtrar los cursos que tienen progress < 100 en el cliente
      const courses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() as any
      })).filter(course => course.progress < 100);

      console.log('Found courses with finalScore and progress < 100:', courses);

      // Buscar certificados para los cursos
      await this.findCertificatesForCourses(courses);

    } catch (error) {
      console.error("Error finding courses: ", error);
    }
  }

  async findCertificatesForCourses(courses: any[]) {
    console.log('aqui',courses)
    const coursesWithCertificates: any[] = [];
    const coursesWithoutCertificates: any[] = [];

    try {
      for (const course of courses) {
        const userId = course.userRef.id;
        const courseId = course.courseRef.id;

        const snapshot = await this.afs.collection('userCertificate', ref => ref
          .where('usuarioId', '==', userId)
          .where('cursoId', '==', courseId)
        ).get().toPromise();

        const certificates = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as any
        }));

        if (certificates.length > 0) {
          course.certificates = certificates;
          coursesWithCertificates.push(course);
        } else {
          coursesWithoutCertificates.push(course);
        }
      }

      console.log('Courses with certificates:', coursesWithCertificates);
      console.log('Courses without certificates:', coursesWithoutCertificates);

    } catch (error) {
      console.error("Error finding certificates: ", error);
    }
  }

  async updateCoursesProgress(courses: any[]) {
    const batch = this.afs.firestore.batch();

    courses.forEach(course => {
      if (course.progress === 90 && course.dateEnd) {
        const courseRef = this.afs.collection('coursesByStudent').doc(course.id).ref;
        batch.update(courseRef, {
          progress: 100,
          progressTime: course.courseTime
        });
      }
    });

    try {
      await batch.commit();
      console.log('Successfully updated courses');
    } catch (error) {
      console.error("Error updating courses: ", error);
    }
  }

  // -----------
  async addNewCoursesFields() {
    const batch = this.afs.firestore.batch();
  
    const collectionRef = this.afs.collection(Curso.collection).ref;
    const snapshot = await collectionRef.get();
  
    snapshot.docs.forEach((doc) => {
      const courseData = doc.data() as CursoJson;
      // console.log(courseData, "courseData")
      batch.update(doc.ref, {
        metaDescripcion: 'Meta - ' + courseData.descripcion,
        objetivos: [],
      });    
    });
  
    await batch.commit();
  }

  // cursosValoraciones
  courseRatingsCollection: string = "cursosValoraciones"

  async getCourseAverageRating(courseId: string): Promise<number> {
    const courseRef = this.getCourseRefById(courseId)
    const ratingsSnapshot = await this.afs.collection<CourseRating>(CourseRating.collection).ref.where('courseRef', '==', courseRef).get();

    if (ratingsSnapshot.empty) {
      console.log("No ratings found for this course");
      return 0;
    }

    const ratings = ratingsSnapshot.docs.map((doc) => doc.data());

    let sum = 0;
    let count = 0;

    ratings.forEach(rating => {
      if (rating && rating.valoracion && rating.valoracion.global !== undefined) {
        sum += rating.valoracion.global;
        count++;
      }
    });

    const average = count > 0 ? sum / count : 0;
    return average;
  }

  async getCourseRatingByUserRef(courseRef: DocumentReference, userRef: DocumentReference) {
    // Query to find the specific rating by the user for the course
    const ratingSnapshot = await this.afs.collection<CourseRating>(CourseRating.collection).ref
    .where('courseRef', '==', courseRef)
    .where('userRef', '==', userRef)
    .get();

    if (ratingSnapshot.empty) {
      console.log("No rating found for this user and course");
      return null;
    }

    const userRating = ratingSnapshot.docs[0].data();
    return userRating;
  }


  getCoursesRatings$(): Observable<CourseRating[]> {
    return this.afs.collection<CourseRating>(this.courseRatingsCollection).valueChanges()
  }
  

  //3amvhFWj9nYwLbQAWhTc

  async checkAndUpdateSkills() {
    //const batch = this.afs.firestore.batch(); // Batch para actualizar todos los documentos de una sola vez
    const defaultSkillRef = this.afs.doc('/skill/3amvhFWj9nYwLbQAWhTc').ref;
    const coursesToUpdate = []; // Arreglo para almacenar los cursos que necesitan actualización
  
    try {
      // Paso 1: Traer todos los documentos de las colecciones 'skills' y 'categories'
      const skillsSnapshot = await this.afs.collection('skill').get().toPromise();
      const categoriesSnapshot = await this.afs.collection('category').get().toPromise();
      
      const skills = skillsSnapshot.docs.map(doc => doc.data());
      const categories = categoriesSnapshot.docs.map(doc => doc.data());
  
      // Paso 2: Traer todos los documentos de la colección 'live-course'
      const liveCoursesSnapshot = await this.afs.collection('live-course-template').get().toPromise();
      const liveCourses = liveCoursesSnapshot.docs;
  
      // Iterar sobre cada documento de 'live-course'
      for (const courseDoc of liveCourses) {
        const courseData = courseDoc.data();
        let needsUpdate = false; // Bandera para verificar si el curso necesita actualización
  
        // Paso 3: Actualizar el campo 'skillsRef' si tiene skills referenciados
        if (courseData['skillsRef'] && Array.isArray(courseData['skillsRef'])) {
          const updatedSkillsRef = courseData['skillsRef'].map((skillRef: any) => {
            // Encontrar el skill en la colección de skills
            const skillInCollection = skills.find(skill => skill['id'] === skillRef.id);
  
            // Si el skill existe, ahora verificamos si también existe su categoría
            if (skillInCollection) {
              const categoryRef = skillInCollection['category'];
              
              // Comprobamos si la categoría referenciada existe
              const categoryExists = categories.some(category => category['id'] === categoryRef.id);
  
              // Si la categoría no existe, devolvemos el skill por defecto y marcamos que necesita actualización
              if (!categoryExists) {
                needsUpdate = true;
                return defaultSkillRef;
              }
              
              // Si todo está bien, devolvemos la referencia original del skill
              return skillRef;
            } else {
              // Si el skill no existe, devolvemos la referencia por defecto y marcamos que necesita actualización
              needsUpdate = true;
              return defaultSkillRef;
            }
          });
  
          // Paso 4: Eliminar duplicados (si hay duplicados)
          const uniqueSkillsRef = Array.from(new Set(updatedSkillsRef.map(ref => ref.path)))
            .map(path => this.afs.doc(path).ref);
  
          // Si se detectó que necesita actualización, agregamos el curso al arreglo 'coursesToUpdate'
          if (needsUpdate) {
            coursesToUpdate.push({
              ref: courseDoc.ref,
              skillsRef: uniqueSkillsRef
            });
          }
        }
      }
  
      // Paso 5: Registrar los cursos que se van a actualizar y preparar el batch
      console.log('Cursos que necesitan actualización:', coursesToUpdate);
      coursesToUpdate.forEach(course => {
        console.log('Curso a actualizar:', course.ref.id, 'con skills:', course.skillsRef);
        // Aquí puedes agregar al batch, pero está comentado por ahora para pruebas
        // batch.update(course.ref, { skillsRef: course.skillsRef });
      });
  
      // Paso 6: Ejecutar el batch de actualizaciones (descomentar cuando todo esté listo)
      // await batch.commit();
      console.log('Batch commit successful: Skills references updated.');
    } catch (error) {
      console.error('Error al actualizar las referencias de skills:', error);
    }
  }
  
  
  
}
