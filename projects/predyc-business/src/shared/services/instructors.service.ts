import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { BehaviorSubject, Observable, catchError, combineLatest, firstValueFrom, of } from 'rxjs';
import { EnterpriseService } from './enterprise.service';
@Injectable({
  providedIn: 'root'
})
export class InstructorsService {



  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
    private enterpriseService: EnterpriseService,
  ) 
  {

    this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.empresa = enterprise
      }
    })
    this.getInstructors()
    //this.fixInstructors() // comentar 
  }
  private InstructorsSubject = new BehaviorSubject<any[]>([]);
  private instructors$ = this.InstructorsSubject.asObservable();
  empresa
  
  async addInstructor(Instructor): Promise<void> {
    try {
      if (Instructor?.id) {
        // Si Instructor tiene un id, actualizar el documento existente
        const ref = this.afs.collection('instructors').doc(Instructor.id).ref;
        await ref.set(Instructor, { merge: true });
        console.log('Instructor actualizado', Instructor);
      } else {
        // Si Instructor no tiene un id, crear un nuevo documento
        const ref = this.afs.collection('instructors').doc().ref;
        Instructor.id = ref.id;
        Instructor.idOld = null;
        await ref.set(Instructor, { merge: true });
        console.log('Instructor agregado', Instructor);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async fixInstructors(){

    const batch = this.afs.firestore.batch();
  
    // Referencia a la colección de 'skill'
    const collectionRef = this.afs.collection('instructors').ref;
    
    // Obtiene todos los documentos de la colección 'skill'
    const snapshot = await collectionRef.get();
    
    // Itera sobre cada documento y actualiza el campo 'enterprise' a null
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { enterpriseRef: null});
    });
  
    // Ejecuta el batch write
    await batch.commit();
    
  }
  
  enterpriseRef
  getInstructors() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (!isLoaded) {
        return;
      }
      this.enterpriseRef = this.enterpriseService.getEnterpriseRef();
  
      console.log('empresa', this.empresa);
  
      if (this.empresa?.name?.toLowerCase() == 'predyc') {
        this.afs.collection<any>('instructors', ref => 
          ref.where('enterpriseRef', '==', null)
        ).valueChanges().subscribe({
          next: instructor => {
            this.InstructorsSubject.next(instructor);
          },
          error: error => {
            console.log(error);
          }
        });
      } else {
        const enterpriseInstructors$ = this.afs.collection<any>('instructors', ref => 
          ref.where('enterpriseRef', '==', this.enterpriseRef)
        ).valueChanges();
  
        const nullInstructors$ = this.afs.collection<any>('instructors', ref => 
          ref.where('enterpriseRef', '==', null)
        ).valueChanges();
  
        combineLatest([enterpriseInstructors$, nullInstructors$])
          .pipe(
            catchError(error => {
              console.error(error);
              return of([[], []]);
            })
          )
          .subscribe({
            next: ([enterpriseInstructors, nullInstructors]) => {
              const combinedInstructors = [...enterpriseInstructors, ...nullInstructors];
              this.InstructorsSubject.next(combinedInstructors);
            },
            error: error => {
              console.error(error);
            }
          });
      }
    });
  }


  getInstructorsObservable(): Observable<any[]> {
    return this.instructors$
  }

  fetchInstructorDataById(instructorId: string): Observable<any> {
    const instructorRef = this.afs.doc<any>(`instructors/${instructorId}`).ref;
    return this.afs.doc<any>(instructorRef).valueChanges();
  }
  
  fetchInstructorDataByRef(instructorRef: DocumentReference): Observable<any> {
    return this.afs.doc<any>(instructorRef).valueChanges();
  }

  getInstructors$(): Observable<any> {
    return this.afs.collection<any>("instructors").valueChanges();
  }

  public getInstructorRefById(id: string): DocumentReference {
    return this.afs.collection<any>("instructors").doc(id).ref
  }


  async getInstructorByEmail(email: string): Promise<any> {
    const snapshot = await firstValueFrom(
      this.afs.collection<any>('instructors', ref => ref.where('email', '==', email)).get()
    );

    if (snapshot.empty) {
      return null;
    }

    return snapshot.docs.map(doc => doc.data());
  }
}
