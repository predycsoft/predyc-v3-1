import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { LoginComponent } from './login/login.component';
// import { SideNavComponent } from './sidenav/sidenav.component';
import { DashboardComponent } from './dashboard/dashboard.component'
import { UserListComponent } from './users/user-list/user-list.component'
import { ManagementComponent } from './management/management.component';
import { CoursesComponent } from './courses/courses.component';
import { ValidationComponent } from './validation/validation.component';
import { SettingsComponent } from './settings/settings.component';
import { DepartmentsProfilesComponent } from './departments-profiles/departments-profiles.component';
import { MyTeamComponent } from './my-team/my-team.component';


const routes: Routes = [
  // {path:"", component: LoginComponent},
  {path:"", redirectTo: "/dashboard", pathMatch:"full"},
  {path:"dashboard", component: DashboardComponent},
  {path:"gestion", component: ManagementComponent},
  {path:"departamentos-perfiles", component: DepartmentsProfilesComponent},
  {path:"mi-equipo", component: MyTeamComponent},
  {path:"cursos", component: CoursesComponent},
  {path:"validacion", component: ValidationComponent},
  {path:"configuracion", component: SettingsComponent},
  {path:"users/user-list", component: UserListComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 