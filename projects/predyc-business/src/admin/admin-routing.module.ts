import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "./admin-pages/home/home.component";
import { CreateDemoComponent } from "./admin-pages/create-demo/create-demo.component";
import { CoursesComponent } from "projects/predyc-business/src/app/business-pages/management/courses/courses.component";
import { RoyaltyComponent } from "./admin-pages/royalty/royalty.component";
import { SalesComponent } from "./admin-pages/sales/sales.component";
import { StudentsComponent } from "./admin-pages/students/students.component";
import { EnterpriseComponent } from "./admin-pages/enterprise/enterprise.component";
import { LicensesSubscriptionsComponent } from "./admin-pages/licenses-subscriptions/licenses-subscriptions.component";
import { ProductsComponent } from "./admin-pages/products/products.component";
import { StudentDetailComponent } from "./admin-pages/students/student-detail/student-detail.component";
import { EnterpriseDetailComponent } from "./admin-pages/enterprise/enterprise-detail/enterprise-detail.component";
import { FreebiesComponent } from "./admin-pages/freebies/freebies.component";

export const MAIN_TITLE = "Predyc Admin - ";

const routes: Routes = [
  { path: "", title: MAIN_TITLE + "home", component: HomeComponent },
  {
    path: "students",
    title: MAIN_TITLE + "Estudiantes",
    component: StudentsComponent,
  },
  {
    path: "students/:uid",
    title: MAIN_TITLE + "Estudiantes",
    component: StudentDetailComponent,
  },
  {
    path: "enterprises",
    title: MAIN_TITLE + "Empresas",
    component: EnterpriseComponent,
  },
  {
    path: "enterprises/form",
    title: MAIN_TITLE + "Empresas",
    component: EnterpriseDetailComponent,
  },
  {
    path: "enterprises/form/:id",
    title: MAIN_TITLE + "Empresas",
    component: EnterpriseDetailComponent,
  },
  {
    path: "products",
    title: MAIN_TITLE + "Productos",
    component: ProductsComponent,
  },
  {
    path: "licenses-and-subscriptions",
    title: MAIN_TITLE + "L&S",
    component: LicensesSubscriptionsComponent,
  },
  {
    path: "royalties",
    title: MAIN_TITLE + "Regalias",
    component: RoyaltyComponent,
  },
  { path: "sales", title: MAIN_TITLE + "Ventas", component: SalesComponent },
  {
    path: "courses",
    title: MAIN_TITLE + "Cursos",
    component: CoursesComponent,
  },
  {
    path: "freebies",
    title: MAIN_TITLE + "Freebies",
    component: FreebiesComponent,
  },
  { path: "**", redirectTo: "", pathMatch: "full" }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
