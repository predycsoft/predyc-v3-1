import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest } from 'rxjs';
import { Coupon } from 'projects/shared/models/coupon.model';
import { License } from 'projects/shared/models/license.model';
import { Price } from 'projects/shared/models/price.model';
import { Product } from 'projects/shared/models/product.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { LicenseService } from 'projects/predyc-business/src/shared/services/license.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { DialogNewLicenseComponent } from '../dialog-new-license/dialog-new-license.component';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model'
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';


interface LicensesInList {
  productName: string,
  acquired: number,
  used: number,
  avaliable: number,
  avaliableRotations: number
  start: number
  valid: number,
  status: string,
  rotations: number
  rotationsUsed: number

}

@Component({
  selector: 'app-enterprise-licenses-list',
  templateUrl: './enterprise-licenses-list.component.html',
  styleUrls: ['./enterprise-licenses-list.component.css']
})
export class EnterpriseLicensesListComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>

  constructor(
    private dialog: MatDialog,
    private licenseService: LicenseService,
    private productService: ProductService,
    private priceService: PriceService,
    private couponService: CouponService,
    public dialogService: DialogService,
  ) {}

  displayedColumns: string[] = [
    "product",
    "acquired",
    "rotations",
    "avaliable",
    "avaliableRotations",
    "inUse",
    "rotationsUsed",
  ];

  dataSource = new MatTableDataSource<LicensesInList>();

  products: Product[] = [];
  prices: Price[] = [];
  coupons: Coupon[] = [];

  licenseSubscription: Subscription
  combinedServicesSubscription: Subscription


  ngOnInit() {
    this.combinedServicesSubscription = combineLatest(
      [
        this.priceService.getPrices$(), 
        this.productService.getProducts$(),
        this.couponService.getCoupons$(),
        this.licenseService.getLicensesByEnterpriseRef$(this.enterpriseRef),
      ]
    ).subscribe(([prices, products, coupons, licenses]) => {
      this.prices = prices
      this.products = products
      this.coupons = coupons

      const licensesInList: LicensesInList[] = licenses.map(license => {
        const licensePrice = prices.find(price => price.id === license.priceRef.id)
        const licenseProduct = products.find(product => product.id === licensePrice.product.id)
        return {
          productName: licenseProduct.name,
          acquired: license.quantity,
          used: license.quantityUsed,
          avaliable: license.quantity - license.quantityUsed,
          valid: license.currentPeriodEnd,
          rotations: license.rotations,
          rotationsUsed: license.rotationsUsed,
          avaliableRotations: license.rotations - license.rotationsUsed,
          start: license.currentPeriodStart,
          status: SubscriptionClass.statusToDisplayValueDict[license.status]
        }
      })
      console.log("licensesInList", licensesInList)
      this.dataSource.data = licensesInList

    })
  }


  async addLicense() {
    let licences =this.dataSource.data
    let licenceActive = licences.find(x=> x.status == "Activo")

    let dateStart = null

    if(licenceActive){
      dateStart = licenceActive.start
    }

    const dialogRef = this.dialog.open(DialogNewLicenseComponent, {
      data: {
        coupons: this.coupons,
        prices: this.prices,
        products: this.products,
        dateStart: dateStart
      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: License) => {
      if (result) {
        result.enterpriseRef = this.enterpriseRef;
        try {
          await this.licenseService.saveLicense(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
        }
      }
    });

  }


  ngOnDestroy() {
    if (this.licenseSubscription) this.licenseSubscription.unsubscribe()
  }


}
