import { Injectable } from "@angular/core";
import { User, UserJson } from "projects/shared/models/user.model";
import { AngularFirestore, CollectionReference, DocumentReference, Query } from "@angular/fire/compat/firestore";
import { BehaviorSubject, combineLatest, filter, firstValueFrom, map, Observable, shareReplay, Subscription, switchMap,} from "rxjs";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { EnterpriseService } from "./enterprise.service";
import { AlertsService } from "./alerts.service";
import { firestoreTimestampToNumberTimestamp, generateSixDigitRandomNumber, obtenerUltimoDiaDelMes, obtenerUltimoDiaDelMesAnterior } from "projects/shared/utils";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { Profile } from "projects/shared/models/profile.model";
import { ProfileService } from "./profile.service";
import { CourseByStudent } from "projects/shared/models/course-by-student.model";
import { Curso } from "projects/shared/models/course.model";
import { DepartmentService } from "./department.service";
@Injectable({
  providedIn: "root",
})

export class UserService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  private usersWithoutProfileSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();
  public usersWithoutProfile$ = this.usersWithoutProfileSubject.asObservable();
  private usersLoadedSubject = new BehaviorSubject<boolean>(false);
  private usersWithoutProfileLoadedSubject = new BehaviorSubject<boolean>(
    false
  );

  public usersLoaded$ = this.usersLoadedSubject.asObservable();
  public usersWithoutProfileLoaded$ =
    this.usersWithoutProfileLoadedSubject.asObservable();

  private userCollectionSubscription: Subscription;
  private userCollectionProfileSubscription: Subscription;

  constructor(
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
    private enterpriseService: EnterpriseService,
    private profileService: ProfileService,
    private alertService: AlertsService,
    private departmentService: DepartmentService
  ) {
    //this.fixUsersEmpresasLastActivity();
    console.log("Se instancio el user service");
    //this.generateCourseCompletionReport(this.afs)
    this.enterpriseService.enterpriseLoaded$.subscribe((enterpriseIsLoaded) => {
      if (enterpriseIsLoaded) {
        this.getUsers();
      }
    });
  }


  async generateCourseCompletionReport(afs: AngularFirestore): Promise<any[]> {
    try {
      // Definir el rango de fechas para el año 2024
      const startOf2024 = new Date('2024-02-01T00:00:00Z');
      const endOf2024 = new Date('2024-12-31T23:59:59Z');
  
      // Obtener todos los cursos completados en 2024
      const coursesSnapshot = await afs.collection('coursesByStudent', ref =>
        ref.where('progress', '==', 100)
           .where('dateEnd', '>=', startOf2024)
           .where('dateEnd', '<=', endOf2024)
      ).get().toPromise();
      const coursesByStudent = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todos los usuarios
      const usersSnapshot = await afs.collection('user').get().toPromise();
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todos los cursos
      const allCoursesSnapshot = await afs.collection('course').get().toPromise();
      const allCourses = allCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todas las clases
      const classesSnapshot = await afs.collection('class').get().toPromise();
      const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Crear mapas para búsqueda rápida de usuarios, cursos y clases
      const userMap = new Map(users.map(user => [user.id, user]));
      const courseMap = new Map(allCourses.map(course => [course.id, course]));
      const classMap = new Map(allClasses.map(classe => [classe.id, classe]));
  
      // Obtener módulos y clases para cada curso
      for (const course of allCourses) {
        const modulesSnapshot = await afs.collection(`course/${course.id}/module`, ref => ref.orderBy('numero')).get().toPromise();
        const modules = modulesSnapshot.docs.map(doc => doc.data() as any);
  
        course.classes = modules.flatMap(module =>
          module.clasesRef.map((classRef: any) => classMap.get(classRef.id))
        );
      }
  
      // Agrupar los resultados por usuario
      const groupedByUser = coursesByStudent.reduce((acc, completion) => {
        const userId = completion.userRef.id;
        const courseId = completion.courseRef.id;
  
        if (!userMap.has(userId)) {
          return acc;
        }
  
        if (!acc[userId]) {
          acc[userId] = {
            user: userMap.get(userId),
            courses: [],
          };
        }
  
        const courseData = courseMap.get(courseId);
        acc[userId].courses.push({
          ...courseData,
          completionDetails: completion,
        });
  
        return acc;
      }, {} as { [key: string]: { user: any; courses: any[] } });
  
      // Procesar cada usuario para verificar las clases completadas
      const usersWithIncompleteCourses = [];
      for (const userId in groupedByUser) {
        const userCourses = groupedByUser[userId].courses;
        const userRef = afs.doc(`user/${userId}`).ref;
  
        // Obtener las clases completadas por el usuario
        const completedClassesSnapshot = await afs.collection('classesByStudent', ref =>
          ref.where('userRef', '==', userRef)
            .where('completed', '==', true)
        ).get().toPromise();
  
        const completedClasses = new Set(completedClassesSnapshot.docs.map(doc => doc.data()['classRef'].id));
  
        // Verificar las clases de cada curso y filtrar los cursos incompletos con última clase completada
        const incompleteCoursesWithCompletedLastClass = userCourses.filter(course => {
          const lastClass = course.classes[course.classes.length - 1]; // Última clase del curso
          return completedClasses.has(lastClass.id) &&
            !course.classes.every((classe: any) => completedClasses.has(classe.id));
        });
  
        if (incompleteCoursesWithCompletedLastClass.length > 0) {
          usersWithIncompleteCourses.push({
            user: groupedByUser[userId].user,
            courses: incompleteCoursesWithCompletedLastClass.map(course => ({
              ...course,
              incompleteClasses: course.classes.filter((classe: any) => !completedClasses.has(classe.id))
            }))
          });
        }
  
        console.log(`Usuario procesado: ${userId}`);
      }
  
      console.log('Reporte de cursos incompletos con última clase completada por usuario:', usersWithIncompleteCourses);
      return usersWithIncompleteCourses;
    } catch (error) {
      console.error('Error generando el reporte:', error);
      return []; // Asegurarse de devolver un arreglo vacío en caso de error
    }
  }
  
  

  async __generateCourseCompletionReport(afs: AngularFirestore): Promise<any[]> {
    try {
      // Definir el rango de fechas para el año 2024
      const startOf2024 = new Date('2024-02-01T00:00:00Z');
      const endOf2024 = new Date('2024-12-31T23:59:59Z');
  
      // Obtener todos los cursos completados en 2024
      const coursesSnapshot = await afs.collection('coursesByStudent', ref =>
        ref.where('progress', '==', 100)
           .where('dateEnd', '>=', startOf2024)
           .where('dateEnd', '<=', endOf2024)
      ).get().toPromise();
      const coursesByStudent = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todos los usuarios
      const usersSnapshot = await afs.collection('user').get().toPromise();
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todos los cursos
      const allCoursesSnapshot = await afs.collection('course').get().toPromise();
      const allCourses = allCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todas las clases
      const classesSnapshot = await afs.collection('class').get().toPromise();
      const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Crear mapas para búsqueda rápida de usuarios, cursos y clases
      const userMap = new Map(users.map(user => [user.id, user]));
      const courseMap = new Map(allCourses.map(course => [course.id, course]));
      const classMap = new Map(allClasses.map(classe => [classe.id, classe]));
  
      // Obtener módulos y clases para cada curso
      for (const course of allCourses) {
        const modulesSnapshot = await afs.collection(`course/${course.id}/module`, ref => ref.orderBy('numero')).get().toPromise();
        const modules = modulesSnapshot.docs.map(doc => doc.data() as any);
        
        course.classes = modules.flatMap(module => 
          module.clasesRef.map((classRef: any) => classMap.get(classRef.id))
        );
      }
  
      // Agrupar los resultados por usuario
      const groupedByUser = coursesByStudent.reduce((acc, completion) => {
        const userId = completion.userRef.id;
        const courseId = completion.courseRef.id;
  
        if (!userMap.has(userId)) {
          return acc;
        }
  
        if (!acc[userId]) {
          acc[userId] = {
            user: userMap.get(userId),
            courses: [],
          };
        }
  
        const courseData = courseMap.get(courseId);
        acc[userId].courses.push({
          ...courseData,
          completionDetails: completion,
        });
  
        return acc;
      }, {} as { [key: string]: { user: any; courses: any[] } });
  
      // Procesar cada usuario para verificar las clases completadas
      const usersWithIncompleteCourses = [];
      for (const userId in groupedByUser) {
        const userCourses = groupedByUser[userId].courses;
        const userRef = afs.doc(`user/${userId}`).ref;
  
        // Obtener las clases completadas por el usuario
        const completedClassesSnapshot = await afs.collection('classesByStudent', ref =>
          ref.where('userRef', '==', userRef)
            .where('completed', '==', true)
        ).get().toPromise();
  
        const completedClasses = new Set(completedClassesSnapshot.docs.map(doc => doc.data()['classRef'].id));
  
        // Verificar las clases de cada curso y filtrar los cursos incompletos
        const incompleteCourses = userCourses.filter(course => 
          !course.classes.every((classe: any) => completedClasses.has(classe.id))
        );
  
        if (incompleteCourses.length > 0) {
          usersWithIncompleteCourses.push({
            user: groupedByUser[userId].user,
            courses: incompleteCourses.map(course => ({
              ...course,
              incompleteClasses: course.classes.filter((classe: any) => !completedClasses.has(classe.id))
            }))
          });
        }
  
        console.log(`Usuario procesado: ${userId}`);
      }
  
      console.log('Reporte de cursos incompletos por usuario:', usersWithIncompleteCourses);
      return usersWithIncompleteCourses;
    } catch (error) {
      console.error('Error generando el reporte:', error);
      return []; // Asegurarse de devolver un arreglo vacío en caso de error
    }
  }
  
  


  async _generateCourseCompletionReport(afs: AngularFirestore): Promise<any[]> {
    try {
      // Obtener todos los cursos completados
      const coursesSnapshot = await afs.collection('coursesByStudent', ref => ref.where('progress', '==', 100)).get().toPromise();
      const coursesByStudent = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todos los usuarios
      const usersSnapshot = await afs.collection('user').get().toPromise();
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todos los cursos
      const allCoursesSnapshot = await afs.collection('course').get().toPromise();
      const allCourses = allCoursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Obtener todas las clases
      const classesSnapshot = await afs.collection('class').get().toPromise();
      const allClasses = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  
      // Crear mapas para búsqueda rápida de usuarios, cursos y clases
      const userMap = new Map(users.map(user => [user.id, user]));
      const courseMap = new Map(allCourses.map(course => [course.id, course]));
      const classMap = new Map(allClasses.map(classe => [classe.id, classe]));
  
      // Obtener módulos y clases para cada curso
      for (const course of allCourses) {
        const modulesSnapshot = await afs.collection(`course/${course.id}/module`).get().toPromise();
        const modules = modulesSnapshot.docs.map(doc => doc.data() as any);
        
        course.classes = modules.flatMap(module => 
          module.clasesRef.map((classRef: any) => classMap.get(classRef.id))
        );
      }
  
      // Agrupar los resultados por usuario
      const groupedByUser = coursesByStudent.reduce((acc, completion) => {
        const userId = completion.userRef.id;
        const courseId = completion.courseRef.id;
  
        if (!userMap.has(userId)) {
          return acc;
        }
  
        if (!acc[userId]) {
          acc[userId] = {
            user: userMap.get(userId),
            courses: [],
          };
        }
  
        const courseData = courseMap.get(courseId);
        acc[userId].courses.push({
          ...courseData,
          completionDetails: completion,
        });
  
        return acc;
      }, {} as { [key: string]: { user: any; courses: any[] } });
  
      // Procesar cada usuario para verificar las clases completadas
      const usersWithIncompleteCourses = [];
      for (const userId in groupedByUser) {
        const userCourses = groupedByUser[userId].courses;
        const userRef = afs.doc(`user/${userId}`).ref;
  
        // Obtener las clases completadas por el usuario
        const completedClassesSnapshot = await afs.collection('classesByStudent', ref =>
          ref.where('userRef', '==', userRef)
            .where('completed', '==', true)
        ).get().toPromise();
  
        const completedClasses = new Set(completedClassesSnapshot.docs.map(doc => doc.data()['classRef'].id));
  
        // Verificar las clases de cada curso y filtrar los cursos incompletos
        const incompleteCourses = userCourses.filter(course => 
          !course.classes.every((classe: any) => completedClasses.has(classe.id))
        );
  
        if (incompleteCourses.length > 0) {
          usersWithIncompleteCourses.push({
            user: groupedByUser[userId].user,
            courses: incompleteCourses.map(course => ({
              ...course,
              incompleteClasses: course.classes.filter((classe: any) => !completedClasses.has(classe.id))
            }))
          });
        }
  
        console.log(`Usuario procesado: ${userId}`);
      }
  
      console.log('Reporte de cursos incompletos por usuario:', usersWithIncompleteCourses);
      return usersWithIncompleteCourses;
    } catch (error) {
      console.error('Error generando el reporte:', error);
      return []; // Asegurarse de devolver un arreglo vacío en caso de error
    }
  }

  async fixUsersEmpresasLastActivity() {
    console.log('inicio fixUsersLastActivity');
  
    const batch = this.afs.firestore.batch();
    const collectionRef = this.afs.collection('user').ref;
    const snapshot = await collectionRef.get();
  
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const userRef = doc.ref;
  
      if (!userData['lastActivity'] && userData['enterprise']) {
  
        // Buscar todas las clases del usuario actual
        const classesSnapshot = await this.afs.collection('classesByStudent', ref =>
          ref.where('userRef', '==', userRef)
        ).get().toPromise();
  
        // Filtrar las clases que tienen dateEnd
        const classesWithDateEnd = classesSnapshot.docs.filter(classDoc => classDoc.data()['dateEnd']);
  
        // Si hay al menos una clase con dateEnd, procesarla
        if (classesWithDateEnd.length > 0) {
          let mostRecentClass = null;
          let mostRecentDate = null;
  
          classesWithDateEnd.forEach(classDoc => {
            const classData = classDoc.data();
            let dateEnd;
  
            if (classData['dateEnd'].seconds) {
              dateEnd = new Date(classData['dateEnd'].seconds * 1000);
            } else if (typeof classData['dateEnd'] === 'number') {
              dateEnd = new Date(classData['dateEnd']);
            } else {
              dateEnd = new Date(classData['dateEnd']);
            }
  
            if (!mostRecentDate || dateEnd > mostRecentDate) {
              mostRecentDate = dateEnd;
              mostRecentClass = classData;
            }
          });
  
          if (mostRecentClass && mostRecentDate) {
            console.log('usuarioActividad fixUsersLastActivity', userData, mostRecentClass, mostRecentDate);
            batch.update(doc.ref, { lastActivity: 'Clase finalizada', lastActivityDate: mostRecentDate });
          }
        }
      }
    }
  
    // Ejecuta el batch write
    await batch.commit();
  
    console.log('fin fixUsersLastActivity');
  }
  

  async addUser(newUser: User): Promise<void> {
    // console.log(newUser.name);
    newUser.name = newUser.name.toLocaleLowerCase();
    newUser.displayName = newUser.displayName.toLocaleLowerCase();
    newUser.email = newUser.email.toLocaleLowerCase();
    const { uid } = await firstValueFrom(
      this.fireFunctions.httpsCallable("createUserWithEmailAndPassword")({
        email: newUser.email as string,
        name: newUser.name,
      })
    );
    const dataToSave =
      typeof newUser.toJson === "function" ? newUser.toJson() : newUser;

    await this.afs
      .collection(User.collection)
      .doc(uid)
      .set({ ...dataToSave, uid: uid });
    newUser.uid = uid;
    if (newUser.profile) {
      const userRef = this.getUserRefById(uid);
      const profileRef = this.profileService.getProfileRefById(
        newUser.profile.id
      );
      await this.profileService.saveUserProfileLog(userRef, profileRef);
    }
  }

  async addUserInMigrations(oldUser: User): Promise<string> {
    const usersIdMap: { [key: string]: string } = {}
    // console.log(newUser.name);
    oldUser.name = oldUser.name.toLocaleLowerCase();
    oldUser.displayName = oldUser.displayName.toLocaleLowerCase();
    oldUser.email = oldUser.email.toLocaleLowerCase();
    const { uid } = await firstValueFrom(
      this.fireFunctions.httpsCallable("createUserWithEmailAndPassword")({
        email: oldUser.email as string,
        name: oldUser.name,
      })
    );
    const dataToSave = typeof oldUser.toJson === "function" ? oldUser.toJson() : oldUser;

    await this.afs
      .collection(User.collection)
      .doc(uid)
      .set({ ...dataToSave, uid: uid });
      
    return uid

  }

  private async activateUser(user: User) {
    await this.afs
      .collection(User.collection)
      .doc(user.uid as string)
      .set(
        {
          ...user,
          isActive: true,
        },
        { merge: true }
      );
  }

  async delete(user: User): Promise<void> {
    try {
      await this.afs
        .collection(User.collection)
        .doc(user.uid as string)
        .set(
          {
            ...user,
            isActive: false,
          },
          { merge: true }
        );
      this.alertService.succesAlert("Has eliminado al usuario exitosamente.");
    } catch (error) {
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }

  async transformUserToAdmin(user: User): Promise<void> {
    try {
      await this.afs
        .collection(User.collection)
        .doc(user.uid as string)
        .set(
          {
            ...user,
            role: "admin",
          },
          { merge: true }
        );
      this.alertService.succesAlert(
        `El usuario ${user.displayName} ha sido convertido en administrador.`
      );
    } catch (error) {
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }

  async transformUserToStudent(user: User): Promise<void> {
    try {
      await this.afs
        .collection(User.collection)
        .doc(user.uid as string)
        .set(
          {
            ...user,
            role: "student",
          },
          { merge: true }
        );
      this.alertService.succesAlert(
        `El usuario ${user.displayName} ha sido convertido en estudiante.`
      );
    } catch (error) {
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }

  async editUser(user: UserJson): Promise<void> {
    user.name = user.name.toLocaleLowerCase();
    user.displayName = user.displayName.toLocaleLowerCase();
    user.email = user.email.toLocaleLowerCase();
    const userRef = this.getUserRefById(user.uid);
    // Obtener el documento actual
    const currentDocument = await firstValueFrom(
      this.afs
        .collection(User.collection)
        .doc(user.uid as string)
        .get()
    );
    const currentData = currentDocument.data() as UserJson;

    await this.afs
      .collection(User.collection)
      .doc(user.uid as string)
      .set(user, { merge: true });
    // Comparar el valor original con el nuevo
    if (
      (user.profile && !currentData.profile) ||
      (currentData.profile && currentData.profile.id !== user.profile.id)
    ) {
      console.log("Se cambió el perfil del usuario");
      const profileRef = this.profileService.getProfileRefById(user.profile.id);
      await this.profileService.saveUserProfileLog(userRef, profileRef);
    }
  }

  getUsers$(
    searchTerm = null,
    profileFilter = null,
    statusFilter = null
  ): Observable<User[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return [];
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        return this.afs
          .collection<User>(User.collection, (ref) => {
            let query: CollectionReference | Query = ref;
            query = query.where("enterprise", "==", enterpriseRef);
            query = query.where("isActive", "==", true);
            if (searchTerm) {
              // query = query.where('displayName', '==', searchTerm)
              query = query
                .where("displayName", ">=", searchTerm)
                .where("displayName", "<=", searchTerm + "\uf8ff");
            }
            if (profileFilter) {
              const profileRef =
                this.profileService.getProfileRefById(profileFilter);
              query = query.where("profile", "==", profileRef);
            }

            if (
              statusFilter &&
              statusFilter === SubscriptionClass.STATUS_ACTIVE
            ) {
              query = query.where(
                "status",
                "==",
                SubscriptionClass.STATUS_ACTIVE
              );
            }
            return query.orderBy("displayName");
          })
          .valueChanges();
      })
    );
  }

  getUsersReport$(
    searchTerm = null,
    profileFilter = null,
    statusFilter = null,
    departmentsFilter = null,
    dateIni = null,
    deteEnd = null
  ): Observable<User[]> {
    console.log(
      searchTerm,
      profileFilter,
      statusFilter,
      departmentsFilter,
      dateIni,
      deteEnd
    );

    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap((isLoaded) => {
        if (!isLoaded) return [];
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        return this.afs
          .collection<User>(User.collection, (ref) => {
            let query: CollectionReference | Query = ref;
            query = query.where("enterprise", "==", enterpriseRef);
            query = query.where("isActive", "==", true);
            if (searchTerm) {
              // query = query.where('displayName', '==', searchTerm)
              query = query
                .where("displayName", ">=", searchTerm)
                .where("displayName", "<=", searchTerm + "\uf8ff");
            }
            if (profileFilter) {
              const profileRef =
                this.profileService.getProfileRefById(profileFilter);
              query = query.where("profile", "==", profileRef);
            }

            if (departmentsFilter && departmentsFilter.length > 0) {
              // Convierte los IDs de departamento en referencias de documentos
              const departmentRefs = departmentsFilter.map(
                (id) => this.afs.doc(`department/${id}`).ref
              );

              // Utiliza la cláusula 'in' con las referencias de documentos, teniendo en cuenta la limitación de 10 elementos
              if (departmentRefs.length <= 10) {
                query = query.where("departmentRef", "in", departmentRefs);
              } else {
                console.error(
                  "La función no soporta filtrar por más de 10 departamentos debido a limitaciones de Firestore."
                );
              }
            }

            if (
              statusFilter &&
              statusFilter === SubscriptionClass.STATUS_ACTIVE
            ) {
              query = query.where(
                "status",
                "==",
                SubscriptionClass.STATUS_ACTIVE
              );
            }
            return query.orderBy("displayName");
          })
          .valueChanges();
      })
    );
  }

  getAllUsers$(searchTerm = null): Observable<User[]> {
    return this.afs
      .collection<User>(User.collection, (ref) => {
        let query: CollectionReference | Query = ref;
        // if (searchTerm) {
        //   query = query.where('displayName', '>=', searchTerm).where('displayName', '<=', searchTerm+ '\uf8ff')
        // }
        return query.orderBy("displayName");
      })
      .valueChanges()
      .pipe(shareReplay(1));
  }

  getUsersByEnterpriseRef$(
    enterpriseRef: DocumentReference
  ): Observable<User[]> {
    return this.afs
      .collection<User>(User.collection, (ref) =>
        ref.where("enterprise", "==", enterpriseRef)
      )
      .valueChanges();
  }

  getStudentUsersByEnterpriseRef$(
    enterpriseRef: DocumentReference
  ): Observable<User[]> {
    return this.afs
      .collection<User>(User.collection, (ref) =>
        ref
          .where("enterprise", "==", enterpriseRef)
          .where("role", "==", "student")
      )
      .valueChanges();
  }

  getAdminUsersByEnterpriseRef$(
    enterpriseRef: DocumentReference
  ): Observable<User[]> {
    return this.afs
      .collection<User>(User.collection, (ref) =>
        ref
          .where("enterprise", "==", enterpriseRef)
          .where("role", "==", "admin")
      )
      .valueChanges();
  }

  getSubscriptionByStudentDateFiltered$(
    userRef: DocumentReference<any>,
    dateIni = null,
    dateEnd = null
  ): Observable<any[]> {
    return this.afs.collection<any>(SubscriptionClass.collection, (ref) => {
        let query = ref.where("userRef", "==", userRef);
        return query;
      }) .valueChanges();
  }

  getMonthProgress(): number {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = now.getMonth() === 11 ? new Date(now.getFullYear() + 1, 0, 1) : new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const totalDaysInMonth = (nextMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24);
    const daysElapsed = (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24);

    return Number((daysElapsed / totalDaysInMonth).toFixed(2)); // Redondea a dos decimales y retorna como número
  }

  getRatingPointsFromStudyPlan(
    userStudyPlan: CourseByStudent[],
    courses: Curso[]
  ): number {
    let totalScore = 0;
    const today = new Date().getTime();
    userStudyPlan.forEach((courseByStudent) => {
      const course = courses.find(
        (course) => course.id === courseByStudent.courseRef.id
      );
      let targetComparisonDate = today;
      let delayTime = 0;
      let delayDays = 0;
      if (courseByStudent.dateEnd) {
        totalScore += course.duracion / 60;
        let puntaje = courseByStudent.finalScore;
        if (puntaje >= 80 && puntaje < 90) {
          totalScore += (course.duracion / 60) * 0.1;
        }
        if (puntaje >= 90 && puntaje < 100) {
          totalScore += (course.duracion / 60) * 0.3;
        }
        if (puntaje == 100) {
          totalScore += (course.duracion / 60) * 0.5;
        }
        targetComparisonDate = courseByStudent.dateEnd;
        delayTime = targetComparisonDate - courseByStudent.dateEndPlan;
        delayDays = delayTime / (24 * 60 * 60 * 1000);
        if (delayDays >= 1) {
          if (delayDays < 3) {
            totalScore -= (course.duracion / 60) * 0.1;
          }
          if (delayDays >= 3 && delayDays < 5) {
            totalScore -= (course.duracion / 60) * 0.3;
          }
          if (delayDays >= 5) {
            totalScore -= (course.duracion / 60) * 0.5;
          }
        }
      }
    });
    return totalScore >= 0 ? totalScore : 0;
  }

  // getPerformanceWithDetails(student): { performance:"no plan" | "high" | "medium" | "low", score: number, grade: number } {
  getPerformanceWithDetails(
    userStudyPlan
  ): "no plan" | "high" | "medium" | "low" | "no iniciado" {

    const today = new Date().getTime();

    let targetComparisonDate = today;

    let lastDayPast = obtenerUltimoDiaDelMesAnterior(targetComparisonDate)
    let lastDayCurrent = obtenerUltimoDiaDelMes(targetComparisonDate)

    let progressMonth = this.getMonthProgress()



    let userStudyPlanUntilLastMonth = userStudyPlan.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)<=lastDayPast)
    let userStudyPlanCurrent = userStudyPlan.filter(x=>x.dateEndPlan  && (x.dateEndPlan?.seconds*1000)>lastDayPast && (x.dateEndPlan?.seconds*1000)<=lastDayCurrent )

    let studentHours = 0
    let studentExpectedHours = 0

    userStudyPlanUntilLastMonth.forEach(course => {
      if(course.progress >=100){
        studentExpectedHours +=course.courseTime
        studentHours +=course.courseTime
      }
      else{
        studentExpectedHours +=course.courseTime
        studentHours +=course.progressTime
      }
    });

    userStudyPlanCurrent.forEach(course => {
      
      studentExpectedHours +=(course.courseTime * progressMonth)
      studentHours +=course.progressTime?course.progressTime:0
    });


    let procentaje = studentHours*100/studentExpectedHours


    let performance: "no plan" | "high" | "medium" | "low" | "no iniciado";
    

    let validator = userStudyPlan.find((x) => x.progressTime > 0);
    if (!validator && userStudyPlan.length > 0) {
      performance = "no iniciado";
    } else if (userStudyPlan.length == 0) {
      performance = "no plan";
    } else if (procentaje >=80) {
      performance = "high";
    } else if (procentaje >=50) {
      performance = "medium";
    } else {
      performance = "low";
    }


    return performance;
  }

  // getActiveUsers$(searchTerm, profileFilter): Observable<User[]> {
  //   return this.getUsers$(searchTerm, profileFilter, true)
  // }

  // getInactiveUsers$(searchTerm, profileFilter): Observable<User[]> {
  //   return this.getUsers$(searchTerm, profileFilter, false)
  // }

  // Arguments could be pageSize, sort, currentPage

  private getUsers() {
    if (this.userCollectionSubscription) {
      this.userCollectionSubscription.unsubscribe();
    }
    this.userCollectionSubscription = this.afs
      .collection<User>(
        User.collection,
        (ref) =>
          ref
            .where(
              "enterprise",
              "==",
              this.enterpriseService.getEnterpriseRef()
            )
            .where("isActive", "==", true)
            .orderBy("displayName")
        //  .limit(pageSize)
      )
      .valueChanges()
      .subscribe({
        next: (users) => {
          this.usersSubject.next(users);
          if (!this.usersLoadedSubject.value) {
            this.usersLoadedSubject.next(true);
          }
        },
        error: (error) => {
          console.log(error);
          this.alertService.errorAlert(JSON.stringify(error));
        },
      });
  }

  getUser(uid: string): User {
    // const user = await firstValueFrom(this.afs.collection<User>(User.collection).doc(uid).valueChanges())
    // return user?.enterprise === this.enterpriseService.getEnterpriseRef() ? user : undefined
    return this.usersSubject.value.find((x) => x.uid === uid);
  }

  async getUserByUid(uid: string): Promise<User> {
    return (
      await firstValueFrom(
        this.afs.collection<User>(User.collection).doc(uid).get()
      )
    ).data();
  }

  getUser$(uid: string): Observable<User> {
    return this.afs.collection<User>(User.collection).doc(uid).valueChanges();
  }

  public getUserRefById(id: string): DocumentReference<User> {
    return this.afs.collection<User>(User.collection).doc(id).ref;
  }

  public usersAreLoaded(): boolean {
    return this.usersLoadedSubject.value;
  }

  public getUsersByProfile(idProfile: string | null) {
    return this.users$.pipe(
      map((users) =>
        users.filter(
          (user) =>
            (idProfile === null && user.profile === null) ||
            (user.profile && user.profile.id === idProfile)
        )
      )
    );
  }

  public getUsersRefByProfileId(
    profileId: string | null
  ): DocumentReference<User>[] {
    // Filtrar usuarios basados en el profileId y mapear a sus referencias
    const userRefs = this.usersSubject.value
      .filter(
        (user) =>
          user.profile &&
          user.profile.path === `${Profile.collection}/${profileId}`
      )
      .map((user) => this.afs.doc<User>(`${User.collection}/${user.uid}`).ref);
    return userRefs;
  }

  public getUsersRefsWithProfile(): DocumentReference<User>[] {
    // Filtrar usuarios que tienen un perfil y mapear a sus referencias
    return this.usersSubject.value
      .filter((user) => user.profile)
      .map((user) => this.afs.doc<User>(`${User.collection}/${user.uid}`).ref);
  }

  async getGeneralUserData(key: string): Promise<User> {
    // Hacer peticion aqui o globalmente cuando se inicie el servicio
    // Crear modelo para nombre de coleccion y documento
    const configData = await firstValueFrom(
      this.afs.collection("general").doc("config").valueChanges()
    );
    const userRef: DocumentReference = configData[key];
    console.log("general user data", this.getUser(userRef.id));
    return this.getUser(userRef.id);
  }

  async saveStudyPlanHoursPerMonth(uid: string, hoursPerMonth: number) {
    await this.afs.collection(User.collection).doc(uid).set(
      {
        studyHours: hoursPerMonth,
      },
      { merge: true }
    );
  }

  async updateUserFields(uid: string, fields: Partial<User>) {
    await this.afs
      .collection(User.collection)
      .doc(uid)
      .set(fields, { merge: true });
  }

  async canEnrollParticularCourses(
    userId: string,
    value: boolean
  ): Promise<void> {
    const userRef = this.getUserRefById(userId);

    return this.afs
      .collection(User.collection)
      .doc(userId)
      .set({ canEnrollParticularCourses: value }, { merge: true });
  }
}
