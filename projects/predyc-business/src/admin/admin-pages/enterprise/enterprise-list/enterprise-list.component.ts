import { Component, ViewChild } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, Subscription, combineLatest, map, of, switchMap } from "rxjs";
import { License } from "projects/shared/models/license.model";
import { User } from "projects/shared/models/user.model";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { Product } from "projects/shared";

interface EnterpriseInfo {
  name: string;
  photoUrl: string;
  userQty: number;
  totalLicenses: number;
  availableLicenses: number;
  availableRotations: number;
  rotacionWarningCount: number;
  expirationDate: Date;
}

@Component({
  selector: "app-enterprise-list",
  templateUrl: "./enterprise-list.component.html",
  styleUrls: ["./enterprise-list.component.css"],
})
export class EnterpriseListComponent {
  SubscriptionClass = SubscriptionClass;

  displayedColumns: string[] = [
    "name",
    "userQty",
    "availableLicenses",
    "inUseLicenses",
    "rotations",
    "expirationDate",
    "product",
    "status",
  ];

  dataSource = new MatTableDataSource<EnterpriseInfo>();
  pageSize: number = 16;
  totalLength: number;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  queryParamsSubscription: Subscription;
  enterpriseSubscription: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private productService: ProductService,
    private router: Router
  ) {}

  public status: string;
  private statusFilterTerm = new Subject<string>();

  search(status: string) {
    this.status = status;
    this.statusFilterTerm.next(status);
  }

  products: Product[];

  ngOnInit() {
    this.productService.getProducts$().subscribe((products) => {
      this.products = products;
    });
    this.status = this.activatedRoute.snapshot.queryParams["status"] || "all";
    this.statusFilterTerm.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { status: term ? term : null, page: 1 },
        queryParamsHandling: "merge",
      });
    });
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(
      (params) => {
        const page = Number(params["page"]) || 1;
        const statusFilterTerm = params["status"] || "all";
        this.performSearch(statusFilterTerm, page);
      }
    );
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: "merge",
    });
  }

  performSearch(statusFilterTerm: string, page: number) {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe();
    this.enterpriseSubscription = this.enterpriseService
      .getEnterprises$()
      .pipe(
        // Users Qty
        switchMap((enterprises) => {
          // For each enterprise, query their active students
          const observables = enterprises.map((enterprise) => {
            const enterpriseRef = this.enterpriseService.getEnterpriseRefById(
              enterprise.id
            );
            return this.afs
              .collection<User>(User.collection, (ref) =>
                ref.where("enterprise", "==", enterpriseRef)
              )
              .valueChanges()
              .pipe(map((users) => ({ enterprise, userQty: users.length })));
          });
          return observables.length > 0 ? combineLatest(observables) : of([]);
        }),
        // License Information
        switchMap((enterprisesInfo) => {
          const observables = enterprisesInfo.map((enterpriseInfo) => {
            const enterpriseRef = this.enterpriseService.getEnterpriseRefById(
              enterpriseInfo.enterprise.id
            );
            return this.afs
              .collection<License>(License.collection, (ref) =>
                ref
                  .where("enterpriseRef", "==", enterpriseRef)
                  .orderBy("createdAt", "desc")
              )
              .valueChanges()
              .pipe(
                map((licenses) => {
                  let totalLicenses = 0;
                  let rotationsWaitingCount = 0;
                  let availableLicenses = 0;
                  let availableRotations = 0;
                  let rotacionWarningCount = 0;
                  let expirationDate = null;
                  licenses.forEach((license) => {
                    if (license.status !== "active") return;
                    totalLicenses += license.quantity;
                    rotationsWaitingCount += license.rotationsWaitingCount;
                    availableLicenses +=
                      license.quantity - license.quantityUsed;
                    availableRotations +=
                      license.rotations - license.rotationsUsed;
                    rotacionWarningCount += license.failedRotationCount;
                    if (
                      !expirationDate ||
                      expirationDate < license.currentPeriodEnd
                    )
                      expirationDate = license.currentPeriodEnd;
                  });
                  return {
                    ...enterpriseInfo,
                    rotationsWaitingCount,
                    totalLicenses,
                    availableLicenses,
                    availableRotations,
                    expirationDate,
                    rotacionWarningCount,
                    licenses,
                  };
                })
              );
          });
          return observables.length > 0 ? combineLatest(observables) : of([]);
        })
      )
      .subscribe((response) => {
        console.log(response);

        const enterprises: EnterpriseInfo[] = response
          .map((enterpriseInfo) => {
            const licenses = enterpriseInfo.licenses.sort(
              (a, b) => b.currentPeriodEnd - a.currentPeriodEnd
            );
            const product =
              licenses.length > 0
                ? this.products.find((x) => x.id === licenses[0].productRef.id)
                : null;
            if (
              enterpriseInfo.licenses.filter((x) => {
                const today = +new Date();
                return (
                  x.status === SubscriptionClass.STATUS_ACTIVE &&
                  x.currentPeriodEnd < today
                );
              }).length > 0
            )
              this.atLeastOneExpired = true;
            return {
              name: enterpriseInfo.enterprise.name,
              photoUrl: enterpriseInfo.enterprise.photoUrl,
              userQty: enterpriseInfo.userQty,
              totalLicenses: enterpriseInfo.totalLicenses,
              availableLicenses: enterpriseInfo.availableLicenses,
              availableRotations: enterpriseInfo.availableRotations,
              rotacionWarningCount: enterpriseInfo.rotacionWarningCount,
              expirationDate: enterpriseInfo.expirationDate,
              id: enterpriseInfo.enterprise.id,
              status:
                enterpriseInfo.licenses.filter(
                  (x) => x.status === SubscriptionClass.STATUS_ACTIVE
                ).length > 0
                  ? SubscriptionClass.STATUS_ACTIVE
                  : SubscriptionClass.STATUS_INACTIVE,
              showWarning:
                enterpriseInfo.licenses.filter((x) => {
                  const today = +new Date();
                  return (
                    x.status === SubscriptionClass.STATUS_ACTIVE &&
                    x.currentPeriodEnd < today
                  );
                }).length > 0,
              product: product ? product.name : "N/A",
            };
          })
          .filter((x) => {
            if (!statusFilterTerm || statusFilterTerm === "all") return true;
            let result = true;
            switch (statusFilterTerm) {
              case "active":
                result = x.status === SubscriptionClass.STATUS_ACTIVE;
                break;
              case "expired":
                result = x.showWarning;
                break;
              default:
                break;
            }
            return result;
          });
        this.paginator.pageIndex = page - 1; // Update the paginator's page index
        this.dataSource.data = enterprises; // Assuming the data is in 'items'
        this.totalLength = response.length; // Assuming total length is returned
      });
  }

  atLeastOneExpired = false;

  ngOnDestroy() {
    if (this.queryParamsSubscription)
      this.queryParamsSubscription.unsubscribe();
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe();
  }
}
