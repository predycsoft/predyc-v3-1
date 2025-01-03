import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { AdminRoutingModule } from "./admin-routing.module";
import { HomeComponent } from "./admin-pages/home/home.component";
import { SharedModule } from "projects/predyc-business/src/shared/shared.module";
import { CreateDemoComponent } from "./admin-pages/create-demo/create-demo.component";
import { EnterpriseListComponent } from "./admin-pages/enterprise/enterprise-list/enterprise-list.component";
import { RoyaltyComponent } from "./admin-pages/royalty/royalty.component";
import { SalesComponent } from "./admin-pages/sales/sales.component";
import { StudentsComponent } from "./admin-pages/students/students.component";
import { AdminStudentListComponent } from "./admin-pages/students/admin-student-list/admin-student-list.component";
import { EnterpriseComponent } from "./admin-pages/enterprise/enterprise.component";
import { LicensesSubscriptionsComponent } from "./admin-pages/licenses-subscriptions/licenses-subscriptions.component";
import { LicensesListComponent } from "./admin-pages/licenses-subscriptions/licenses-list/licenses-list.component";
import { SubscriptionsListComponent } from "./admin-pages/licenses-subscriptions/subscriptions-list/subscriptions-list.component";
import { ProductsComponent } from "./admin-pages/products/products.component";
import { ProductListComponent } from "./admin-pages/products/product-list/product-list.component";
import { DialogProductFormComponent } from "./admin-pages/products/product-list/dialog-product-form/dialog-product-form.component";
import { ProductFormComponent } from "./admin-pages/products/product-list/dialog-product-form/product-form/product-form.component";
import { StudentDetailComponent } from "./admin-pages/students/student-detail/student-detail.component";
import { StudentSubscriptionListComponent } from "./admin-pages/students/student-detail/student-subscription-list/student-subscription-list.component";
import { SalesListComponent } from "./admin-pages/sales/sales-list/sales-list.component";
import { EnterpriseDetailComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-detail.component";
import { EnterpriseInfoComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-info/enterprise-info.component";
import { EnterpriseStudentsComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-students.component";
import { EnterprisePaymentsComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-payments/enterprise-payments.component";
import { DialogNewLicenseComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-students/dialog-new-license/dialog-new-license.component";
import { EnterpriseLicensesListComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-licenses-list/enterprise-licenses-list.component";
import { EnterpriseAdminsListComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-admins-list/enterprise-admins-list.component";
import { EnterpriseStudentsListComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-students/enterprise-students-list/enterprise-students-list.component";
import { StudentChargeListComponent } from "./admin-pages/students/student-detail/student-charge-list/student-charge-list.component";
import { StudentCoursesListComponent } from "./admin-pages/students/student-detail/student-courses-list/student-courses-list.component";
import { StudentClassesActivityListComponent } from "./admin-pages/students/student-detail/student-classes-activity-list/student-classes-activity-list.component";
import { FreebiesComponent } from "./admin-pages/freebies/freebies.component";
import { FreebiesListComponent } from "./admin-pages/freebies/freebies-list/freebies-list.component";
import { DialogFreebiesFormComponent } from "./admin-pages/freebies/freebies-list/dialog-freebies-form/dialog-freebies-form.component";

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
    StudentDetailComponent,
    DialogProductFormComponent,
    ProductFormComponent,
    StudentSubscriptionListComponent,
    SalesListComponent,
    EnterpriseDetailComponent,
    EnterpriseInfoComponent,
    EnterpriseStudentsComponent,
    EnterprisePaymentsComponent,
    DialogNewLicenseComponent,
    EnterpriseLicensesListComponent,
    EnterpriseAdminsListComponent,
    EnterpriseStudentsListComponent,
    StudentChargeListComponent,
    StudentCoursesListComponent,
    StudentClassesActivityListComponent,
    FreebiesComponent,
    FreebiesListComponent,
    DialogFreebiesFormComponent,
  ],
  imports: [SharedModule, CommonModule, AdminRoutingModule],
})
export class AdminModule {}
