import { DocumentReference } from "@angular/fire/compat/firestore";
import { Coupon } from "./coupon.model";
import { Product } from "./product.model";

export interface PriceJson {
    active: boolean;
    amount: number;
    coupon: DocumentReference<Coupon> | null;
    createdAt: number;
    currency: string;
    freeTrialDays: number;
    id: string;
    interval: string;
    intervalCount: number;
    product: DocumentReference<Product> | null;
    type: string;
}

export class Price {
    active: boolean;
    amount: number;
    coupon: DocumentReference<Coupon> | null;
    createdAt: number;
    currency: string;
    freeTrialDays: number;
    id: string;
    interval: string;
    intervalCount: number;
    product: DocumentReference<Product> | null;
    type: string;
    // Coupon could be part of price or could be an individual object
  
    public static intervalToDisplayValueDict = {
      month: 'Mensual',
      day: 'Diario',
      year: 'Anual',
    };

    public static collection = 'price'

    public static newPrice = Price.fromJson({
      active: true,
      amount: 0,
      coupon: null,
      createdAt: +new Date(),
      currency: 'USD',
      freeTrialDays: 0,
      id: '',
      interval: 'month',
      intervalCount: 1,
      product: null,
      type: 'recurring',
    }) 

  
    public static fromJson(obj: PriceJson): Price {
      let price = new Price();
      price.active = obj.active;
      price.amount = obj.amount;
      price.coupon = obj.coupon;
      price.createdAt = obj.createdAt;
      price.currency = obj.currency;
      price.freeTrialDays = obj.freeTrialDays;
      price.id = obj.id;
      price.interval = obj.interval;
      price.intervalCount = obj.intervalCount;
      price.product = obj.product;
      price.type = obj.type;
      return price;
    }

    public toJson(): PriceJson {
      return {
        active: this.active,
        amount: this.amount,
        coupon: this.coupon,
        createdAt: this.createdAt,
        currency: this.currency,
        freeTrialDays: this.freeTrialDays,
        id: this.id,
        interval: this.interval,
        intervalCount: this.intervalCount,
        product: this.product,
        type: this.type,
      };
    }
  
    public getIntervalDisplayValue(): string {
      return Price.intervalToDisplayValueDict[this.interval];
    }
  
    public getTotalAmount(coupons: Coupon[]): number {
      let totalAmount = this.amount;
      coupons.forEach((coupon) => {
        if (coupon.percentOff) {
          totalAmount -= (this.amount * coupon.percentOff) / 100;
        } else if (coupon.amountOff) {
          totalAmount -= coupon.amountOff;
        }
      });
      return totalAmount;
    }
}