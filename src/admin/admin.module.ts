import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { HomeComponent } from './admin-pages/home/home.component';
import { SharedModule } from 'src/shared/shared.module';
import { CreateDemoComponent } from './admin-pages/create-demo/create-demo.component';
import { EnterpriseListComponent } from './admin-pages/enterprise/enterprise-list/enterprise-list.component';
import { ProductListComponent } from './admin-pages/product-list/product-list.component';
import { LicenseSubscriptionListComponent } from './admin-pages/license-subscription-list/license-subscription-list.component';
import { RoyaltyComponent } from './admin-pages/royalty/royalty.component';
import { SaleComponent } from './admin-pages/sale/sale.component';
import { StudentsComponent } from './admin-pages/students/students.component';
import { AdminStudentListComponent } from './admin-pages/students/admin-student-list/admin-student-list.component';
import { EnterpriseComponent } from './admin-pages/enterprise/enterprise.component';


@NgModule({
  declarations: [
    HomeComponent,
    CreateDemoComponent,
    EnterpriseListComponent,
    ProductListComponent,
    LicenseSubscriptionListComponent,
    RoyaltyComponent,
    SaleComponent,
    StudentsComponent,
    AdminStudentListComponent,
    EnterpriseComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AdminRoutingModule,
  ]
})
export class AdminModule { }
