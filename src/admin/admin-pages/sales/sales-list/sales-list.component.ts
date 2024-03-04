import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { chargeData } from 'src/assets/data/charge.data';
import { Charge, ChargeJson } from 'src/shared/models/charges.model';
import { Coupon } from 'src/shared/models/coupon.model';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { Price } from 'src/shared/models/price.model';
import { Product } from 'src/shared/models/product.model';
import { User } from 'src/shared/models/user.model';
import { ChargeService } from 'src/shared/services/charge.service';
import { CouponService } from 'src/shared/services/coupon.service';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { IconService } from 'src/shared/services/icon.service';
import { PriceService } from 'src/shared/services/price.service';
import { ProductService } from 'src/shared/services/product.service';
import { UserService } from 'src/shared/services/user.service';

interface ChargeInList extends ChargeJson {
  productName: string
  customerName: string
  customerEmail: string
  payDate: number
}


@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css']
})
export class SalesListComponent {

  constructor(
    private router: Router,
    private chargeService: ChargeService,
    private productService: ProductService,
    private couponService: CouponService,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    public icon: IconService,

    private priceService: PriceService,
  ){}

  displayedColumns: string[] = [
    "amount",
    "origin",
    "status",
    "product",
    "description",
    "client",
    "createdAt",
    "payAt",
    "refund",
  ];

  dataSource = new MatTableDataSource<ChargeInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  pageSize: number = 8
  totalLength: number
  
  combinedServicesSubscription: Subscription
  queryParamsSubscription: Subscription
  chargeSubscription: Subscription

  prices: Price[]
  products: Product[]
  coupons: Coupon[]
  users: User[]
  enterprises: Enterprise[]

  ngOnInit() {

    this.combinedServicesSubscription = combineLatest(
      [ 
        this.priceService.getPrices$(), 
        this.productService.getProducts$(), 
        this.couponService.getCoupons$(),
        this.userService.getAllUsers$(),
        this.enterpriseService.getAllEnterprises$(),
      ]
    ).
    subscribe(([prices, products, coupons, users, enterprises]) => {
      this.prices = prices
      this.products = products
      this.coupons = coupons
      this.users = users
      this.enterprises = enterprises
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        this.performSearch(searchTerm, page);
      })
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm:string, page: number) {
    this.chargeSubscription = this.chargeService.getCharges$().subscribe(charges => {
      const chargesInList: ChargeInList[] = charges.map(charge => {
        const productData = this.getProductData(charge.price.id)
        return {
          ... charge,
          productName: productData.name,
          customerName: this.getCustomerName(charge, productData),
          customerEmail: this.getCustomerEmail(charge, productData),
          payDate: this.getPayDate(charge)
        }
      })

      const filteredCharges = searchTerm ? chargesInList.filter(sub => sub.customerName.toLowerCase().includes(searchTerm.toLowerCase())) : chargesInList;
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = filteredCharges
      this.totalLength = filteredCharges.length;
    })
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getProductData(priceId: string): Product {
    const price = this.prices.find(price => price.id === priceId)
    return this.products.find(product => product.id === price.product.id)
  }

  getCustomerEmail(charge: Charge, product: Product): string {
    if (product.isACompanyProduct) {
      const enterpriseData: Enterprise = this.enterprises.find(enterprise => enterprise.id === charge.customer.id)
      // return enterpriseData.email // it doesnt exists
      return "Empresa" // it doesnt exists
    }
    else {
      const userData: User = this.users.find(user => user.uid === charge.customer.id)
      return userData.email
    }
  }

  getCustomerName(charge: Charge, product: Product): string {
    if (product.isACompanyProduct) {
      const enterpriseData: Enterprise = this.enterprises.find(enterprise => enterprise.id === charge.customer.id)
      return enterpriseData.name
    }
    else {
      const userData: User = this.users.find(user => user.uid === charge.customer.id)
      return userData.displayName
    }
  }

  getPayDate(item: Charge): number | null {
    if (item.payAt) return item.payAt;
    if (item.status === 'succeeded' && item.createdAt) return item.createdAt;
    return null;
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

  // -------------------------------------
  async createTestData() {
    // const prices = await firstValueFrom(this.priceService.getPrices$())
    const pricesRef = this.prices.map(price => { return this.priceService.getPriceRefById(price.id) } )

    const users = await firstValueFrom(this.userService.getAllUsers$())
    const usersRef = users.map(user=> { return this.userService.getUserRefById(user.uid) } )

    const enterprises = await firstValueFrom(this.enterpriseService.getAllEnterprises$())
    const enterprisesRef = enterprises.map(enterprise => { return this.enterpriseService.getEnterpriseRefById(enterprise.id) } )
    
    // const customerRefs = [...usersRef, ...enterprisesRef];
    const getRandomElement = (arr: any) => arr[Math.floor(Math.random() * arr.length)];

    for (let charge of chargeData ) {
      charge.price = getRandomElement(pricesRef);

      const priceData = this.prices.find(price => price.id === charge.price.id)
      const productData = this.products.find(product => product.id === priceData.product.id)
      if (productData.isACompanyProduct) charge.customer = getRandomElement(enterprisesRef)
      else charge.customer = getRandomElement(usersRef)

      await this.chargeService.saveCharge(charge as Charge)
    }
    console.log(`Finished Creating charges`)
  }
  // -------------------------------------
}
