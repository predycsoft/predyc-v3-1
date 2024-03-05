import { Component, Input, ViewChild } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { Coupon } from 'projects/predyc-business/src/shared/models/coupon.model';
import { Price } from 'projects/predyc-business/src/shared/models/price.model';
import { Product } from 'projects/predyc-business/src/shared/models/product.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

interface SubscriptionInfo {
  productName: string
  coupon: Object
  status: string
  paymentMethod: string
  createdAt: string
  currentPeriodStart: string
  statusBasedComment: string
  // <span *ngIf="subscription.status != 'canceled'" class="ft11 gray-9">Próximo
//   cobro el {{subscription.currentPeriodEnd |
//   date:"dd/MM/yyyy"}} por ${{getNextInvoice(subscription).ammount}}</span>
// <span *ngIf="subscription.status == 'canceled'" class="ft11 gray-9">Cancelada el
//   {{subscription.endedAt | date:'dd/MM/yyyy'}}</span>
}

@Component({
  selector: 'app-student-subscription-list',
  templateUrl: './student-subscription-list.component.html',
  styleUrls: ['./student-subscription-list.component.css']
})
export class StudentSubscriptionListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private priceService: PriceService,
    private productService: ProductService,
    private couponService: CouponService,
  ){}

  displayedColumns: string[] = [
    "productName",
    "coupon",
    "status",
    "paymentMethod",
    "createdAt",
    "currentPeriodStart",
    "statusBasedComment",
    "actions"
  ];

  dataSource = new MatTableDataSource<SubscriptionInfo>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 4
  totalLength: number

  @Input() user: User
  userRef: DocumentReference<User>

  prices: Price[]
  products: Product[]
  coupons: Coupon[]

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  ngOnInit() {
    this.userRef = this.userService.getUserRefById(this.user.uid)
    this.combinedServicesSubscription = combineLatest(
      [
        this.productService.getProducts$(),
        this.priceService.getPrices$(), 
        this.couponService.getCoupons$(),
      ]
    ).subscribe(([products, prices, coupons]) => {
      this.prices = prices
      this.products = products
      this.coupons = coupons
      this.performSearch();
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch() {
    if (this.subscriptionsSubscription) {
      this.subscriptionsSubscription.unsubscribe()
    }
    this.subscriptionsSubscription = this.subscriptionService.getUserSubscriptions$(this.userRef).subscribe(subscriptions => {
      console.log("Subscriptions", subscriptions)
      const subscriptionsInfo: SubscriptionInfo[] = subscriptions.map(subscription => {
        const price = this.prices.find(p => p.id === subscription.priceRef.id);
        const product = this.products.find(prod => prod.id === price.product.id);
  
        return {
          productName: "prueba",
          coupon: "prueba",
          status: "prueba",
          paymentMethod: "prueba",
          createdAt: "prueba",
          currentPeriodStart: "prueba",
          statusBasedComment: "prueba",
          // userName: user ? user.displayName : "N/A",
          // userEmail: user ? user.email : "N/A",
          // productName: product ? product.name : "N/A",
          // origin: subscription.origin,
          // status: SubscriptionClass.statusToDisplayValueDict[subscription.status],
          // createdAt: subscription.createdAt,
          // currentPeriodStart: subscription.currentPeriodStart,
          // currentPeriodEnd: subscription.currentPeriodEnd,
          // priceId: price.id,
          // interval: subscription.interval,
          // couponId: price.coupon.id    
        };
      });
      
      this.dataSource.data = subscriptionsInfo;
      this.totalLength = subscriptionsInfo.length;
    });
  }

  // // ------- from predyc admin 
  // getNextInvoice(subscription: SubscriptionInList) {
  //   switch (subscription.origin.toLocaleLowerCase()) {
  //     case 'predyc':
  //       return {
  //         date: this.getPeriodEnd(subscription),
  //         ammount: this.getAmount(subscription),
  //       };
  //     case 'stripe':
  //       return {
  //         date: subscription.currentPeriodEnd,
  //         ammount: this.getAmount(subscription),
  //       };
  //     case 'paypal':
  //       return {
  //         date: subscription.currentPeriodEnd,
  //         ammount: this.getAmount(subscription),
  //       };
  //     default:
  //       return {
  //         date: subscription.currentPeriodEnd,
  //         ammount: this.getAmount(subscription),
  //       };
  //   }
  // }

  // getPeriodEnd(subscription: SubscriptionInList): number {
  //   const date = new Date(subscription.currentPeriodStart);
  //   let day = date.getDate();
  //   let month = date.getMonth();
  //   let year = date.getFullYear();
  //   const price = this.prices.find(p => p.id === subscription.priceId);
  //   let newDay = 0;
  //   let newMonth = 0;
  //   let newYear = 0;
  //   switch (price.interval) {
  //     case 'month':
  //       newDay = day;
  //       newMonth = month + subscription.interval;
  //       newYear = year;
  //       if (month + subscription.interval > 11) {
  //         newMonth = month + subscription.interval - 11;
  //         newYear = newYear + 1;
  //       }
  //       if (day > this.daysInMonth(newMonth + 1, newYear)) {
  //         newDay = this.daysInMonth(newMonth + 1, newYear);
  //       }
  //       return +new Date(newYear, newMonth, newDay);
  //     case 'year':
  //       newDay = day;
  //       newMonth = month;
  //       newYear = year + subscription.interval;
  //       return +new Date(newYear, newMonth, newDay);
  //     default:
  //       return +new Date(year, month, day);
  //   }
  // }

  // daysInMonth(month, year) {
  //   return new Date(year, month, 0).getDate();
  // }

  // getAmount(subscription: SubscriptionInList): number {
  //   const today = +new Date
  //   let price = this.prices.find(p => p.id === subscription.priceId);
  //   price = Price.fromJson(price);
    
  //   let coupons = [];
  //   if (subscription.couponId) {
  //     let coupon = this.coupons.find((x) => x.id == subscription.couponId);
  //     coupons = [coupon];
  //     switch (coupon.duration) {
  //       case 'once':
  //         return price.getTotalAmount([]);
  //       case 'repeating':
  //         return price.getTotalAmount([]);
  //       case 'forever':
  //         return price.getTotalAmount([coupon]);
  //       default:
  //         return price.getTotalAmount([]);
  //     }
  //   }
  //   return price.getTotalAmount([]);
  // }
  // // ------- 

  ngOnDestroy() {
    if (this.combinedServicesSubscription) this.combinedServicesSubscription.unsubscribe()
    if (this.subscriptionsSubscription) this.subscriptionsSubscription.unsubscribe()
  }

}
