import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { LoginComponent } from './login/login.component';
// import { SideNavComponent } from './sidenav/sidenav.component';
import { DashboardComponent } from './main-components/dashboard/dashboard.component'
import { StudentListComponent } from './shared/components/users/student-list/student-list.component'
import { ManagementComponent } from './main-components/management/management.component';
import { CoursesComponent } from './main-components/management/courses/courses.component';
import { ValidationComponent } from './main-components/validation/validation.component';
import { SettingsComponent } from './main-components/settings/settings.component';
import { DepartmentsProfilesComponent } from './main-components/management/departments-profiles/departments-profiles.component';
import { MyTeamComponent } from './main-components/management/my-team/my-team.component';
import { ManagementDashboardComponent } from './main-components/management/management-dashboard/management-dashboard.component';
import { NotificationsComponent } from './shared/components/notifications/notifications.component'
import { StudentComponent } from './main-components/management/my-team/student/student.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './shared/guards/auth.guard';

const MAIN_TITLE = 'Predyc - '

const routes: Routes = [
  {path:"", component: LoginComponent, canActivate: [AuthGuard]},
  // {path:"", redirectTo: "/dashboard", pathMatch:"full"},
  {
    path:"dashboard",
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
      {path:"departments-and-profiles", title: MAIN_TITLE + 'Departamentos y perfiles', component: DepartmentsProfilesComponent, canActivate: [AuthGuard]},
      {path:"notifications", title: MAIN_TITLE + 'Notificaciones', component: NotificationsComponent, canActivate: [AuthGuard]},
      {path:"students", title: MAIN_TITLE + 'Mi equipo', component: MyTeamComponent, canActivate: [AuthGuard]},
      {path:"students/:uid", title: MAIN_TITLE + 'Mi equipo', component: StudentComponent, canActivate: [AuthGuard]},
    ]
  },
  {path:"validation", title: MAIN_TITLE + 'Validación de competencias', component: ValidationComponent, canActivate: [AuthGuard]},
  {path:"settings", title: MAIN_TITLE + 'Configuración', component: SettingsComponent, canActivate: [AuthGuard]},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 