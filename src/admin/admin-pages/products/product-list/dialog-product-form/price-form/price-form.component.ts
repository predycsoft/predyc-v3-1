import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Coupon } from 'src/shared/models/coupon.model';
import { Price } from 'src/shared/models/price.model';
import { CouponService } from 'src/shared/services/coupon.service';
import { DialogService } from 'src/shared/services/dialog.service';
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';

@Component({
  selector: 'app-price-form',
  templateUrl: './price-form.component.html',
  styleUrls: ['./price-form.component.css']
})
export class PriceFormComponent {

  @Output() viewChange: EventEmitter<Price | null> = new EventEmitter();
  @Input() selectedProductId: string
  @Input() selectedPrice: Price | null
  @Input() coupons: Coupon[]


  constructor(
    private fb: FormBuilder, 
    private priceService: PriceService,
    private dialogService: DialogService,
    private productService: ProductService,
    private couponService: CouponService,

  ) {}

  reset(): void {
    this.viewChange.emit(null); // Emitting null to indicate switching back to the list view
  }

  priceForm = this.fb.group({
    id: [''],
    active: [true],
    product: [null],
    couponId: [''],
    coupon: [null],
    amount: [0],
    currency: ['USD'],
    interval: ['month'] /* day, week, month or year */,
    intervalCount: [1],
    freeTrialDays: [0],
    stripeInfo: this.fb.group({ stripeId: [''], updatedAt: [null] }),
    paypalInfo: this.fb.group({ paypalId: [''], updatedAt: [null] }),
    type: ['recurring']
  });


  ngOnInit(): void {
    console.log("this.selectedPrice en price-form", this.selectedPrice)
    this.priceForm.patchValue(this.selectedPrice);
    this.priceForm.patchValue({couponId: this.selectedPrice.coupon ? this.selectedPrice.coupon.id : ""})
    // console.log("this.priceForm.value", this.priceForm.value)
  }

  togglePriceActiveState(): void {
    this.priceForm.controls.active.setValue(
      !this.priceForm.controls.active.value
    );
  }

  async onSubmit(): Promise<void> {
    const price = this.priceForm.value
    if (!price.id) {
      const newId = [
        `${this.selectedProductId}`,
        `${price.amount}${price.currency}`,
        `${price.interval}`,
      ].join('-');
      price.id = newId;
      price.product = this.productService.getProductRefById(this.selectedProductId)
    }
    try {
      price.coupon = this.couponService.getCouponRefById(price.couponId)
      delete price.couponId // we dont want to save this field
      
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

  onTypeChange(option) {
    console.log(option.value)

    if (option.value == "one_time") {
      this.priceForm.get("interval").reset("month");
      this.priceForm.get("intervalCount").reset(1);
    }
  }

}