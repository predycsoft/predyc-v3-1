import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ChargeService } from 'projects/predyc-business/src/shared/services/charge.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ChargeJson } from 'projects/shared/models/charges.model';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { Subscription } from 'rxjs/internal/Subscription';

interface ChargeInList extends ChargeJson {
  productName: string
  customerName: string
  customerEmail: string
}

@Component({
  selector: 'app-student-charge-list',
  templateUrl: './student-charge-list.component.html',
  styleUrls: ['./student-charge-list.component.css']
})
export class StudentChargeListComponent {

  constructor(
    private chargeService: ChargeService,
    public icon: IconService,
  ){}

  displayedColumns: string[] = [
    "amount",
    "via",
    "status",
    "product",
    "description",
    "createdAt",
    "origin",
    "refund",
  ];

  dataSource = new MatTableDataSource<ChargeInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Input() userRef: DocumentReference<User>
  @Input() user: User
  @Input() products: Product[]

  pageSize: number = 3
  totalLength: number
  
  combinedServicesSubscription: Subscription
  queryParamsSubscription: Subscription
  chargeSubscription: Subscription


  ngOnChanges(changes: SimpleChanges) {
    if (this.userRef && this.products) {
      // Check if prices or products have changed
      if (changes.products) {
        this.performSearch();
      }
    }
  }

  ngOnInit() {
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch() {
    this.chargeSubscription = this.chargeService.getChargesByCustomerRef$(this.userRef).subscribe(charges => {
      const chargesInList: ChargeInList[] = charges.map(charge => {
        const productData = this.getProductData(charge.productRef.id)
        return {
          ... charge,
          productName: productData.name,
          customerName: this.user.displayName,
          customerEmail: this.user.email,
          // payDate: this.getPayDate(charge)
        }
      })

      this.dataSource.data = chargesInList;
      this.totalLength = chargesInList.length;
    })
  }

  // onPageChange(page: number): void {
  //   this.router.navigate([], {
  //     queryParams: { page },
  //     queryParamsHandling: 'merge'
  //   });
  // }

  getProductData(productId: string): Product {
    const product = this.products.find(product => product.id === productId)
    return product
  }


  // getPayDate(item: Charge): number | null {
  //   if (item.payAt) return item.payAt;
  //   if (item.status === 'succeeded' && item.createdAt) return item.createdAt;
  //   return null;
  // }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

}
