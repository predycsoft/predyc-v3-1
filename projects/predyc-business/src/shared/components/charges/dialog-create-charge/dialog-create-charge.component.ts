import { Component, Inject, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Charge } from 'projects/predyc-business/src/shared/models/charges.model';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { Subscription } from 'rxjs';
import { PriceService } from '../../../services/price.service';
import { CouponService } from '../../../services/coupon.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from '../../../models/product.model';
import { Price } from '../../../models/price.model';
import { Coupon } from '../../../models/coupon.model';

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
      enterpriseRef: DocumentReference<Enterprise>,
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

  newCharge: Charge

  fechaString:any
  productId: any;

  formProductIdSubscription: Subscription

  showAlertText = false

  ngOnInit() {
    this.newCharge = Charge.newChargeTemplate
    console.log("this.newCharge.id", this.newCharge.id)
    this.newCharge.customer = this.data.enterpriseRef
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
      startDate: [null],
      payAt: [null],
      interval: [1, Validators.min(1)],
      quantity: [1, Validators.min(1)],
      comment: ['', ],
      amount: [0, Validators.min(0)],
      amountCaptured: [{value: '', disabled: this.newCharge.via !== 'Predyc'}, Validators.min(0)],
      amountRefunded: [{value: '', disabled: this.newCharge.via !== 'Predyc'}, Validators.min(0)],
      description: [{value: '', disabled: this.newCharge.via !== 'Predyc'}],
      paymentMethod: [{value: '', disabled: this.newCharge.via !== 'Predyc'}, Validators.required],
      status: [{value: '', disabled: this.newCharge.via !== 'Predyc'}],
    });

    this.form.patchValue({
      status: this.newCharge.status,
      startDate: this.dateToString(this.newCharge.createdAt),
    })

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
      this.newCharge.payAt = this.stringToNumberDate(formValue.payAt) ;
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
}
