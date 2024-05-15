import { Injectable } from "@angular/core";
import { User } from "projects/shared/models/user.model";
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, DocumentReference, QuerySnapshot } from "@angular/fire/compat/firestore";
import { BehaviorSubject, firstValueFrom, forkJoin, Observable, of } from "rxjs";
import { EnterpriseService } from "./enterprise.service";
import { AlertsService } from "./alerts.service";
import { combineLatest } from "rxjs";
import { defaultIfEmpty, map, switchMap } from "rxjs/operators";
import { Curso } from "projects/shared/models/course.model";
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
    this.getCourses();
    //this.removeCheater('q5B5fsOhjcOoMuLUcLg8KfVB13Q2');
    //this.fixCertificates()
  }

  private coursesSubject = new BehaviorSubject<Curso[]>([]);
  private course$ = this.coursesSubject.asObservable();

  private enterpriseRef: DocumentReference;

  async fixCoursesCustomURL() {
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

  async saveCourse(newCourse: Curso): Promise<void> {
    try {
      try {
        // console.log("test saveCourse", newCourse);
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

  public getCourseRefById(id: string): DocumentReference<Curso> {
    return this.afs.collection<Curso>(Curso.collection).doc(id).ref;
  }

  // Funciones de diego

  getCourses$(): Observable<Curso[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return [];
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();

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

  getAllCourses$(): Observable<Curso[]> {
    return this.afs.collection<Curso>(Curso.collection).valueChanges();

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

  public async getCourseById(id: string): Promise<Curso> {
    return await firstValueFrom(
      this.afs.collection<Curso>(Curso.collection).doc(id).valueChanges()
    );
  }

  // ---- courseByStudent Collection methods
  getCoursesByStudent$(
    userRef: DocumentReference<User>
  ): Observable<CourseByStudent[]> {
    return this.afs
      .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
        ref.where("userRef", "==", userRef)
      )
      .valueChanges();
  }

    // ---- courseByStudent Collection methods
    getCoursesByStudentWithRef$(
      courseByStudentRef: DocumentReference<any>
    ): Observable<CourseByStudent[]> {
      return this.afs
        .collection<CourseByStudent>(CourseByStudent.collection, (ref) =>
          ref.where("id", "==", courseByStudentRef.id)
        )
        .valueChanges();
    }
  

  async getCourseByStudent(
    userRef: DocumentReference<User>,
    courseRef: DocumentReference<Curso>
  ): Promise<CourseByStudent> {
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

  async saveCourseByStudent(
    courseRef: DocumentReference,
    userRef: DocumentReference,
    dateStartPlan: Date,
    dateEndPlan: Date,
    isExtraCourse: boolean,
    idx: number
  ): Promise<CourseByStudent> {
    const ref = this.afs
      .collection<CourseByStudent>(CourseByStudent.collection)
      .doc().ref;
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

    await this.afs
      .collection(CourseByStudent.collection)
      .doc(courseByStudent.id)
      .set(courseByStudent);
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

  async setCourseByStudentActive(
    courseByStudentId: string,
    startDate: any,
    endDate: any
  ) {
    await this.afs
      .collection(CourseByStudent.collection)
      .doc(courseByStudentId)
      .set(
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
    return (
      await firstValueFrom(
        this.afs.collection<Clase>(Clase.collection).doc(classId).get()
      )
    ).data();
  }

  getClassesByEnterprise$(): Observable<any[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return of([]);
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        return this.afs
          .collection<User>(User.collection, (ref) =>
            ref.where("enterprise", "==", enterpriseRef)
          )
          .valueChanges();
      }),
      switchMap((users) => {
        if (users.length === 0) {
          return of([]);
        }
        const observableArray = [];
        users.forEach((user) => {
          observableArray.push(
            this.afs
              .collection("classesByStudent", (ref) =>
                ref
                  .where(
                    "userRef",
                    "==",
                    this.userService.getUserRefById(user.uid)
                  )
                  .where("completed", "==", true)
              )
              .valueChanges()
          );
        });
        return combineLatest(observableArray);
      }),
      map((arraysOfClasses) => arraysOfClasses.flat())
    );
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

}
