import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { parse } from 'date-fns';
import { SubscriptionInfo } from 'projects/predyc-business/src/admin/admin-pages/students/student-detail/student-subscription-list/student-subscription-list.component';
import { Product } from 'projects/shared/models/product.model';
import { Subscription as SubscriptionClass } from 'projects/shared/models/subscription.model';

@Component({
  selector: 'app-dialog-edit-subscription',
  templateUrl: './dialog-edit-subscription.component.html',
  styleUrls: ['./dialog-edit-subscription.component.css']
})
export class DialogEditSubscriptionComponent {

  constructor(
    private fb: FormBuilder,
    public matDialogRef: MatDialogRef<DialogEditSubscriptionComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: {
      subscription: SubscriptionInfo,
      products: Product[]
    },
  ){}

  form: FormGroup;
  subscriptionInfo: SubscriptionInfo
  products: Product[]
  statusChoices = SubscriptionClass.STATUS_CHOICES


  ngOnInit() {
    this.subscriptionInfo = this.data.subscription
    this.products = this.data.products
    this.setupForm()
  }

  async setupForm() {
    this.form = this.fb.group({
      currentPeriodStart: [null],
      status: [null],
      endedAt: [null],
      interval: [null],
    });

    this.form.patchValue({
      currentPeriodStart: this.toStringDate(new Date(this.subscriptionInfo.currentPeriodStart)),
      status: this.subscriptionInfo.status,
      interval: this.subscriptionInfo.interval,
      endedAt: this.subscriptionInfo.endedAt ? this.toStringDate(new Date(this.subscriptionInfo.endedAt)): null,
    });

    this.checkEndedAtAsRequired();

    this.form.get('status').statusChanges.subscribe(() => {
      this.checkEndedAtAsRequired();
    });

  }

  checkEndedAtAsRequired() {
    const statusControl = this.form.get('status');
    const endedAtControl = this.form.get('endedAt');
    if (statusControl.value === 'canceled') endedAtControl.setValidators(Validators.required);
    else endedAtControl.clearValidators();
    
    endedAtControl.updateValueAndValidity(); // Important to re-evaluate the control status
  }

  saveDates(): void {
    const parsedDate = this.toDate(this.form.get("currentPeriodStart").value);

    this.subscriptionInfo.changedAt = +new Date()

    if(this.form.get("status").value == 'canceled'){
      const parsedDateEnd = this.toDate(this.form.get("endedAt").value)
      this.subscriptionInfo.endedAt = +parsedDateEnd
      this.subscriptionInfo.canceledAt = +parsedDateEnd
      this.subscriptionInfo.currentPeriodStart = null
      this.subscriptionInfo.currentPeriodEnd = null
      this.subscriptionInfo.startedAt = null
      this.subscriptionInfo.nextPaymentDate = null

    }

    else {
      this.subscriptionInfo.currentPeriodStart = +parsedDate
      this.subscriptionInfo.nextPaymentDate = +parsedDate
      this.subscriptionInfo.endedAt = null;
      this.subscriptionInfo.canceledAt = null;
    }
  }

  private toStringDate(date: Date): string {
    return (date.getFullYear().toString() + '-'
      + ("0" + (date.getMonth() + 1)).slice(-2) + '-'
      + ("0" + (date.getDate())).slice(-2))
      + 'T' + date.toTimeString().slice(0, 5);
  }

  private toDate(date: string): Date {
    date = date.replace('T', '-');
    let parts = date.split('-');
    let timeParts = parts[3].split(':');
    return new Date(+parts[0], +parts[1] - 1, +parts[2], +timeParts[0], +timeParts[1]);

  }


  saveSubscription() {
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.saveDates()
      this.subscriptionInfo.interval = formValue.interval
      this.subscriptionInfo.status = formValue.status
      this.matDialogRef.close(this.subscriptionInfo);
    }
    else {
      console.error("El formulario no es valido")
    }


  }

  cancel() {
    this.matDialogRef.close()
  }


}
