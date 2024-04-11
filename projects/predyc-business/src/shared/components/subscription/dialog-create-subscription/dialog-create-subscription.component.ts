import { Component, Inject, Input,HostListener } from '@angular/core';
import { Product } from 'projects/shared/models/product.model';
import { Subscription as SubscriptionClass, SubscriptionJson } from 'projects/shared/models/subscription.model';
import { UserService } from '../../../services/user.service';
//import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { ProductService } from '../../../services/product.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from '../../../services/icon.service';


@Component({
  selector: 'app-dialog-create-subscription',
  templateUrl: './dialog-create-subscription.component.html',
  styleUrls: ['./dialog-create-subscription.component.css']
})
export class DialogCreateSubscriptionComponent {
  constructor(
    private fb: FormBuilder,
    private dialogRef: NgbModal,
    //private dialogRef: MatDialogRef<DialogCreateSubscriptionComponent>,
    private userService: UserService,
    private productService: ProductService,
    private activeModal: NgbActiveModal,
		public icon: IconService,


  ) {}


  @Input() data = null


  subscription: SubscriptionClass = new SubscriptionClass();
  products: Product[] = [];
  enterpriseRef: DocumentReference<Enterprise>;

  selectedProduct: Product

  productId: string = '';

  form: FormGroup;
  formProductIdSubscription: Subscription

  showAlertText = false

  ngOnInit(): void {
    console.log(this.data)
    if(!this.data.subscription){
      this.subscription = SubscriptionClass.fromJson({...SubscriptionClass.getSubscriptionTemplate()})
      this.subscription.userRef = this.userService.getUserRefById(this.data.userId)
    }
    else{
      this.subscription = SubscriptionClass.fromJson({...this.data.subscription})
      this.subscription.userRef = this.userService.getUserRefById(this.data.userId)
    }

    this.products = this.data.products
    this.enterpriseRef = this.data.enterpriseRef

    this.initForm(this.data.subscription)
  }

  initForm(data = null) {

    if(!data){
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
    else{
      console.log('data',data)

      this.form = this.fb.group({
        startedAt: [this.formatDate(data.currentPeriodStart)],
        currentPeriodEnd: [this.formatDate(data.currentPeriodEnd), Validators.required],
        productId: [data.productRef.id, Validators.required],
      });

      this.productId = data.productRef.id

      this.selectedProduct = this.products.find(product => product.id === this.productId)

      console.log('form',this.form)

      this.formProductIdSubscription = this.form.get('productId')!.valueChanges.subscribe(value => {
        this.productId = value;
        this.selectedProduct = this.products.find(product => product.id === this.productId)
      });

    }

    


  }
  // Función para formatear la fecha a YYYY-MM-DD
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = this.padTo2Digits(date.getMonth() + 1);
    const day = this.padTo2Digits(date.getDate());

    return `${year}-${month}-${day}`;
  }

  // Función auxiliar para asegurar que el mes y el día siempre tengan dos dígitos
  private padTo2Digits(num: number): string {
    return num.toString().padStart(2, '0');
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

  private toDate(dateStr: string): Date {
    // Parsea la fecha a componentes
    let [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
  
    // Crea un objeto Date en el último momento del día indicado
    let date = new Date(year, month - 1, day, 23, 59, 59, 999);
  
    return date;
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
      this.activeModal.close(this.subscription);

    }
    else {
      console.log('invalid')
      this.showAlertText = true
    }

  }

  cancel(): void {
    this.activeModal.close();
  }

  dismiss() {
		this.activeModal.dismiss("User closed modal");
	}

  @HostListener('document:keydown.escape', ['$event']) 
  onKeydownHandler(event: KeyboardEvent) {
    this.dismiss();
  }

}

