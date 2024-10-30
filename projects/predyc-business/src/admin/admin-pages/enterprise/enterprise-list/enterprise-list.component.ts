import { Component, EventEmitter, Output, ViewChild } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { Subject, Subscription, combineLatest, filter, firstValueFrom, map, of, switchMap, take } from "rxjs";
import { License } from "projects/shared/models/license.model";
import { User } from "projects/shared/models/user.model";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { Product } from "projects/shared";
import * as XLSX from "xlsx-js-style";

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
    "ritmo",
    "complete",
    "userQty",
    // "availableLicenses",
    "inUseLicenses",
    // "rotations",
    // "expirationDate",
    // "product",
    "status",
    "accountManagement",
    "demo",
  ];

  dataSource = new MatTableDataSource<EnterpriseInfo>();
  pageSize: number = 200;
  totalLength: number;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Output() totalEmpresas = new EventEmitter<any>();

  queryParamsSubscription: Subscription;
  enterpriseSubscription: Subscription;
  statusSubscription: Subscription;

  products: Product[];
  first = true

  public status: string;
  private statusFilterTerm = new Subject<string>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private productService: ProductService,
    private router: Router
  ) {}

  search(status: string) {
    this.status = status;
    this.statusFilterTerm.next(status);
  }

  async ngOnInit() {
    this.first = true
    const products = await firstValueFrom(this.productService.getProducts$())
    this.products = products;
    this.status = this.activatedRoute.snapshot.queryParams["status"] || "all";
    this.statusSubscription = this.statusFilterTerm.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { status: term ? term : null, page: 1 },
        queryParamsHandling: "merge",
      });
    });
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      const page = Number(params["page"]) || 1;
      const searchTerm = params["search"] || "";
      if (this.first) {
        this.performSearch(searchTerm, page);
      }
      else {
        this.performSearchLocal(searchTerm, page);
      }
    });
  }


  getTotalRitmo(ritmos: { high: number, medium: number, low: number, noIniciado: number, noPlan: number }): number {
    return ritmos.high + ritmos.medium + ritmos.low + ritmos.noIniciado + ritmos.noPlan;
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

  performSearchLocal(searchTerm: string, page: number) {
    let empresas = structuredClone(this.empresas);

    empresas = empresas.filter((x) => {
      if (!searchTerm || searchTerm === "") return true;
      return (
        x.name
          .toLocaleLowerCase()
          .includes(searchTerm.toLocaleLowerCase())
      );
    })

    this.paginator.pageIndex = page - 1; // Update the paginator's page index
    this.dataSource.data = empresas; // Assuming the data is in 'items'
    this.totalLength = empresas.length; // Assuming total length is returned
    this.first = false
  }

  performSearch(searchTerm: string, page: number) {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe();
    this.enterpriseSubscription = this.enterpriseService.getEnterprises$().pipe(
      // Only proceed if the emitted value has more than 1 enterprise (predyc enterprise)
      filter((enterprises) => enterprises.length > 1),
      // Users Qty
      switchMap((enterprises) => {
        // For each enterprise, query their active students
        const observables = enterprises.map((enterprise) => {
          const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id);
          return this.afs.collection<User>(User.collection, (ref) =>ref.where("enterprise", "==", enterpriseRef)).valueChanges().pipe(
            map((users) => (
              { 
                enterprise, 
                userQty: users.length 
              }
            ))
          );
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
      }),
      take(1)
    ).subscribe((response) => {
      // console.log(response);

      let enterprises: EnterpriseInfo[] = response
      .map((enterpriseInfo) => {
        const licenses = enterpriseInfo.licenses.sort(
          (a, b) => b.currentPeriodEnd - a.currentPeriodEnd
        );
        const product = licenses.length > 0 ? this.products.find((x) => x.id === licenses[0].productRef.id) : null;
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

        if(!enterpriseInfo?.enterprise?.rythms){
          enterpriseInfo.enterprise.rythms = {
            high: 0,
            medium: 0,
            low: 0,
            noPlan: 0,
            noIniciado:0
          }
        }

        let progress = enterpriseInfo?.enterprise?.progress
        let complete = 0
        let completeExpected = 0
        if (progress && progress.studentExpectedHoursTotal>0) {
          complete= progress.studentHours*100/progress.studentExpectedHoursTotal
          completeExpected = progress.studentExpectedHours*100/progress.studentExpectedHoursTotal
        }

        if(enterpriseInfo.enterprise.tractian ){
        
        }
        
        let lastDate = null
        if(enterpriseInfo.licenses.length>0){
          lastDate = enterpriseInfo.licenses[0].currentPeriodEnd

        }

        let datos = {
          name: enterpriseInfo.enterprise.name,
          photoUrl: enterpriseInfo.enterprise.photoUrl,
          userQty: enterpriseInfo.userQty,
          demo:enterpriseInfo.enterprise.demo ? enterpriseInfo.enterprise.demo : false,
          tractian:enterpriseInfo.enterprise.tractian ? enterpriseInfo.enterprise.tractian : false,
          requireAccountManagement:enterpriseInfo.enterprise.requireAccountManagement ? enterpriseInfo.enterprise.requireAccountManagement : false,
          totalLicenses: enterpriseInfo.totalLicenses,
          availableLicenses: enterpriseInfo.availableLicenses,
          availableRotations: enterpriseInfo.availableRotations,
          complete:complete,
          accountManagerName: enterpriseInfo.enterprise.accountManagerName,
          lastDate:lastDate,
          // licenses:enterpriseInfo.licenses,
          completeExpected:completeExpected,
          rotacionWarningCount: enterpriseInfo.rotacionWarningCount,
          expirationDate: enterpriseInfo.expirationDate,
          id: enterpriseInfo.enterprise.id,
          ritmos: enterpriseInfo.enterprise.rythms,
          totalRitmos:this.getTotalRitmo(enterpriseInfo.enterprise.rythms),
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
          product: product ? product.name :  (enterpriseInfo.enterprise.tractian? 'Demo': 'N/A'),
        };
        return datos
      })
      this.totalEmpresas.emit(enterprises)
      this.empresas = enterprises
      enterprises = enterprises.filter((x) => {
        if (!searchTerm || searchTerm === "") return true;
        return (x.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()));
      })
      // console.log('enterprises',enterprises)
      this.paginator.pageIndex = page - 1; // Update the paginator's page index
      this.dataSource.data = enterprises; // Assuming the data is in 'items'
      this.totalLength = response.length; // Assuming total length is returned
      this.first = false
    });
  }

  atLeastOneExpired = false;

  empresas

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe();
    if (this.statusSubscription) this.statusSubscription.unsubscribe();
  }
}
