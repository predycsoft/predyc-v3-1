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
import { Subscription, combineLatest, map, of, switchMap } from "rxjs";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";

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
  pageSize: number = 16;
  totalLength: number;

  enterprises: Enterprise[];

  constructor(
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    private router: Router,
    private userService: UserService,
    private enterpriseService: EnterpriseService,
    private subscriptionService: SubscriptionService,
    private productService: ProductService,

  ) {}

  ngOnInit() {
    this.enterpriseService.getAllEnterprises$().subscribe((enterprises) => {
      this.enterprises = enterprises;
    });

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        const page = Number(params["page"]) || 1;
        const searchTerm = params["search"] || "";
        const statusTerm = params["status"] || "";
        this.performSearch(searchTerm,statusTerm, page);
      }
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }
  productSubscription
  products
  performSearch(searchTerm: string, statusTerm:string, page: number) {
    let today = new Date()
    let todayTime = today.getTime()

    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }

    if (this.productSubscription) {
      this.productSubscription.unsubscribe();
    }


    this.productSubscription = this.productService.getProducts$().subscribe((products) => {
      this.products = products
      this.userServiceSubscription = this.userService.getAllUsers$(searchTerm).pipe(
        switchMap(users => {
          if (users.length === 0) return of([]); // Early exit if no users found
  
          // Fetch subscriptions for all users at once
          return this.subscriptionService.getSubscriptions$().pipe(
            map(subscriptions => {
              // Map each subscription to its user
              const userSubscriptionsMap = subscriptions.reduce((acc, sub) => {
                (acc[sub.userRef.id] = acc[sub.userRef.id] || []).push(sub);
                return acc;
              }, {});
  
              return users.map(user => ({
                user,
                subscriptions: userSubscriptionsMap[user.uid] || []
              }));
            })
          );
        })
      )
      .subscribe((response) => { // user with suscription data
        if (this.enterprises) {
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

              console.log('revisar licencias',activeSubscriptions,expiredSubscriptions,status,AllActiveSubs)
              let subscriptionWithLatestEndPeriod
              if(AllActiveSubs.length>0){
                AllActiveSubs.forEach(sub => {
                  sub.product = this.products.find(x=>x.id == sub.productRef.id)
                });
                subscriptionWithLatestEndPeriod = AllActiveSubs?.reduce((latest, current) => {
                  return latest.currentPeriodEnd > current.currentPeriodEnd ? latest : current;
                });
              
              }
              return {
                displayName: user.displayName,
                uid: user.uid,
                photoUrl: user.photoUrl,
                email: user.email,
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
            if(searchTerm){
              usersInList = usersInList.filter((x) => {
                return (
                  x.displayName
                    .toLocaleLowerCase()
                    .includes(searchTerm.toLocaleLowerCase()) ||
                  x.email
                    .toLocaleLowerCase()
                    .includes(searchTerm.toLocaleLowerCase())
                );
              })
            }

            console.log('statusTerm',statusTerm)
            if(statusTerm && statusTerm!='all') {
              let filter = 'x.statusId == statusTerm'

              if(statusTerm == 'active') {
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
      });




      });


  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: "merge",
    });
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription)
      this.queryParamsSubscription.unsubscribe();
    if (this.userServiceSubscription)
      this.userServiceSubscription.unsubscribe();
  }
}
