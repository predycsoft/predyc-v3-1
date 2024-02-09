import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { BehaviorSubject, Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class InstructorsService {



  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
  ) 
  {
    this.getInstructors()
  }
  private InstructorsSubject = new BehaviorSubject<any[]>([]);
  private instructors$ = this.InstructorsSubject.asObservable();

  
  async addInstructor(Instructor): Promise<void> {
    try {
      const ref = this.afs.collection('instructors').doc().ref;
      let idOld = Instructor.id
      await ref.set({...Instructor,idOld:Instructor.id,id:ref.id}, { merge: true });
      Instructor.id = ref.id;
      Instructor.idOld = idOld
      console.log('Instructor agregado',Instructor);
    } catch (error) {
      console.log(error)
    }
  }

  getInstructors() {
    this.afs.collection<any>('instructors').valueChanges().subscribe({
      next: instructor => {
        this.InstructorsSubject.next(instructor)
      },
      error: error => {
        console.log(error)
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
}
