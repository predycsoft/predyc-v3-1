import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './admin-pages/home/home.component';
import { CreateDemoComponent } from './admin-pages/create-demo/create-demo.component';

const MAIN_TITLE = 'Predyc Admin - '

const routes: Routes = [
  {path:"", title: MAIN_TITLE + 'home',component: HomeComponent },
  {path:"create-demo", title: MAIN_TITLE + 'Crear demo', component: CreateDemoComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
