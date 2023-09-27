import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './main-components/dashboard/dashboard.component'
import { ManagementComponent } from './main-components/management/management.component';
import { CoursesComponent } from './main-components/management/courses/courses.component';
import { ValidationComponent } from './main-components/validation/validation.component';
import { SettingsComponent } from './main-components/settings/settings.component';
import { DepartmentsProfilesComponent } from './main-components/management/departments-profiles/departments-profiles.component';
import { MyTeamComponent } from './main-components/management/my-team/my-team.component';
import { ManagementDashboardComponent } from './main-components/management/management-dashboard/management-dashboard.component';
import { NotificationsComponent } from './main-components/management/notifications/notifications.component'
import { StudentComponent } from './main-components/management/my-team/student/student.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { MainComponent } from './main-components/main.component';
import { CreateCourseComponent } from './main-components/management/create-course/create-course.component';
import { InitScriptComponent } from './shared/components/init-script/init-script.component';
import { MyAccountComponent } from './main-components/my-account/my-account.component';
import { CreateProfileComponent } from './main-components/management/create-profile/create-profile.component';

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
          {path:"", title: MAIN_TITLE +'Gestión de personal', component: ManagementDashboardComponent, canActivate: [AuthGuard]},
          {path:"courses", title: MAIN_TITLE + 'Cursos', component: CoursesComponent, canActivate: [AuthGuard]},
          {path:"create-course", title: MAIN_TITLE + 'Crear curso', component: CreateCourseComponent, canActivate: [AuthGuard]},
          {path:"departments-and-profiles", title: MAIN_TITLE + 'Departamentos y perfiles', component: DepartmentsProfilesComponent, canActivate: [AuthGuard]},
          {path:"notifications", title: MAIN_TITLE + 'Notificaciones', component: NotificationsComponent, canActivate: [AuthGuard]},
          {path:"students", title: MAIN_TITLE + 'Mi equipo', component: MyTeamComponent, canActivate: [AuthGuard]},
          {path:"students/:uid", title: MAIN_TITLE + 'Mi equipo', component: StudentComponent, canActivate: [AuthGuard]},
          {path:"create-profile/:id", title: MAIN_TITLE + 'Crear perfil', component: CreateProfileComponent, canActivate: [AuthGuard]},

        ]
      },
      {path:"validation", title: MAIN_TITLE + 'Validación de competencias', component: ValidationComponent, canActivate: [AuthGuard]},
      {path:"settings", title: MAIN_TITLE + 'Configuración', component: SettingsComponent, canActivate: [AuthGuard]},
      {path:"my-account", title: MAIN_TITLE + 'Mi cuenta', component: MyAccountComponent, canActivate: [AuthGuard]},
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
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 