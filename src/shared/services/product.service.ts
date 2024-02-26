import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Product, ProductJson } from '../models/product.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private afs: AngularFirestore,
  ) { }

  public getProducts$(): Observable<Product[]> {
    return this.afs.collection<Product>(Product.collection).valueChanges()
  }

  public getProductById$(productId: string): Observable<Product> {
    return this.afs.collection<Product>(Product.collection).doc(productId).valueChanges()
  }

  public async getProductByRef(priceRef: DocumentReference){
    return Product.fromJson((await (priceRef.get())).data() as ProductJson)
  }
}
