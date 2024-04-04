import { Component, EventEmitter, Input, Output } from "@angular/core";
import {
	FormArray,
	FormBuilder,
	FormControl,
	FormGroup,
	Validators,
} from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { Product } from "projects/shared/models/product.model";

@Component({
	selector: "app-product-form",
	templateUrl: "./product-form.component.html",
	styleUrls: ["./product-form.component.css"],
})
export class ProductFormComponent {
	constructor(
		private fb: FormBuilder,
		public activeModal: NgbActiveModal,
		public icon: IconService
	) {}

	@Input() product: Product;
	@Output() onSave = new EventEmitter<any>();

	typeOptions = Product.TYPE_CHOICES;

	showAlertText = false;

	// Product features should be added dynamically
	productForm = this.fb.group({
		id: [""],
		name: ["", Validators.required],
		active: [true],
		autodeactivate: [false],
		amount: [0],
		description: [""],
		features: this.fb.array([]),
		accesses: this.fb.group({
			enableUserRadar: [false],
			enableStudyPlanView: [false],
			enableExtraCoursesView: [false],
			enableToTakeTest: [false],
			enableCreateParticularCourses: [false],
		}),
		type: [""],
		coursesQty: [null],
	});

	ngOnInit(): void {
		if (this.product.id) {
			this.product.features.forEach((_) => this.addFeature());
			this.productForm.patchValue(this.product);
		} else {
			this.productForm.patchValue({ type: Product.TYPE_INDEPEND });
		}
	}
	

	toggleProductActiveState(): void {
		this.productForm.controls.active.setValue(
			!this.productForm.controls.active.value
		);
	}

	get features(): FormArray {
		return <FormArray>this.productForm.get("features");
	}

	addFeature() {
		const feature = new FormGroup({
			text: new FormControl(""),
			isActive: new FormControl(false),
		});
		return this.features.push(feature);
	}

	removeFeature(index: number) {
		this.features.removeAt(index);
	}

	async onSubmit(): Promise<void> {
		if (this.productForm.valid) {
			this.onSave.emit(this.productForm.value);
		} else {
			this.showAlertText = true;
		}
	}
	
}
