import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { IconService } from '../../../services/icon.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { Product } from 'projects/shared/models/product.model';
import { License } from 'projects/shared/models/license.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dialog-create-license',
  templateUrl: './dialog-create-license.component.html',
  styleUrls: ['./dialog-create-license.component.css']
})
export class DialogCreateLicenseComponent {

  constructor(
    public matDialogRef: MatDialogRef<DialogCreateLicenseComponent>, 
    public icon: IconService,
    private fb: FormBuilder,
    private productService: ProductService,
    @Inject(MAT_DIALOG_DATA) public data: {
      products: Product[],
      dateStart: number
    },
  ) { }

  license: License

  products: Product[] = [];
  productId: string = '';
  dateStart: number
  form: FormGroup;

  combinedServicesSubscription: Subscription

  showAlertText = false

  formProductIdSubscription: Subscription
  formStartDateSubscription: Subscription

  showWarningDate = false

  statusChoices = License.STATUS_CHOICES
 

  ngOnInit(): void {
    this.license = License.fromJson({...License.getLicenseTemplate()})
    this.products = this.data.products
    this.dateStart = this.data?.dateStart
    this.initializeForm()
  }

  initializeForm() {
    this.form = this.fb.group({
      productId: ['', Validators.required],
      startDate: ['', ],
      endDate: ['',  Validators.required],
      quantity: [1, Validators.min(1)],
      rotations: [0, Validators.min(0)],
      status: ['', ],
    });

    if(this.dateStart){
      console.log(this.dateStart)
      this.license.startedAt = this.dateStart;
      this.showWarningDate = true
    }
    else{
      this.license.startedAt = Date.now();
      this.showWarningDate = false

    }

    this.license.id = Date.now().toString()


    this.form.patchValue({
      startDate: this.toDateString(new Date(this.license.startedAt)),
      quantity: this.license.quantity,
      rotations: this.license.rotations,
      status: this.license.status,
    })

    this.onDateChange(this.form.get('startDate').value);
    this.formStartDateSubscription = this.form.get('startDate').valueChanges.subscribe(value => {
      this.onDateChange(value);
    });

    this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
      this.productId = value;
    });
  }

  save(){
    if (this.form.valid) {
      // Process and save data
      const formValue = this.form.value;
      this.license.quantity = formValue.quantity;
      this.license.rotations = formValue.rotations;
      this.license.status = formValue.status
      this.license.productRef = this.productService.getProductRefById(formValue.productId)
      this.license.currentPeriodEnd = +this.parseDateString(formValue.endDate)
      // this.license.enterpriseRef Set in parent component

      this.matDialogRef.close(this.license);
    }
    else {
      this.showAlertText = true
    }
  }

  cancel(){
    this.matDialogRef.close()
  }

  private toDateString(date: Date): string {
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

  onDateChange(startedAt: string): void {
    let parsedDate: Date = this.parseDateString(startedAt);

    // check if date is valid first
    // if (parsedDate.getTime() != NaN) {
      this.license.startedAt = +parsedDate;
      this.license.currentPeriodStart = +parsedDate;
    // }
  }

  private parseDateString(date: string): Date {
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

  ngOnDestroy() {
    this.formProductIdSubscription.unsubscribe()
    this.formStartDateSubscription.unsubscribe()
  }

}