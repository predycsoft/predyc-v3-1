import { DocumentReference } from "@angular/fire/compat/firestore";
import { Product } from "./product.model";
import { User } from "./user.model";
import { Enterprise } from "./enterprise.model";

export interface ChargeJson {
  amount: number;
  createdAt: number;
  currency: string;
  description: string;
  id: string;
  endDate: number;
  productRef: DocumentReference<Product>;
  status: 'failed'  | 'succeeded';
  customer: DocumentReference<User | Enterprise> ;
  startDate: number; 
  isPayed: boolean; 
  // failureMessage: string | null;
  // interval: number | null; 
  // paymentMethod: string;
  // amountCaptured: number | null;
  // amountRefunded: number | null;
  // cardBrand: string;
  // cardLast4: string;
  // comment: string;
  // via: 'Stripe' | 'Paypal' | 'Predyc';
  // quantity: number | null;
}
  
export class Charge {
  amount: number;
  createdAt: number;
  currency: string;
  description: string;
  id: string;
  endDate: number;
  productRef: DocumentReference<Product>;
  status: 'failed'  | 'succeeded';
  customer: DocumentReference<User | Enterprise> ;
  startDate: number; 
  isPayed: boolean;
  // failureMessage: string | null;
  // interval: number | null; 
  // paymentMethod: string;
  // amountCaptured: number | null;
  // amountRefunded: number | null;
  // cardBrand: string;
  // cardLast4: string;
  // comment: string;
  // via: 'Stripe' | 'Paypal' | 'Predyc';
  // quantity: number | null;

  public static collection = 'charge'

  public static getChargeTemplate(): Charge {
    return Charge.fromJson({
      amount: 0,
      createdAt: +new Date(),
      currency: "usd",
      description: "",
      id: "ch_pre_" + +new Date(),
      endDate: null,
      productRef: null,
      status: 'succeeded',
      customer: null,
      startDate: +new Date(),
      isPayed: true
    });
  }

  public static STATUS_FAILED = 'failed';
  public static STATUS_SUCCEEDED = 'succeeded';

  public static STATUS_CHOICES = [
    this.STATUS_FAILED,
    this.STATUS_SUCCEEDED,
  ];


  public toJson(): ChargeJson {
    return {
      amount: this.amount,
      createdAt: this.createdAt,
      currency: this.currency,
      description: this.description,
      id: this.id,
      endDate: this.endDate,
      productRef: this.productRef,
      status: this.status,
      customer: this.customer,
      startDate: this.startDate,
      isPayed: this.isPayed,
      // failureMessage: this.failureMessage,
      // interval: this.interval,
      // paymentMethod: this.paymentMethod,
      // amountCaptured: this.amountCaptured, // Since you've kept these in ChargeJson, they remain uncommented
      // amountRefunded: this.amountRefunded,
      // cardBrand: this.cardBrand,
      // cardLast4: this.cardLast4,
      // comment: this.comment,
      // via: this.via,
      // quantity: this.quantity,
    };
  }

  public static fromJson(charge: ChargeJson): Charge {
    let newCharge = new Charge();
    newCharge.amount = charge.amount;
    newCharge.createdAt = charge.createdAt;
    newCharge.currency = charge.currency;
    newCharge.description = charge.description;
    newCharge.id = charge.id;
    newCharge.endDate = charge.endDate;
    newCharge.productRef = charge.productRef;
    newCharge.status = charge.status;
    newCharge.customer = charge.customer;
    newCharge.startDate = charge.startDate;
    newCharge.isPayed = charge.isPayed;
    // newCharge.amountCaptured = charge.amountCaptured;
    // newCharge.amountRefunded = charge.amountRefunded;
    // newCharge.cardBrand = charge.cardBrand;
    // newCharge.cardLast4 = charge.cardLast4;
    // newCharge.comment = charge.comment;
    // newCharge.failureMessage = charge.failureMessage;
    // newCharge.interval = charge.interval;
    // newCharge.paymentMethod = charge.paymentMethod;
    // newCharge.via = charge.via;
    // newCharge.quantity = charge.quantity;
    return newCharge;
  }
}