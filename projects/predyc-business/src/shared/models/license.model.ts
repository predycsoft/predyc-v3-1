import { DocumentReference } from "@angular/fire/compat/firestore"
import { Coupon } from "./coupon.model";
import { Price } from "./price.model";
import { Enterprise } from "./enterprise.model";

export interface LicenseJson {
    couponRef: DocumentReference<Coupon> | null,
    createdAt: number | null,
    currentPeriodEnd: number | null,
    currentPeriodStart: number | null,
    enterpriseRef: DocumentReference<Enterprise> | null,
    failedRotationCount: number | null,
    id: string | null,
    priceRef: DocumentReference<Price>,
    quantity: number | null,
    quantityUsed: number | null,
    rotations: number | null,
    rotationsUsed: number | null,
    rotationsWaitingCount:  number | null,
    startedAt: number | null,
    status: string | null,
    trialDays: number | null,
}

export class License {

    public static collection = 'license'

    public static newLicenseTemplate =  License.fromJson({
        couponRef: null,
        createdAt: Date.now(),
        currentPeriodEnd: null,
        currentPeriodStart: Date.now(),
        enterpriseRef: null,
        failedRotationCount: null,
        id: Date.now().toString(),
        priceRef: null,
        quantity: 1,
        quantityUsed: 0,
        rotations: 1,
        rotationsUsed: null,
        rotationsWaitingCount: null,
        startedAt: Date.now(),
        status: "trialing",
        trialDays: 5,
      });

    constructor(
        public couponRef: DocumentReference<Coupon> | null,
        public createdAt: number | null,
        public currentPeriodEnd: number | null,
        public currentPeriodStart: number | null,
        public enterpriseRef: DocumentReference<Enterprise> | null,
        public id: string | null,
        public priceRef: DocumentReference<Price>,
        public quantity: number | null,
        public quantityUsed: number | null,
        public rotations: number | null,
        public rotationsUsed: number | null,
        public failedRotationCount: number | null,
        public rotationsWaitingCount:  number | null,
        public startedAt: number | null,
        public status: string | null,
        public trialDays: number | null,
    ) {}

    public static fromJson(licenseJson: LicenseJson): License {
        return new License(
            licenseJson.couponRef,
            licenseJson.createdAt,
            licenseJson.currentPeriodEnd,
            licenseJson.currentPeriodStart,
            licenseJson.enterpriseRef,
            licenseJson.id,
            licenseJson.priceRef,
            licenseJson.quantity,
            licenseJson.quantityUsed,
            licenseJson.rotations,
            licenseJson.rotationsWaitingCount,
            licenseJson.rotationsUsed,
            licenseJson.failedRotationCount,
            licenseJson.startedAt,
            licenseJson.status,
            licenseJson.trialDays,
        )
    }

    public toJson(): LicenseJson {
        return {
            couponRef: this.couponRef, 
            createdAt: this.createdAt, 
            currentPeriodEnd: this.currentPeriodEnd, 
            currentPeriodStart: this.currentPeriodStart, 
            enterpriseRef: this.enterpriseRef, 
            id: this.id, 
            priceRef: this.priceRef, 
            quantity: this.quantity, 
            quantityUsed: this.quantityUsed, 
            rotations: this.rotations, 
            rotationsUsed:this.rotationsUsed,
            failedRotationCount:this.failedRotationCount,
            rotationsWaitingCount:this.rotationsWaitingCount,
            startedAt: this.startedAt, 
            status: this.status, 
            trialDays: this.trialDays, 
        }
    }
}