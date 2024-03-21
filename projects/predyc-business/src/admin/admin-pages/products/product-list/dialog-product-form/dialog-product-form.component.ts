import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';
import { Product } from 'projects/shared/models/product.model';

@Component({
  selector: 'app-dialog-product-form',
  templateUrl: './dialog-product-form.component.html',
  styleUrls: ['./dialog-product-form.component.css']
})
export class DialogProductFormComponent {
  
  constructor(
    public activeModal: NgbActiveModal,
    public icon: IconService,
    public productService: ProductService,
    public dialogService: DialogService,
  ) {}

  @Input() product: Product;

  combinedServicesSubscription: Subscription


  ngOnInit(): void {
  }

  async onSubmit(product): Promise<void> {
    if (!product.id) {
      const newId = product.name.split(' ').join('-');
      product.id = newId;
    }
    try {
      await this.productService.saveProduct(product)
    } catch (error) {
      this.dialogService.dialogAlerta(error);
    }
    this.closeDialog();
  }

  closeDialog() {
    this.activeModal.dismiss('Cross click');
  }

  // handleViewChange(price: Price | null): void {
  //   this.showPriceForm = price !== null;
  //   this.selectedPrice = price
  // }


}

