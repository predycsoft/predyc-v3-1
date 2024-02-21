import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainAdminComponent } from './admin-pages/main-admin.component';
import { HomeComponent } from './admin-pages/home/home.component';
import { SystemUserGuard } from './guards/systemUser.guard';
import { CreateDemoComponent } from './admin-pages/create-demo/create-demo.component';

const MAIN_TITLE = 'Predyc Admin - '

const routes: Routes = [
  {
    path: 'admin',
    component: MainAdminComponent,
    canActivate: [SystemUserGuard],
    children: [
      // Authenticated routes...
      {path:"",title: MAIN_TITLE + 'home',component: HomeComponent },
      {path:"/create-demo", title: MAIN_TITLE + 'Crear demo', component: CreateDemoComponent},
      // {path:"test",title: MAIN_TITLE + 'test',component: TestComponent, canActivate: [AdminPredycGuard] },
      // {path:"validation", title: MAIN_TITLE + 'Validación de competencias', component: ValidationComponent, canActivate: [AuthGuard]},
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
