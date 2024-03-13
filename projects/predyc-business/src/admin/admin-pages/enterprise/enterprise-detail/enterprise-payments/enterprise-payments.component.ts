import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ChargeJson, Charge } from 'projects/shared/models/charges.model';
import { Coupon } from 'projects/shared/models/coupon.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Price } from 'projects/shared/models/price.model';
import { Product } from 'projects/shared/models/product.model';
import { ChargeService } from 'projects/predyc-business/src/shared/services/charge.service';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { Subscription, combineLatest } from 'rxjs';
import { DialogCreateChargeComponent } from '../../../../../shared/components/charges/dialog-create-charge/dialog-create-charge.component';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';

interface ChargeInList extends ChargeJson {
  productName: string
  payDate: number
}

@Component({
  selector: 'app-enterprise-payments',
  templateUrl: './enterprise-payments.component.html',
  styleUrls: ['./enterprise-payments.component.css']
})
export class EnterprisePaymentsComponent {

  @Input() enterprise: Enterprise
  enterpriseRef: DocumentReference<Enterprise>;

  constructor(
    private chargeService: ChargeService,
    private productService: ProductService,
    private couponService: CouponService,
    private enterpriseService: EnterpriseService,
    public icon: IconService,
    private priceService: PriceService,
    private dialog: MatDialog,
    public dialogService: DialogService,

  ){}

  displayedColumns: string[] = [
    "amount",
    "via",
    "status",
    "product",
    "quantity",
    "description",
    "createdAt",
    "payAt",
    "paymentMethod",
    "refund",
    "comment",
  ];

  dataSource = new MatTableDataSource<ChargeInList>();
  
  combinedServicesSubscription: Subscription

  prices: Price[]
  products: Product[]
  coupons: Coupon[]

  ngOnInit() {
    this.enterpriseRef = this.enterpriseService.getEnterpriseRefById(this.enterprise.id)
    
    this.combinedServicesSubscription = combineLatest(
      [ 
        this.priceService.getPrices$(), 
        this.productService.getProducts$(), 
        this.couponService.getCoupons$(),
        this.chargeService.getChargesByEnterpriseRef$(this.enterpriseRef)
      ]
    ).
    subscribe(([prices, products, coupons, charges]) => {
      this.prices = prices
      this.products = products
      this.coupons = coupons

      const chargesInList: ChargeInList[] = charges.map(charge => {
        const productData = this.getProductData(charge.price.id)
        return {
          ... charge,
          productName: productData.name,
          payDate: this.getPayDate(charge)
        }
      })
      this.dataSource.data = chargesInList
    })
  }

  getProductData(priceId: string): Product {
    const price = this.prices.find(price => price.id === priceId)
    return this.products.find(product => product.id === price.product.id)
  }

  getPayDate(item: Charge): number | null {
    if (item.payAt) return item.payAt;
    if (item.status === 'succeeded' && item.createdAt) return item.createdAt;
    return null;
  }

  getChargePrice(charge: ChargeInList): Price {
    return this.prices.find(price => price.id === charge.price.id)
  }

  async openCreateChargeModal() {
    const dialogRef = this.dialog.open(DialogCreateChargeComponent, {
      data: {
        customerRef: this.enterpriseRef,
        coupons: this.coupons,
        prices: this.prices,
        products: this.products,
      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: Charge) => {
      if (result) {
        try {
          console.log("result", result)
          await this.chargeService.saveCharge(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
          console.log(error)
        }
      }
    });

  }

  ngOnDestroy() {
    if (this.combinedServicesSubscription) this.combinedServicesSubscription.unsubscribe()
  }

}
  
