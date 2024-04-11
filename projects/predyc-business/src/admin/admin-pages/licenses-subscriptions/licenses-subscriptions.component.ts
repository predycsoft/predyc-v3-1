import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import {
  License,
  LicenseJson,
  Product,
  Subscription,
  SubscriptionJson,
} from "projects/shared";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-licenses-subscriptions",
  templateUrl: "./licenses-subscriptions.component.html",
  styleUrls: ["./licenses-subscriptions.component.css"],
})
export class LicensesSubscriptionsComponent {
  constructor(public icon: IconService, private afs: AngularFirestore) {}

  async executeMap() {
    const existingSubscriptions = await firstValueFrom(
      this.afs.collection<any>("subscription").valueChanges()
    );
    const existingLicenses = await firstValueFrom(
      this.afs.collection<any>("license").valueChanges()
    );
    console.log(existingSubscriptions);
    console.log(existingLicenses);
    for (let license of existingLicenses) {
      await this.afs
        .collection(License.collection)
        .doc(license.id)
        .set(
          {
            createdAt: license.createdAt,
            currentPeriodEnd: license.currentPeriodEnd,
            currentPeriodStart: license.currentPeriodStart,
            enterpriseRef: license.enterpriseRef,
            failedRotationCount: license.failedRotationCount,
            id: license.id,
            productRef: this.afs.collection(Product.collection).doc("Full").ref,
            quantity: license.quantity,
            quantityUsed: license.quantityUsed,
            rotations: license.rotations,
            rotationsUsed: license.rotationsUsed,
            rotationsWaitingCount: license.rotationsWaitingCount,
            startedAt: license.startedAt,
            status:
              license.status !== Subscription.STATUS_ACTIVE
                ? Subscription.STATUS_INACTIVE
                : Subscription.STATUS_ACTIVE,
          },
          { merge: true }
        );
    }
    for (let subscription of existingSubscriptions) {
      await this.afs
        .collection(Subscription.collection)
        .doc(subscription.id)
        .set(
          {
            id: subscription.id,
            createdAt: subscription.createdAt,
            changedAt: subscription.changedAt,
            startedAt: subscription.startedAt,
            currency: subscription.currency,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            userRef: subscription.userRef,
            endedAt: subscription.endedAt,
            canceledAt: subscription.canceledAt,
            productRef: this.afs.collection(Product.collection).doc("Full").ref,
            status:
              subscription.status !== Subscription.STATUS_ACTIVE
                ? Subscription.STATUS_INACTIVE
                : Subscription.STATUS_ACTIVE,
            currentError: subscription.currentError,
            nextPaymentDate: subscription.nextPaymentDate,
            nextPaymentAmount: subscription.nextPaymentAmount,
            enterpriseRef: subscription.enterpriseRef,
            licenseRef: this.afs
              .collection(License.collection)
              .doc(subscription.licenseRef.id).ref,
          },
          { merge: true }
        );
    }
  }
}
