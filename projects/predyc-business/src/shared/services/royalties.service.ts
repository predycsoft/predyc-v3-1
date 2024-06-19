import { Injectable } from "@angular/core";
import { AngularFirestore} from "@angular/fire/compat/firestore";
import { BehaviorSubject, Observable } from "rxjs";


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

  // private royaltiesSubject = new BehaviorSubject<any[]>([]);
  // private royalties$ = this.royaltiesSubject.asObservable();

  getRoyalties$(): Observable<any[]> {
    return this.afs.collection<'any'>('royalties').valueChanges();
  }

  

}
