import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Charge, ChargeJson } from 'projects/shared/models/charges.model';
import { Observable } from 'rxjs';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { User } from 'projects/shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ChargeService {

  constructor(
    private afs: AngularFirestore,

  ) { }

  public getCharges$(): Observable<Charge[]> {
    return this.afs.collection<Charge>(Charge.collection, ref => ref.orderBy('date', 'desc')).valueChanges();
  }
  
  
  public getChargesByCustomerRef$(customerRef: DocumentReference<Enterprise | User>): Observable<Charge[]> {
    return this.afs.collection<Charge>(Charge.collection, ref => ref.where("customer", "==", customerRef)).valueChanges()
  }

  async saveCharge(charge: ChargeJson): Promise<void> {
    return await this.afs.collection(Charge.collection).doc(charge.id).set(charge, { merge: true });
  }


  async saveSale(charge: any): Promise<void> {
    const salesCollection = this.afs.collection(Charge.collection);
  
    // Si ya tiene un ID, lo usamos para actualizar el documento
    if (charge.id) {
      return await salesCollection.doc(charge.id).set(charge, { merge: true });
    } else {
      // Si no tiene ID, generamos uno nuevo con add() y luego actualizamos el objeto 'charge' con ese ID
      const docRef = await salesCollection.add(charge);
      charge.id = docRef.id; // Agregamos el ID generado al objeto 'charge'
  
      // Luego actualizamos el documento con el nuevo ID (opcional si necesitas que tenga el ID en Firestore también)
      return await salesCollection.doc(charge.id).set(charge, { merge: true });
    }
  }
  
}
