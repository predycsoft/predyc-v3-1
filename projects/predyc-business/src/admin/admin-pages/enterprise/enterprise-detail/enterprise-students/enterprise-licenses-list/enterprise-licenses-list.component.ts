import { Component, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Subject, Subscription, combineLatest } from "rxjs";
import { License } from "projects/shared/models/license.model";
import { Product } from "projects/shared/models/product.model";
import { LicenseService } from "projects/predyc-business/src/shared/services/license.service";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { Subscription as SubscriptionClass } from "projects/shared/models/subscription.model";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { DialogService } from "projects/predyc-business/src/shared/services/dialog.service";
import { ActivatedRoute, Router } from "@angular/router";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";
import { DialogCreateLicenseComponent } from "projects/predyc-business/src/shared/components/license/dialog-create-license/dialog-create-license.component";

interface LicensesInList {
  productName: string;
  acquired: number;
  used: number;
  available: number;
  availableRotations: number;
  start: number;
  valid: number;
  status: string;
  rotations: number;
  rotationsUsed: number;
}

@Component({
  selector: "app-enterprise-licenses-list",
  templateUrl: "./enterprise-licenses-list.component.html",
  styleUrls: ["./enterprise-licenses-list.component.css"],
})
export class EnterpriseLicensesListComponent {
  @Input() enterpriseRef: DocumentReference<Enterprise>;

  constructor(
    private dialog: MatDialog,
    private licenseService: LicenseService,
    private productService: ProductService,
    public dialogService: DialogService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private subscriptionService: SubscriptionService
  ) {}

  SubscriptionClass = SubscriptionClass;

  displayedColumns: string[] = [
    "product",
    "acquired",
    "rotations",
    "available",
    "availableRotations",
    "inUse",
    "rotationsUsed",
    "start",
    "expiration",
    "status",
  ];

  dataSource = new MatTableDataSource<LicensesInList>();

  products: Product[] = [];

  public status: string;
  private statusFilterTerm = new Subject<string>();

  atLeastOneExpired = false;

  search(status: string) {
    this.status = status;
    this.statusFilterTerm.next(status);
  }

  licenseSubscription: Subscription;
  combinedServicesSubscription: Subscription;

  ngOnInit() {
    this.statusFilterTerm.subscribe((term) => {
      this.router.navigate([], {
        queryParams: { status: term ? term : null },
        queryParamsHandling: "merge",
      });
    });
    this.combinedServicesSubscription = combineLatest([
      this.productService.getProducts$(),
      this.licenseService.getLicensesByEnterpriseRef$(this.enterpriseRef),
      this.activatedRoute.queryParams,
    ]).subscribe(([products, licenses, params]) => {
      this.products = products;
      const statusFilterTerm = params["status"] || "all";
      const today = +new Date();

      const licensesInList: LicensesInList[] = licenses
        .map((license) => {
          const licenseProduct = products.find(
            (product) => product?.id === license?.productRef?.id
          );
          return {
            productName: licenseProduct?.name
              ? licenseProduct?.name
              : "Licencias",
            acquired: license.quantity,
            used: license.quantityUsed,
            available: license.quantity - license.quantityUsed,
            valid: license.currentPeriodEnd,
            rotations: license.rotations,
            rotationsUsed: license.rotationsUsed,
            availableRotations: license.rotations - license.rotationsUsed,
            start: license.currentPeriodStart,
            status: license.status,
            showWarning:
              license.status === SubscriptionClass.STATUS_ACTIVE &&
              license.currentPeriodEnd < today,
            license: license,
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
      // console.log("licensesInList", licensesInList)
      this.dataSource.data = licensesInList;
    });
  }

  async editLicense(license: License) {
    console.log(license)
    const dialogRef = this.dialog.open(DialogCreateLicenseComponent, {
      data: {
        license: license,
        products: this.products,
        dateStart: null,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: License) => {
      if (result) {
        result.enterpriseRef = this.enterpriseRef;
        try {
          const licenseJson = result.toJson();
          await this.licenseService.saveLicense(licenseJson);
          // Update all subscriptions
          const subscriptions =
            await this.subscriptionService.getSubscriptionsByLicense(
              this.licenseService.getLicenseRefById(licenseJson.id)
            );
          for (let subscription of subscriptions) {
            const modifiedSubscription = {
              ...subscription,
              canceledAt:
                licenseJson.status === SubscriptionClass.STATUS_ACTIVE
                  ? null
                  : Date.now(),
              changedAt: Date.now(),
              currentPeriodEnd: licenseJson.currentPeriodEnd,
              currentPeriodStart: licenseJson.currentPeriodStart,
              endedAt:
                licenseJson.status === SubscriptionClass.STATUS_ACTIVE
                  ? null
                  : Date.now(),
              productRef: licenseJson.productRef,
              status: licenseJson.status,
            };
            await this.subscriptionService.saveSubscription(
              modifiedSubscription
            );
          }
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta(
            "Hubo un error al guardar la licencia. Inténtalo de nuevo."
          );
          console.log(error);
        }
      }
    });
  }

  async addLicense() {
    let licences = this.dataSource.data;
    let licenceActive = licences.find((x) => x.status == "Activo");

    let dateStart = null;

    if (licenceActive) {
      dateStart = licenceActive.start;
    }

    const dialogRef = this.dialog.open(DialogCreateLicenseComponent, {
      data: {
        license: null,
        products: this.products,
        dateStart: dateStart,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: License) => {
      if (result) {
        result.enterpriseRef = this.enterpriseRef;
        try {
          await this.licenseService.saveLicense(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta(
            "Hubo un error al guardar la licencia. Inténtalo de nuevo."
          );
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.licenseSubscription) this.licenseSubscription.unsubscribe();
  }
}
