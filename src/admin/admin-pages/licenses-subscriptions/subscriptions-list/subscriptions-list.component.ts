import { Component, Input, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest } from 'rxjs';
import { SubscriptionService } from 'src/shared/services/subscription.service';
import { UserService } from 'src/shared/services/user.service';
import { Subscription as SubscriptionClass } from 'src/shared/models/subscription.model'
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';
import { User } from 'src/shared/models/user.model';
import { Product } from 'src/shared/models/product.model';
import { Price } from 'src/shared/models/price.model';
import { Coupon } from 'src/shared/models/coupon.model';
import { CouponService } from 'src/shared/services/coupon.service';
import { MatPaginator } from '@angular/material/paginator';

interface SubscriptionInList {
  userName: string,
  userEmail: string,
  productName: string,
  origin: string,
  status: string,
  createdAt: number,
  currentPeriodStart: number,
  currentPeriodEnd: number,
  priceId: string,
  interval: number,
  couponId: string,
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
    private priceService: PriceService,
    private productService: ProductService,
    private couponService: CouponService,

  ){}

  displayedColumns: string[] = [
    'displayName',
    'email',
    'origin',
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
  prices: Price[]
  products: Product[]
  coupons: Coupon[]

  ngOnInit() {
    this.combinedServicesSubscription = combineLatest(
      [
        this.userService.getAllUsers$(), 
        this.priceService.getPrices$(), 
        this.productService.getProducts$(),
        this.couponService.getCoupons$(),
      ]
    ).subscribe(([users, prices, products, coupons]) => {
      this.users = users
      this.prices = prices
      this.products = products
      this.coupons = coupons
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

  performSearch(searchTerm: string, page: number) {
    this.subscriptionService.getSubscriptions$().subscribe(subscriptions => {
      const subscriptionsInList: SubscriptionInList[] = subscriptions.map(subscription => {
        const user = this.users.find(u => u.uid === subscription.userRef.id);
        const price = this.prices.find(p => p.id === subscription.priceRef.id);
        const product = this.products.find(prod => prod.id === price.product.id);
  
        return {
          userName: user ? user.displayName : "N/A",
          userEmail: user ? user.email : "N/A",
          productName: product ? product.name : "N/A",
          origin: subscription.origin,
          status: SubscriptionClass.statusToDisplayValueDict[subscription.status],
          createdAt: subscription.createdAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          priceId: price.id,
          interval: subscription.interval,
          couponId: price.coupon.id
          
        };
      });
      
      // Filtering
      const filteredSubscriptions = searchTerm ? subscriptionsInList.filter(sub => sub.userName.toLowerCase().includes(searchTerm.toLowerCase())) : subscriptionsInList;
  
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = filteredSubscriptions.slice(this.paginator.pageIndex * this.pageSize, (this.paginator.pageIndex + 1) * this.pageSize);
      this.totalLength = filteredSubscriptions.length;
    });
  }

  // ------- from predyc admin 
  getNextInvoice(subscription: SubscriptionInList) {
    switch (subscription.origin.toLocaleLowerCase()) {
      case 'predyc':
        return {
          date: this.getPeriodEnd(subscription),
          ammount: this.getAmount(subscription),
        };
      case 'stripe':
        return {
          date: subscription.currentPeriodEnd,
          ammount: this.getAmount(subscription),
        };
      case 'paypal':
        return {
          date: subscription.currentPeriodEnd,
          ammount: this.getAmount(subscription),
        };
      default:
        return {
          date: subscription.currentPeriodEnd,
          ammount: this.getAmount(subscription),
        };
    }
  }

  getPeriodEnd(subscription: SubscriptionInList): number {
    const date = new Date(subscription.currentPeriodStart);
    let day = date.getDate();
    let month = date.getMonth();
    let year = date.getFullYear();
    const price = this.prices.find(p => p.id === subscription.priceId);
    let newDay = 0;
    let newMonth = 0;
    let newYear = 0;
    switch (price.interval) {
      case 'month':
        newDay = day;
        newMonth = month + subscription.interval;
        newYear = year;
        if (month + subscription.interval > 11) {
          newMonth = month + subscription.interval - 11;
          newYear = newYear + 1;
        }
        if (day > this.daysInMonth(newMonth + 1, newYear)) {
          newDay = this.daysInMonth(newMonth + 1, newYear);
        }
        return +new Date(newYear, newMonth, newDay);
      case 'year':
        newDay = day;
        newMonth = month;
        newYear = year + subscription.interval;
        return +new Date(newYear, newMonth, newDay);
      default:
        return +new Date(year, month, day);
    }
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  getAmount(subscription: SubscriptionInList): number {
    const today = +new Date
    let price = this.prices.find(p => p.id === subscription.priceId);
    price = Price.fromJson(price);
    
    let coupons = [];
    if (subscription.couponId) {
      let coupon = this.coupons.find((x) => x.id == subscription.couponId);
      coupons = [coupon];
      switch (coupon.duration) {
        case 'once':
          return price.getTotalAmount([]);
        case 'repeating':
          return price.getTotalAmount([]);
        case 'forever':
          return price.getTotalAmount([coupon]);
        default:
          return price.getTotalAmount([]);
      }
    }
    return price.getTotalAmount([]);
  }
  // ------- 

  onPageChange(subscriptionPage: number): void {
    this.router.navigate([], {
      queryParams: { subscriptionPage },
      queryParamsHandling: 'merge'
    });
  }

  onSelect(subscription) {

  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

}