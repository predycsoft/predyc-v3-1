import { StripeInfo } from "./stripe.model";

export interface CouponJson {
    id: string;
    name: string;
    amountOff: number | null;
    duration: string; // once, repeating, forever
    durationInMonths: number | null;
    currency: string; // force to USD
    percentOff: number | null; // gt 0 lt 100
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number | null;
    redeemBy: number | null; // Timestamp
    isGlobal: boolean;
    active: boolean;
    stripeInfo: StripeInfo;
    activeBanner: boolean;
    textBanner: string | null;
    promoCode: string | null;
}

export class Coupon {
    id: string;
    name: string;
    amountOff: number | null;
    duration: string; // once, repeating, forever
    durationInMonths: number | null;
    currency: string; // force to USD
    percentOff: number | null; // gt 0 lt 100
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number | null;
    redeemBy: number | null; // Timestamp
    isGlobal: boolean;
    active: boolean;
    activeBanner: boolean;
    textBanner: string | null;
    stripeInfo: StripeInfo;
    promoCode: string | null;
  
    public static fromJson(obj: CouponJson): Coupon {
      let coupon = new Coupon();
      coupon.id = obj.id;
      coupon.name = obj.name;
      coupon.amountOff = obj.amountOff;
      coupon.duration = obj.duration;
      coupon.durationInMonths = obj.durationInMonths;
      coupon.currency = obj.currency;
      coupon.percentOff = obj.percentOff;
      coupon.maxRedemptions = obj.maxRedemptions;
      coupon.maxRedemptionsPerUser = obj.maxRedemptionsPerUser;
      coupon.redeemBy = obj.redeemBy;
      coupon.isGlobal = obj.isGlobal;
      coupon.active = obj.active;
      coupon.activeBanner = obj.activeBanner;
      coupon.textBanner = obj.textBanner;
      coupon.promoCode = obj.promoCode;
      coupon.stripeInfo = obj.stripeInfo;
      return coupon;
    }
  
    public tooltipInfo(): string {
      return `
      <strong>Duración: </strong> ${this.durationDisplayName()}<br>
      <strong>Descuento: </strong> ${this.getDiscountText()}<br>
      <strong>Estatus: </strong> ${this.active ? 'Activo' : 'Inactivo'}<br>
      <strong>Global: </strong> ${this.isGlobal ? 'Si' : 'No'}    
      `;
    }
  
    public toJson(): CouponJson {
      return {
        id: this.id,
        name: this.name,
        amountOff: this.amountOff,
        duration: this.duration,
        durationInMonths: this.durationInMonths,
        currency: this.currency,
        percentOff: this.percentOff,
        maxRedemptions: this.maxRedemptions,
        maxRedemptionsPerUser: this.maxRedemptionsPerUser,
        redeemBy: this.redeemBy,
        isGlobal: this.isGlobal,
        active: this.active,
        activeBanner: this.activeBanner,
        textBanner: this.textBanner,
        promoCode: this.promoCode,
        stripeInfo: this.stripeInfo,
      };
    }
  
    public durationDisplayName() {
      switch (this.duration) {
        case 'once':
          return 'primer cobro';
        case 'repeating':
          return 'Por ' + this.durationInMonths + ' meses';
        case 'forever':
          return 'Mientras mantenga su suscripción activa';
        default:
          return 'No definido <Llamar a soporte>';
      }
    }
  
    public toStripeCreateParams() {
      let couponCreateParams = {
        currency: this.currency,
        duration: this.duration,
        name: this.name,
      };
      if (this.amountOff) {
        couponCreateParams['amount_off'] = this.amountOff;
      } else if (this.percentOff) {
        couponCreateParams['percent_off'] = this.percentOff;
      }
      if (this.duration === 'repeating' && this.durationInMonths) {
        couponCreateParams['duration_in_months'] = this.durationInMonths;
      }
      return couponCreateParams;
    }
  
    // Delete a coupon
  
    public getDiscountText(): string {
      let discountText = '';
      if (this.percentOff) {
        discountText = `${this.percentOff}%`;
      } else if (this.amountOff) {
        discountText = `-${this.amountOff} ${this.currency}`;
      }
      return discountText;
    }
}