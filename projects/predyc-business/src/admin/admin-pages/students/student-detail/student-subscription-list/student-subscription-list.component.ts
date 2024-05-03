import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { MatTableDataSource } from "@angular/material/table";
import { Subscription } from "rxjs";
import { Product } from "projects/shared/models/product.model";
import { User } from "projects/shared/models/user.model";
import { SubscriptionService } from "projects/predyc-business/src/shared/services/subscription.service";
import {
  Subscription as SubscriptionClass,
  SubscriptionJson,
} from "projects/shared/models/subscription.model";
import { MatDialog } from "@angular/material/dialog";
import { DialogEditSubscriptionComponent } from "projects/predyc-business/src/shared/components/subscription/dialog-edit-subscription/dialog-edit-subscription.component";
import { DialogService } from "projects/predyc-business/src/shared/services/dialog.service";
import { DatePipe } from "@angular/common";
import Swal from "sweetalert2";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";

export interface SubscriptionInfo extends SubscriptionJson {
  productName: string;
  statusToDisplay: string;
}

@Component({
  selector: "app-student-subscription-list",
  templateUrl: "./student-subscription-list.component.html",
  styleUrls: ["./student-subscription-list.component.css"],
  providers: [DatePipe],
})
export class StudentSubscriptionListComponent {
  @Output() onSubSelected = new EventEmitter<User>();

  constructor(
    private subscriptionService: SubscriptionService,
    private dialog: MatDialog,
    public dialogService: DialogService,
    public icon: IconService
  ) {}

  displayedColumns: string[] = [
    "productName",
    "status",
    "createdAt",
    "currentPeriodStart",
    "currentPeriodEnd",
    "actions",
  ];

  dataSource = new MatTableDataSource<SubscriptionInfo>();

  pageSize: number = 3;
  totalLength: number;

  @Input() userRef: DocumentReference<User>;
  @Input() products: Product[];

  combinedServicesSubscription: Subscription;
  subscriptionsSubscription: Subscription;

  ngOnInit() {}

  todayTime;

  ngOnChanges(changes: SimpleChanges) {
    let today = new Date();
    this.todayTime = today.getTime();

    if (this.userRef) {
      // Check if prices, products, or coupons have changed
      if (changes.products) {
        this.performSearch();
      }
    }
  }

  performSearch() {
    if (this.subscriptionsSubscription) {
      this.subscriptionsSubscription.unsubscribe();
    }
    this.subscriptionsSubscription = this.subscriptionService
      .getUserSubscriptions$(this.userRef)
      .subscribe((subscriptions) => {
        // console.log("Subscriptions", subscriptions)
        const subscriptionsInfo: SubscriptionInfo[] = subscriptions.map(
          (subscription) => {
            const product = this.products.find(
              (prod) => prod.id === subscription?.productRef?.id
            );
            if (
              subscription.status === SubscriptionClass.STATUS_ACTIVE &&
              subscription.currentPeriodEnd < this.todayTime
            ) {
              subscription.status = SubscriptionClass.STATUS_EXPIRED;
            }
            let sub = {
              ...subscription,
              productName: product?.name,
              statusToDisplay:
                SubscriptionClass.statusToDisplayValueDict[subscription.status],
            };
            return sub;
          }
        );

        this.dataSource.data = subscriptionsInfo;
        this.totalLength = subscriptionsInfo.length;
      });
  }

  editSubscription(subscription: SubscriptionInfo) {
    const dialogRef = this.dialog.open(DialogEditSubscriptionComponent, {
      data: {
        subscription,
      },
    });

    dialogRef.afterClosed().subscribe(async (result: SubscriptionInfo) => {
      if (result) {
        try {
          const editedSubscription: SubscriptionJson =
            this.subscriptionInfoToJson(result);
          console.log("editedsubscription", editedSubscription);
          await this.subscriptionService.saveSubscription(editedSubscription);
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta(
            "Hubo un error al guardar la licencia. Inténtalo de nuevo."
          );
        }
      }
    });
  }

  changeStatusPrev(subscription: SubscriptionInfo) {
    Swal.fire({
      title: "Confirmar acción",
      text: `¿Desea editar el estatus de la subcripcion?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Editar",
      confirmButtonColor: "var(--blue-5)",
    }).then((result) => {
      /* Read more about isConfirmed, isDenied below */
      if (result.isConfirmed) {
        this.changeStatus(subscription);
      }
    });
  }

  async changeStatus(subscription: SubscriptionInfo) {
    if (
      subscription.status === SubscriptionClass.STATUS_ACTIVE ||
      subscription.status === SubscriptionClass.STATUS_EXPIRED
    ) {
      subscription.status = SubscriptionClass.STATUS_INACTIVE;
      subscription.endedAt = +new Date();
      subscription.canceledAt = +new Date();
    } else {
      subscription.status = SubscriptionClass.STATUS_ACTIVE;
      subscription.endedAt = null;
      subscription.canceledAt = null;
    }
    subscription.changedAt = +new Date();
    try {
      const editedSubscription: SubscriptionJson =
        this.subscriptionInfoToJson(subscription);
      console.log("editedsubscription", editedSubscription);
      await this.subscriptionService.saveSubscription(editedSubscription);
      this.dialogService.dialogExito();
    } catch (error) {
      this.dialogService.dialogAlerta(
        "Hubo un error al guardar la licencia. Inténtalo de nuevo."
      );
    }
  }

  subscriptionInfoToJson(subscriptionInfo: SubscriptionInfo): SubscriptionJson {
    return {
      id: subscriptionInfo.id,
      createdAt: subscriptionInfo.createdAt,
      changedAt: subscriptionInfo.changedAt,
      startedAt: subscriptionInfo.startedAt,
      currency: subscriptionInfo.currency,
      currentPeriodStart: subscriptionInfo.currentPeriodStart,
      currentPeriodEnd: subscriptionInfo.currentPeriodEnd,
      userRef: subscriptionInfo.userRef,
      endedAt: subscriptionInfo.endedAt,
      canceledAt: subscriptionInfo.canceledAt,
      productRef: subscriptionInfo.productRef,
      status: subscriptionInfo.status,
      currentError: subscriptionInfo.currentError,
      nextPaymentDate: subscriptionInfo.nextPaymentDate,
      nextPaymentAmount: subscriptionInfo.nextPaymentAmount,
      enterpriseRef: subscriptionInfo.enterpriseRef,
      licenseRef: subscriptionInfo.licenseRef,
    };
  }

  ngOnDestroy() {
    if (this.combinedServicesSubscription)
      this.combinedServicesSubscription.unsubscribe();
    if (this.subscriptionsSubscription)
      this.subscriptionsSubscription.unsubscribe();
  }

  clickSub(data) {
    console.log(data)
    if (!data.licenseRef) {
      this.onSubSelected.emit(data);
    } else {
      Swal.fire({
        text: `Esta suscripción no se puede editar porque tiene una licencia asociada.`,
        icon: "info",
        confirmButtonColor: "var(--blue-5)",
      });
    }
  }
}
