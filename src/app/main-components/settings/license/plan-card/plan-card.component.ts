import { Component } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon, CouponJson } from 'src/app/shared/models/coupon.model';
import { License } from 'src/app/shared/models/license.model';
import { Price, PriceJson } from 'src/app/shared/models/price.model';
import { Product, ProductJson } from 'src/app/shared/models/product.model';
import { CouponService } from 'src/app/shared/services/coupon.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LicenseService } from 'src/app/shared/services/license.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { PriceService } from 'src/app/shared/services/price.service';
import { ProductService } from 'src/app/shared/services/product.service';

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
        this.licenseService.getLicensesObservableByEnterpriseRef(enterpriseRef).subscribe(async licenses => {
          this.license = licenses[0]
          if (this.license) {
            this.price = await this.priceService.getPriceByRef(this.license.price as DocumentReference)
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
