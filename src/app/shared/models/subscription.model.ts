import { DocumentReference } from "@angular/fire/compat/firestore";

export interface SubscriptionJson {
    id: string;
    idAtOrigin: string;
    origin: string;
    createdAt: number;
    createdAtOrigin: number;
    changedAt: number | null;
    startedAt: number | null;
    currency: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    customer: string;
    couponRef: DocumentReference | null;
    userRef: DocumentReference | null;
    endedAt: number | null;
    canceledAt: number | null;
    priceRef: DocumentReference | null;
    status:
      | 'active'
      | 'incomplete'
      | 'incomplete_expired'
      | 'trialing'
      | 'past_due'
      | 'canceled'
      | 'unpaid';
    trialStartedAt: number | null;
    trialEndedAt: number | null;
    interval: number | null;
    currentError: string | null;
    nextPaymentDate: number;
    nextPaymentAmount: number;
    enterpriseRef: DocumentReference
}
  
export class Subscription {

    public static collection: string = 'subscription'

    public static STATUS_ACTIVE: string = 'active';
    public static STATUS_INCOMPLETE: string = 'incomplete';
    public static STATUS_INCOMPLETE_EXPIRED: string = 'incomplete_expired';
    public static STATUS_TRIALING: string = 'trialing';
    public static STATUS_PAST_DUE: string = 'past_due';
    public static STATUS_CANCELED: string = 'canceled';
    public static STATUS_UNPAID: string = 'unpaid';
  
    public static STATUS_CHOICES = [
      this.STATUS_ACTIVE,
      this.STATUS_INCOMPLETE,
      this.STATUS_INCOMPLETE_EXPIRED,
      this.STATUS_TRIALING,
      this.STATUS_PAST_DUE,
      this.STATUS_CANCELED,
      this.STATUS_UNPAID,
    ];
  
    public static CURRENT_STATUS: String[] = [
      this.STATUS_INCOMPLETE,
      this.STATUS_TRIALING,
      this.STATUS_PAST_DUE,
      this.STATUS_UNPAID,
    ];
  
    id: string;
    idAtOrigin: string;
    origin: string;
    createdAt: number;
    createdAtOrigin: number;
    changedAt: number | null;
    startedAt: number | null;
    currency: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    customer: string | null;
    userRef: DocumentReference | null;
    endedAt: number | null;
    canceledAt: number | null;
    priceRef: DocumentReference | null;
    status:
      | 'active'
      | 'incomplete'
      | 'incomplete_expired'
      | 'trialing'
      | 'past_due'
      | 'canceled'
      | 'unpaid';
    trialStartedAt: number | null;
    trialEndedAt: number | null;
    interval: number | null;
    couponRef: DocumentReference | null;
    currentError: string | null;
    nextPaymentDate: number;
    nextPaymentAmount: number;
    enterpriseRef: DocumentReference
  
    public static statusToDisplayValueDict = {
      active: 'Activo',
      incomplete: 'Pago pendiente',
      incomplete_expired: 'Activación expirada',
      trialing: 'Período de prueba',
      past_due: 'Pago pendiente',
      canceled: 'Cancelado',
      unpaid: 'Pago pendiente',
    };
  
    public getStatusDisplayValue(): string {
      return Subscription.statusToDisplayValueDict[this.status];
    }
  
    public static fromJson(subscriptionData: SubscriptionJson): Subscription {
      let subscription = new Subscription();
      subscription.id = subscriptionData.id;
      subscription.idAtOrigin = subscriptionData.idAtOrigin;
      subscription.origin = subscriptionData.origin;
      subscription.createdAt = subscriptionData.createdAt;
      subscription.createdAtOrigin = subscriptionData.createdAtOrigin;
      subscription.changedAt = subscriptionData.changedAt;
      subscription.startedAt = subscriptionData.startedAt;
      subscription.couponRef = subscriptionData.couponRef;
      subscription.currency = subscriptionData.currency;
      subscription.currentPeriodStart = subscriptionData.currentPeriodStart;
      subscription.currentPeriodEnd = subscriptionData.currentPeriodEnd;
      subscription.customer = subscriptionData.customer;
      subscription.userRef = subscriptionData.userRef;
      subscription.endedAt = subscriptionData.endedAt;
      subscription.canceledAt = subscriptionData.canceledAt;
      subscription.priceRef = subscriptionData.priceRef;
      subscription.status = subscriptionData.status;
      subscription.trialStartedAt = subscriptionData.trialStartedAt;
      subscription.trialEndedAt = subscriptionData.trialEndedAt;
      subscription.interval = subscriptionData.interval;
      subscription.currentError = subscriptionData.currentError;
      subscription.nextPaymentDate = subscriptionData.nextPaymentDate;
      subscription.nextPaymentAmount = subscriptionData.nextPaymentAmount;
      subscription.enterpriseRef = subscriptionData.enterpriseRef
      return subscription;
    }
  
    public toJson(): SubscriptionJson {
      return {
        id: this.id,
        idAtOrigin: this.idAtOrigin,
        origin: this.origin,
        createdAt: this.createdAt,
        createdAtOrigin: this.createdAtOrigin,
        changedAt: this.changedAt,
        startedAt: this.startedAt,
        currency: this.currency,
        currentPeriodStart: this.currentPeriodStart,
        currentPeriodEnd: this.currentPeriodEnd,
        customer: this.customer,
        userRef: this.userRef,
        endedAt: this.endedAt,
        canceledAt: this.canceledAt,
        priceRef: this.priceRef,
        status: this.status,
        trialStartedAt: this.trialStartedAt,
        trialEndedAt: this.trialEndedAt,
        currentError: this.currentError,
        interval: this.interval,
        couponRef: this.couponRef,
        nextPaymentDate: this.nextPaymentDate,
        nextPaymentAmount: this.nextPaymentAmount,
        enterpriseRef: this.enterpriseRef
      };
    }
  
}