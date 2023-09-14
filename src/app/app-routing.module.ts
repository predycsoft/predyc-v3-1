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

const MAIN_TITLE = 'Predyc - '

const routes: Routes = [
  {path:"", component: LoginComponent},
  // {path:"", redirectTo: "/dashboard", pathMatch:"full"},
  {path:"dashboard", title: MAIN_TITLE + 'Dashboard',component: DashboardComponent},
  {
    path:"management",
    component: ManagementComponent,
    children: [
      {path:"", title: MAIN_TITLE +'Gestión de personal', component: ManagementDashboardComponent},
      {path:"courses", title: MAIN_TITLE + 'Cursos', component: CoursesComponent},
      {path:"departments-and-profiles", title: MAIN_TITLE + 'Departamentos y perfiles', component: DepartmentsProfilesComponent},
      {path:"notifications", title: MAIN_TITLE + 'Notificaciones', component: NotificationsComponent},
      {path:"students", title: MAIN_TITLE + 'Mi equipo', component: MyTeamComponent},
      {path:"students/:uid", title: MAIN_TITLE + 'Mi equipo', component: StudentComponent},
    ]
  },
  {path:"validation", title: MAIN_TITLE + 'Validación de competencias', component: ValidationComponent},
  {path:"settings", title: MAIN_TITLE + 'Configuración', component: SettingsComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 