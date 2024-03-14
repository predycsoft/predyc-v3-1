import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { Coupon } from 'projects/shared/models/coupon.model';
import { Price } from 'projects/shared/models/price.model';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Subscription as SubscriptionClass, SubscriptionJson } from 'projects/shared/models/subscription.model'
import { MatDialog } from '@angular/material/dialog';
import { DialogEditSubscriptionComponent } from 'projects/predyc-business/src/shared/components/subscription/dialog-edit-subscription/dialog-edit-subscription.component';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';


export interface SubscriptionInfo extends SubscriptionJson {
  productName: string
  couponName: Object
  statusToDisplay: string
  statusBasedComment: string
  priceInterval: string,
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
    private dialog: MatDialog,
    public dialogService: DialogService,

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

  pageSize: number = 3
  totalLength: number

  @Input() user: User
  @Input() prices: Price[]
  @Input() products: Product[]
  @Input() coupons: Coupon[]
  userRef: DocumentReference<User>

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  ngOnInit() {
    this.userRef = this.userService.getUserRefById(this.user.uid)
    this.performSearch();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.userRef) {
      // Check if prices, products, or coupons have changed
      if (changes.prices || changes.products || changes.coupons) {
        this.performSearch();
      }
    }
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
      // console.log("Subscriptions", subscriptions)
      const subscriptionsInfo: SubscriptionInfo[] = subscriptions.map(subscription => {
        const price = this.prices.find(p => p.id === subscription.priceRef.id);
        const product = this.products.find(prod => prod.id === price.product.id);
        const coupon = subscription.couponRef ? this.coupons.find(coup => coup.id === subscription.couponRef.id) : null;
  
        return {
          ...subscription,
          productName: product.name,
          couponName: coupon ? coupon.name : null,
          statusToDisplay: SubscriptionClass.statusToDisplayValueDict[subscription.status],
          statusBasedComment: "prueba",
          priceInterval: price.interval
        };
      });
      
      this.dataSource.data = subscriptionsInfo;
      this.totalLength = subscriptionsInfo.length;
    });
  }

  editSubscription(subscription: SubscriptionInfo) {
    const dialogRef = this.dialog.open(DialogEditSubscriptionComponent, {
      data: {
        subscription,
        prices: this.prices
      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: SubscriptionInfo) => {
      if (result) {
        try {
          const editedSubscription: SubscriptionJson = this.subscriptionInfotoJson(result)
          console.log("editedsubscription", editedSubscription);
          await this.subscriptionService.saveSubscription(editedSubscription);
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
        }
      }
    });
    
  }
  deleteSubscription(subscription) {
    
  }

  subscriptionInfotoJson(subscriptionInfo: SubscriptionInfo): SubscriptionJson {
    return {
      id: subscriptionInfo.id,
      idAtOrigin: subscriptionInfo.idAtOrigin,
      origin: subscriptionInfo.origin,
      createdAt: subscriptionInfo.createdAt,
      createdAtOrigin: subscriptionInfo.createdAtOrigin,
      changedAt: subscriptionInfo.changedAt,
      startedAt: subscriptionInfo.startedAt,
      currency: subscriptionInfo.currency,
      currentPeriodStart: subscriptionInfo.currentPeriodStart,
      currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      customer: subscriptionInfo.customer,
      userRef: subscriptionInfo.userRef,
      endedAt: subscriptionInfo.endedAt,
      canceledAt: subscriptionInfo.canceledAt,
      priceRef: subscriptionInfo.priceRef,
      status: subscriptionInfo.status,
      trialStartedAt: subscriptionInfo.trialStartedAt,
      trialEndedAt: subscriptionInfo.trialEndedAt,
      currentError: subscriptionInfo.currentError,
      interval: subscriptionInfo.interval,
      couponRef: subscriptionInfo.couponRef,
      nextPaymentDate: subscriptionInfo.nextPaymentDate,
      nextPaymentAmount: subscriptionInfo.nextPaymentAmount,
      enterpriseRef: subscriptionInfo.enterpriseRef,
      licenseRef: subscriptionInfo.licenseRef
    };
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
