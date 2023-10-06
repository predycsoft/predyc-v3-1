import { Injectable } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon, CouponJson } from '../models/coupon.model';

@Injectable({
  providedIn: 'root'
})
export class CouponService {

  constructor() { }

  public async getCouponByRef(priceRef: DocumentReference){
    return  Coupon.fromJson((await (priceRef.get())).data() as CouponJson)
  }
}
