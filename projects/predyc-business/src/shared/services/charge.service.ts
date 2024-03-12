import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Charge, ChargeJson } from 'projects/shared/models/charges.model';
import { Observable } from 'rxjs';
import { Enterprise } from 'projects/shared/models/enterprise.model';

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

  public getChargesByEnterpriseRef$(enterpriseRef: DocumentReference<Enterprise>): Observable<Charge[]> {
    return this.afs.collection<Charge>(Charge.collection, ref => ref.where("customer", "==", enterpriseRef)).valueChanges()
  }

  async saveCharge(charge: ChargeJson): Promise<void> {
    return await this.afs.collection(Charge.collection).doc(charge.id).set(charge, { merge: true });
  }
}
