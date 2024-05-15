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
import { QuestionsComponent } from "./admin-pages/questions/questions.component";

import { CertificationsComponent } from "./admin-pages/certifications/certifications.component";
import { CertificationsFormComponent } from "./admin-pages/certifications/certifications-form/certifications-form.component";

import { DiplomadosComponent } from "./admin-pages/diplomados/diplomados.component";

import { DiplomadoFormComponent } from "./admin-pages/diplomados/diplomado-form/diplomado-form.component";

export const MAIN_TITLE = "Predyc Admin - ";

const routes: Routes = [
  // { path: "", title: MAIN_TITLE + "home", component: HomeComponent },
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
    path: "",
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
  { path: "questions", title: MAIN_TITLE + "Preguntas", component: QuestionsComponent },
  { path: "certifications", title: MAIN_TITLE + "Certificados", component: CertificationsComponent },

  { path:"certifications/form", title: MAIN_TITLE + 'Crear Certificación', component: CertificationsFormComponent },
  { path:"certifications/form/:id", title: MAIN_TITLE + 'Editar Certificación', component: CertificationsFormComponent },

  { path:"diplomados/form", title: MAIN_TITLE + 'Crear Diplomado', component: DiplomadoFormComponent },
  { path:"diplomados/form/:id", title: MAIN_TITLE + 'Editar Diplomado', component: DiplomadoFormComponent },

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

  {
    path: "diplomados",
    title: MAIN_TITLE + "Diplomados",
    component: DiplomadosComponent,
  },

  { path: "**", redirectTo: "", pathMatch: "full" }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
