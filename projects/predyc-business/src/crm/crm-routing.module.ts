import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DashboardComponent } from "./crm-pages/dashboard/dashboard.component";


export const MAIN_TITLE = "Predyc CRM - ";

const routes: Routes = [
  { path: "", title: MAIN_TITLE + "", component: DashboardComponent },
  { path: "dashboard", title: MAIN_TITLE + "Dashboard", component: DashboardComponent },
  { path: "**", redirectTo: "dashboard", pathMatch: "full" }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrmRoutingModule {}
