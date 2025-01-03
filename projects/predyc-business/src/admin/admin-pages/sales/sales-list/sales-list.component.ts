import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom } from 'rxjs';
import { chargeData } from 'projects/predyc-business/src/assets/data/charge.data';
import { Charge, ChargeJson } from 'projects/shared/models/charges.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { ChargeService } from 'projects/predyc-business/src/shared/services/charge.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

interface ChargeInList extends ChargeJson {
  productName: string
  customerName: string
  customerEmail: string
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
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
  ){}

  displayedColumns: string[] = [
    "amount",
    "status",
    "product",
    "description",
    "client",
    "startDate",
    "endDate",
    "payed",

  ];

  dataSource = new MatTableDataSource<ChargeInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  pageSize: number = 16
  totalLength: number
  
  combinedServicesSubscription: Subscription
  queryParamsSubscription: Subscription
  chargeSubscription: Subscription

  products: Product[]
  users: User[]
  enterprises: Enterprise[]

  ngOnInit() {

    this.combinedServicesSubscription = combineLatest(
      [ 
        this.productService.getProducts$(), 
        this.userService.getAllUsers$(),
        this.enterpriseService.getAllEnterprises$(),
      ]
    ).
    subscribe(([ products, users, enterprises]) => {
      this.products = products
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
        const productData = this.getProductData(charge.productRef.id)
        return {
          ... charge,
          productName: productData.name,
          customerName: this.getCustomerName(charge),
          customerEmail: this.getCustomerEmail(charge),
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

  getProductData(productId: string): Product {
    return this.products.find(product => product.id === productId)
  }

  getCustomerEmail(charge: Charge): string {
    const userData: User = this.users.find(user => user.uid === charge.customer.id)
    if (userData) return userData.email
    else return "Empresa"
  
  }

  getCustomerName(charge: Charge): string {
    const userData: User = this.users.find(user => user.uid === charge.customer.id)
    if (userData) return userData.displayName
    else {
      const enterpriseData: Enterprise = this.enterprises.find(enterprise => enterprise.id === charge.customer.id)
      return enterpriseData.name
    }
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

  // -------------------------------------
  // async createTestData() {
  //   // const prices = await firstValueFrom(this.priceService.getPrices$())
  //   const pricesRef = this.prices.map(price => { return this.priceService.getPriceRefById(price.id) } )

  //   const users = await firstValueFrom(this.userService.getAllUsers$())
  //   const usersRef = users.map(user=> { return this.userService.getUserRefById(user.uid) } )

  //   const enterprises = await firstValueFrom(this.enterpriseService.getAllEnterprises$())
  //   const enterprisesRef = enterprises.map(enterprise => { return this.enterpriseService.getEnterpriseRefById(enterprise.id) } )
    
  //   // const customerRefs = [...usersRef, ...enterprisesRef];
  //   const getRandomElement = (arr: any) => arr[Math.floor(Math.random() * arr.length)];

  //   for (let charge of chargeData ) {
  //     charge.price = getRandomElement(pricesRef);

  //     if (Math.random() > 0.5) charge.customer = getRandomElement(enterprisesRef)
  //     else charge.customer = getRandomElement(usersRef)

  //     await this.chargeService.saveCharge(charge as Charge)
  //   }
  //   console.log(`Finished Creating charges`)
  // }
  // -------------------------------------
}
