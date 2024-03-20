import { Component, Inject } from '@angular/core';
import { Product } from 'projects/shared/models/product.model';
import { Subscription as SubscriptionClass, SubscriptionJson } from 'projects/shared/models/subscription.model';
import { UserService } from '../../../services/user.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/shared/models/enterprise.model';

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
  priceId: string = '';
  couponId: string = '';

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
      productId: ['', Validators.required],
      interval: [null]
    });

    this.form.patchValue({
      startedAt: this.toStringDate(new Date(this.subscription.startedAt)),
      interval: this.subscription.interval,
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

    // check if date is valid first
      this.subscription.startedAt = +parsedDate;
      this.subscription.currentPeriodStart = +parsedDate;
      // this.subscription.currentPeriodEnd = this.getPeriodEnd();
  }

  getCurrentTimes() {
    // this.subscription.currentPeriodEnd = this.getPeriodEnd();
    this.subscription.nextPaymentDate = this.subscription.currentPeriodEnd
    this.showAlertText = false
  }

  getPeriodEnd() {
    const date = new Date(this.subscription.currentPeriodStart);
    // const currentPriceId = this.form.get("priceId").value
    // if (!currentPriceId) {
    //   return null;
    // }
    // let day = date.getDate();
    // let month = date.getMonth();
    // let year = date.getFullYear();
    // let newDay = 0;
    // let newMonth = 0;
    // let newYear = 0;
    // switch (price.interval) {
    //   case 'month':
    //     newDay = day;
    //     newMonth = month + 1;
    //     newYear = year;
    //     if (month == 11) {
    //       newMonth = 0;
    //       newYear = newYear + 1;
    //     }
    //     if (day > this.daysInMonth(newMonth + 1, newYear)) {
    //       newDay = this.daysInMonth(newMonth + 1, newYear);
    //     }
    //     return +new Date(newYear, newMonth, newDay);
    //   case 'year':
    //     newDay = day;
    //     newMonth = month;
    //     newYear = year + 1;
    //     return +new Date(newYear, newMonth, newDay);
    //   default:
    //     return +new Date(newYear, newMonth, newDay);
    // }
  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  saveSubscription() {
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.subscription.interval = formValue.interval
      this.subscription.enterpriseRef = this.enterpriseRef
      // this.subscription.nextPaymentAmount = this.getAmount()

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

