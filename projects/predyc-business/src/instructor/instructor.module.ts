import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";

import { InstructorRoutingModule } from "./instructor-routing.module";
import { SharedModule } from "projects/predyc-business/src/shared/shared.module";
import { QuestionsComponent } from "./instructor-pages/questions/questions.component";



@NgModule({
  declarations: [
    QuestionsComponent,
  ],
  imports: [SharedModule, CommonModule, InstructorRoutingModule],
})
export class InstructorModule {}
