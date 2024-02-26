export interface StripeInfo {
    stripeId: string | null;
    updatedAt: { nanoseconds: number, seconds: number} | null;
}