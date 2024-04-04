import { DocumentReference } from "@angular/fire/compat/firestore";
import { UserJson } from "./user.model";
import { ProductJson } from "./product.model";
import { EnterpriseJson } from "./enterprise.model";
import { LicenseJson } from "./license.model";

export interface SubscriptionJson {
  id: string;
  createdAt: number;
  changedAt: number | null;
  startedAt: number | null;
  currency: string;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  userRef: DocumentReference | null;
  endedAt: number | null;
  canceledAt: number | null;
  productRef: DocumentReference | null;
  status: "active" | "inactive";
  currentError: string | null;
  nextPaymentDate: number;
  nextPaymentAmount: number;
  enterpriseRef: DocumentReference;
  licenseRef: DocumentReference;
}

export class Subscription {
  // public static collection: string = "new-subscription";
  public static collection: string = "subscription";

  public static STATUS_ACTIVE: "active" = "active";
  public static STATUS_INACTIVE: "inactive" = "inactive";
  public static STATUS_EXPIRED: "expired" = "expired";


  public static STATUS_CHOICES = [this.STATUS_ACTIVE, this.STATUS_INACTIVE, this.STATUS_EXPIRED];

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
  userRef: DocumentReference | null;
  endedAt: number | null;
  canceledAt: number | null;
  productRef: DocumentReference | null;
  status: "active" | "inactive";
  currentError: string | null;
  nextPaymentDate: number;
  nextPaymentAmount: number;
  enterpriseRef: DocumentReference;
  licenseRef: DocumentReference;

  public static statusToDisplayValueDict = {
    active: "Activo",
    inactive: "Inactivo",
    expired: "Expired"
  };

  public static getSubscriptionTemplate(): Subscription {
    return Subscription.fromJson({
      id: "PRE_" + +new Date(),
      createdAt: +new Date(),
      changedAt: null,
      startedAt: +new Date(),
      currency: "usd",
      currentPeriodStart: +new Date(),
      currentPeriodEnd: null,
      userRef: null,
      endedAt: null,
      productRef: null,
      status: "active",
      nextPaymentAmount: 0,
      nextPaymentDate: null,
      canceledAt: null,
      currentError: null,
      enterpriseRef: null,
      licenseRef: null,
    });
  }

  public getStatusDisplayValue(): string {
    return Subscription.statusToDisplayValueDict[this.status];
  }

  public static fromJson(subscriptionData: SubscriptionJson): Subscription {
    let subscription = new Subscription();
    subscription.id = subscriptionData.id;
    subscription.createdAt = subscriptionData.createdAt;
    subscription.changedAt = subscriptionData.changedAt;
    subscription.startedAt = subscriptionData.startedAt;
    subscription.currency = subscriptionData.currency;
    subscription.currentPeriodStart = subscriptionData.currentPeriodStart;
    subscription.currentPeriodEnd = subscriptionData.currentPeriodEnd;
    subscription.userRef = subscriptionData.userRef;
    subscription.endedAt = subscriptionData.endedAt;
    subscription.canceledAt = subscriptionData.canceledAt;
    subscription.productRef = subscriptionData.productRef;
    subscription.status = subscriptionData.status;
    subscription.currentError = subscriptionData.currentError;
    subscription.nextPaymentDate = subscriptionData.nextPaymentDate;
    subscription.nextPaymentAmount = subscriptionData.nextPaymentAmount;
    subscription.enterpriseRef = subscriptionData.enterpriseRef;
    subscription.licenseRef = subscriptionData.licenseRef;
    return subscription;
  }

  public toJson(): SubscriptionJson {
    return {
      id: this.id,
      createdAt: this.createdAt,
      changedAt: this.changedAt,
      startedAt: this.startedAt,
      currency: this.currency,
      currentPeriodStart: this.currentPeriodStart,
      currentPeriodEnd: this.currentPeriodEnd,
      userRef: this.userRef,
      endedAt: this.endedAt,
      canceledAt: this.canceledAt,
      productRef: this.productRef,
      status: this.status,
      currentError: this.currentError,
      nextPaymentDate: this.nextPaymentDate,
      nextPaymentAmount: this.nextPaymentAmount,
      enterpriseRef: this.enterpriseRef,
      licenseRef: this.licenseRef,
    };
  }
}
