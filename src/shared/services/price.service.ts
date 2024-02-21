import { Injectable } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Price, PriceJson } from '../models/price.model';

@Injectable({
  providedIn: 'root'
})
export class PriceService {

  constructor() { }

  public async getPriceByRef(priceRef: DocumentReference){
    return  Price.fromJson((await (priceRef.get())).data() as PriceJson)
  }
  
}
