import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CouponService } from 'src/shared/services/coupon.service';
import { Coupon } from 'src/shared/models/coupon.model'
import { IconService } from 'src/shared/services/icon.service';


interface CouponsInList {
  name: string,
  id: string,
  discount: string,
  status: string,

}

@Component({
  selector: 'app-coupons-list',
  templateUrl: './coupons-list.component.html',
  styleUrls: ['./coupons-list.component.css']
})
export class CouponsListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private couponService: CouponService,
    public icon: IconService,

  ){}

  displayedColumns: string[] = [
    "name",
    "id",
    "discount",
    "status",
  ];

  dataSource = new MatTableDataSource<CouponsInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 7
  totalLength: number

  productSubscription: Subscription


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
    this.productSubscription = this.couponService.getCoupons$().subscribe(coupons => {
      const couponsInList: CouponsInList[] = coupons.map(coupon => {
        return {
          name: coupon.name,
          id: coupon.id,
          discount: Coupon.fromJson(coupon).getDiscountText(), 
          status: coupon.active ? 'Activo' : 'Inactivo',
        }
      })
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = couponsInList
      this.totalLength = couponsInList.length;
    })

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