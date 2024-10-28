import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, Subscription, firstValueFrom } from 'rxjs';
import { Enterprise, EnterpriseJson } from 'projects/shared/models/enterprise.model';
import { AlertsService } from './alerts.service';
import { AuthService } from './auth.service';
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { User } from 'shared';


@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  

  private enterpriseSubject = new BehaviorSubject<Enterprise | null>(null)
  public enterprise$ = this.enterpriseSubject.asObservable()
  private enterpriseLoadedSubject = new BehaviorSubject<boolean>(false)
  public enterpriseLoaded$ = this.enterpriseLoadedSubject.asObservable()
  private enterpriseRef: DocumentReference<Enterprise>


  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
    private alertService: AlertsService
  ) {
    console.log("Se instancio el enterprise service")
    this.authService.user$.subscribe(async (user) => {
      if (user && user.role!='instructor') {
        // Load the enterprise data based on the authenticated user
        // const enterpriseDocumentReference = await ((user.enterprise as DocumentReference).get())
        // const enterprise = enterpriseDocumentReference.data() as Enterprise
        this.afs.doc<Enterprise>((user.enterprise as DocumentReference).path).valueChanges().subscribe(enterprise => {
          this.enterpriseSubject.next(enterprise)
          this.enterpriseRef = this.afs.collection<Enterprise>(Enterprise.collection).doc(enterprise.id).ref
          if (!this.enterpriseLoadedSubject.value) {
            this.enterpriseLoadedSubject.next(true)
            // console.log("La empresa fue cargada", enterprise)
            //this.getUsersWithEnterpriseAndClassesByDevice()
          }
        })
      }
    });
  }

  getAllEnterprises$(): Observable<Enterprise[]> {
    return this.afs.collection<Enterprise>(Enterprise.collection).valueChanges()
  }

  async addEnterprise(enterprise: Enterprise): Promise<string> {
    const ref = this.afs.collection<Enterprise>(Enterprise.collection).doc().ref;
    await ref.set({...enterprise.toJson(), id: ref.id}, { merge: true });
    enterprise.id = ref.id;

    return ref.id
  }

  async saveEnterprises(enterprises: EnterpriseJson[]): Promise<void> {
    const batch = this.afs.firestore.batch();
    enterprises.forEach((enterprise) => {
      const docRef = this.afs.firestore.collection(Enterprise.collection).doc(enterprise.id);
      batch.set(docRef, enterprise, { merge: true });
    });
    await batch.commit();
  }

  async editEnterprise(enteprise: EnterpriseJson): Promise<void> {
    await this.afs.collection(Enterprise.collection).doc(enteprise.id as string).set(
      enteprise, { merge: true }
    );
    console.log('enteprise edit',enteprise)


  }

  public getEnterpriseRefById(id: string): DocumentReference<Enterprise> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(id).ref
  }

  

  public enterpriseIsLoaded(): boolean {
    return this.enterpriseLoadedSubject.value;
  }

  public getEnterpriseRef(): DocumentReference<Enterprise> {
    return this.enterpriseRef
  }

  public getEnterprise() {
    return this.enterpriseSubject.value
  }

  public getEnterprises$(searchTerm=null): Observable<Enterprise[]> {
    return this.afs.collection<Enterprise>(Enterprise.collection, ref => {
      let query: CollectionReference | Query = ref;
      if (searchTerm) {
        query = query.where('name', '>=', searchTerm).where('name', '<=', searchTerm+ '\uf8ff')
      }
      return query.orderBy('name')
    }).valueChanges()
  }

  public getEnterpriseById$(enterpriseId: string): Observable<Enterprise> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(enterpriseId).valueChanges()
  }

  public getEnterpriseByIdPromise(enterpriseId: string): Promise<Enterprise> {
    return firstValueFrom(this.afs.collection<Enterprise>(Enterprise.collection).doc(enterpriseId).valueChanges());
  }

  async changeAllusersEnterpriseEnrollExtra(enterpriseId,value){
    const enterpriseRef = this.afs.collection('enterprise').doc(enterpriseId).ref;
    try {
      const batch = this.afs.firestore.batch();
      // Obtener documentos relacionados en la colección 'user'
      const usersSnapshot = await this.afs.collection('user', ref => ref.where('enterprise', '==', enterpriseRef)).get().toPromise();
      usersSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          canEnrollParticularCourses: value,
        });
      });
      await batch.commit();
    }
    catch (error) {
      console.error('Error editando usuarios emepresa:', error);
      // Manejo de errores adicional si es necesario
    }


  }

  public async deleteEnterprise(enterpriseId: string): Promise<void> {
    const enterpriseRef = this.afs.collection('enterprise').doc(enterpriseId).ref;

    try {
      const batch = this.afs.firestore.batch();

      // Obtener documentos relacionados en la colección 'user'
      const usersSnapshot = await this.afs.collection('user', ref => ref.where('enterprise', '==', enterpriseRef)).get().toPromise();
      const userRefs = usersSnapshot.docs.map(doc => doc.ref); // Obtener las referencias de los usuarios

      // Eliminar documentos relacionados en la colección 'user'
      usersSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      // Recorrer referencias de usuarios para eliminar en otras colecciones
      for (const userRef of userRefs) {


        await firstValueFrom(
          this.fireFunctions.httpsCallable("deleteUser")({
            userId: userRef.id as string,
          })
        );

        // Eliminar documentos relacionados en la colección 'question'
        const questionsSnapshot = await this.afs.collection('question', ref => ref.where('userRef', '==', userRef)).get().toPromise();
        questionsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Eliminar documentos relacionados en la colección 'profileTestsByStudent'
        const profileTestsSnapshot = await this.afs.collection('profileTestsByStudent', ref => ref.where('userRef', '==', userRef)).get().toPromise();
        profileTestsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Eliminar documentos relacionados en la colección 'userCertificate' usando el ID del usuario
        const certificatesSnapshot = await this.afs.collection('userCertificate', ref => ref.where('usuarioId', '==', userRef.id)).get().toPromise();
        certificatesSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Eliminar documentos relacionados en la colección 'new-subscription'
        const subscriptionsSnapshot = await this.afs.collection('new-subscription', ref => ref.where('userRef', '==', userRef)).get().toPromise();
        subscriptionsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Eliminar documentos relacionados en la colección 'coursesActivityByStudent'
        const coursesActivitySnapshot = await this.afs.collection('coursesActivityByStudent', ref => ref.where('userRef', '==', userRef)).get().toPromise();
        coursesActivitySnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Eliminar documentos relacionados en la colección 'coursesByStudent'
        const coursesByStudentSnapshot = await this.afs.collection('coursesByStudent', ref => ref.where('userRef', '==', userRef)).get().toPromise();
        coursesByStudentSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        // Eliminar documentos relacionados en la colección 'classesByStudent' donde 'completed' es false esto por tema de regalias
        const classesByStudentSnapshot = await this.afs.collection('classesByStudent', ref => 
          ref.where('userRef', '==', userRef)
             .where('completed', '==', false)
        ).get().toPromise();
        classesByStudentSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });


        // Eliminar documentos relacionados en la colección 'userProfile'
        const userProfileSnapshot = await this.afs.collection('userProfile', ref => ref.where('userRef', '==', userRef)).get().toPromise();
        userProfileSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
      }


      // Eliminar documentos relacionados en la colección 'department'
      const departmentSnapshot = await this.afs.collection('department', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      departmentSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar documentos relacionados en la colección 'department'
      const instructorsSnapshot = await this.afs.collection('instructors', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      instructorsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Obtener y eliminar documentos relacionados en la colección 'profile'
      const profilesSnapshot = await this.afs.collection('profile', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      profilesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Obtener y eliminar documentos relacionados en la colección 'skill'
      const skillSnapshot = await this.afs.collection('skill', ref => ref.where('enterprise', '==', enterpriseRef)).get().toPromise();
      skillSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar documentos relacionados en la colección 'new-license' usando enterpriseRef
      const licensesSnapshot = await this.afs.collection('new-license', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      licensesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar documentos relacionados en la colección 'category' usando enterpriseRef
      const categoriesSnapshot = await this.afs.collection('category', ref => ref.where('enterprise', '==', enterpriseRef)).get().toPromise();
      categoriesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar documentos relacionados en la colección 'course' usando enterpriseRef
      const coursesSnapshot = await this.afs.collection('course', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      coursesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar documentos relacionados en la colección 'class' usando enterpriseRef
      const classesSnapshot = await this.afs.collection('class', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      classesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar documentos relacionados en la colección 'activity' usando enterpriseRef
      const activitiesSnapshot = await this.afs.collection('activity', ref => ref.where('enterpriseRef', '==', enterpriseRef)).get().toPromise();
      activitiesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Eliminar la empresa
      batch.delete(enterpriseRef);

      // Ejecutar el batch write
      await batch.commit();

      console.log('Enterprise and related documents in user, profile, question, userCertificate, profileTestsByStudent, new-subscription, new-license, category, course, class, activity, coursesActivityByStudent, coursesByStudent, classesByStudent, and userProfile collections deleted successfully');
    } catch (error) {
      console.error('Error deleting enterprise and related documents:', error);
      // Manejo de errores adicional si es necesario
    }
  }

  public async updateVimeoFolder(enterprise: Enterprise, idFolder: string, folderUri: string): Promise<void> {
    await this.afs.collection(Enterprise.collection).doc(enterprise.id).update({
      vimeoFolderId: idFolder,
      vimeoFolderUri: folderUri
    })
  }


  public async getCertificatesEnterprise(enterprise: Enterprise): Promise<any[]> {
    const batchLimit = 10; // Tamaño del lote
    let certificates: any[] = [];

    try {
      // 1. Buscar todos los usuarios de la empresa
      const usersSnapshot = await this.afs.collection<User>(User.collection, ref => ref.where('enterprise', '==', this.afs.doc(`enterprise/${enterprise.id}`).ref)).get().toPromise();

      const users = usersSnapshot.docs.map(doc => doc.data());

      // 2. Buscar los certificados de cada usuario en lotes
      for (let i = 0; i < users.length; i += batchLimit) {
        const batch = users.slice(i, i + batchLimit);
        const userIds = batch.map(user => user.uid);

        // Obtener los certificados para el lote actual de usuarios
        const certificatesSnapshot = await this.afs.collection<any>('userCertificate', ref => ref.where('usuarioId', 'in', userIds)).get().toPromise();
        const batchCertificates = certificatesSnapshot.docs.map(doc => doc.data());

        certificates = certificates.concat(batchCertificates);
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }

    return certificates;
  }


  async getUsersWithEnterpriseAndClassesByDevice(firestore = this.afs) {
    // Paso 1: Obtener todos los usuarios con enterprise
    const usersSnapshot = await firestore.collection('user', ref => ref.where('enterprise', '!=', null)).get().toPromise();
    
    // Si no hay usuarios con enterprise, terminar la función
    if (usersSnapshot.empty) {
        console.log('No users with enterprise found.');
        return;
    }

    // Obtener referencias de los usuarios
    const userRefs = usersSnapshot.docs.map(doc => doc.ref);

    // Paso 2: Obtener clases completadas por estos usuarios que tienen device definido
    const classesSnapshot = await firestore.collection('classesByStudent', ref => 
        ref.where('completed', '==', true)
    ).get().toPromise();

    // Filtrar clases por usuarios con enterprise y que tengan device definido
    const classesWithDevice = classesSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data['device'] && userRefs.some(userRef => userRef.isEqual(data['userRef']));
    });

    // Si no hay clases con device, terminar la función
    if (classesWithDevice.length === 0) {
        console.log('No classes with device found.');
        return;
    }

    // Paso 3: Calcular el porcentaje por device
    const deviceCounts = classesWithDevice.reduce((counts, classDoc) => {
        const device = classDoc.data()['device'];
        counts[device] = (counts[device] || 0) + 1;
        return counts;
    }, {} as Record<string, number>);

    const totalClasses = classesWithDevice.length;
    const devicePercentages = Object.keys(deviceCounts).reduce((percentages, device) => {
        percentages[device] = (deviceCounts[device] / totalClasses) * 100;
        return percentages;
    }, {} as Record<string, number>);

    // Imprimir los resultados
    console.log('Device Percentages:', devicePercentages);
  }


  public getEventRegister$(searchTerm=null): Observable<Enterprise[]> {
    return this.afs.collection<any>('eventosRegister', ref => {
      let query: CollectionReference | Query = ref;
      if (searchTerm) {
        query = query.where('campana', '==', searchTerm)
      }
      return query
    }).valueChanges()
  }

  public getFormsData$(searchTerm=null): Observable<Enterprise[]> {
    return this.afs.collection<any>('infoRequestRegister', ref => {
      let query: CollectionReference | Query = ref;
      if (searchTerm) {
        query = query.where('origen', '==', searchTerm)
      }
      return query
    }).valueChanges()
  }

  async getCursosValoraciones(): Promise<any[]> {
    try {
        // Obtener todos los cursos
        const cursosSnapshot = await this.afs.collection('course').get().toPromise();
        const cursosData: any[] = cursosSnapshot.docs.map(doc => doc.data()); // Solo los datos

        // Obtener todas las valoraciones
        const valoracionesSnapshot = await this.afs.collection('cursosValoraciones').get().toPromise();
        const valoracionesData: any[] = valoracionesSnapshot.docs.map(doc => doc.data()); // Solo los datos

        // Extraer los userRef de las valoraciones
        const userRefs = valoracionesData.map(valoracion => valoracion.userRef);
        const uniqueUserRefs = Array.from(new Set(userRefs.map(ref => ref.id))); // Obtener IDs únicos

        // Dividir en grupos de 10
        const userPromises = [];
        for (let i = 0; i < uniqueUserRefs.length; i += 10) {
            const batch = uniqueUserRefs.slice(i, i + 10);
            userPromises.push(this.afs.collection('user', ref => ref.where('uid', 'in', batch)).get().toPromise());
        }

        // Obtener los usuarios en lotes
        const userSnapshots = await Promise.all(userPromises);
        const usersData: any[] = userSnapshots.flatMap(snapshot => snapshot.docs.map(doc => doc.data())); // Obtener todos los datos de usuarios

        // Obtener todas las empresas
        const enterprisesSnapshot = await this.afs.collection('enterprise').get().toPromise();
        const enterprisesData: any[] = enterprisesSnapshot.docs.map(doc =>doc.data()); // Datos de empresas

        // Combinar valoraciones con detalles del curso, usuario y empresa
        const valoracionesConCursosYUsuarios = valoracionesData.map(valoracion => {
            const courseRef = valoracion.courseRef; // Obtén la referencia del curso
            const cursoDetalles = cursosData.find(curso => curso.id === courseRef.id); // Encuentra el curso correspondiente

            // Encuentra el usuario correspondiente
            const userRef = valoracion.userRef; // Asumiendo que userRef es un documento de referencia
            const usuarioDetalles = usersData.find(user => user.uid === userRef.id); // Encuentra el usuario

            // Si el usuario tiene enterpriseRef, busca la empresa
            const enterpriseRef = usuarioDetalles?.enterprise;
            const empresaDetalles = enterpriseRef ? enterprisesData.find(enterprise => enterprise.id === enterpriseRef.id) : null; // Encuentra la empresa

            // Agrega los detalles del curso, del usuario y de la empresa a la valoración
            return {
                ...valoracion,
                cursoDetalles: cursoDetalles || null, // Agrega los detalles del curso
                usuarioDetalles: usuarioDetalles || null, // Agrega los detalles del usuario
                empresaDetalles: empresaDetalles || null // Agrega los detalles de la empresa
            };
        });

        return valoracionesConCursosYUsuarios; // Devuelve un arreglo de valoraciones con los detalles del curso, usuario y empresa
    } catch (error) {
        console.error('Error obteniendo cursos, valoraciones, usuarios y empresas:', error);
        throw new Error('Error al obtener los datos');
    }
}












}
