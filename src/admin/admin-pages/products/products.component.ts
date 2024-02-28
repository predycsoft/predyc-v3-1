import { Component } from '@angular/core';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent {

  constructor(
    public icon: IconService,
  ) {}

  createNewProduct() {

  }

  createNewCoupon() {
    
  }
}