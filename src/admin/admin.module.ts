import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { HomeComponent } from './admin-pages/home/home.component';
import { SharedModule } from 'src/shared/shared.module';
import { CreateDemoComponent } from './admin-pages/create-demo/create-demo.component';


@NgModule({
  declarations: [
    HomeComponent,
    CreateDemoComponent
  ],
  imports: [
    SharedModule,
    CommonModule,
    AdminRoutingModule,
  ]
})
export class AdminModule { }
