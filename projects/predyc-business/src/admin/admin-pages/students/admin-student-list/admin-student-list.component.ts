import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription, combineLatest, firstValueFrom, map, of, switchMap, take } from "rxjs";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { User } from "projects/shared/models/user.model";

interface UserInList {
  displayName: string;
  uid: string;
  photoUrl: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  enterprise: string;
  phoneNumber: string;
  statusId:string;
  fechaVencimiento:number;
  productName:string
}

@Component({
  selector: "app-admin-student-list",
  templateUrl: "./admin-student-list.component.html",
  styleUrls: ["./admin-student-list.component.css"],
})
export class AdminStudentListComponent {
  displayedColumns: string[] = [
    "displayName",
    // 'email',
    "createdAt",
    "updatedAt",
    "userType",
    "enterprise",
    "phoneNumber",
    "fechaVencimiento",
    "productName",
    "status",
  ];

  dataSource = new MatTableDataSource<UserInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true;
  @Output() onStudentSelected = new EventEmitter<UserInList>();
  @Output() totalUsers = new EventEmitter<any>();

  queryParamsSubscription: Subscription;
  userServiceSubscription: Subscription;
  combinedSubscription: Subscription;
  pageSize: number = 16;
  totalLength: number;

  enterprises: Enterprise[];

  productSubscription
  products
  
  constructor(
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    private router: Router,
    private userService: UserService,
    private enterpriseService: EnterpriseService,
    private subscriptionService: SubscriptionService,
    private productService: ProductService,

  ) {}

  async ngOnInit() {
    const enterprises = await firstValueFrom(this.enterpriseService.getAllEnterprises$())
    this.enterprises = enterprises;

    const products = await firstValueFrom(this.productService.getProducts$())
    this.products = products

    this.combinedSubscription = combineLatest([
      this.userService.getAllUsers$(),
      this.subscriptionService.getSubscriptions$()
    ]).pipe(take(1))
    .subscribe(([users, subscriptions]) => {
      // console.log("users", users)
      // console.log("subscriptions", subscriptions)
      // Map each subscription to its user
      const userSubscriptionsMap = subscriptions.reduce((acc, sub) => {
        (acc[sub.userRef.id] = acc[sub.userRef.id] || []).push(sub);
        return acc;
      }, {});

      const response: any = users.map(user => ({
        user,
        subscriptions: userSubscriptionsMap[user.uid] || []
      }));
  
      let today = new Date()
      let todayTime = today.getTime()
  
      let usersInList: UserInList[] = response
      .map(({ user, subscriptions }) => {
        const enterprise = this.enterprises.find(
          (enterprise) => enterprise.id === user.enterprise?.id
        );
        let activeSubscriptions = subscriptions.filter(
          (x) => x.status === SubscriptionClass.STATUS_ACTIVE && x.currentPeriodEnd >= todayTime
        );
        let expiredSubscriptions = subscriptions.filter(
          (x) => x.status === SubscriptionClass.STATUS_ACTIVE && x.currentPeriodEnd < todayTime
        );
        let status
  
        if(!activeSubscriptions || activeSubscriptions.length==0){
          activeSubscriptions = []
        }
        if(!expiredSubscriptions || expiredSubscriptions.length==0){
          expiredSubscriptions = []
        }
  
        let AllActiveSubs = [...activeSubscriptions,...expiredSubscriptions]
  
        if((activeSubscriptions.length > 0 && expiredSubscriptions.length == 0) || (activeSubscriptions.length >0 && expiredSubscriptions.length > 0)){
          status = SubscriptionClass.STATUS_ACTIVE
        }
        else if (activeSubscriptions.length == 0 && expiredSubscriptions.length > 0){
          status = SubscriptionClass.STATUS_EXPIRED
        }
        else {
          status = SubscriptionClass.STATUS_INACTIVE
        }
  
        // console.log('revisar licencias',activeSubscriptions,expiredSubscriptions,status,AllActiveSubs)
        let subscriptionWithLatestEndPeriod
        if( AllActiveSubs.length > 0) {
          AllActiveSubs.forEach(sub => {
            sub.product = this.products.find(x=>x.id == sub.productRef.id)
          });
          subscriptionWithLatestEndPeriod = AllActiveSubs?.reduce((latest, current) => {
            return latest.currentPeriodEnd > current.currentPeriodEnd ? latest : current;
          });
        
        }
        if (user.createdAt?.seconds) {
          user.createdAt = user.createdAt.seconds*1000
        }
        if (user.updatedAt?.seconds) {
          user.updatedAt = user.updatedAt.seconds*1000
        }
        return {
          displayName: user.displayName,
          uid: user.uid,
          photoUrl: user.photoUrl,
          email: user.email,
          role:user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          phoneNumber: user.phoneNumber,
          enterprise: enterprise ? enterprise.name : null,
          status: SubscriptionClass.statusToDisplayValueDict[status],
          statusId: status,
          fechaVencimiento:subscriptionWithLatestEndPeriod?.currentPeriodEnd?subscriptionWithLatestEndPeriod.currentPeriodEnd:null,
          productName:subscriptionWithLatestEndPeriod?.product.name?subscriptionWithLatestEndPeriod?.product.name:'N/A',
        };
      })
      this.totalUsers.emit(usersInList);
  
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
        const page = Number(params["page"]) || 1;
        const searchTerm = params["search"] || "";
        const statusTerm = params["status"] || "";
        this.performSearch(searchTerm,statusTerm, page, usersInList);
      });
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }
  
  performSearch(searchTerm: string, statusTerm:string, page: number, usersInList: UserInList[]) {
    if (searchTerm) {
      usersInList = usersInList.filter((x) => {
        return (
          x.displayName.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
          x.email.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase())
        );
      })
    }

    // console.log('statusTerm',statusTerm)
    if (statusTerm && statusTerm!='all') {
      let filter = 'x.statusId == statusTerm'

      if (statusTerm == 'active') {
        filter = filter+" || x.statusId == 'expired'"
      }

      usersInList = usersInList.filter((x) => {
        if (statusTerm === 'particular') {
          return !x.enterprise;
        } else if (statusTerm === 'enterprise') {
          return x.enterprise;
        } else {
          return eval(filter);
        }
      })
      
    }
    this.paginator.pageIndex = page - 1;
    this.dataSource.data = usersInList;
    this.totalLength = usersInList.length;
  }


  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: "merge",
    });
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe();
    if (this.combinedSubscription) this.combinedSubscription.unsubscribe();
  }
}
