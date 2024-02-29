import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent {
  
  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    public icon: IconService,
  ) {}

  @Input() product: any;
  @Output() onSave = new EventEmitter<any>();

  // Product features should be added dynamically
  productForm = this.fb.group({
    id: [''],
    name: [''],
    active: [true],
    description: [''],
    features: this.fb.array([]),
    stripeInfo: this.fb.group({ stripeId: [''], updatedAt: [null] }),
    paypalInfo: this.fb.group({ paypalId: [''], updatedAt: [null] }),
    priority: [null],
    acceptsStripe: [false],
    acceptsBankTransfer: [false],
    acceptsZelle: [false],
    acceptsPaypal: [false],
    canEnrollByHimself: [true],
    canEnrollPrograms: [true],
    //
    isACompanyProduct: [true],
  });

  ngOnInit(): void {
    // console.log("this.product", this.product)
    if (this.product.id) {
      this.product.features.forEach((_) => this.addFeature());
      this.productForm.patchValue(this.product);
    }

  }

  toggleProductActiveState(): void {
    this.productForm.controls.active.setValue(
      !this.productForm.controls.active.value
    );
  }

  get features(): FormArray {
    return <FormArray>this.productForm.get('features');
  }

  addFeature() {
    const feature = new FormGroup({
      text: new FormControl(''),
      isActive: new FormControl(false),
    });
    return this.features.push(feature);
  }

  removeFeature(index: number) {
    this.features.removeAt(index);
  }

  async onSubmit(): Promise<void> {
    this.onSave.emit(this.productForm.value);
  }



}
