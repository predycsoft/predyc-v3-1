import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, combineLatest } from 'rxjs';
import { Coupon } from 'src/shared/models/coupon.model';
import { Price } from 'src/shared/models/price.model';
import { CouponService } from 'src/shared/services/coupon.service';
import { IconService } from 'src/shared/services/icon.service';
import { PriceService } from 'src/shared/services/price.service';

@Component({
  selector: 'app-dialog-product-form',
  templateUrl: './dialog-product-form.component.html',
  styleUrls: ['./dialog-product-form.component.css']
})
export class DialogProductFormComponent {
  
  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    public icon: IconService,
    private priceService: PriceService,
    private couponService: CouponService,

  ) {}

  @Input() product: any;
  @Output() onSave = new EventEmitter<any>();

  // Product features should be added dynamically
  productForm = this.fb.group({
    id: [''],
    name: [''],
    active: [true],
    description: [''],
    features: this.fb.array([]),
    stripeInfo: this.fb.group({ stripeId: [''], updatedAt: [null] }),
    paypalInfo: this.fb.group({ paypalId: [''], updatedAt: [null] }),
    priority: [null],
    acceptsStripe: [false],
    acceptsBankTransfer: [false],
    acceptsZelle: [false],
    acceptsPaypal: [false],
    canEnrollByHimself: [true],
    canEnrollPrograms: [true],
    //
    isACompanyProduct: [true],
  });

  showPriceForm: boolean = false;
  selectedPrice: Price | null 

  combinedServicesSubscription: Subscription

  prices: Price[] = [];
  coupons: Coupon[] = [];

  ngOnInit(): void {
    console.log("this.product", this.product)
    if (this.product.id) {
      this.product.features.forEach((_) => this.addFeature());
      this.productForm.patchValue(this.product);
    }

    this.combinedServicesSubscription = combineLatest( [ this.priceService.getPrices$(),  this.couponService.getCoupons$()]).subscribe(([prices, coupons]) => {
      this.prices = prices.map(price => { return Price.fromJson(price) }) 
      this.prices = this.prices.filter(x => x.product.id === this.product.id)
      this.coupons = coupons.map(coupon => { return Coupon.fromJson(coupon)})       
    })
  }

  toggleProductActiveState(): void {
    this.productForm.controls.active.setValue(
      !this.productForm.controls.active.value
    );
  }

  get features(): FormArray {
    return <FormArray>this.productForm.get('features');
  }

  addFeature() {
    const feature = new FormGroup({
      text: new FormControl(''),
      isActive: new FormControl(false),
    });
    return this.features.push(feature);
  }

  removeFeature(index: number) {
    this.features.removeAt(index);
  }

  onSubmit(): void {
    this.onSave.emit(this.productForm.value);
    this.closeDialog();
  }

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }

  handleViewChange(price: Price | null): void {
    // If price is not null, we want to show the form to edit this price
    console.log("Selected price:",price)
    this.showPriceForm = price !== null;
    this.selectedPrice = price
  }


}

