import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './business-pages/dashboard/dashboard.component'
import { ManagementComponent } from './business-pages/management/management.component';
import { CoursesComponent } from './business-pages/management/courses/courses.component';
import { ValidationComponent } from './business-pages/validation/validation.component';
import { SettingsComponent } from './business-pages/settings/settings.component';
import { MyTeamComponent } from './business-pages/management/my-team/my-team.component';
import { NotificationsComponent } from './business-pages/management/notifications/notifications.component'
import { StudentComponent } from './business-pages/management/my-team/student/student.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { MainComponent } from './business-pages/main.component';
import { CreateCourseComponent } from './business-pages/management/create-course/create-course.component';
import { InitScriptComponent } from 'src/shared/components/init-script/init-script.component';
import { MyAccountComponent } from './business-pages/my-account/my-account.component';
import { ProfilesComponent } from './business-pages/management/profiles/profiles.component';
import { ProfileGuard } from 'src/shared/guards/profile.guard';
import { SystemUserGuard } from 'src/admin/guards/systemUser.guard';

const MAIN_TITLE = 'Predyc - '

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children: [
      // Authenticated routes...
      {
        path:"",
        title: MAIN_TITLE + 'Dashboard',
        component: DashboardComponent,
        canActivate: [AuthGuard]
      },
      {
        path:"management",
        component: ManagementComponent,
        canActivate: [AuthGuard],
        children: [
          {path:"students", title: MAIN_TITLE + 'Mi equipo', component: MyTeamComponent, canActivate: [AuthGuard]},
          // {path:"profiles", title: MAIN_TITLE + 'Nuevo perfil', component: ProfilesComponent, canActivate: [AuthGuard]},
          {path:"profiles/:id", title: MAIN_TITLE, component: ProfilesComponent, canActivate: [AuthGuard, ProfileGuard]},
          {path:"courses", title: MAIN_TITLE + 'Cursos', component: CoursesComponent, canActivate: [AuthGuard]},
          {path:"create-course/:mode/:idCurso", title: MAIN_TITLE + 'Crear / Editar curso', component: CreateCourseComponent, canActivate: [AuthGuard]},
          {path:"notifications", title: MAIN_TITLE + 'Notificaciones', component: NotificationsComponent, canActivate: [AuthGuard]},
          {path:"students/:uid", title: MAIN_TITLE + 'Mi equipo', component: StudentComponent, canActivate: [AuthGuard]},
        ]
      },
      {path:"validation", title: MAIN_TITLE + 'Validación de competencias', component: ValidationComponent, canActivate: [AuthGuard]},
      {path:"settings", title: MAIN_TITLE + 'Configuración', component: SettingsComponent, canActivate: [AuthGuard]},
      {path:"my-account", title: MAIN_TITLE + 'Mi cuenta', component: MyAccountComponent, canActivate: [AuthGuard]},
      {
        path: "admin",
        loadChildren: () => import("../admin/admin.module").then(m => m.AdminModule),
        canActivate: [SystemUserGuard]
      },
    ]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
    children: [
      // other non-authenticated routes like signup...
    ]
  },
  {
    path: 'init-script',
    component: InitScriptComponent
  },
  { path: '**', redirectTo: '', pathMatch: 'full' }, // Wildcard Route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 