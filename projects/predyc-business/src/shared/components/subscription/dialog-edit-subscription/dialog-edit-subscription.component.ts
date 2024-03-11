import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubscriptionInfo } from 'projects/predyc-business/src/admin/admin-pages/students/student-detail/student-subscription-list/student-subscription-list.component';
import { Price } from 'projects/shared/models/price.model';

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
      prices: Price[]
    },
  ){}

  form: FormGroup;
  subscriptionInfo: SubscriptionInfo
  prices: Price[]


  ngOnInit() {
    this.subscriptionInfo = this.data.subscription
    this.prices = this.data.prices
    this.setupForm()
  }

  async setupForm() {
    this.form = this.fb.group({
      currentPeriodStart: [null],
      status: [null],
      interval: [null],
      endedAt: [null],
    });

    this.form.patchValue({
      currentPeriodStart: this.toStringDate(new Date(this.subscriptionInfo.currentPeriodStart)),
      status: this.subscriptionInfo.status,
      interval: this.subscriptionInfo.interval,
      endedAt: this.subscriptionInfo.endedAt,
    });

  }

  // dateToString(numberDate: number):string{
  //   let date = new Date(numberDate)
  //   return date.getFullYear()+"-"+(date.getMonth() + 1).toFixed(0).padStart(2,'0')+"-"+date.getDate().toFixed(0).padStart(2,'0')
  // }

  // stringToNumberDate(stringDate: string): number{
  //   const [year, month, day] = stringDate.split("-")
  //   const numberDate = +new Date(month+"/"+day+"/"+year)
  //   return +new Date(numberDate)
  // }

  onDateChange(): void {
    // let parsedDate = this.toDate(this._date);
    // // check if date is valid first
    // if (parsedDate.getTime() != NaN) {
    //   this.subscription.currentPeriodStart = +parsedDate
    //   this.subscription.currentPeriodEnd = this.getPeriodEnd()
    // }
    // if(this.subscription.status == 'canceled'){
    //   let parsedDateEnd = this.toDate(this._dateCanceled)
    //   if (parsedDateEnd.getTime() != NaN) {
    //     console.log(parsedDateEnd)
    //     this.subscription.endedAt = +parsedDateEnd
    //     this.subscription.canceledAt = +parsedDateEnd
    //   }
    // }
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
    // new Date(year, month [, day [, hours[, minutes[, seconds[, ms]]]]])
    return new Date(+parts[0], +parts[1] - 1, +parts[2], +timeParts[0], +timeParts[1]);     // Note: months are 0-based

  }

  getPeriodEnd() {
    const date = new Date(this.subscriptionInfo.currentPeriodStart)
    if(!this.subscriptionInfo.priceInterval){
      return null
    }
    let day = date.getDate()
    let month = date.getMonth()
    let year = date.getFullYear()
    // let price = this.prices.find(x => x.id == this.subscriptionInfo.priceId)
    let newDay = 0
    let newMonth = 0
    let newYear = 0
    console.log("this.subscriptionInfo.priceInterval", this.subscriptionInfo.priceInterval)
    switch (this.subscriptionInfo.priceInterval) {
      case "month":
        newDay = day
        newMonth = month + 1
        newYear = year
        if (month == 11) {
          newMonth = 0
          newYear = newYear + 1
        }
        if (day > this.daysInMonth(newMonth + 1, newYear)) {
          newDay = this.daysInMonth(newMonth + 1, newYear)
        }
        this.subscriptionInfo.currentPeriodEnd = +new Date(newYear, newMonth, newDay) //
        return +new Date(newYear, newMonth, newDay)
      case "year":
        newDay = day
        newMonth = month
        newYear = year+1
        this.subscriptionInfo.currentPeriodEnd = +new Date(newYear, newMonth, newDay) //
        return +new Date(newYear, newMonth, newDay)
      default:
        this.subscriptionInfo.currentPeriodEnd = +new Date(newYear, newMonth, newDay) //
        return +new Date(2012, newMonth, newDay)
    }

  }

  daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  saveSubscription() {

  }

  cancel() {

  }


}
