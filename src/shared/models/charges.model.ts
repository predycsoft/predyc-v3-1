import { DocumentReference } from "@angular/fire/compat/firestore";
import { Coupon } from "./coupon.model";
import { Price } from "./price.model";
import { User } from "./user.model";
import { Enterprise } from "./enterprise.model";

export interface ChargeJson {
    amount: number;
    amountCaptured: number | null;
    amountRefunded: number | null;
    cardBrand: string;
    cardLast4: string;
    comment: string;
    coupon: DocumentReference<Coupon>;
    createdAt: number;
    currency: string;
    description: string;
    failureMessage: string | null;
    id: string;
    interval: number | null; // Where to get this info in stripe
    origin: string;
    payAt: number;
    price: DocumentReference<Price>;
    // status: Stripe.Charge.Status;
    status: 'failed' | 'pending' | 'succeeded';
    customer: DocumentReference<User> | DocumentReference<Enterprise>;
    via: 'Stripe' | 'Paypal' | 'Predyc';
    quantity: number | null;
  }
  
  export class Charge {
    amount: number;
    amountCaptured: number | null;
    amountRefunded: number | null;
    cardBrand: string;
    cardLast4: string;
    comment: string;
    coupon: DocumentReference<Coupon>;
    createdAt: number;
    currency: string;
    description: string;
    failureMessage: string | null;
    id: string;
    interval: number | null; // Where to get this info in stripe
    origin: string;
    payAt: number;
    price: DocumentReference<Price>;
    // status: Stripe.Charge.Status;
    status: 'succeeded' | 'failed' | 'pending';
    customer: DocumentReference<User> | DocumentReference<Enterprise>;
    via: 'Stripe' | 'Paypal' | 'Predyc';
    quantity: number | null;

    public static collection = 'charge'
  
    STATUS_FAILED = 'failed';
    STATUS_PENDING = 'pending';
    STATUS_SUCCEEDED = 'succeeded';
  
    STATUS_CHOICES = [
      this.STATUS_FAILED,
      this.STATUS_PENDING,
      this.STATUS_SUCCEEDED,
    ];
  
    public static fromStripeCharge(charge: any): Charge {
      let newCharge = new Charge();

      newCharge.amount = charge.amount / 100; // This value is in cents
      newCharge.amountCaptured = charge.amount_captured / 100; // This value is in cents
      newCharge.amountRefunded = charge.amount_refunded / 100;
      newCharge.cardBrand = charge.payment_method_details.card.brand;
      newCharge.cardLast4 = charge.payment_method_details.card.last4;
      newCharge.comment = null;
      newCharge.createdAt = +new Date(charge.created * 1000);
      newCharge.currency = charge.currency;
      newCharge.description = charge.description;
      newCharge.failureMessage = charge.failure_message;
      newCharge.id = charge.id;
      newCharge.interval = null;
      newCharge.origin = 'Stripe';
      newCharge.status = charge.status; // Probably should map this to an internal value to avoid difference with paypal
    //   newCharge.customer = charge.customer; // charge.customer is an id. we have to put the docRef here.
      newCharge.customer = null;
      newCharge.via = 'Stripe';
      // newCharge.price = paymentIntent.price
      return newCharge;
    }
  
    public toJson(): ChargeJson {
      return {
        amount: this.amount,
        amountCaptured: this.amountCaptured,
        amountRefunded: this.amountRefunded,
        cardBrand: this.cardBrand,
        cardLast4: this.cardLast4,
        comment: this.comment,
        coupon: this.coupon,
        createdAt: this.createdAt,
        currency: this.currency,
        description: this.description,
        failureMessage: this.failureMessage,
        id: this.id,
        interval: this.interval,
        origin: this.origin,
        payAt: this.payAt,
        price: this.price,
        status: this.status,
        customer: this.customer,
        via: this.via,
        quantity: this.quantity,
      };
    }
  
    public static fromJson(charge: ChargeJson): Charge {
      let newCharge = new Charge();
      newCharge.amount = charge.amount;
      newCharge.amountCaptured = charge.amountCaptured;
      newCharge.amountRefunded = charge.amountRefunded;
      newCharge.cardBrand = charge.cardBrand;
      newCharge.cardLast4 = charge.cardLast4;
      newCharge.comment = charge.comment;
      newCharge.coupon = charge.coupon;
      newCharge.createdAt = charge.createdAt;
      newCharge.currency = charge.currency;
      newCharge.description = charge.description;
      newCharge.failureMessage = charge.failureMessage;
      newCharge.id = charge.id;
      newCharge.interval = charge.interval;
      newCharge.origin = charge.origin;
      newCharge.payAt = charge.payAt;
      newCharge.price = charge.price;
      newCharge.status = charge.status;
      newCharge.customer = charge.customer;
      newCharge.via = charge.via;
      newCharge.quantity = charge.quantity;
      return newCharge;
    }
  }