import { Injectable } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Product, ProductJson } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor() { }

  public async getProductByRef(priceRef: DocumentReference){
    return  Product.fromJson((await (priceRef.get())).data() as ProductJson)
  }
}
