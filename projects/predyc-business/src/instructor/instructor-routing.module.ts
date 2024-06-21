import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { QuestionsComponent } from "./instructor-pages/questions/questions.component";


export const MAIN_TITLE = "Predyc Instructor - ";

const routes: Routes = [
  { path: "", title: MAIN_TITLE + "Empresas", component: QuestionsComponent },
  { path: "questions", title: MAIN_TITLE + "Preguntas", component: QuestionsComponent },
  { path: "regalias", title: MAIN_TITLE + "Regalías", component: QuestionsComponent },
  { path: "**", redirectTo: "", pathMatch: "full" }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InstructorRoutingModule {}
