import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon, CouponJson } from '../models/coupon.model';
import { Observable } from 'rxjs';

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


  public async getCouponByRef(priceRef: DocumentReference){
    return  Coupon.fromJson((await (priceRef.get())).data() as CouponJson)
  }
}
