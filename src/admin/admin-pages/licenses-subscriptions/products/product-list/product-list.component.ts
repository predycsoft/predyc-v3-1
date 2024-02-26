import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from 'src/shared/services/product.service';
import { stripeTimestampToNumberTimestamp } from 'src/shared/utils';

interface ProductsInList {
  name: string,
  priority: number,
  created: number,
  updated: number,
  id: string,
}

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
  ){}

  displayedColumns: string[] = [
    "name",
    "priority",
    "created",
    "updated",
  ];

  dataSource = new MatTableDataSource<ProductsInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 7
  totalLength: number

  productSubscription: Subscription

  showSaveButton: boolean = false;

  originalPriorities = new Map<string, number>();


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
      const productsInList: ProductsInList[] = products.map(product => {
        this.originalPriorities.set(product.id, product.priority);
        return {
          name: product.name,
          priority: product.priority,
          created: 0, //check this
          updated: stripeTimestampToNumberTimestamp(product.stripeInfo.updatedAt),
          id: product.id, 
        }
      })
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = productsInList
      this.totalLength = productsInList.length;
    })

  }

  onPriorityChange(product: ProductsInList) {
    this.showSaveButton = true;
    // You might also want to track which products have changed if you need to save selectively
  }

  async savePriorities() {
    this.dataSource.data.forEach(async product => {
      const originalPriority = this.originalPriorities.get(product.id);
      if (product.priority !== originalPriority) {
        await this.productService.updateProductPriority(product.id, product.priority)
        console.log(product.name, "priority updated")
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

  onSelect(subscription) {

  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

}
