import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { HomeComponent } from './admin-pages/home/home.component';
import { SharedModule } from 'src/shared/shared.module';
import { CreateDemoComponent } from './admin-pages/create-demo/create-demo.component';
import { EnterpriseListComponent } from './admin-pages/enterprise/enterprise-list/enterprise-list.component';
import { RoyaltyComponent } from './admin-pages/royalty/royalty.component';
import { SalesComponent } from './admin-pages/sales/sales.component';
import { StudentsComponent } from './admin-pages/students/students.component';
import { AdminStudentListComponent } from './admin-pages/students/admin-student-list/admin-student-list.component';
import { EnterpriseComponent } from './admin-pages/enterprise/enterprise.component';
import { LicensesSubscriptionsComponent } from './admin-pages/licenses-subscriptions/licenses-subscriptions.component';
import { LicensesListComponent } from './admin-pages/licenses-subscriptions/licenses-list/licenses-list.component';
import { SubscriptionsListComponent } from './admin-pages/licenses-subscriptions/subscriptions-list/subscriptions-list.component';
import { ProductsComponent } from './admin-pages/products/products.component';
import { ProductListComponent } from './admin-pages/products/product-list/product-list.component';
import { CouponsListComponent } from './admin-pages/products/coupons-list/coupons-list.component';
import { DialogProductFormComponent } from './admin-pages/products/product-list/dialog-product-form/dialog-product-form.component';
import { PriceFormComponent } from './admin-pages/products/product-list/dialog-product-form/price-form/price-form.component';
import { PricesListComponent } from './admin-pages/products/product-list/dialog-product-form/prices-list/prices-list.component';
import { ProductFormComponent } from './admin-pages/products/product-list/dialog-product-form/product-form/product-form.component';
import { StudentDetailComponent } from './admin-pages/students/student-detail/student-detail.component';
import { DialogCouponFormComponent } from './admin-pages/products/coupons-list/dialog-coupon-form/dialog-coupon-form.component';
import { StudentSubscriptionListComponent } from './admin-pages/students/student-detail/student-subscription-list/student-subscription-list.component';
import { SalesListComponent } from './admin-pages/sales/sales-list/sales-list.component';
import { EnterpriseDetailComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-detail.component';
import { EnterpriseInfoComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-info/enterprise-info.component';
import { EnterpriseStudentsComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-students.component';
import { EnterprisePaymentsComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-payments/enterprise-payments.component';
import { DialogNewLicenseComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-students/dialog-new-license/dialog-new-license.component';
import { EnterpriseLicensesListComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-licenses-list/enterprise-licenses-list.component';
import { EnterpriseAdminsListComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-admins-list/enterprise-admins-list.component';
import { EnterpriseStudentsListComponent } from './admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-students-list/enterprise-students-list.component';


@NgModule({
  declarations: [
    HomeComponent,
    CreateDemoComponent,
    EnterpriseListComponent,
    ProductListComponent,
    RoyaltyComponent,
    SalesComponent,
    StudentsComponent,
    AdminStudentListComponent,
    LicensesSubscriptionsComponent,
    LicensesListComponent,
    SubscriptionsListComponent,
    EnterpriseComponent,
    LicensesSubscriptionsComponent,
    ProductsComponent,
    CouponsListComponent,
    StudentDetailComponent,
    DialogProductFormComponent,
    PriceFormComponent,
    PricesListComponent,
    ProductFormComponent,
    DialogCouponFormComponent,
    StudentSubscriptionListComponent,
    SalesListComponent,
    EnterpriseDetailComponent,
    EnterpriseInfoComponent,
    EnterpriseStudentsComponent,
    EnterprisePaymentsComponent,
    DialogNewLicenseComponent,
    EnterpriseLicensesListComponent,
    EnterpriseAdminsListComponent,
    EnterpriseStudentsListComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AdminRoutingModule,
  ]
})
export class AdminModule { }
