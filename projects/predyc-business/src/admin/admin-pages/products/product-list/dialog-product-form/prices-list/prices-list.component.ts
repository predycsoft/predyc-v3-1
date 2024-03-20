import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DialogService } from 'projects/predyc-business/src/shared/services/dialog.service';
import { ProductService } from 'projects/predyc-business/src/shared/services/product.service';

@Component({
  selector: 'app-prices-list',
  templateUrl: './prices-list.component.html',
  styleUrls: ['./prices-list.component.css']
})
export class PricesListComponent {
  // @Input() selectedProductId: string;
  // @Output() viewChange: EventEmitter<Price | null> = new EventEmitter();

  // @Input() prices: Price[]
  // @Input() coupons: Coupon[]

  // selectedPrice: Price | null = null;

  // constructor(
  //   private priceService: PriceService,
  //   private productService: ProductService,
  //   private dialogService: DialogService,
  // ) {}

  // displayedColumns: string[] = [
  //   "price",
  //   "discountedPrice",
  //   "status",
  //   "freeTrial",
  //   "created",
  // ];

  // ngOnInit() {
  // }


  // createPrice() {
  //   if (this.selectedProductId) {
  //     let newPrice = Price.newPrice;
  //     newPrice.product = this.productService.getProductRefById(this.selectedProductId);
  //     this.editPrice(newPrice);
  //   } else {
  //     this.dialogService.dialogAlerta(
  //       'Debe seleccionar un producto para poder agregar un precio'
  //     );
  //   }
  // }

  // editPrice(price: Price) {
  //   this.selectedPrice = price;
  //   this.viewChange.emit(price);
  // }

  // getCoupon(couponId): Coupon[] {
  //   const coupon = this.coupons.find((x) => x.id == couponId);
  //   if (coupon) {
  //     return [coupon];
  //   } else {
  //     return [];
  //   }
  // }

  // reset(): void {
  //   this.selectedPrice = null;
  // }

  // async onSave(price: Price): Promise<void> {
  //   if (!price.id) {
  //     const newId = [
  //       `${price.product.id}`,
  //       `${price.amount}${price.currency}`,
  //       `${price.interval}`,
  //     ].join('-');
  //     price.id = newId;
  //   }
  //   try {
  //     await this.priceService.savePrice(price)
  //     this.reset();
  //   } catch (error) {
  //     this.dialogService.dialogAlerta(error);
  //   }
  // }

}