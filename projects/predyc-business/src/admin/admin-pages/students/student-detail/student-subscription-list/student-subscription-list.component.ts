import { Component, Input, SimpleChanges, ViewChild } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Subscription } from 'rxjs';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { Subscription as SubscriptionClass, SubscriptionJson } from 'projects/shared/models/subscription.model'
import { MatDialog } from '@angular/material/dialog';
import { DialogEditSubscriptionComponent } from 'projects/predyc-business/src/shared/components/subscription/dialog-edit-subscription/dialog-edit-subscription.component';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { DatePipe } from '@angular/common';


export interface SubscriptionInfo extends SubscriptionJson {
  productName: string
  // statusToDisplay: string
  // statusBasedComment: string
  // <span *ngIf="subscription.status != 'canceled'" class="ft11 gray-9">Próximo
//   cobro el {{subscription.currentPeriodEnd |
//   date:"dd/MM/yyyy"}} por ${{getNextInvoice(subscription).ammount}}</span>
// <span *ngIf="subscription.status == 'canceled'" class="ft11 gray-9">Cancelada el
//   {{subscription.endedAt | date:'dd/MM/yyyy'}}</span>
}

@Component({
  selector: 'app-student-subscription-list',
  templateUrl: './student-subscription-list.component.html',
  styleUrls: ['./student-subscription-list.component.css'],
  providers: [DatePipe]
})
export class StudentSubscriptionListComponent {

  constructor(
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    public dialogService: DialogService,


  ){}

  displayedColumns: string[] = [
    "productName",
    "status",
    "createdAt",
    "currentPeriodStart",
    // "statusBasedComment",
    "actions"
  ];

  dataSource = new MatTableDataSource<SubscriptionInfo>();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  pageSize: number = 3
  totalLength: number

  @Input() userRef: DocumentReference<User>
  @Input() products: Product[]

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  ngOnInit() {
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
        const product = this.products.find(prod => prod.id === subscription.productRef.id);
  
        return {
          ...subscription,
          productName: product.name,
          statusToDisplay: SubscriptionClass.statusToDisplayValueDict[subscription.status],
          // statusBasedComment: this.getStatusBasedComment(subscription, price, coupon),
          // priceInterval: price.interval
        };
      });
      
      this.dataSource.data = subscriptionsInfo;
      this.totalLength = subscriptionsInfo.length;
    });
  }

  // getStatusBasedComment(subscription: SubscriptionClass, price: Price, coupon: Coupon): string {
  //   let formattedDate: string;
  //   if (subscription.status == "canceled") {
  //     formattedDate = this.datePipe.transform(subscription.endedAt, 'dd/MM/yyyy');
  //     return `Cancelada el ${formattedDate}`;
  //   } else {
  //     formattedDate = this.datePipe.transform(subscription.currentPeriodEnd, 'dd/MM/yyyy');
  //     return `Próximo cobro el ${formattedDate} por $${this.getAmount(price, coupon)}`;
  //   }
  // }
  

  // getAmount(price: Price, coupon: Coupon): number {
  //   let coupons = []
  //   price = Price.fromJson(price)
  //   if (coupon) {
  //     coupons = [coupon]
  //     switch (coupon.duration) {
  //       case "once":
  //         return price.getTotalAmount([])
  //       case "repeating":
  //         return price.getTotalAmount([])
  //       case "forever":
  //         return price.getTotalAmount([coupon])
  //       default:
  //         return price.getTotalAmount([])
  //     }
  //   }
  //   return price.getTotalAmount([])
  // }

  editSubscription(subscription: SubscriptionInfo) {
    const dialogRef = this.dialog.open(DialogEditSubscriptionComponent, {
      data: {
        subscription,
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
      createdAt: subscriptionInfo.createdAt,
      changedAt: subscriptionInfo.changedAt,
      startedAt: subscriptionInfo.startedAt,
      currency: subscriptionInfo.currency,
      currentPeriodStart: subscriptionInfo.currentPeriodStart,
      currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      userRef: subscriptionInfo.userRef,
      endedAt: subscriptionInfo.endedAt,
      canceledAt: subscriptionInfo.canceledAt,
      productRef: subscriptionInfo.productRef,
      status: subscriptionInfo.status,
      trialStartedAt: subscriptionInfo.trialStartedAt,
      trialEndedAt: subscriptionInfo.trialEndedAt,
      currentError: subscriptionInfo.currentError,
      interval: subscriptionInfo.interval,
      nextPaymentDate: subscriptionInfo.nextPaymentDate,
      nextPaymentAmount: subscriptionInfo.nextPaymentAmount,
      enterpriseRef: subscriptionInfo.enterpriseRef,
      licenseRef: subscriptionInfo.licenseRef
    };
  }

  ngOnDestroy() {
    if (this.combinedServicesSubscription) this.combinedServicesSubscription.unsubscribe()
    if (this.subscriptionsSubscription) this.subscriptionsSubscription.unsubscribe()
  }

}
