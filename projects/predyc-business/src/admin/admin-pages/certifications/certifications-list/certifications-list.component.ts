import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom, take } from 'rxjs';
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
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';



@Component({
  selector: 'app-certifications-list',
  templateUrl: './certifications-list.component.html',
  styleUrls: ['./certifications-list.component.css']
})
export class CertificationsListComponent {

  constructor(
    private router: Router,
    private chargeService: ChargeService,
    private productService: ProductService,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private activatedRoute: ActivatedRoute,
    private activityClassesService:ActivityClassesService,
    public icon: IconService,
  ){}

  displayedColumns: string[] = [
    "title",
    "questions",
    "status",
    "type",
    "actions"
  ];

  dataSource = new MatTableDataSource<any>();

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

    // this.combinedServicesSubscription = combineLatest(
    //   [ 
    //     this.productService.getProducts$(), 
    //     this.userService.getAllUsers$(),
    //     this.enterpriseService.getAllEnterprises$(),
    //   ]
    // ).
    // subscribe(([ products, users, enterprises]) => {
    //   // this.products = products
    //   // this.users = users
    //   // this.enterprises = enterprises
    //   this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
    //     const page = Number(params['page']) || 1;
    //     const searchTerm = params['search'] || '';
    //     this.performSearch(searchTerm, page);
    //   })
    // })

    this.chargeSubscription = this.activityClassesService.getActivityCertifications().pipe(take(1)).subscribe(charges => {

      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        this.performSearch(charges, searchTerm, page);
      })
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(charges: any, searchTerm: string, page: number) {
      // console.log('datos',charges)
      const filteredCharges = charges
      this.paginator.pageIndex = page - 1;
      console.log('data',filteredCharges)
      this.dataSource.data = filteredCharges
      this.totalLength = filteredCharges.length;
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getTypeName(activity){

    const subType = activity.subType

    if(subType == 'initTest'){
      return 'Diagnostico Inicial'
    }
    else if(activity.isPageTest){
      return 'Diagnóstico Web'
    }

    return 'Diplomado'

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

  async changeStatusPrev(activity){
    if(activity.status){
      if(activity.status == 'inactive'){
        activity.status = 'active'
      }
      else{
        activity.status = 'inactive'
      }
    }
    else{
      activity.status = 'inactive'
    }
    await this.activityClassesService.saveActivity(activity);
  }


}
