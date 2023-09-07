export interface Licenses {
    couponId: string,
    createdAt: number, // Timestamp
    currentPeriodEnd: number, // Timestamp
    currentPeriodStart: number, // Timestamp
    id: string,
    priceId: string,
    quantity: number, // Timestamp
    // retrieveBy: string[], // Is this required?
    startedAt: number, // Timestamp
    status: string,
}