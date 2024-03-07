import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Charge } from 'projects/predyc-business/src/shared/models/charges.model';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { Subscription } from 'rxjs';
import { Coupon, Price, Product } from 'shared';

@Component({
  selector: 'app-dialog-create-charge',
  templateUrl: './dialog-create-charge.component.html',
  styleUrls: ['./dialog-create-charge.component.css']
})
export class DialogCreateChargeComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>;
  @Input() prices:Price[];
  @Input() products:Product[];
  @Input() coupons:Coupon[];

  constructor(
    private fb: FormBuilder,

  ){}

  form: FormGroup;

  filteredPrices: Price[] = []
  selectedProduct: Product

  newCharge: Charge

  fechaString:any
  productId: any;

  formProductIdSubscription: Subscription

  ngOnInit() {
    this.newCharge = Charge.newChargeTemplate
    this.newCharge.customer = this.enterpriseRef
    this.initializeForm()

  }

  initializeForm() {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      priceId: ['', Validators.required],
      couponId: [''],
      startDate: ['', ],
      interval: [0, Validators.min(0)],
      quantity: [1, Validators.min(1)],
      comment: ['', ],
      amount: [0, Validators.min(0)],
      amountCaptured: [0, Validators.min(0)],
      amountRefunded: [0, Validators.min(0)],
      trialDays: [''],
      description: [''],
      paymentMethod: [''],
      status: [''],
    });

    this.form.patchValue({
      status: this.newCharge.status,
    })

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.form.get('priceId')!.setValue('');
      this.productId = value;
      this.selectedProduct = this.products.find(product => product.id === this.productId)
      this.filteredPrices = this.prices.filter((x) => x.product.id == this.productId);
    });
  }

  getAmount() {
    // this.charge.amount = this.calculateAmount()
    // return this.charge.amount
  }

  calculateAmount() {
    // if(this.charge.priceId){
    //  let price = this.prices.find(x => x.id == this.charge.priceId)
    //  let coupons = []
    //  if(this.charge.couponId){
    //   let coupon = this.coupons.find(x => x.id == this.charge.couponId)
    //   coupons = [coupon]
    //   switch(coupon.duration){
    //     case "once":
    //       return this.charge.quantity*(price.getTotalAmount(coupons) + price.getTotalAmount([])*(this.charge.interval - 1))
    //     case "repeating":
    //       if(coupon.durationInMonths > this.charge.interval){
    //         this.charge.interval = coupon.durationInMonths
    //       }
    //       return price.getTotalAmount([coupon])*coupon.durationInMonths + price.getTotalAmount([])*(this.charge.interval - coupon.durationInMonths)
    //     case "forever":
    //       return price.getTotalAmount([coupon])*this.charge.interval
    //     default:
    //       return  this.charge.quantity*price.getTotalAmount([coupon])*this.charge.interval
    //   }
    //  }
    //  return price.getTotalAmount([])*this.charge.interval*this.charge.quantity
    // } else {
    //   return 0
    // }
  }

  
  getFilteredPrice() {
    return []
  }
  getFilteredCoupons() {
    return [] 
  }

  getProduct() {
    
  }
  updateCaptureAmount() {
    
  }
  saveCharge() {
    
  }
  cancel() {
    
  }
}
