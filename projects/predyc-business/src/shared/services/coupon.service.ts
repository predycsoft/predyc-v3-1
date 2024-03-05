import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon, CouponJson } from '../models/coupon.model';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CouponService {

  constructor(
    private afs: AngularFirestore,

  ) { }

  public getCoupons$(): Observable<Coupon[]> {
    return this.afs.collection<Coupon>(Coupon.collection).valueChanges()
  }


  public async getCouponByRef(couponRef: DocumentReference){
    return Coupon.fromJson((await (couponRef.get())).data() as CouponJson)
  }

  public getCouponRefById(couponId: string): DocumentReference<Coupon> {
    return this.afs.collection<Coupon>(Coupon.collection).doc(couponId).ref
  }

  async saveCoupon(coupon): Promise<void> {
    return await this.afs.collection(Coupon.collection).doc(coupon.id).set(coupon, { merge: true });
  }

  async desactivateOtherBanners(couponId: string) {
    const batch = this.afs.firestore.batch();
  
    const querySnapshot = await firstValueFrom(this.afs.collection<Coupon>(Coupon.collection, ref => 
      ref.where('activeBanner', '==', true).where('id', '!=', couponId)
    ).get());
  
    querySnapshot.forEach((doc) => {
      batch.set(doc.ref, { activeBanner: false }, { merge: true });
    });
  
    // Commit the batch
    await batch.commit();
  }
  
  
}
