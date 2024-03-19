import { Component, Inject, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Charge } from 'projects/shared/models/charges.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Subscription } from 'rxjs';
import { PriceService } from '../../../services/price.service';
import { CouponService } from '../../../services/coupon.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Coupon } from 'projects/shared/models/coupon.model';
import { Price } from 'projects/shared/models/price.model';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';

@Component({
  selector: 'app-dialog-create-charge',
  templateUrl: './dialog-create-charge.component.html',
  styleUrls: ['./dialog-create-charge.component.css']
})
export class DialogCreateChargeComponent {

  constructor(
    private fb: FormBuilder,
    private priceService: PriceService,
    private couponService: CouponService,
    public matDialogRef: MatDialogRef<DialogCreateChargeComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: {
      customerRef: DocumentReference<Enterprise | User>,
      coupons: Coupon[],
      prices: Price[],
      products: Product[],
    },
  ){}
  products: Product[] = [];
  prices: Price[] = [];
  coupons: Coupon[] = [];

  form: FormGroup;

  filteredPrices: Price[] = []
  selectedProduct: Product

  newCharge: Charge = null

  fechaString:any
  productId: any;

  formProductIdSubscription: Subscription

  showAlertText = false

  ngOnInit() {
    this.newCharge = Charge.fromJson({...Charge.getChargeTemplate()})
    this.newCharge.id = "ch_pre_" + Date.now().toString(),
    this.newCharge.customer = this.data.customerRef
    this.products = this.data.products
    this.prices = this.data.prices
    this.coupons = this.data.coupons
    this.initializeForm()
  }

  initializeForm() {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      priceId: ['', Validators.required],
      couponId: [''],
      startDate: [this.dateToString(this.newCharge.createdAt)],
      payAt: [this.newCharge.payAt],
      interval: [this.newCharge.interval, Validators.min(1)],
      quantity: [this.newCharge.quantity, Validators.min(1)],
      comment: [this.newCharge.comment],
      amount: [this.newCharge.amount, Validators.min(0)],
      amountCaptured: [{value: this.newCharge.amountCaptured, disabled: this.newCharge.via !== 'Predyc'}, Validators.min(0)],
      amountRefunded: [{value: this.newCharge.amountRefunded, disabled: this.newCharge.via !== 'Predyc'}, Validators.min(0)],
      description: [{value: this.newCharge.description, disabled: this.newCharge.via !== 'Predyc'}],
      paymentMethod: [{value: this.newCharge.paymentMethod, disabled: this.newCharge.via !== 'Predyc'}, Validators.required],
      status: [{value: this.newCharge.status, disabled: this.newCharge.via !== 'Predyc'}],
    });

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.form.get('priceId')!.setValue('');
      this.productId = value;
      this.selectedProduct = this.products.find(product => product.id === this.productId)
      this.filteredPrices = this.prices.filter((x) => x.product.id == this.productId);
    });
  }

  dateToString(numberDate: number):string{
    let date = new Date(numberDate)
    return date.getFullYear()+"-"+(date.getMonth() + 1).toFixed(0).padStart(2,'0')+"-"+date.getDate().toFixed(0).padStart(2,'0')
  }

  stringToNumberDate(stringDate: string): number{
    const [year, month, day] = stringDate.split("-")
    const numberDate = +new Date(month+"/"+day+"/"+year)
    return +new Date(numberDate)
  }

  getAmount() {
    this.newCharge.amount = this.calculateAmount()
    this.updateCaptureAmountAnPayAt()
  }

  calculateAmount(): number {
    if(this.form.get('priceId').value){
      let price = this.prices.find(x => x.id == this.form.get('priceId').value)
      price = Price.fromJson(price)
      let coupons = []
      if(this.form.get('couponId').value){
        let coupon = this.coupons.find(x => x.id == this.form.get('couponId').value)
        coupons = [coupon]
        switch(coupon.duration){
          case "once":
            return this.form.get('quantity').value*(price.getTotalAmount(coupons) + price.getTotalAmount([])*(this.form.get('interval').value - 1))
          case "repeating":
            if(coupon.durationInMonths > this.form.get('interval').value){
              // this.newCharge.interval = coupon.durationInMonths
              this.form.get('interval')!.setValue(coupon.durationInMonths)
            }
            return price.getTotalAmount([coupon])*coupon.durationInMonths + price.getTotalAmount([])*(this.form.get('interval').value - coupon.durationInMonths)
          case "forever":
            return price.getTotalAmount([coupon])*this.form.get('interval').value
          default:
            return  this.form.get('quantity').value*price.getTotalAmount([coupon])*this.form.get('interval').value
        }
      }
      return price.amount*this.form.get('interval').value*this.form.get('quantity').value
    } else {
      return 0
    }
  }

  updateCaptureAmountAnPayAt() {
    if(this.form.get('status').value == Charge.STATUS_SUCCEEDED){
      this.form.get('amountCaptured')!.setValue(this.newCharge.amount)
      this.form.get('payAt')!.setValue(this.dateToString(this.newCharge.createdAt))
    }
    else {
      this.form.get('amountCaptured')!.setValue(0)
      this.form.get('payAt')!.setValue(null)   
    } 
  }

  cancel() {
    this.matDialogRef.close()
  }

  save(){
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.newCharge.createdAt = this.stringToNumberDate(formValue.startDate);
      this.newCharge.payAt = formValue.status === Charge.STATUS_SUCCEEDED ? this.stringToNumberDate(formValue.payAt) : null
      this.newCharge.quantity = formValue.quantity;
      this.newCharge.status = formValue.status
      this.newCharge.price = this.priceService.getPriceRefById(formValue.priceId)
      this.newCharge.coupon = formValue.couponId ? this.couponService.getCouponRefById(formValue.couponId) : null
      this.newCharge.interval = formValue.interval
      this.newCharge.comment = formValue.comment
      this.newCharge.amountCaptured = formValue.amountCaptured
      this.newCharge.amountRefunded = formValue.amountRefunded
      this.newCharge.description = formValue.description
      this.newCharge.paymentMethod = formValue.paymentMethod

      this.matDialogRef.close(this.newCharge);
    }
    else {
      this.showAlertText = true
    }
  }

  ngOnDestroy() {
    this.formProductIdSubscription.unsubscribe()
  }
}
