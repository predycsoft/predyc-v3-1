import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, map, of, switchMap } from 'rxjs';
import { SubscriptionService } from 'src/shared/services/subscription.service';
import { UserService } from 'src/shared/services/user.service';
import { Subscription as SubscriptionClass } from 'src/shared/models/subscription.model'
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';


@Component({
  selector: 'app-license-subscription-list',
  templateUrl: './license-subscription-list.component.html',
  styleUrls: ['./license-subscription-list.component.css']
})
export class LicenseSubscriptionListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private priceService: PriceService,
    private productService: ProductService,

  ){}

  displayedColumns: string[] = [
    'displayName',
    'email',
    'origin',
    'product',
    'status',
    'start',
  ];

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 8
  totalLength: number

  combinedServicesSubscription: Subscription

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      const searchTerm = params['search'] || '';
      this.performSearch(searchTerm, page);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  // ----------- WITHOUT PRODUCT INFO
  // performSearch(searchTerm: string, page: number) {
  //   this.combinedServicesSubscription = combineLatest([
  //     this.userService.getAllUsers$(searchTerm),
  //     this.subscriptionService.getSubscriptions$()
  //   ]).pipe(
  //     map(([users, subscriptions]) => {
  //       return users.map(user => {
  //         const userSubscriptions = subscriptions.filter(subscription => subscription.userRef.id === user.uid);
  //         const sortedUserSubscriptions = userSubscriptions.sort((a, b) => b.createdAt - a.createdAt);
  //         // Get the most recent one
  //         const recentSubscription = sortedUserSubscriptions.length > 0 ? sortedUserSubscriptions[0] : null;
  
  //         return {
  //           origin: recentSubscription ? recentSubscription.origin : "N/A",
  //           product: null, // Asumiendo que necesitas otra lógica para determinar esto
  //           status: recentSubscription ? SubscriptionClass.statusToDisplayValueDict[recentSubscription.status] : "N/A",
  //           createdAt: recentSubscription ? recentSubscription.createdAt : "N/A",
  //           userName: user.displayName,
  //           userEmail: user.email,
  //         };
  //       });
  //     })
  //   ).subscribe(usersInList => {
  //     console.log("usersInList", usersInList)
  //     this.paginator.pageIndex = page - 1;
  //     this.dataSource.data = usersInList;
  //     this.totalLength = usersInList.length;
  //   });
  // }
  // ----------

  performSearch(searchTerm: string, page: number) {
    this.combinedServicesSubscription = combineLatest([
      this.userService.getAllUsers$(searchTerm),
      this.subscriptionService.getSubscriptions$()
    ]).pipe(
      switchMap(([users, subscriptions]) => {
        const userWithSubs = users.map(user => {
          const userSubscriptions = subscriptions.filter(sub => sub.userRef.id === user.uid).sort((a, b) => b.createdAt - a.createdAt);
          const recentSubscription = userSubscriptions.length > 0 ? userSubscriptions[0] : null;
          if (!recentSubscription) {
            return of({
              origin: null,
              product: null,
              status: null,
              createdAt: null,
              userName: user.displayName,
              userEmail: user.email,
            });
          }
          else {
            // Get the price in order to get the product
            return this.priceService.getPriceById$(recentSubscription.priceRef.id).pipe(
              switchMap(price => {
                return this.productService.getProductById$(price.product.id).pipe(
                  map(product => ({
                    ...recentSubscription,
                    productName: product.name,
                  }))
                );
              }),
              map(subscription => ({
                origin: subscription.origin,
                product: subscription.productName,
                status: SubscriptionClass.statusToDisplayValueDict[recentSubscription.status],
                createdAt: subscription.createdAt,
                userName: user.displayName,
                userEmail: user.email,
              }))
            );
          }
        });

        return combineLatest(userWithSubs)
      })
    ).subscribe(usersInList => {
      console.log("usersInList", usersInList);
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = usersInList;
      this.totalLength = usersInList.length;
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  onSelect(subscription) {

  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

}
