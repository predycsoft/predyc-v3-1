import { Component } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, map, switchMap } from 'rxjs';
import { MAIN_TITLE } from 'projects/predyc-business/src/admin/admin-routing.module';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { User } from 'projects/shared/models/user.model';
import { calculateAgeFromTimestamp, timestampToDateNumbers } from 'projects/shared/utils';
import { MatDialog } from '@angular/material/dialog';
import { DialogCreateSubscriptionComponent } from 'projects/predyc-business/src/shared/components/subscription/dialog-create-subscription/dialog-create-subscription.component';
import { SubscriptionJson } from 'projects/shared/models/subscription.model';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { SubscriptionService } from 'projects/predyc-business/src/shared/services/subscription.service';
import { CouponService } from 'projects/predyc-business/src/shared/services/coupon.service';
import { PriceService } from 'projects/predyc-business/src/shared/services/price.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { Price } from 'projects/shared/models/price.model';
import { Coupon } from 'projects/shared/models/coupon.model';
import { Product } from 'projects/shared/models/product.model';

@Component({
  selector: 'app-student-detail',
  templateUrl: './student-detail.component.html',
  styleUrls: ['./student-detail.component.css']
})
export class StudentDetailComponent {

  userId = this.route.snapshot.paramMap.get('uid');
  user
  tab: number = 0

  constructor(
    private titleService: Title,
    private route: ActivatedRoute,
    private afs: AngularFirestore,
    private dialog: MatDialog,
    public dialogService: DialogService,
    private subscriptionService: SubscriptionService,
    private priceService: PriceService,
    private productService: ProductService,
    private couponService: CouponService,


  ) {}

  userSubscription: Subscription
  combinedServicesSubscription: Subscription

  prices: Price[]
  products: Product[]
  coupons: Coupon[]

  ngOnInit() {
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
            return {...newUser, enterprise}
          }),
        )
      }),
    ).subscribe(user => {
      this.user = user
      const title = MAIN_TITLE + `Usuario ${this.user.name}`
      this.titleService.setTitle(title)
    })

    this.combinedServicesSubscription = combineLatest(
      [
        this.productService.getProducts$(),
        this.priceService.getPrices$(), 
        this.couponService.getCoupons$(),
      ]
    ).subscribe(([products, prices, coupons]) => {
      this.prices = prices
      this.products = products
      this.coupons = coupons
    })
  }

  createSubscription() {
    const dialogRef = this.dialog.open(DialogCreateSubscriptionComponent, {
      data: {

      }
    });
  
    dialogRef.afterClosed().subscribe(async (result: SubscriptionJson) => {
      if (result) {
        try {
          
          // await this.subscriptionService.saveSubscription(editedSubscription);
          this.dialogService.dialogExito();
        } catch (error) {
          this.dialogService.dialogAlerta("Hubo un error al guardar la licencia. Inténtalo de nuevo.");
        }
      }
    });
  }

  createCharge() {
    console.log("Crear pago")
  }

  ngOnDestroy() {
    this.userSubscription.unsubscribe()
    this.combinedServicesSubscription.unsubscribe()
  }

}
