export interface CouponJson {
    active: boolean;
    activeBanner: boolean;
    amountOff: number | null;
    createdAt: number;
    currency: string; // force to USD
    duration: string; // once, repeating, forever
    durationInMonths: number | null;
    id: string;
    isGlobal: boolean;
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number | null;
    name: string;
    percentOff: number | null; // gt 0 lt 100
    promoCode: string | null;
    redeemBy: number | null; // Timestamp
    textBanner: string | null;
}

export class Coupon {
    active: boolean;
    activeBanner: boolean;
    amountOff: number | null;
    createdAt: number;
    currency: string; // force to USD
    duration: string; // once, repeating, forever
    durationInMonths: number | null;
    id: string;
    isGlobal: boolean;
    maxRedemptions: number | null;
    maxRedemptionsPerUser: number | null;
    name: string;
    percentOff: number | null; // gt 0 lt 100
    promoCode: string | null;
    redeemBy: number | null; // Timestamp
    textBanner: string | null;

    public static collection = 'coupon'

    public static getCouponTemplate(): Coupon {
      return Coupon.fromJson({
        active: true,
        activeBanner: false,
        amountOff: 0,
        createdAt: +new Date(),
        currency: '',
        duration: '',
        durationInMonths: null,
        id: '',
        maxRedemptions: null,
        maxRedemptionsPerUser: 1,
        name: '',
        isGlobal: false,
        percentOff: 0,
        promoCode: '',
        redeemBy: null,
        textBanner: '',
      });
    }  
  
    public static fromJson(obj: CouponJson): Coupon {
      let coupon = new Coupon();
      coupon.active = obj.active;
      coupon.activeBanner = obj.activeBanner;
      coupon.amountOff = obj.amountOff;
      coupon.createdAt = obj.createdAt;
      coupon.currency = obj.currency;
      coupon.duration = obj.duration;
      coupon.durationInMonths = obj.durationInMonths;
      coupon.id = obj.id;
      coupon.isGlobal = obj.isGlobal;
      coupon.maxRedemptions = obj.maxRedemptions;
      coupon.maxRedemptionsPerUser = obj.maxRedemptionsPerUser;
      coupon.name = obj.name;
      coupon.percentOff = obj.percentOff;
      coupon.promoCode = obj.promoCode;
      coupon.redeemBy = obj.redeemBy;
      coupon.textBanner = obj.textBanner;
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
        active: this.active,
        activeBanner: this.activeBanner,
        amountOff: this.amountOff,
        createdAt: this.createdAt,
        currency: this.currency,
        duration: this.duration,
        durationInMonths: this.durationInMonths,
        id: this.id,
        isGlobal: this.isGlobal,
        name: this.name,
        maxRedemptions: this.maxRedemptions,
        maxRedemptionsPerUser: this.maxRedemptionsPerUser,
        percentOff: this.percentOff,
        promoCode: this.promoCode,
        redeemBy: this.redeemBy,
        textBanner: this.textBanner,
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