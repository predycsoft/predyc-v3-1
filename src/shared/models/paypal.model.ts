export interface PaypalInfo {
    paypalId: string | null;
    updatedAt: number | null;
}

export interface PaypalPaymentPreferences {
    auto_bill_outstanding: boolean; // Automatically bill in the next billing cycle.
    payment_failure_threshold: number; // Max number of payment failures to suspend subscription
    setup_fee: Object;
    setup_fee_failure_acetion: string;
    service_type: string;
}
  
export interface PaypalFixedPrice {
    currency_code: string;
    value: number;
}
  
export interface PaypalFrequency {
    interval_unit: string; // DAY, WEEK, MONTH, YEAR
    interval_count: number;
}
  
export interface PaypalBillingCycle {
    frequency: PaypalFrequency;
    sequence: number; // Use 1 since we dont work with trial cycles
    tenure_type: string; // REGULAR or TRIAL
    fixed_price: PaypalFixedPrice;
    payment_preferences: PaypalPaymentPreferences;
}
  
export interface PaypalBillingPlan {
    billing_cycle: PaypalBillingCycle[];
    name: string;
    product_id: string;
    description: string;
    quantity_supported: boolean; // should be false since we dont support this
    status: string; // CREATED, INACTIVE, ACTIVE
}
  
export interface PaypalProduct {
    id: string;
    name: string;
    description: string;
    type: string;
    category: string;
}
  
export interface PaypalSubscription {
    id: string;
    product_id: string;
    name: string;
    description: string;
    status: string;
    usage_type: string;
    billing_cycles: PaypalBillingCycle[];
    payment_preferences: PaypalPaymentPreferences;
    taxes: Object;
    create_time: string;
    update_time: string;
    start_time: string;
    links: Object[];
}
  