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
import { Subscription as SubscriptionClass } from "shared";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";

interface UserInList {
  displayName: string;
  uid: string;
  photoUrl: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  enterprise: string;
  phoneNumber: string;
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
    "status",
  ];

  dataSource = new MatTableDataSource<UserInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true;
  @Output() onStudentSelected = new EventEmitter<UserInList>();

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
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit() {
    this.enterpriseService.getAllEnterprises$().subscribe((enterprises) => {
      this.enterprises = enterprises;
    });

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        const page = Number(params["page"]) || 1;
        const searchTerm = params["search"] || "";
        this.performSearch(searchTerm, page);
      }
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm: string, page: number) {
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
    this.userServiceSubscription = this.userService
      .getAllUsers$(searchTerm)
      .pipe(
        switchMap((users) => {
          // For each user, query their active courses
          const observables = users.map((user) => {
            const userRef = this.userService.getUserRefById(user.uid);
            return this.subscriptionService
              .getUserSubscriptions$(userRef)
              .pipe(map((subscriptions) => ({ user, subscriptions })));
          });
          return observables.length > 0 ? combineLatest(observables) : of([]);
        })
      )
      .subscribe((response) => {
        if (this.enterprises) {
          const usersInList: UserInList[] = response.map(
            ({ user, subscriptions }) => {
              const enterprise = this.enterprises.find(
                (enterprise) => enterprise.id === user.enterprise?.id
              );
              const activeSubscriptions = subscriptions.filter(
                (x) => x.status === SubscriptionClass.STATUS_ACTIVE
              );

              const status =
                activeSubscriptions.length > 0
                  ? SubscriptionClass.STATUS_ACTIVE
                  : SubscriptionClass.STATUS_CANCELED;

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
              };
            }
          );
          // console.log("usersInList", usersInList)
          this.paginator.pageIndex = page - 1;
          this.dataSource.data = usersInList;
          this.totalLength = usersInList.length;
        }
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
