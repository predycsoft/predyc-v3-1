import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { CrmRoutingModule } from "./crm-routing.module";
import { SharedModule } from "projects/predyc-business/src/shared/shared.module";
import { DashboardComponent } from "./crm-pages/dashboard/dashboard.component";



@NgModule({
  declarations: [
    DashboardComponent,
  ],
  imports: [SharedModule, CommonModule, CrmRoutingModule],
})
export class CrmModule {}
