import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { BehaviorSubject, Observable } from 'rxjs';
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
      const ref = this.afs.collection('instructors').doc().ref;
      let idOld = Instructor?.id ? Instructor?.id : null;
      // console.log('idOld',idOld)
      await ref.set({...Instructor,idOld:idOld,id:ref.id}, { merge: true });
      Instructor.id = ref.id;
      Instructor.idOld = idOld
      // console.log('Instructor agregado',Instructor);
    } catch (error) {
      console.log(error)
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
        return
      }
      this.enterpriseRef =this.enterpriseService.getEnterpriseRef()

      console.log('empresa',this.empresa)

      if(this.empresa.name.toLowerCase() == 'predyc'){
        this.afs.collection<any>('instructors', ref => 
        ref.where('enterpriseRef', '==', null)
        ).valueChanges().subscribe({
          next: instructor => {
            this.InstructorsSubject.next(instructor)
          },
          error: error => {
            console.log(error)
          }
        })
      }
      else{
        this.afs.collection<any>('instructors', ref => 
        ref.where('enterpriseRef', '==', this.enterpriseRef)
        ).valueChanges().subscribe({
        next: instructor => {
          this.InstructorsSubject.next(instructor);
        },
        error: error => {
          console.error(error);
        }
        });

      }
    })
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
}
