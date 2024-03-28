import { Component } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { MatTabChangeEvent } from '@angular/material/tabs';


@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent {

  constructor(
    public icon: IconService,
  ) {}



  currentTab = 'Disponibles'

  onTabChange(event : MatTabChangeEvent) {
    this.currentTab = 'Disponibles'
    if(event.tab.textLabel == 'Cupones') {
      this.currentTab = 'Cupones'

    }

  }
}