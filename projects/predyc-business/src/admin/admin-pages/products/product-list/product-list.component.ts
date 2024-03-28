import { Component, Input, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { ProductService } from "projects/predyc-business/src/shared/services/product.service";
import { stripeTimestampToNumberTimestamp } from "projects/shared/utils";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { DialogProductFormComponent } from "./dialog-product-form/dialog-product-form.component";
import { Product } from "projects/shared/models/product.model";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";

@Component({
	selector: "app-product-list",
	templateUrl: "./product-list.component.html",
	styleUrls: ["./product-list.component.css"],
})
export class ProductListComponent {
	constructor(
		private router: Router,
		private productService: ProductService,
		private activatedRoute: ActivatedRoute,
		private modalService: NgbModal,
		public icon: IconService
	) {}

	displayedColumns: string[] = ["name", "amount", "type", "created"];

	dataSource = new MatTableDataSource<Product>();

	@ViewChild(MatPaginator) paginator: MatPaginator;

	queryParamsSubscription: Subscription;
	pageSize: number = 7;
	totalLength: number;

	productSubscription: Subscription;

	showSaveButton: boolean = false;

	templateNewProduct = Product.fromJson(Product.newProduct) as Product;

	ngOnInit() {
		this.queryParamsSubscription =
			this.activatedRoute.queryParams.subscribe((params) => {
				const page = Number(params["page"]) || 1;
				this.performSearch(page);
			});
	}

	ngAfterViewInit() {
		this.dataSource.paginator = this.paginator;
		this.dataSource.paginator.pageSize = this.pageSize;
	}

	performSearch(page: number) {
		this.productSubscription = this.productService
			.getProducts$()
			.subscribe((products) => {
				this.paginator.pageIndex = page - 1;
				this.dataSource.data = products;
				this.totalLength = products.length;
			});
	}

	onPageChange(page: number): void {
		this.router.navigate([], {
			queryParams: { page },
			queryParamsHandling: "merge",
		});
	}

	async onSelect(selectedProduct: Product) {
		const modalRef = this.modalService.open(DialogProductFormComponent, {
			animation: true,
			centered: true,
			size: "md",
			backdrop: "static",
			keyboard: false,
			// windowClass: 'modWidth'
		});

		modalRef.componentInstance.product = selectedProduct;
	}

	ngOnDestroy() {
		if (this.queryParamsSubscription)
			this.queryParamsSubscription.unsubscribe();
	}
}
