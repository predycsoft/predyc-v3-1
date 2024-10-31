import { Component, EventEmitter, Input, Output } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { Subject, Subscription, combineLatest } from "rxjs";
import { License, LicenseJson } from "projects/shared/models/license.model";
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
import { formatDate } from "@angular/common";

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
  selector: "app-enterprise-licenses-cards",
  templateUrl: "./enterprise-licenses-cards.component.html",
  styleUrls: ["./enterprise-licenses-cards.component.css"],
})
export class EnterpriseLicensesCardsComponent {
  @Input() enterpriseRef: DocumentReference<Enterprise>;
  @Output() licenseDeactivated = new EventEmitter<LicenseJson>();

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

  products: Product[] = [];

  public status: string;
  private statusFilterTerm = new Subject<string>();

  licenses = []

  atLeastOneExpired = false;

  search(status: string) {
    this.status = status;
    this.statusFilterTerm.next(status);
  }

  licenseSubscription: Subscription;
  combinedServicesSubscription: Subscription;

  getFormattedDate(date: any): string {
    return formatDate(date, 'dd MMM yy', 'en-US');
  }

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

          // Convierte los timestamps a objetos Date
          const startDate = new Date(license.currentPeriodStart);
          const endDate = new Date(license.currentPeriodEnd);

          // Calcula la diferencia en milisegundos
          const differenceInMs = endDate.getTime() - startDate.getTime();

          // Convierte la diferencia de milisegundos a días
          const differenceInDays = Math.ceil(differenceInMs / (1000 * 60 * 60 * 24));

          const startFormated = this.getFormattedDate(startDate)
          const endFormated = this.getFormattedDate(endDate)

          // console.log('fechasFormated',startFormated,endFormated)

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
            differenceInDays:differenceInDays,
            showWarning:
              license.status === SubscriptionClass.STATUS_ACTIVE &&
              license.currentPeriodEnd < today,
            license: license,
            startFormated:startFormated,
            endFormated:endFormated,
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
      this.licenses = licensesInList
      //this.dataSource.data = licensesInList;
    });
  }

  async editLicense(license: License) {
    // console.log("license", license)
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
          const subscriptions =await this.subscriptionService.getSubscriptionsByLicense(this.licenseService.getLicenseRefById(licenseJson.id));
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
          if (license.status !== licenseJson.status) {
            console.log("License status changed");
            if (this.licenses.filter(x => x.status === "inactive").length === this.licenses.length) {
              this.licenseDeactivated.emit(licenseJson);
            }
          }
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
          console.log(error);
        }
      }
    });
  }

  async addLicense() {
    let licenses = this.licenses
    let licenseActive = licenses.find((x) => x.status == "Activo");

    let dateStart = null;

    if (licenseActive) {
      dateStart = licenseActive.start;
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
