import { Component, Inject } from '@angular/core';
import { Product } from 'projects/shared/models/product.model';
import { Price } from 'projects/shared/models/price.model';
import { Coupon } from 'projects/shared/models/coupon.model';
import { Subscription as SubscriptionClass, SubscriptionJson } from 'projects/shared/models/subscription.model';
import { UserService } from '../../../services/user.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CouponService } from '../../../services/coupon.service';
import { PriceService } from '../../../services/price.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/shared/models/enterprise.model';

@Component({
  selector: 'app-dialog-create-subscription',
  templateUrl: './dialog-create-subscription.component.html',
  styleUrls: ['./dialog-create-subscription.component.css']
})
export class DialogCreateSubscriptionComponent {
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogCreateSubscriptionComponent>,
    private userService: UserService,
    private priceService: PriceService,
    private couponService: CouponService,

    @Inject(MAT_DIALOG_DATA) public data: {
      userId: string,
      products: Product[],
      prices: Price[],
      coupons: Coupon[],
      enterpriseRef: DocumentReference<Enterprise>
    }
  ) {}

  subscription: SubscriptionClass = new SubscriptionClass();
  products: Product[] = [];
  prices: Price[] = [];
  coupons: Coupon[] = [];
  enterpriseRef: DocumentReference<Enterprise>;

  selectedProduct: Product
  filteredPrices: Price[]

  productId: string = '';
  priceId: string = '';
  couponId: string = '';

  form: FormGroup;
  formProductIdSubscription: Subscription

  showAlertText = false

  ngOnInit(): void {
    this.subscription = SubscriptionClass.fromJson({...SubscriptionClass.getSubscriptionTemplate()})
    this.subscription.userRef = this.userService.getUserRefById(this.data.userId)
    // this.subscription.id = 'PRE_' + +new Date()
    // this.subscription.idAtOrigin = 'PRE_' + +new Date()
    // this.subscription.enterpriseRef

    this.products = this.data.products
    this.prices = this.data.prices
    this.coupons = this.data.coupons
    this.enterpriseRef = this.data.enterpriseRef

    this.initForm()
  }

  initForm() {
    this.form = this.fb.group({
      startedAt: [null],
      productId: ['', Validators.required],
      priceId: ['', Validators.required],
      couponId: [null],
      interval: [null]
    });

    this.form.patchValue({
      startedAt: this.toStringDate(new Date(this.subscription.startedAt)),
      interval: this.subscription.interval,
    });

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.form.get('priceId')!.setValue('');
      this.productId = value;
      this.selectedProduct = this.products.find(product => product.id === this.productId)
      this.filteredPrices = this.prices.filter((x) => x.product.id == this.productId);
    });

  }

  getFilteredPrice() {
    return this.prices.filter((x) => x.product.id == this.productId);
  }

  private toStringDate(date: Date): string {
    return (
      date.getFullYear().toString() +
      '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + date.getDate()).slice(-2) +
      'T' +
      date.toTimeString().slice(0, 5)
    );
  }

  private toDate(date: string): Date {
    date = date.replace('T', '-');
    let parts = date.split('-');
    let timeParts = parts[3].split(':');

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(
      +parts[0],
      +parts[1] - 1,
      +parts[2],
      +timeParts[0],
      +timeParts[1]
    ); // Note: months are 0-based
  }

  onDateChange(): void {
    let parsedDate = this.toDate(this.form.get("startedAt").value);

    // check if date is valid first
      this.subscription.startedAt = +parsedDate;
      this.subscription.currentPeriodStart = +parsedDate;
      // this.subscription.currentPeriodEnd = this.getPeriodEnd();
  }

  getCurrentTimes() {
    // SE supone que es un mes
    this.subscription.currentPeriodEnd = this.getPeriodEnd();
    this.subscription.nextPaymentDate = this.subscription.currentPeriodEnd
    this.showAlertText = false
  }

  getPeriodEnd() {
    const date = new Date(this.subscription.currentPeriodStart);
    const currentPriceId = this.form.get("priceId").value
    if (!currentPriceId) {
      return null;
    }
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    let price = this.prices.find((x) => x.id == currentPriceId);
    let newDay = 0;
    let newMonth = 0;
    let newYear = 0;
    console.log("price.interval", price.interval);
    switch (price.interval) {
      case 'month':
        newDay = day;
        newMonth = month + 1;
        newYear = year;
        if (month == 11) {
          newMonth = 0;
          newYear = newYear + 1;
        }
        if (day > this.daysInMonth(newMonth + 1, newYear)) {
          newDay = this.daysInMonth(newMonth + 1, newYear);
        }
        return +new Date(newYear, newMonth, newDay);
      case 'year':
        newDay = day;
        newMonth = month;
        newYear = year + 1;
        return +new Date(newYear, newMonth, newDay);
      default:
        return +new Date(newYear, newMonth, newDay);
    }
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  saveSubscription() {
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.subscription.interval = formValue.interval
      this.subscription.customer = this.subscription.userRef.id
      this.subscription.priceRef = this.priceService.getPriceRefById(formValue.priceId)
      this.subscription.couponRef = formValue.couponId ? this.couponService.getCouponRefById(formValue.couponId) : null
      this.subscription.enterpriseRef = this.enterpriseRef
      this.subscription.nextPaymentAmount = this.getNextInvoice(this.subscription).ammount

      this.dialogRef.close(this.subscription);
    }
    else {
      this.showAlertText = true
    }

  }

  cancel(): void {
    this.dialogRef.close();
  }

  getNextInvoice(subscription: SubscriptionClass) {
    switch (subscription.origin.toLocaleLowerCase()) {
      case "predyc":
        return {
          date:this.getPeriodEnd(),
          ammount: this.getAmount()
        }
      case "stripe":
        return {
          date: subscription.currentPeriodEnd,
          ammount: this.getAmount()
        }
      case "paypal":
        return {
          date: subscription.currentPeriodEnd,
          ammount: this.getAmount()
        }
      default :
      return {
        date: subscription.currentPeriodEnd,
        ammount: this.getAmount()
      }
    }
  }

  getAmount(): number {
    let price = this.prices.find(x => x.id == this.form.get('priceId').value)
    price = Price.fromJson(price)
    const couponId = this.form.get('couponId').value
    if (couponId) {
      const coupon = this.coupons.find(x => x.id == couponId)
      switch (coupon.duration) {
        case "once":
          return price.getTotalAmount([])
        case "repeating":
          return price.getTotalAmount([])
        case "forever":
          return price.getTotalAmount([coupon])
        default:
          return price.getTotalAmount([])
      }
    }
    return price.getTotalAmount([])
  }
}

