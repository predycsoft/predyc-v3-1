import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference, QuerySnapshot } from '@angular/fire/compat/firestore';
import { BehaviorSubject, combineLatest, Observable, of, zip } from 'rxjs'
import { filter, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { EnterpriseService } from './enterprise.service';
import { Curso, User } from 'shared';
import { Diplomado } from 'projects/shared/models/diplomado.model';



@Injectable({
  providedIn: 'root'
})
export class DiplomadoService {

  constructor(
    private afs: AngularFirestore,
    private authService: AuthService,
    private enterpriseService: EnterpriseService,
  ) 
  {

  }
  private coursesByStudentSubject = new BehaviorSubject<any[]>([]);
  private coursesByStudent$: Observable<any[]>;


  // private initialize() {

  //   this.authService.user$.pipe(
  //     filter(userDoc => userDoc !== null) // Only proceed if userDoc is not null
  //   ).subscribe(userDoc => {
  //     //console.log('userDoc', userDoc);
  //     this.initializeDiplomadosByStudent(userDoc);
  //   });
  // }


  public initializeDiplomadosByStudent(userRef: any) {
    // const userRef = this.afs.doc(`user/${userDoc.uid}`).ref;
  
    // Consulta para diplomados del estudiante
    const diplomadosByStudent$ = this.afs.collection('diplomadoByStudent', ref =>
      ref.where('userRef', '==', userRef)
    ).valueChanges({ idField: 'id' });
  
    // Fetch all courses
    const allCourses$ = this.afs.collection<Curso>(Curso.collection).valueChanges({ idField: 'id' });
  
    // Fetch all certificates for the student
    const certificatesByStudent$ = this.afs.collection('userCertificate', ref => ref.where('usuarioId', '==', userRef.id))
      .valueChanges({ idField: 'id' });
  
    // Fetch all coursesByStudent for the student
    const coursesByStudent$ = this.afs.collection<any>('coursesByStudent', ref => 
      ref.where('userRef', '==', userRef)
    ).valueChanges({ idField: 'id' });
  
    // Procesar los diplomados
    const diplomadosWithCourses$ = combineLatest([diplomadosByStudent$, certificatesByStudent$]).pipe(
      switchMap(([diplomados, studentCertificates]) => {
        const diplomadoCourses$ = diplomados.map(diplomado => {
          const diplomadoRef = diplomado['diplomadoRef']; // Usar directamente diplomadoRef del objeto diplomado
          const diplomadoByStudentRef = this.afs.doc(`diplomadoByStudent/${diplomado.id}`).ref; // Agregar referencia a diplomadoByStudent
  
          return this.afs.doc(diplomadoRef.path).valueChanges().pipe(
            switchMap((diplomadoData: any) => {
              const coursesRefs: Array<{ courseRef: any, studyPlanOrder: number }> = diplomadoData.coursesRef;
              const courses$ = coursesRefs.map(courseRefObj => {
                const courseRef = courseRefObj.courseRef;
                return this.afs.doc(courseRef.path).valueChanges({ idField: 'id' }).pipe(
                  switchMap((course: any) => {
                    if (course.instructorRef) {
                      return this.afs.doc(course.instructorRef.path).valueChanges({ idField: 'id' }).pipe(
                        map(instructor => ({ ...course, instructor, studyPlanOrder: courseRefObj.studyPlanOrder }))
                      );
                    } else {
                      return of({ ...course, studyPlanOrder: courseRefObj.studyPlanOrder });
                    }
                  })
                );
              });
  
              const combinedCourses$ = combineLatest(courses$).pipe(
                map(courses => {
                  // Buscar el certificado asociado al diplomado en la raíz del objeto del diplomado
                  const certificate = studentCertificates.find(cert => cert['diplomadoId'] === diplomado['diplomadoRef'].id) || null;
                  return { ...diplomado, ...diplomadoData, courses, diplomadoByStudentRef, certificate };
                })
              );
  
              if (diplomadoData.activityRef) {
                const activityRef = diplomadoData.activityRef;
                const questions$ = this.afs.collection(`${activityRef.path}/question`).valueChanges({ idField: 'id' });
  
                return combineLatest([combinedCourses$, questions$]).pipe(
                  map(([diplomadoWithCourses, questions]) => ({
                    ...diplomadoWithCourses,
                    questions
                  }))
                );
              } else {
                return combinedCourses$;
              }
            })
          );
        });
        return combineLatest(diplomadoCourses$);
      })
    );
  
    // Combine all courses with the student's courses and certificates, then perform a local 'join'
    this.coursesByStudent$ = combineLatest([allCourses$, coursesByStudent$, certificatesByStudent$, diplomadosWithCourses$]).pipe(
      map(([allCourses, studentCourses, studentCertificates, diplomados]) => {
        return diplomados.map(diplomado => {
          const coursesWithDetails = diplomado.courses.map((course: any) => {
            const studentCourse = studentCourses.find(sc => sc.courseRef.id === course.id) || null;
            const courseCertificate = studentCertificates.find(cert => cert['cursoId'] === course.id) || null;
            return { ...course, studentCourse, courseCertificate };
          });
          return { ...diplomado, courses: coursesWithDetails };
        });
      })
    );
  
    this.coursesByStudent$.subscribe({
      next: courses => {
        this.coursesByStudentSubject.next(courses);
      },
      error: error => {
        console.error('Error fetching courses and certificates:', error);
      }
    });
  }
  
  
  
  
  getDiplomadoByStudent(): Observable<any[]> {
    return this.coursesByStudentSubject.asObservable();
  }

  getDiplomadoRefById(id: string): DocumentReference<Diplomado> {
    return this.afs.collection<Diplomado>(Diplomado.collection).doc(id).ref;
  }
  

  async enrollUserDiplomadoWithRefs(diplomadoRef, userRef) {
    try {
    
    
      // Verificar si ya existe una inscripción
      const existingEnrollmentSnapshot = await this.afs.collection('diplomadoByStudent', ref =>
        ref.where('userRef', '==', userRef)
           .where('diplomadoRef', '==', diplomadoRef)
      ).get().toPromise();
  
      if (!existingEnrollmentSnapshot.empty) {
        console.log('User is already enrolled in this diplomado');
        return;
      }
  
      let diplomadoEnroll = {
        id: null,
        userRef: userRef,
        diplomadoRef: diplomadoRef,
        enrollDate: new Date(),
        certificateRef: null,
        activityScore: 0,
        dateEnd: null
      };
  
      const ref = this.afs.collection<any>('diplomadoByStudent').doc().ref;
      await ref.set({ ...diplomadoEnroll, id: ref.id }, { merge: true });
      diplomadoEnroll.id = ref.id;
  
      console.log('Enrollment successful', diplomadoEnroll);
  
    } catch (error) {
      console.log('Error enrolling user in diplomado:', error);
    }
  }

  async enrollUserDiplomado(diplomado, user) {
    try {
      const userRef = this.afs.collection('user').doc(user.uid).ref;
      const diplomadoRef = this.afs.collection(Diplomado.collection).doc(diplomado.id).ref;
  
      console.log('enroll diplomado', user, diplomado, userRef, diplomadoRef);
  
      // Verificar si ya existe una inscripción
      const existingEnrollmentSnapshot = await this.afs.collection('diplomadoByStudent', ref =>
        ref.where('userRef', '==', userRef)
           .where('diplomadoRef', '==', diplomadoRef)
      ).get().toPromise();
  
      if (!existingEnrollmentSnapshot.empty) {
        console.log('User is already enrolled in this diplomado');
        return;
      }
  
      let diplomadoEnroll = {
        id: null,
        userRef: userRef,
        diplomadoRef: diplomadoRef,
        enrollDate: new Date(),
        certificateRef: null,
        activityScore: 0,
        dateEnd: null
      };
  
      const ref = this.afs.collection<any>('diplomadoByStudent').doc().ref;
      await ref.set({ ...diplomadoEnroll, id: ref.id }, { merge: true });
      diplomadoEnroll.id = ref.id;
  
      console.log('Enrollment successful', diplomadoEnroll);
  
    } catch (error) {
      console.log('Error enrolling user in diplomado:', error);
    }
  }

  getDiplomadoById(diplomadoId: string): Observable<any> {
    // Obtener la referencia al documento del diplomado
    const diplomadoRef = this.afs.doc(`diplomado/${diplomadoId}`).ref;
  
    // Fetch the diplomado data
    const diplomadoData$ = this.afs.doc(`diplomado/${diplomadoId}`).valueChanges();
  
    return diplomadoData$.pipe(
      switchMap((diplomadoData: any) => {
        // Obtener cursos referenciados en diplomadoData.coursesRef
        const coursesRefs: Array<{ courseRef: any, studyPlanOrder: number }> = diplomadoData.coursesRef || [];
        const courses$ = coursesRefs.map(courseRefObj => {
          const courseRef = courseRefObj.courseRef;
          return this.afs.doc(courseRef.path).valueChanges({ idField: 'id' }).pipe(
            switchMap((course: any) => {
              // Obtener datos del instructor del curso
              const instructorRef = course.instructorRef;
              return this.afs.doc(instructorRef.path).valueChanges({ idField: 'id' }).pipe(
                map(instructor => ({ ...course, instructor, studyPlanOrder: courseRefObj.studyPlanOrder }))
              );
            })
          );
        });
  
        return combineLatest(courses$).pipe(
          map(courses => ({ ...diplomadoData, courses }))
        );
      })
    );
  }

  async getDiplomadoUserCertificate(diplomadoId: string, userId: string): Promise<any> {
    try {
      // Consulta para buscar el certificado del usuario para el diplomado específico
      const querySnapshot = await this.afs.collection('userCertificate', ref =>
        ref.where('diplomadoId', '==', diplomadoId).where('usuarioId', '==', userId)
      ).get().toPromise();
  
      // Verificar si se encontraron certificados
      if (querySnapshot.empty) {
        console.log('No certificate found for the specified diplomadoId and userId.');
        return null;
      }
  
      // Asumir que solo hay un certificado para el usuario y el diplomado especificado
      const certificate = querySnapshot.docs[0].data();
  
      return certificate;
    } catch (error) {
      console.error('Error fetching user certificate:', error);
      return null;
    }
  }
  
  async getDiplomadoDataSynchronously(diplomadoId: string): Promise<any> {
    try {
      // Obtener la información del diplomado
      const diplomadoDoc = await this.afs.doc<any>(`diplomado/${diplomadoId}`).ref.get();
      const diplomadoData = diplomadoDoc.data();
      if (!diplomadoData) return null;
  
      // Obtener los cursos referenciados en diplomadoData.coursesRef
      const coursesRefs: Array<{ courseRef: any, studyPlanOrder: number }> = diplomadoData.coursesRef || [];
      const coursesPromises = coursesRefs.map(async (courseRefObj) => {
        const courseDoc = await courseRefObj.courseRef.get();
        const courseData = courseDoc.data();
        if (!courseData) return null;
  
        // Obtener datos del instructor del curso
        const instructorDoc = await courseData.instructorRef.get();
        const instructorData = instructorDoc.data();
        
        return { ...courseData, instructor: instructorData, studyPlanOrder: courseRefObj.studyPlanOrder };
      });
  
      // Esperar a que se resuelvan todas las promesas de los cursos
      const courses = await Promise.all(coursesPromises);
  
      // Devolver la información del diplomado con sus cursos e instructores
      return { ...diplomadoData, courses };
    } catch (error) {
      console.error("Error fetching diplomado data: ", error);
      return null;
    }
  }

  async enrollUserDiplomadoWithMail(diplomadoId: string, mail: string,enrollDate = new Date()) {
    try {
      // Obtener el usuario por correo electrónico
      const userSnapshot = await this.afs.collection('user', ref => ref.where('email', '==', mail)).get().toPromise();
      if (userSnapshot.empty) {
        console.log('No user found with this email');
        return;
      }
  
      const userDoc = userSnapshot.docs[0];
      const userRef = userDoc.ref;
      const user = userDoc.data();
  
      const diplomadoRef = this.afs.collection(Diplomado.collection).doc(diplomadoId).ref;
  
      console.log('enroll diplomado', user, diplomadoId, userRef, diplomadoRef);
  
      // Verificar si ya existe una inscripción
      const existingEnrollmentSnapshot = await this.afs.collection('diplomadoByStudent', ref => 
        ref.where('userRef', '==', userRef)
           .where('diplomadoRef', '==', diplomadoRef)
      ).get().toPromise();
  
      if (!existingEnrollmentSnapshot.empty) {
        console.log('User is already enrolled in this diplomado');
        return;
      }
  
      // Crear el objeto de inscripción
      let diplomadoEnroll = {
        id: null,
        userRef: userRef,
        diplomadoRef: diplomadoRef,
        enrollDate: enrollDate,
        certificateRef: null,
        activityScore: 0,
        dateEnd: null
      };
  
      // Insertar la inscripción en diplomadoByStudent
      const ref = this.afs.collection<any>('diplomadoByStudent').doc().ref;
      await ref.set({ ...diplomadoEnroll, id: ref.id }, { merge: true });
      diplomadoEnroll.id = ref.id;
  
      console.log('Enrollment successful', diplomadoEnroll);
  
    } catch (error) {
      console.log('Error enrolling user in diplomado:', error);
    }
  }

  public getDiplomado$(id: string): Observable<Diplomado> {
    return this.afs.collection<Diplomado>(Diplomado.collection).doc(id).valueChanges()
  }

  public getDiplomados$(): Observable<Diplomado[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
            
        // Query to get courses matching enterpriseRef
        const enterpriseMatch$ = this.afs.collection<Diplomado>(Diplomado.collection, ref =>
          ref.where('enterpriseRef', '==', enterpriseRef)
        ).valueChanges({ idField: 'id' });
      
        // Query to get courses where enterpriseRef is empty
        const enterpriseEmpty$ = this.afs.collection<Diplomado>(Diplomado.collection, ref =>
          ref.where('enterpriseRef', '==', null)
        ).valueChanges({ idField: 'id' });
      
        // Combine both queries
        return combineLatest([enterpriseMatch$, enterpriseEmpty$]).pipe(
          map(([matched, empty]) => [...matched, ...empty]),
        )
      })
    )
  }

  async getActiveDiplomadosByStudent(
    userRef: DocumentReference<User>
  ): Promise<any[]> {
    const querySnapshot: QuerySnapshot<any> = await this.afs
      .collection<any>('diplomadoByStudent')
      .ref.where("userRef", "==", userRef)
      .get();
    const diplomados = querySnapshot.docs.map((doc) => doc.data());
    return diplomados;
  }


  
  
}
