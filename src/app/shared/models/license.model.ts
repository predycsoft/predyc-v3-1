import { DocumentReference } from "@angular/fire/compat/firestore"
import { Coupon } from "./coupon.model";
import { Price } from "./price.model";
import { Enterprise } from "./enterprise.model";

export interface LicenseJson {
    coupon: DocumentReference<Coupon> | null,
    createdAt: number | null,
    currentPeriodEnd: number | null,
    currentPeriodStart: number | null,
    enterpriseRef: DocumentReference<Enterprise> | null,
    id: string | null,
    price: DocumentReference<Price>,
    quantity: number | null,
    startedAt: number | null,
    status: string | null,
    trialDays: number | null,
    retrieveBy: string[]

}

export class License {

    public static collection = 'license'

    constructor(
        public coupon: DocumentReference<Coupon> | null,
        public createdAt: number | null,
        public currentPeriodEnd: number | null,
        public currentPeriodStart: number | null,
        public enterpriseRef: DocumentReference<Enterprise> | null,
        public id: string | null,
        public price: DocumentReference<Price>,
        public quantity: number | null,
        public startedAt: number | null,
        public status: string | null,
        public trialDays: number | null,
        public retrieveBy: string[],
    ) {}

    public static fromJson(licenseJson: LicenseJson): License {
        return new License(
            licenseJson.coupon,
            licenseJson.createdAt,
            licenseJson.currentPeriodEnd,
            licenseJson.currentPeriodStart,
            licenseJson.enterpriseRef,
            licenseJson.id,
            licenseJson.price,
            licenseJson.quantity,
            licenseJson.startedAt,
            licenseJson.status,
            licenseJson.trialDays,
            licenseJson.retrieveBy,
        )
    }

    public toJson(): LicenseJson {
        return {
            coupon: this.coupon, 
            createdAt: this.createdAt, 
            currentPeriodEnd: this.currentPeriodEnd, 
            currentPeriodStart: this.currentPeriodStart, 
            enterpriseRef: this.enterpriseRef, 
            id: this.id, 
            price: this.price, 
            quantity: this.quantity, 
            startedAt: this.startedAt, 
            status: this.status, 
            trialDays: this.trialDays, 
            retrieveBy: this.retrieveBy, 
        }
    }
}