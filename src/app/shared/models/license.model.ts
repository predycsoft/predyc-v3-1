import { DocumentReference } from "@angular/fire/compat/firestore"
import { Coupon } from "./coupon.model";
import { Price } from "./price.model";

export interface License {
    coupon: DocumentReference<Coupon> | null,
    createdAt: number | null,
    currentPeriodEnd: number | null,
    currentPeriodStart: number | null,
    id: string | null,
    priced: DocumentReference<Price> | null,
    quantity: number | null,
    retrieveBy: string[] | null,
    startedAt: number | null,
    status: string | null,
    trialDays: number | null,
}