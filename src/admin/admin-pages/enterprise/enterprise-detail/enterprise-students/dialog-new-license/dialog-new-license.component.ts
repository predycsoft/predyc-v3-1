import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, combineLatest } from 'rxjs';
import { Coupon } from 'src/shared/models/coupon.model';
import { License } from 'src/shared/models/license.model';
import { Price } from 'src/shared/models/price.model';
import { Product } from 'src/shared/models/product.model';
import { CouponService } from 'src/shared/services/coupon.service';
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';

@Component({
  selector: 'app-dialog-new-license',
  templateUrl: './dialog-new-license.component.html',
  styleUrls: ['./dialog-new-license.component.css']
})
export class DialogNewLicenseComponent {

  constructor(
    public matDialogRef: MatDialogRef<DialogNewLicenseComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any,
    private productService: ProductService,
    private priceService: PriceService,
    private couponService: CouponService,
  ) { }

  licence: License = License.newLicenseTemplate

  _date = '';
  products: Product[] = [];
  prices: Price[] = [];
  coupons: Coupon[] = [];
  productId: string = '';
  priceId: string = '';
  couponId: string = '';


  //


  combinedServicesSubscription: Subscription

  ngOnInit(): void {
    this._date = this.toDateString(new Date(this.licence.startedAt));

    this.combinedServicesSubscription = combineLatest(
      [
        this.priceService.getPrices$(), 
        this.productService.getProducts$(),
        this.couponService.getCoupons$(),
      ]
    ).subscribe(([prices, products, coupons]) => {
      this.prices = prices
      this.products = products
      this.coupons = coupons
    })
  }

  save(){
    this.matDialogRef.close(this.licence)
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

  getFilteredPrice() {
    return this.prices.filter((x) => x.product.id == this.productId);
  }

  onDateChange(): void {
    let parsedDate = this.parseDateString(this._date);

    // check if date is valid first
    // if (parsedDate.getTime() != NaN) {
    //   this.licence.startedAt = +parsedDate;
    //   this.licence.currentPeriodStart = +parsedDate;
    //   this.licence.currentPeriodEnd = this.getPeriodEnd();
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
    this.licence.currentPeriodStart = this.licence.startedAt;
    this.licence.currentPeriodEnd = this.getPeriodEnd();
  }

  getPeriodEnd() {
    if(this.licence.status == 'trialing'){
      const date = new Date(this.licence.currentPeriodStart + this.licence.trialDays*24*60*60*1000);
      let day = date.getDate();
      let month = date.getMonth();
      let year = date.getFullYear();
      return +new Date(year, month, day);
    } else {
      const date = new Date(this.licence.currentPeriodStart);
      if (!this.licence.priceRef.id) {
        return null;
      }
      let day = date.getDate();
      let month = date.getMonth();
      let year = date.getFullYear();
      let price = this.prices.find((x) => x.id == this.licence.priceRef.id);
      let newDay = 0;
      let newMonth = 0;
      let newYear = 0;
      console.log(price.interval);
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
          this.licence.currentPeriodEnd = +new Date(
            newYear,
            newMonth,
            newDay
          );
          return +new Date(newYear, newMonth, newDay);
        case 'year':
          newDay = day;
          newMonth = month;
          newYear = year + 1;
          this.licence.currentPeriodEnd = +new Date(
            newYear,
            newMonth,
            newDay
          );
          return +new Date(newYear, newMonth, newDay);
        default:
          this.licence.currentPeriodEnd = +new Date(
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


}