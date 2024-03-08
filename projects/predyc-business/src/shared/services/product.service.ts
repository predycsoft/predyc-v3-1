import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Product, ProductJson } from 'projects/shared/models/product.model';
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

  
  public getProductRefById(productId: string): DocumentReference<Product> {
    return this.afs.collection<Product>(Product.collection).doc(productId).ref
  }
  
  async saveProduct(product): Promise<void> {
    return await this.afs.collection(Product.collection).doc(product.id).set(product, { merge: true });

  }

  updateProductPriority(productId: string, newPriority: number): Promise<void> {
    return this.afs.collection(Product.collection).doc(productId).update(
      { priority: newPriority }
    )
  }
}
