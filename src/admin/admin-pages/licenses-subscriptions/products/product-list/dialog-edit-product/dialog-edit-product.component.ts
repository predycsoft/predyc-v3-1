import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dialog-edit-product',
  templateUrl: './dialog-edit-product.component.html',
  styleUrls: ['./dialog-edit-product.component.css']
})
export class DialogEditProductComponent {
  @Input() product: any; // This will hold the passed product

  constructor() { }

  ngOnInit() {
    console.log("this.product", this.product)
  }
}
