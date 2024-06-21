import { Injectable } from "@angular/core";
import { AngularFirestore} from "@angular/fire/compat/firestore";
import { BehaviorSubject, Observable, firstValueFrom } from "rxjs";


@Injectable({
  providedIn: "root",
})
export class RoyaltiesService {
  constructor(
    private afs: AngularFirestore,
  ) {
    // this.getRoyalties();
  }

  async saveRoyalties(data: any) {
    await this.afs.collection('royalties').doc(data.id).set(
      {
        ...data,dateSaved:new Date()
      },
      { merge: true }
    );
  }


  getRoyalties$(): Observable<any[]> {
    return this.afs.collection<'any'>('royalties').valueChanges();
  }




  async getRoyaltiesInstructor(idInstructor?: string): Promise<any> {

    const snapshot = await firstValueFrom(
      this.afs.collection<any>('royalties', ref => ref.where('borrador', '==', false)).get()
    );
    if (snapshot.empty) {
      return null;
    }
    const datos = snapshot.docs.map(doc => doc.data())
    datos?.forEach(royalties => {
      delete royalties.totalPredyc
      delete royalties.totalInstructores
      delete royalties.amount
      let instructorData = royalties.instructores.find(x=>x.id == idInstructor)
      delete royalties.instructores
      royalties.instructor = instructorData ? instructorData : null
    });

    return datos;
  }

  

}
