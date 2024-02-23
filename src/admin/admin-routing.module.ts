import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './admin-pages/home/home.component';
import { CreateDemoComponent } from './admin-pages/create-demo/create-demo.component';
import { StudentListComponent } from 'src/shared/components/users/student-list/student-list.component';
import { EnterpriseListComponent } from './admin-pages/enterprise-list/enterprise-list.component';
import { ProductListComponent } from './admin-pages/product-list/product-list.component';
import { LicenseSubscriptionListComponent } from './admin-pages/license-subscription-list/license-subscription-list.component';
import { CoursesComponent } from 'src/app/business-pages/management/courses/courses.component';
import { RoyaltyComponent } from './admin-pages/royalty/royalty.component';
import { SaleComponent } from './admin-pages/sale/sale.component';
import { StudentsComponent } from './admin-pages/students/students.component';

const MAIN_TITLE = 'Predyc Admin - '

const routes: Routes = [
  {path:"", title: MAIN_TITLE + 'home',component: HomeComponent },
  {path:"create-demo", title: MAIN_TITLE + 'Crear demo', component: CreateDemoComponent},
  {path:"students", title: MAIN_TITLE + 'Estudiantes', component: StudentsComponent},
  {path:"enterprises", title: MAIN_TITLE + 'Empresas', component: EnterpriseListComponent},
  {path:"products", title: MAIN_TITLE + 'Productos', component: ProductListComponent},
  {path:"licenses-and-subscriptions", title: MAIN_TITLE + 'L&S', component: LicenseSubscriptionListComponent},
  {path:"royalties", title: MAIN_TITLE + 'Regalias', component: RoyaltyComponent},
  {path:"sales", title: MAIN_TITLE + 'Ventas', component: SaleComponent},
  {path:"courses", title: MAIN_TITLE + 'Cursos', component: CoursesComponent},
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
