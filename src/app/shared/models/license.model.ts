import { DocumentReference } from "@angular/fire/compat/firestore"
import { Coupon } from "./coupon.model";
import { Price } from "./price.model";

export interface LicenseJson {
    coupon: DocumentReference<Coupon> | null,
    createdAt: number | null,
    currentPeriodEnd: number | null,
    currentPeriodStart: number | null,
    id: string | null,
    price: DocumentReference<Price>,
    quantity: number | null,
    retrieveBy: string[] | null,
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
        public id: string | null,
        public price: DocumentReference<Price>,
        public quantity: number | null,
        public retrieveBy: string[] | null,
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
            licenseJson.id,
            licenseJson.price,
            licenseJson.quantity,
            licenseJson.retrieveBy,
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
            id: this.id, 
            price: this.price, 
            quantity: this.quantity, 
            retrieveBy: this.retrieveBy, 
            startedAt: this.startedAt, 
            status: this.status, 
            trialDays: this.trialDays, 
        }
    }
}