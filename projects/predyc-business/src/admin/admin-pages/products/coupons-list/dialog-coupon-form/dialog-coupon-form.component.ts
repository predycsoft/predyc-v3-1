import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Coupon } from 'projects/shared/models/coupon.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';

@Component({
  selector: 'app-dialog-coupon-form',
  templateUrl: './dialog-coupon-form.component.html',
  styleUrls: ['./dialog-coupon-form.component.css']
})
export class DialogCouponFormComponent {

  @Input() coupon: Coupon;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private couponService: CouponService,
    public dialogService: DialogService,
    public icon: IconService,

  ) {}

  ngOnInit() {
    if (this.coupon.id) {
      this.couponForm.patchValue(this.coupon);
    }
  }

  couponForm = this.fb.group({
    id: [''],
    active: [true],
    isGlobal: [false],
    name: [''],
    amountOff: [null],
    duration: ['once'],
    durationInMonths: [null],
    currency: ['USD'],
    percentOff: [null],
    maxRedemptions: [null],
    maxRedemptionsPerUser: [1],
    redeemBy: [null],
    activeBanner: [false],
    textBanner: [''],
    promoCode: [''],
  });

  toggleCouponActiveState(): void {
    this.couponForm.controls.active.setValue(
      !this.couponForm.controls.active.value
    );
  }

  async onSubmit(): Promise<void> {
    const coupon = this.couponForm.value
    if (!coupon.id) {
      const newId = coupon.name.split(' ').join('-');
      coupon.id = newId;
    }
    try {
      await this.couponService.saveCoupon(coupon)
      if (coupon.activeBanner) {
        await this.couponService.desactivateOtherBanners(coupon.id)
      }
      this.closeDialog()
    } catch (error) {
      this.dialogService.dialogAlerta(error);
    }
  }

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }
}
