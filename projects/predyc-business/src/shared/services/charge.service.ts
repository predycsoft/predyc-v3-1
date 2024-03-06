import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Charge } from '../models/charges.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChargeService {

  constructor(
    private afs: AngularFirestore,

  ) { }

  public getCharges$(): Observable<Charge[]> {
    return this.afs.collection<Charge>(Charge.collection).valueChanges()
  }

  async saveCharge(charge: Charge): Promise<void> {
    return await this.afs.collection(Charge.collection).doc(charge.id).set(charge, { merge: true });
  }
}
