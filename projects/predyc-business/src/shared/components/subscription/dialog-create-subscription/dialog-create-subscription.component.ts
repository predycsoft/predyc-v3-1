import { Component, Inject } from '@angular/core';
import { Product } from 'projects/shared/models/product.model';
import { Subscription as SubscriptionClass, SubscriptionJson } from 'projects/shared/models/subscription.model';
import { UserService } from '../../../services/user.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { ProductService } from '../../../services/product.service';

@Component({
  selector: 'app-dialog-create-subscription',
  templateUrl: './dialog-create-subscription.component.html',
  styleUrls: ['./dialog-create-subscription.component.css']
})
export class DialogCreateSubscriptionComponent {
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DialogCreateSubscriptionComponent>,
    private userService: UserService,
    private productService: ProductService,

    @Inject(MAT_DIALOG_DATA) public data: {
      userId: string,
      products: Product[],
      enterpriseRef: DocumentReference<Enterprise>
    }
  ) {}

  subscription: SubscriptionClass = new SubscriptionClass();
  products: Product[] = [];
  enterpriseRef: DocumentReference<Enterprise>;

  selectedProduct: Product

  productId: string = '';

  form: FormGroup;
  formProductIdSubscription: Subscription

  showAlertText = false

  ngOnInit(): void {
    this.subscription = SubscriptionClass.fromJson({...SubscriptionClass.getSubscriptionTemplate()})
    this.subscription.userRef = this.userService.getUserRefById(this.data.userId)
    // this.subscription.id = 'PRE_' + +new Date()
    // this.subscription.idAtOrigin = 'PRE_' + +new Date()
    // this.subscription.enterpriseRef

    this.products = this.data.products
    this.enterpriseRef = this.data.enterpriseRef

    this.initForm()
  }

  initForm() {
    this.form = this.fb.group({
      startedAt: [null],
      currentPeriodEnd: [null,  Validators.required],
      productId: ['', Validators.required],
    });

    this.form.patchValue({
      startedAt: this.toStringDate(new Date(this.subscription.startedAt)),
    });

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.productId = value;
      this.selectedProduct = this.products.find(product => product.id === this.productId)
    });

  }


  private toStringDate(date: Date): string {
    return (
      date.getFullYear().toString() +
      '-' +
      ('0' + (date.getMonth() + 1)).slice(-2) +
      '-' +
      ('0' + date.getDate()).slice(-2) +
      'T' +
      date.toTimeString().slice(0, 5)
    );
  }

  private toDate(date: string): Date {
    date = date.replace('T', '-');
    let parts = date.split('-');
    let timeParts = parts[3].split(':');

    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(
      +parts[0],
      +parts[1] - 1,
      +parts[2],
      +timeParts[0],
      +timeParts[1]
    ); // Note: months are 0-based
  }

  onDateChange(): void {
    let parsedDate = this.toDate(this.form.get("startedAt").value);

      this.subscription.startedAt = +parsedDate;
      this.subscription.currentPeriodStart = +parsedDate;
  }

  saveSubscription() {
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.subscription.currentPeriodEnd = +this.toDate(formValue.currentPeriodEnd)
      this.subscription.nextPaymentDate = this.subscription.currentPeriodEnd
      this.subscription.enterpriseRef = this.enterpriseRef
      this.subscription.productRef = this.productService.getProductRefById(formValue.productId)
      this.subscription.nextPaymentAmount = this.selectedProduct.amount
      console.log("this.subscription", this.subscription)

      this.dialogRef.close(this.subscription);
    }
    else {
      this.showAlertText = true
    }

  }

  cancel(): void {
    this.dialogRef.close();
  }

}

