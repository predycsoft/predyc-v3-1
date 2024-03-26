import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription, map, switchMap } from 'rxjs';
import { MAIN_TITLE } from 'projects/predyc-business/src/admin/admin-routing.module';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { User } from 'projects/shared/models/user.model';
import { calculateAgeFromTimestamp } from 'projects/shared/utils';
import { MatDialog } from '@angular/material/dialog';
import { DialogCreateSubscriptionComponent } from 'projects/predyc-business/src/shared/components/subscription/dialog-create-subscription/dialog-create-subscription.component';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { Product } from 'projects/shared/models/product.model';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { DialogCreateChargeComponent } from 'projects/predyc-business/src/shared/components/charges/dialog-create-charge/dialog-create-charge.component';
import { Charge } from 'projects/shared/models/charges.model';
import { ChargeService } from 'projects/predyc-business/src/shared/services/charge.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

@Component({
  selector: 'app-student-detail',
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.css']
})
export class StudentDetailComponent {

  userId = this.route.snapshot.paramMap.get('uid');
  user
  tab: number = 0
  academicTab: number = 0
  enterpriseRef: DocumentReference<Enterprise> = null
  userRef: DocumentReference<User> = null

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private productService: ProductService,
    private enterpriseService: EnterpriseService,
    private chargeService: ChargeService,
  ) {}

  userSubscription: Subscription
  productSubscription: Subscription

  products: Product[]

  totalCourses: number;
  totalClasses: number;

  ngOnInit() {
    this.userRef = this.userService.getUserRefById(this.userId)
    this.userSubscription = this.afs.collection<User>(User.collection).doc(this.userId).valueChanges()
    .pipe(
      switchMap(user => {
        const newUser = {
          ...user,
          createdAt: new Date(user.createdAt),
          birthdate: new Date(user.birthdate),
          age: calculateAgeFromTimestamp(user.birthdate)
        }
        return this.afs.collection<Enterprise>(Enterprise.collection).doc(user.enterprise.id).valueChanges().pipe(
          map(enterprise => {
            if (enterprise) this.enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)
            return {...newUser, enterprise}
          }),
        )
      }),
    ).subscribe(user => {
      this.user = user
      console.log("this.user", this.user)
      const title = MAIN_TITLE + `Usuario ${this.user.name}`
      this.titleService.setTitle(title)
    })

    this.productSubscription = this.productService.getProducts$().subscribe(products => this.products = products)
  }

  createSubscription() {
    const dialogRef = this.dialog.open(DialogCreateSubscriptionComponent, {
      data: {
        userId: this.user.uid, 
        products: this.products,
        enterpriseRef: this.enterpriseRef
      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: SubscriptionClass) => {
      if (result) {
        try {
          console.log("result", result)
          await this.subscriptionService.saveSubscription(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al crear la suscripción. Inténtalo de nuevo.");
          console.error(error)
        }
      }
    });
  }

  createCharge() {
    const dialogRef = this.dialog.open(DialogCreateChargeComponent, {
      data: {
        customerRef: this.userRef,
        products: this.products,
      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: Charge) => {
      if (result) {
        try {
          console.log("result", result)
          await this.chargeService.saveCharge(result.toJson());
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
          console.log(error)
        }
      }
    });
  }

  handleCourseTotalLengthChange(totalLength: number) {
    this.totalCourses = totalLength;
  }

  handleClassTotalLengthChange(totalLength: number) {
    this.totalClasses = totalLength;
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe()
    this.productSubscription.unsubscribe()
  }

}
