import { Coupon } from "./coupon.model";
import { PaypalInfo } from "./paypal.model";
import { StripeInfo } from "./stripe.model";

export interface PriceJson {
    id: string;
    active: boolean;
    productId: string;
    couponId: string | null;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    stripeInfo: StripeInfo;
    paypalInfo: PaypalInfo;
    freeTrialDays: number;
    type: string;
}

export class Price {
    id: string;
    active: boolean;
    productId: string;
    couponId: string | null;
    amount: number;
    currency: string;
    interval: string;
    intervalCount: number;
    stripeInfo: StripeInfo;
    paypalInfo: PaypalInfo;
    freeTrialDays: number;
    type: string;
    // Coupon could be part of price or could be an individual object
  
    public static intervalToDisplayValueDict = {
      month: 'Mensual',
      day: 'Diario',
      year: 'Anual',
    };
  
    public static fromJson(obj: PriceJson): Price {
      let price = new Price();
      price.id = obj.id;
      price.active = obj.active;
      price.productId = obj.productId;
      price.couponId = obj.couponId;
      price.amount = obj.amount;
      price.currency = obj.currency;
      price.interval = obj.interval;
      price.intervalCount = obj.intervalCount;
      price.stripeInfo = obj.stripeInfo;
      price.paypalInfo = obj.paypalInfo;
      price.freeTrialDays = obj.freeTrialDays;
      price.type = obj.type;
      return price;
    }
  
    public toStripeCreateParams() {
      let priceCreateParams = {
        active: this.active,
        product: this.productId,
        unit_amount: this.amount * 100,
        currency: this.currency,
        recurring: {
          interval: this.interval,
          interval_count: this.intervalCount,
        },
      };
      return priceCreateParams;
    }
  
    public toStripeUpdateParams() {
      let PriceUpdateParams = {
        active: this.active,
      };
      return PriceUpdateParams;
    }
  
    public toPaypalCreateParams() {
      const priceCreateParams = {
        // product_id: this.paypalInfo.paypalId,
        // name: "",
        // description: "",
        status: this.active ? 'ACTIVE' : 'INACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: 'DAY',
              interval_count: 1,
            },
            tenure_type: 'TRIAL',
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: {
                currency_code: 'USD',
                value: this.freeTrialDays,
              },
            },
          },
          {
            frequency: {
              interval_unit: this.interval,
              interval_count: this.intervalCount,
            },
            tenure_type: 'REGULAR',
            sequence: 2,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: {
                currency_code: this.currency,
                value: this.amount,
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          payment_failure_threshold: 3,
        },
      };
      return priceCreateParams;
    }
  
    public toPaypalUpdateParams() {
      // let ProductUpdateParams = [{
      //   op: "replace", 
      //   path: "/",     
      //   value: ""
      // }]
      // return ProductUpdateParams
    }
  
    public getIntervalDisplayValue(): string {
      return Price.intervalToDisplayValueDict[this.interval];
    }
  
    public getTotalAmount(coupons: Coupon[]): number {
      let totalAmount = this.amount;
      coupons.forEach((coupon) => {
        if (coupon.percentOff) {
          totalAmount -= (this.amount * coupon.percentOff) / 100;
        } else if (coupon.amountOff) {
          totalAmount -= coupon.amountOff;
        }
      });
      return totalAmount;
    }
}