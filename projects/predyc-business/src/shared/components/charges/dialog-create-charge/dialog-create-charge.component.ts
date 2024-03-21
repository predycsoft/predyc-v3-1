import { Component, Inject, Input } from '@angular/core';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Charge } from 'projects/shared/models/charges.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Subscription } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-dialog-create-charge',
  templateUrl: './dialog-create-charge.component.html',
  styleUrls: ['./dialog-create-charge.component.css']
})
export class DialogCreateChargeComponent {

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    public matDialogRef: MatDialogRef<DialogCreateChargeComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: {
      customerRef: DocumentReference<Enterprise | User>,
      products: Product[],
    },
  ){}
  products: Product[] = [];

  form: FormGroup;

  selectedProduct: Product

  newCharge: Charge = null

  fechaString:any
  productId: any;

  formProductIdSubscription: Subscription

  showAlertText = false

  statusChoices = Charge.STATUS_CHOICES


  ngOnInit() {
    this.newCharge = Charge.fromJson({...Charge.getChargeTemplate()})
    this.newCharge.id = "ch_pre_" + Date.now().toString(),
    this.newCharge.customer = this.data.customerRef
    this.products = this.data.products
    this.initializeForm()
  }

  initializeForm() {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      startDate: [this.dateToString(this.newCharge.createdAt)],
      payAt: [this.newCharge.payAt],
      interval: [this.newCharge.interval, Validators.min(1)],
      quantity: [this.newCharge.quantity, Validators.min(1)],
      comment: [this.newCharge.comment],
      amount: [this.newCharge.amount, Validators.min(0)],
      amountCaptured: [{value: this.newCharge.amountCaptured, disabled: this.newCharge.via !== 'Predyc'}, Validators.min(0)],
      amountRefunded: [{value: this.newCharge.amountRefunded, disabled: this.newCharge.via !== 'Predyc'}, Validators.min(0)],
      description: [{value: this.newCharge.description, disabled: this.newCharge.via !== 'Predyc'}],
      paymentMethod: [{value: this.newCharge.paymentMethod, disabled: this.newCharge.via !== 'Predyc'}, Validators.required],
      status: [{value: this.newCharge.status, disabled: this.newCharge.via !== 'Predyc'}],
    });

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.productId = value;
      this.selectedProduct = this.products.find(product => product.id === this.productId)
    });
  }

  dateToString(numberDate: number):string{
    let date = new Date(numberDate)
    return date.getFullYear()+"-"+(date.getMonth() + 1).toFixed(0).padStart(2,'0')+"-"+date.getDate().toFixed(0).padStart(2,'0')
  }

  stringToNumberDate(stringDate: string): number{
    const [year, month, day] = stringDate.split("-")
    const numberDate = +new Date(month+"/"+day+"/"+year)
    return +new Date(numberDate)
  }

  getAmount() {
    this.newCharge.amount = this.calculateAmount()
    this.updateCaptureAmountAnPayAt()
  }

  // ARREGLAR
  calculateAmount(): number {
    return this.selectedProduct.amount*this.form.get('interval').value*this.form.get('quantity').value
  }

  updateCaptureAmountAnPayAt() {
    if(this.form.get('status').value == Charge.STATUS_SUCCEEDED){
      this.form.get('amountCaptured')!.setValue(this.newCharge.amount)
      this.form.get('payAt')!.setValue(this.dateToString(this.newCharge.createdAt))
    }
    else {
      this.form.get('amountCaptured')!.setValue(0)
      this.form.get('payAt')!.setValue(null)   
    } 
  }

  cancel() {
    this.matDialogRef.close()
  }

  save(){
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.newCharge.createdAt = this.stringToNumberDate(formValue.startDate);
      this.newCharge.payAt = formValue.status === Charge.STATUS_SUCCEEDED ? this.stringToNumberDate(formValue.payAt) : null
      this.newCharge.quantity = formValue.quantity;
      this.newCharge.status = formValue.status
      this.newCharge.interval = formValue.interval
      this.newCharge.comment = formValue.comment
      this.newCharge.amountCaptured = formValue.amountCaptured
      this.newCharge.amountRefunded = formValue.amountRefunded
      this.newCharge.description = formValue.description
      this.newCharge.paymentMethod = formValue.paymentMethod
      this.newCharge.productRef = this.productService.getProductRefById(formValue.productId)

      this.matDialogRef.close(this.newCharge);
    }
    else {
      this.showAlertText = true
    }
  }

  ngOnDestroy() {
    this.formProductIdSubscription.unsubscribe()
  }
}
