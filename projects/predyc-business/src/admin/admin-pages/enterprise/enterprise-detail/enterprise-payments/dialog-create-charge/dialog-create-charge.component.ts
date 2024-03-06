import { Component, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Charge } from 'projects/predyc-business/src/shared/models/charges.model';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';

@Component({
  selector: 'app-dialog-create-charge',
  templateUrl: './dialog-create-charge.component.html',
  styleUrls: ['./dialog-create-charge.component.css']
})
export class DialogCreateChargeComponent {

  @Input() enterpriseRef: DocumentReference<Enterprise>;

  newCharge: Charge

  fechaString:any
productId: any;
products: any;

  ngOnInit() {
    this.newCharge = Charge.newChargeTemplate
    this.newCharge.customer = this.enterpriseRef
  }

  stringToDate() {

  }
  getFilteredPrice() {
    return []
  }
  getFilteredCoupons() {
    return [] 
  }

  getProduct() {
    
  }
  getAmount() {
    
  }
  updateCaptureAmount() {
    
  }
  saveCharge() {
    
  }
  cancel() {
    
  }
}
