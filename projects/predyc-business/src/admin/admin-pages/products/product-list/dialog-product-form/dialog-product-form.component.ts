import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { Coupon } from 'projects/shared/models/coupon.model';
import { Price } from 'projects/shared/models/price.model';
import { Product } from 'projects/shared/models/product.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';

@Component({
  selector: 'app-dialog-product-form',
  templateUrl: './dialog-product-form.component.html',
  styleUrls: ['./dialog-product-form.component.css']
})
export class DialogProductFormComponent {
  
  constructor(
    public activeModal: NgbActiveModal,
    public icon: IconService,
    private priceService: PriceService,
    private couponService: CouponService,
    public productService: ProductService,
    public dialogService: DialogService,
    private fireFunctions: AngularFireFunctions,

  ) {}

  @Input() product: any;

  showPriceForm: boolean = false;
  selectedPrice: Price | null 

  combinedServicesSubscription: Subscription

  prices: Price[] = [];
  coupons: Coupon[] = [];

  ngOnInit(): void {
    // console.log("this.product", this.product)
    this.combinedServicesSubscription = combineLatest( [ this.priceService.getPrices$(),  this.couponService.getCoupons$()]).subscribe(([prices, coupons]) => {
      this.prices = prices.map(price => { return Price.fromJson(price) }) 
      this.prices = this.prices.filter(x => x.product.id === this.product.id)
      this.coupons = coupons.map(coupon => { return Coupon.fromJson(coupon)})       
    })
  }

  async onSubmit(product): Promise<void> {
    if (!product.id) {
      const newId = product.name.split(' ').join('-');
      product.id = newId;
    }
    try {
      await this.productService.saveProduct(product)
      // UNCOMMENT
      // const promises = [
      //   this.getSyncStripeFunction(product),
      //   this.getSyncPaypalFunction(product),
      // ];
      // const _ = await Promise.all(promises);
    } catch (error) {
      this.dialogService.dialogAlerta(error);
    }
    this.closeDialog();
  }

  getSyncStripeFunction(product: Product): Promise<void> {
    let syncStripeFunction = null;
    if (!product.stripeInfo.stripeId) {
      syncStripeFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('createStripeProduct')(product)
      );
    } else {
      syncStripeFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('updateStripeProduct')(product)
      );
    }
    return syncStripeFunction;
  }

  getSyncPaypalFunction(product: Product): Promise<void> {
    let syncPaypalFunction = null;
    if (!product.paypalInfo.paypalId) {
      syncPaypalFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('createPaypalProduct')(product)
      );
    }
    else {
      syncPaypalFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('updatePaypalProduct')(product)
      );
    }
    return syncPaypalFunction;
  }

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }

  handleViewChange(price: Price | null): void {
    // If price is not null, we want to show the form to edit this price
    // console.log("Selected price:",price)
    this.showPriceForm = price !== null;
    this.selectedPrice = price
  }


}

