import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Price, PriceJson } from '../models/price.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  public getPrices$(): Observable<Price[]> {
    return this.afs.collection<Price>(Price.collection).valueChanges()
  }

  public getPriceById$(priceId: string): Observable<Price> {
    return this.afs.collection<Price>(Price.collection).doc(priceId).valueChanges()
  }

  public async getPriceByRef(priceRef: DocumentReference){
    return  Price.fromJson((await (priceRef.get())).data() as PriceJson)
  }

  public getPriceRefById(priceId: string): DocumentReference<Price> {
    return this.afs.collection<Price>(Price.collection).doc(priceId).ref
  }

  async savePrice(price): Promise<void> {
    return await this.afs.collection(Price.collection).doc(price.id).set(price, { merge: true });
  }
  
}