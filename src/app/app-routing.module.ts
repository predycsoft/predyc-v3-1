import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SideNavComponent } from './sidenav/sidenav.component';
import { DashboardComponent } from './dashboard/dashboard.component'


const routes: Routes = [
  // {path:"", component: LoginComponent},
  {path:"", component: DashboardComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
 