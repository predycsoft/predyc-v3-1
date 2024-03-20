import { Component, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model'
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { User } from 'projects/shared/models/user.model';
import { Product } from 'projects/shared/models/product.model';
import { MatPaginator } from '@angular/material/paginator';

interface SubscriptionInList {
  userName: string,
  userEmail: string,
  productName: string,
  status: string,
  createdAt: number,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  interval: number,
}

@Component({
  selector: 'app-subscriptions-list',
  templateUrl: './subscriptions-list.component.html',
  styleUrls: ['./subscriptions-list.component.css']
})
export class SubscriptionsListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private productService: ProductService,

  ){}

  displayedColumns: string[] = [
    'displayName',
    'email',
    'product',
    'status',
    'start',
    'nextPayment'
  ];

  dataSource = new MatTableDataSource<SubscriptionInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 4
  totalLength: number

  combinedServicesSubscription: Subscription
  subscriptionsSubscription: Subscription

  users: User[]
  products: Product[]

  ngOnInit() {
    this.combinedServicesSubscription = combineLatest(
      [
        this.userService.getAllUsers$(), 
        this.productService.getProducts$(),
      ]
    ).subscribe(([users, products]) => {
      this.users = users
      this.products = products
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['subscriptionPage']) || 1;
        const searchTerm = params['search'] || '';
        this.performSearch(searchTerm, page);
      })
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  debug(searchTerm=null, page=null) {
    console.log("DEBUG", {
      pageIndex: this.paginator.pageIndex,
      data: this.dataSource.data,
      totalLength: this.totalLength,
      searchTerm,
      page
    })
  }

  performSearch(searchTerm: string, page: number) {
    if (this.subscriptionsSubscription) {
      this.subscriptionsSubscription.unsubscribe()
    }
    this.subscriptionsSubscription = this.subscriptionService.getSubscriptions$().subscribe(subscriptions => {
      const subscriptionsInList: SubscriptionInList[] = subscriptions.map(subscription => {
        const user = this.users.find(u => u.uid === subscription.userRef.id);
        const product = this.products.find(prod => prod.id === subscription.productRef.id);
  
        return {
          userName: user ? user.displayName : "N/A",
          userEmail: user ? user.email : "N/A",
          productName: product ? product.name : "N/A",
          status: SubscriptionClass.statusToDisplayValueDict[subscription.status],
          createdAt: subscription.createdAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          interval: subscription.interval,
        };
      });
      
      // Filtering
      const filteredSubscriptions = searchTerm ? subscriptionsInList.filter(sub => sub.userName.toLowerCase().includes(searchTerm.toLowerCase())) : subscriptionsInList;
      // const slicedSubscriptions = filteredSubscriptions.slice(this.paginator.pageIndex * this.pageSize, (this.paginator.pageIndex + 1) * this.pageSize)
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = filteredSubscriptions;
      this.totalLength = filteredSubscriptions.length;
      // this.debug(searchTerm, page)
    });
  }

  // ------- from predyc admin 
  getNextInvoice(subscription: SubscriptionInList) {
    return {
      date: this.getPeriodEnd(subscription),
      ammount: this.getAmount(subscription),
    };
  }

  getPeriodEnd(subscription: SubscriptionInList): number {
    // const date = new Date(subscription.currentPeriodStart);
    // let day = date.getDate();
    // let month = date.getMonth();
    // let year = date.getFullYear();
    // const price = this.prices.find(p => p.id === subscription.priceId);
    // let newDay = 0;
    // let newMonth = 0;
    // let newYear = 0;
    // switch (price.interval) {
    //   case 'month':
    //     newDay = day;
    //     newMonth = month + subscription.interval;
    //     newYear = year;
    //     if (month + subscription.interval > 11) {
    //       newMonth = month + subscription.interval - 11;
    //       newYear = newYear + 1;
    //     }
    //     if (day > this.daysInMonth(newMonth + 1, newYear)) {
    //       newDay = this.daysInMonth(newMonth + 1, newYear);
    //     }
    //     return +new Date(newYear, newMonth, newDay);
    //   case 'year':
    //     newDay = day;
    //     newMonth = month;
    //     newYear = year + subscription.interval;
    //     return +new Date(newYear, newMonth, newDay);
    //   default:
    //     return +new Date(year, month, day);
    // }
    return 0
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  getAmount(subscription: SubscriptionInList): number {
    // let price = this.prices.find(p => p.id === subscription.priceId);
    // price = Price.fromJson(price);
    
    // let coupons = [];
    // if (subscription.couponId) {
    //   let coupon = this.coupons.find((x) => x.id == subscription.couponId);
    //   coupons = [coupon];
    //   switch (coupon.duration) {
    //     case 'once':
    //       return price.getTotalAmount([]);
    //     case 'repeating':
    //       return price.getTotalAmount([]);
    //     case 'forever':
    //       return price.getTotalAmount([coupon]);
    //     default:
    //       return price.getTotalAmount([]);
    //   }
    // }
    // return price.getTotalAmount([]);
    return 0
  }
  // ------- 

  onPageChange(subscriptionPage: number): void {
    this.router.navigate([], {
      queryParams: { subscriptionPage },
      queryParamsHandling: 'merge'
    });
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.subscriptionsSubscription) this.subscriptionsSubscription.unsubscribe()
  }

}