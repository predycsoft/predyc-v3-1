import { Component, Input } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription, combineLatest } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { License } from 'src/shared/models/license.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { IconService } from 'src/shared/services/icon.service';
import { LicenseService } from 'src/shared/services/license.service';
import { Subscription as SubscriptionClass } from 'src/shared/models/subscription.model'
import { MatDialog } from '@angular/material/dialog';
import { DialogNewLicenseComponent } from './dialog-new-license/dialog-new-license.component';
import { DialogService } from 'src/shared/services/dialog.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Coupon } from 'src/shared/models/coupon.model';
import { Price } from 'src/shared/models/price.model';
import { Product } from 'src/shared/models/product.model';
import { CouponService } from 'src/shared/services/coupon.service';
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';


interface LicensesInList {
  productName: string,
  acquired: number,
  used: number,
  avaliable: number,
  valid: number,
  status: string,
}

@Component({
  selector: 'app-enterprise-students',
  templateUrl: './enterprise-students.component.html',
  styleUrls: ['./enterprise-students.component.css']
})
export class EnterpriseStudentsComponent {

  @Input() enterprise: Enterprise
  enterpriseRef: DocumentReference<Enterprise>
  constructor(
    public icon: IconService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private licenseService: LicenseService,
    private enteprriseService: EnterpriseService,
    private productService: ProductService,
    private priceService: PriceService,
    private couponService: CouponService,
  ){}

  displayedColumns: string[] = [
    "product",
    "rotations",
    "avaliable",
    "inUse",
    "expiration",
    "status",
    
  ];

  dataSource = new MatTableDataSource<LicensesInList>();

  products: Product[] = [];
  prices: Price[] = [];
  coupons: Coupon[] = [];

  licenseSubscription: Subscription
  combinedServicesSubscription: Subscription


  ngOnInit() {
    this.enterpriseRef = this.enteprriseService.getEnterpriseRefById(this.enterprise.id)

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
          status: SubscriptionClass.statusToDisplayValueDict[license.status]
        }
      })
      console.log("licensesInList", licensesInList)
      this.dataSource.data = licensesInList

    })

  }


  ngAfterViewInit() {
  }


  async onSelect() {

  }


  ngOnDestroy() {
    if (this.licenseSubscription) this.licenseSubscription.unsubscribe()
  }



  addAdmins() {

  }

  async addLicense() {
    const dialogRef = this.dialog.open(DialogNewLicenseComponent, {
      data: {
        coupons: this.coupons,
        prices: this.prices,
        products: this.products
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

  addUser(){

  }

}
