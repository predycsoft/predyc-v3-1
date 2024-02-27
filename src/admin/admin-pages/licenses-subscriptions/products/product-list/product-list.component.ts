import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { ProductService } from 'src/shared/services/product.service';
import { stripeTimestampToNumberTimestamp } from 'src/shared/utils';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogProductFormComponent } from './dialog-product-form/dialog-product-form.component';
import { Product } from 'src/shared/models/product.model';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { DialogService } from 'src/shared/services/dialog.service';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent {

  constructor(
    private router: Router,
    private productService: ProductService,
    private activatedRoute: ActivatedRoute,
    private modalService: NgbModal,
    private fireFunctions: AngularFireFunctions,
    private dialogService: DialogService,
    public icon: IconService,

  ){}

  displayedColumns: string[] = [
    "name",
    "priority",
    "created",
    "updated",
  ];

  dataSource = new MatTableDataSource<Product>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 7
  totalLength: number

  productSubscription: Subscription

  showSaveButton: boolean = false;

  originalPriorities = new Map<string, number>();

  templateNewProduct = Product.newProduct as Product

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      this.performSearch(page);
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(page: number) {
    this.productSubscription = this.productService.getProducts$().subscribe(products => {
      products.forEach(product => {
        this.originalPriorities.set(product.id, product.priority);
      })
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = products
      this.totalLength = products.length;
    })

  }

  OnStripeTimestampToNumberTimestamp(product: Product): number {
    return stripeTimestampToNumberTimestamp(product.stripeInfo.updatedAt)
  }

  onPriorityChange(product: Product) {
    this.showSaveButton = true;
    // here we can check if all the priorities are as the initial state and hide the button
  }

  async savePriorities() {
    this.dataSource.data.forEach(async product => {
      const originalPriority = this.originalPriorities.get(product.id);
      if (product.priority !== originalPriority) {
        await this.productService.updateProductPriority(product.id, product.priority)
        // console.log(product.name, "priority updated")
      }
    });
    this.showSaveButton = false;
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  async onSelect(selectedProduct: Product) {
    const modalRef = this.modalService.open(DialogProductFormComponent, {
      animation: true,
      centered: true,
      size: 'xl',
      backdrop: 'static',
      keyboard: false ,
    })
    
    modalRef.componentInstance.product = selectedProduct;

    modalRef.componentInstance.onSave.subscribe(async (product: any) => {
      // Create or update given product an add to products array
      if (!product.id) {
        const newId = product.name.split(' ').join('-');
        product.id = newId;
      }
      try {
        await this.productService.saveProduct(product)
        // UNCOMMENT
        // const promises = [
        //   this.getSyncStripeFunction(product),
        //   this.getSyncPaypalFunction(product),
        // ];
        // const _ = await Promise.all(promises);
      } catch (error) {
        this.dialogService.dialogAlerta(error);
      }
    });
  }

  getSyncStripeFunction(product: Product): Promise<void> {
    let syncStripeFunction = null;
    if (!product.stripeInfo.stripeId) {
      syncStripeFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('createStripeProduct')(product)
      );
    } else {
      syncStripeFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('updateStripeProduct')(product)
      );
    }
    return syncStripeFunction;
  }

  getSyncPaypalFunction(product: Product): Promise<void> {
    let syncPaypalFunction = null;
    if (!product.paypalInfo.paypalId) {
      syncPaypalFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('createPaypalProduct')(product)
      );
    }
    else {
      syncPaypalFunction = firstValueFrom(
        this.fireFunctions.httpsCallable('updatePaypalProduct')(product)
      );
    }
    return syncPaypalFunction;
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

}
