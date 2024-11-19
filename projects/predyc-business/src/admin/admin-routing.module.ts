import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CoursesComponent } from "projects/predyc-business/src/app/business-pages/management/courses/courses.component";
import { InstructorsComponent } from "./admin-pages/instructors/instructors.component";
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
import { CreateLiveCourseComponent } from "../shared/components/live-courses/create-live-course/create-live-course.component";
import { LiveCoursesComponent } from "../shared/components/live-courses/live-courses/live-courses.component";
import { ArticlesComponent } from "./admin-pages/articles/articles.component";
import { ArticleComponent } from "./admin-pages/articles/article/article.component";
import { ArticlePreviewComponent } from "./admin-pages/articles/article-preview/article-preview.component";
import { DiplomadoLiveFormComponent } from "../shared/components/live-courses/live-courses-diplomados/diplomado-form/diplomado-form.component";
import { PillarsComponent } from "./admin-pages/pillars/pillars.component";
import { ReviewsComponent } from "./admin-pages/reviews/reviews.component";
import { CoursesP21Component } from "../shared/components/courses-p21/courses-p21.component";
import { CreateCourseP21Component } from "../shared/components/courses-p21/create-course-p21/create-course-p21.component";
import { LogsComponent } from "./admin-pages/logs/logs.component";
import { CreateProgramP21Component } from "../shared/components/courses-p21/create-program-p21/create-program-p21.component";

export const MAIN_TITLE = "Predyc Admin - ";

const routes: Routes = [
  // { path: "", title: MAIN_TITLE + "home", component: HomeComponent },
  { path: '', redirectTo: 'students', pathMatch: 'full' },
  { path: "enterprises", title: MAIN_TITLE + "Empresas", component: EnterpriseComponent },
  { path: "students", title: MAIN_TITLE + "Estudiantes", component: StudentsComponent },
  { path: "students/:uid", title: MAIN_TITLE + "Estudiantes", component: StudentDetailComponent },
  { path: "enterprises/form", title: MAIN_TITLE + "Empresas", component: EnterpriseDetailComponent },
  { path: "enterprises/form/:id", title: MAIN_TITLE + "Empresas", component: EnterpriseDetailComponent },
  { path: "products", title: MAIN_TITLE + "Productos", component: ProductsComponent },
  { path: "licenses-and-subscriptions", title: MAIN_TITLE + "L&S", component: LicensesSubscriptionsComponent },
  { path: "instructors", title: MAIN_TITLE + "Instructores", component: InstructorsComponent },
  { path: "sales", title: MAIN_TITLE + "Ventas", component: SalesComponent },
  { path: "questions", title: MAIN_TITLE + "Preguntas", component: QuestionsComponent },
  { path: "certifications", title: MAIN_TITLE + "Certificados", component: CertificationsComponent },

  { path: "certifications/form", title: MAIN_TITLE + "Crear Certificación", component: CertificationsFormComponent },
  { path: "certifications/form/:id", title: MAIN_TITLE + "Editar Certificación", component: CertificationsFormComponent },

  { path: "diplomados/form", title: MAIN_TITLE + "Crear Diplomado", component: DiplomadoFormComponent },
  { path: "diplomados/form/:id", title: MAIN_TITLE + "Editar Diplomado", component: DiplomadoFormComponent },

  { path: "courses", title: MAIN_TITLE + "Cursos", component: CoursesComponent },

  { path: "cursos-P21", title: MAIN_TITLE + "Cursos P21", component: CoursesP21Component },

  { path: "create-cursos-p21/:mode/:idCurso", title: "Predictiva 21 - Crear / Editar curso", component: CreateCourseP21Component},
  { path: "create-diplomado-p21/:mode/:idPrograma", title: "Predictiva 21 - Crear / Editar Diplomado", component: CreateProgramP21Component},



  { path: "live", title: MAIN_TITLE + "Cursos en vivo", component: LiveCoursesComponent },
  { path: "live/new", title: MAIN_TITLE + "Crear curso en vivo", component: CreateLiveCourseComponent },
  { path: "live/:idCurso", title: MAIN_TITLE + "Editar curso en vivo", component: CreateLiveCourseComponent },
  { path: "live-sessions/:idCurso/:idLiveCourseSon", title: MAIN_TITLE + "Editar sessiones en vivo", component: CreateLiveCourseComponent },

  { path: "live-sessions/diplomates-live/form", title: MAIN_TITLE + "Crear Diplomado", component: DiplomadoLiveFormComponent },
  { path: "live-sessions/diplomates-live/form/:id", title: MAIN_TITLE + "Editar Diplomado", component: DiplomadoLiveFormComponent },

  { path: "freebies", title: MAIN_TITLE + "Freebies", component: FreebiesComponent },

  { path: "diplomados", title: MAIN_TITLE + "Diplomados", component: DiplomadosComponent },

  { path: "articles", title: MAIN_TITLE + "Articulos", component: ArticlesComponent },
  { path: "articles/new", title: MAIN_TITLE + "Editar artículo", component: ArticleComponent },
  { path: "articles/edit/:articleId", title: MAIN_TITLE + "Artículo", component: ArticleComponent },
  { path: "articles/preview/:articleId", title: MAIN_TITLE + "Artículo", component: ArticlePreviewComponent },

  { path: "pillars", title: MAIN_TITLE + "Pillars", component: PillarsComponent },
  
  { path: "reviews", title: MAIN_TITLE + "Reviews", component: ReviewsComponent },
  { path: "logs", title: MAIN_TITLE + "Logs", component: LogsComponent },

  { path: "**", redirectTo: "", pathMatch: "full" }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
