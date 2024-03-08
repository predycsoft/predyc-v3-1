import { Component } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon, CouponJson } from 'projects/shared/models/coupon.model';
import { License } from 'projects/shared/models/license.model';
import { Price, PriceJson } from 'projects/shared/models/price.model';
import { Product, ProductJson } from 'projects/shared/models/product.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { LicenseService } from 'projects/predyc-business/src/shared/services/license.service';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';

@Component({
  selector: 'app-plan-card',
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.css']
})
export class PlanCardComponent {
  constructor(
    private licenseService: LicenseService,
    private priceService: PriceService,
    private productService: ProductService,
    private couponService: CouponService,
    private enterpriseService: EnterpriseService,
    private afs: AngularFirestore,
    public loaderService: LoaderService,
    public icon: IconService,
  ) {}

  license: License
  price: Price
  coupon: Coupon
  product: Product

  async ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if (isLoaded) {
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        this.licenseService.getCurrentEnterpriseLicenses$().subscribe(async licenses => {
          this.license = licenses[0]
          if (this.license) {
            this.price = await this.priceService.getPriceByRef(this.license.priceRef as DocumentReference)
            this.product = await this.productService.getProductByRef(this.price.product as DocumentReference)
            this.coupon = this.price.coupon 
                          ? await this.couponService.getCouponByRef(this.price.coupon as DocumentReference)
                          : null
            this.loaderService.setLoading(false)
          }
        })
      }
    })
  }

}
