import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { Coupon } from 'projects/predyc-business/src/shared/models/coupon.model';
import { Price } from 'projects/predyc-business/src/shared/models/price.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { stripeTimestampToNumberTimestamp } from 'projects/predyc-business/src/shared/utils';

@Component({
  selector: 'app-prices-list',
  templateUrl: './prices-list.component.html',
  styleUrls: ['./prices-list.component.css']
})
export class PricesListComponent {
  @Input() selectedProductId: string;
  @Output() viewChange: EventEmitter<Price | null> = new EventEmitter();

  @Input() prices: Price[]
  @Input() coupons: Coupon[]

  selectedPrice: Price | null = null;

  constructor(
    private priceService: PriceService,
    private productService: ProductService,
    private dialogService: DialogService,
    private fireFunctions: AngularFireFunctions
  ) {}

  displayedColumns: string[] = [
    "price",
    "discountedPrice",
    "apiId",
    "status",
    "freeTrial",
    "created",
  ];

  ngOnInit() {
  }


  createPrice() {
    if (this.selectedProductId) {
      let newPrice = Price.newPrice;
      newPrice.product = this.productService.getProductRefById(this.selectedProductId);
      this.editPrice(newPrice);
    } else {
      this.dialogService.dialogAlerta(
        'Debe seleccionar un producto para poder agregar un precio'
      );
    }
  }

  editPrice(price: Price) {
    this.selectedPrice = price;
    this.viewChange.emit(price);
  }

  getCoupon(couponId): Coupon[] {
    const coupon = this.coupons.find((x) => x.id == couponId);
    if (coupon) {
      return [coupon];
    } else {
      return [];
    }
  }

  reset(): void {
    this.selectedPrice = null;
  }

  getSyncStripeFunction(price: Price): Promise<void> {
    let syncStripeFunction = null;
    if (!price.stripeInfo.stripeId) {
      syncStripeFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('createStripePrice')(price)
      );
    } else {
      syncStripeFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('updateStripePrice')(price)
      );
    }
    return syncStripeFunction;
  }

  getSyncPaypalFunction(price: Price): Promise<void> {
    let syncPaypalFunction = null;
    if (!price.paypalInfo.paypalId) {
      syncPaypalFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('createPaypalPrice')(price)
      );
    }
    else {
      syncPaypalFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('updatePaypalPrice')(price)
      );
    }
    return syncPaypalFunction;
  }

  async onSave(price: Price): Promise<void> {
    if (!price.id) {
      const newId = [
        `${price.product.id}`,
        `${price.amount}${price.currency}`,
        `${price.interval}`,
      ].join('-');
      price.id = newId;
    }
    try {
      await this.priceService.savePrice(price)
      // const promises = [
      //   this.getSyncStripeFunction(price),
      //   this.getSyncPaypalFunction(price),
      // ];
      // const _ = await Promise.all(promises);
      this.reset();
    } catch (error) {
      this.dialogService.dialogAlerta(error);
    }
  }

  OnStripeTimestampToNumberTimestamp(price: Price): number {
    return stripeTimestampToNumberTimestamp(price.stripeInfo.updatedAt)
  }
}