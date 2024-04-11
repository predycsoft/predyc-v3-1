import { DocumentReference } from "@angular/fire/compat/firestore";
import { Product } from "./product.model";
import { Enterprise } from "./enterprise.model";
import { Subscription as SubscriptionClass } from "./subscription.model";

export interface LicenseJson {
  createdAt: number | null;
  currentPeriodEnd: number | null;
  currentPeriodStart: number | null;
  enterpriseRef: DocumentReference<Enterprise> | null;
  failedRotationCount: number | null;
  id: string | null;
  productRef: DocumentReference<Product>;
  quantity: number | null;
  quantityUsed: number | null;
  rotations: number | null;
  rotationsUsed: number | null;
  rotationsWaitingCount: number | null;
  startedAt: number | null;
  status: "active" | "inactive" | null;
}

export class License {
  public static collection = "new-license";
  //public static collection = "license";

  constructor(
    public createdAt: number | null,
    public currentPeriodEnd: number | null,
    public currentPeriodStart: number | null,
    public enterpriseRef: DocumentReference<Enterprise> | null,
    public id: string | null,
    public productRef: DocumentReference<Product>,
    public quantity: number | null,
    public quantityUsed: number | null,
    public rotations: number | null,
    public rotationsUsed: number | null,
    public failedRotationCount: number | null,
    public rotationsWaitingCount: number | null,
    public startedAt: number | null,
    public status: "active" | "inactive" | null
  ) {}

  public static STATUS_CHOICES = SubscriptionClass.STATUS_CHOICES;

  public static getLicenseTemplate(): License {
    return License.fromJson({
      createdAt: Date.now(),
      currentPeriodEnd: null,
      currentPeriodStart: Date.now(),
      enterpriseRef: null,
      failedRotationCount: null,
      id: Date.now().toString(),
      productRef: null,
      quantity: 1,
      quantityUsed: 0,
      rotations: 0,
      rotationsUsed: 0,
      rotationsWaitingCount: 0,
      startedAt: Date.now(),
      status: SubscriptionClass.STATUS_ACTIVE,
    });
  }

  public static fromJson(licenseJson: LicenseJson): License {
    return new License(
      licenseJson.createdAt,
      licenseJson.currentPeriodEnd,
      licenseJson.currentPeriodStart,
      licenseJson.enterpriseRef,
      licenseJson.id,
      licenseJson.productRef,
      licenseJson.quantity,
      licenseJson.quantityUsed,
      licenseJson.rotations,
      licenseJson.rotationsWaitingCount,
      licenseJson.rotationsUsed,
      licenseJson.failedRotationCount,
      licenseJson.startedAt,
      licenseJson.status
    );
  }

  public toJson(): LicenseJson {
    return {
      createdAt: this.createdAt,
      currentPeriodEnd: this.currentPeriodEnd,
      currentPeriodStart: this.currentPeriodStart,
      enterpriseRef: this.enterpriseRef,
      id: this.id,
      productRef: this.productRef,
      quantity: this.quantity,
      quantityUsed: this.quantityUsed,
      rotations: this.rotations,
      rotationsUsed: this.rotationsUsed,
      failedRotationCount: this.failedRotationCount,
      rotationsWaitingCount: this.rotationsWaitingCount,
      startedAt: this.startedAt,
      status: this.status,
    };
  }
}
