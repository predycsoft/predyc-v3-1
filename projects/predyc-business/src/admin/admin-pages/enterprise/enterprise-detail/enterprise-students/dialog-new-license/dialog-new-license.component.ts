import { Component, Inject, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, combineLatest } from 'rxjs';
import { Coupon } from 'projects/predyc-business/src/shared/models/coupon.model';
import { License } from 'projects/predyc-business/src/shared/models/license.model';
import { Price } from 'projects/predyc-business/src/shared/models/price.model';
import { Product } from 'projects/predyc-business/src/shared/models/product.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-dialog-new-license',
  templateUrl: './dialog-new-license.component.html',
  styleUrls: ['./dialog-new-license.component.css']
})
export class DialogNewLicenseComponent {

  constructor(
    public matDialogRef: MatDialogRef<DialogNewLicenseComponent>, 
    private productService: ProductService,
    private priceService: PriceService,
    private couponService: CouponService,
    public icon: IconService,
    private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: {
      coupons: Coupon[],
      prices: Price[],
      products: Product[],
      dateStart: number
    },
  ) { }

  license: License = License.newLicenseTemplate

  products: Product[] = [];
  prices: Price[] = [];
  coupons: Coupon[] = [];
  productId: string = '';
  dateStart: number


  form: FormGroup;

  combinedServicesSubscription: Subscription

  showAlertText = false

  formProductIdSubscription: Subscription
  formStartDateSubscription: Subscription

  showWarningDate = false

  ngOnInit(): void {
    this.license = License.newLicenseTemplate
    this.products = this.data.products
    this.prices = this.data.prices
    this.coupons = this.data.coupons
    this.dateStart = this.data?.dateStart
    this.initializeForm()
  }

  initializeForm() {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      priceId: ['', Validators.required],
      couponId: [''],
      startDate: ['', ],
      quantity: [1, Validators.min(1)],
      rotations: [0, Validators.min(0)],
      status: ['', ],
      trialDays: ['']
    });

    if(this.dateStart){
      console.log(this.dateStart)
      this.license.startedAt = this.dateStart;
      this.showWarningDate = true
    }
    else{
      this.license.startedAt = Date.now();
      this.showWarningDate = false

    }

    this.license.id = Date.now().toString()


    this.form.patchValue({
      startDate: this.toDateString(new Date(this.license.startedAt)),
      quantity: this.license.quantity,
      rotations: this.license.rotations,
      status: this.license.status,
      trialDays: this.license.trialDays,
    })

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.productId = value;
      this.form.get('priceId')!.setValue('');
    });
    this.formStartDateSubscription = this.form.get('startDate').valueChanges.subscribe(value => {
      this.onDateChange(value);
    });
  }

  save(){
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.license.quantity = formValue.quantity;
      this.license.rotations = formValue.rotations;
      this.license.status = formValue.status
      this.license.trialDays = formValue === "trialing" ? formValue.trialDays : null      
      this.license.priceRef = this.priceService.getPriceRefById(formValue.priceId)
      this.license.couponRef = formValue.couponId ? this.couponService.getCouponRefById(formValue.couponId) : null
      // this.license.enterpriseRef Set in parent component

      this.matDialogRef.close(this.license);
    }
    else {
      this.showAlertText = true
    }
  }

  cancel(){
    this.matDialogRef.close()
  }

  private toDateString(date: Date): string {
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


  getFilteredCoupons() {
    return this.coupons;
  }

  getFilteredPrice(): Price[] {
    return this.prices.filter((x) => x.product.id == this.productId);
  }

  onDateChange(startedAt: string): void {
    let parsedDate: Date = this.parseDateString(startedAt);

    // check if date is valid first
    // if (parsedDate.getTime() != NaN) {
      this.license.startedAt = +parsedDate;
      this.license.currentPeriodStart = +parsedDate;
      this.license.currentPeriodEnd = this.getPeriodEnd();
    // }
  }

  private parseDateString(date: string): Date {
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

  getCurrentTimes() {
    // SE supone que es un mes
    this.license.currentPeriodStart = this.license.startedAt;
    this.license.currentPeriodEnd = this.getPeriodEnd();
  }

  getPeriodEnd() {
    if(this.license.status == 'trialing'){
      const date = new Date(this.license.currentPeriodStart + this.license.trialDays*24*60*60*1000);
      let day = date.getDate();
      let month = date.getMonth();
      let year = date.getFullYear();
      return +new Date(year, month, day);
    } else {
      const date = new Date(this.license.currentPeriodStart);
      if (!this.license.priceRef.id) {
        return null;
      }
      let day = date.getDate();
      let month = date.getMonth();
      let year = date.getFullYear();
      let price = this.prices.find((x) => x.id == this.license.priceRef.id);
      let newDay = 0;
      let newMonth = 0;
      let newYear = 0;
      // console.log(price.interval);
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
          this.license.currentPeriodEnd = +new Date(
            newYear,
            newMonth,
            newDay
          );
          return +new Date(newYear, newMonth, newDay);
        case 'year':
          newDay = day;
          newMonth = month;
          newYear = year + 1;
          this.license.currentPeriodEnd = +new Date(
            newYear,
            newMonth,
            newDay
          );
          return +new Date(newYear, newMonth, newDay);
        default:
          this.license.currentPeriodEnd = +new Date(
            newYear,
            newMonth,
            newDay
          );
          return +new Date(2012, newMonth, newDay);
      }
    }
   
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  ngOnDestroy() {
    this.formProductIdSubscription.unsubscribe()
    this.formStartDateSubscription.unsubscribe()
  }

}