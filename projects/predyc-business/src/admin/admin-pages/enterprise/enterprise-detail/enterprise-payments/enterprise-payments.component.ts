import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatTableDataSource } from '@angular/material/table';
import { ChargeJson, Charge } from 'projects/shared/models/charges.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Product } from 'projects/shared/models/product.model';
import { ChargeService } from 'projects/predyc-business/src/shared/services/charge.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
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
    private enterpriseService: EnterpriseService,
    public icon: IconService,
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

  products: Product[]

  ngOnInit() {
    this.enterpriseRef = this.enterpriseService.getEnterpriseRefById(this.enterprise.id)
    
    this.combinedServicesSubscription = combineLatest(
      [ 
        this.productService.getProducts$(), 
        this.chargeService.getChargesByCustomerRef$(this.enterpriseRef)
      ]
    ).
    subscribe(([ products, charges]) => {
      this.products = products

      const chargesInList: ChargeInList[] = charges.map(charge => {
        const productData = this.getProductData(charge.productRef.id)
        return {
          ... charge,
          productName: productData.name,
          payDate: this.getPayDate(charge)
        }
      })
      this.dataSource.data = chargesInList
    })
  }

  getProductData(productId: string): Product {
    return this.products.find(product => product.id === productId)
  }

  getPayDate(item: Charge): number | null {
    if (item.payAt) return item.payAt;
    if (item.status === 'succeeded' && item.createdAt) return item.createdAt;
    return null;
  }

  // getChargePrice(charge: ChargeInList): Price {
  //   return this.prices.find(price => price.id === charge.price.id)
  // }

  async openCreateChargeModal() {
    const dialogRef = this.dialog.open(DialogCreateChargeComponent, {
      data: {
        customerRef: this.enterpriseRef,
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
  
