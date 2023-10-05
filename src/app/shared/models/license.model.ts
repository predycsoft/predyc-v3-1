import { DocumentReference } from "@angular/fire/compat/firestore"
import { Coupon } from "./coupon.model";
import { Price } from "./price.model";
import { Enterprise } from "./enterprise.model";

export interface LicenseJson {
    coupon: DocumentReference<Coupon> | null,
    createdAt: number | null,
    currentPeriodEnd: number | null,
    currentPeriodStart: number | null,
    enterprise: DocumentReference<Enterprise> | null,
    id: string | null,
    price: DocumentReference<Price>,
    quantity: number | null,
    startedAt: number | null,
    status: string | null,
    trialDays: number | null,
}

export class License {
    constructor(
        public coupon: DocumentReference<Coupon> | null,
        public createdAt: number | null,
        public currentPeriodEnd: number | null,
        public currentPeriodStart: number | null,
        public enterprise: DocumentReference<Enterprise> | null,
        public id: string | null,
        public price: DocumentReference<Price>,
        public quantity: number | null,
        public startedAt: number | null,
        public status: string | null,
        public trialDays: number | null,
    ) {}

    public static fromJson(licenseJson: LicenseJson): License {
        return new License(
            licenseJson.coupon,
            licenseJson.createdAt,
            licenseJson.currentPeriodEnd,
            licenseJson.currentPeriodStart,
            licenseJson.enterprise,
            licenseJson.id,
            licenseJson.price,
            licenseJson.quantity,
            licenseJson.startedAt,
            licenseJson.status,
            licenseJson.trialDays,
        )
    }

    public toJson(): LicenseJson {
        return {
            coupon: this.coupon, 
            createdAt: this.createdAt, 
            currentPeriodEnd: this.currentPeriodEnd, 
            currentPeriodStart: this.currentPeriodStart, 
            enterprise: this.enterprise, 
            id: this.id, 
            price: this.price, 
            quantity: this.quantity, 
            startedAt: this.startedAt, 
            status: this.status, 
            trialDays: this.trialDays, 
        }
    }
}