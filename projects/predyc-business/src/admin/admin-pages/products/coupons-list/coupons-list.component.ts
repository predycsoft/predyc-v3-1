import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DialogCouponFormComponent } from './dialog-coupon-form/dialog-coupon-form.component';

@Component({
  selector: 'app-coupons-list',
  templateUrl: './coupons-list.component.html',
  styleUrls: ['./coupons-list.component.css']
})
export class CouponsListComponent {

  // constructor(
  //   private router: Router,
  //   private activatedRoute: ActivatedRoute,
  //   private couponService: CouponService,
  //   public icon: IconService,
  //   private modalService: NgbModal,

  // ){}

  // displayedColumns: string[] = [
  //   "name",
  //   "id",
  //   "discount",
  //   "status",
  // ];

  // dataSource = new MatTableDataSource<Coupon>();

  // @ViewChild(MatPaginator) paginator: MatPaginator;
  // @Input() enableNavigateToUser: boolean = true

  // queryParamsSubscription: Subscription
  // pageSize: number = 7
  // totalLength: number

  // couponSubscription: Subscription

  // templateNewCoupon: Coupon = Coupon.fromJson({...Coupon.getCouponTemplate()})


  // ngOnInit() {
  //   this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
  //     const page = Number(params['page']) || 1;
  //     this.performSearch(page);
  //   })
  // }


  // ngAfterViewInit() {
  //   this.dataSource.paginator = this.paginator;
  //   this.dataSource.paginator.pageSize = this.pageSize;
  // }

  // performSearch(page: number) {
  //   this.couponSubscription = this.couponService.getCoupons$().subscribe(coupons => {
  //     this.paginator.pageIndex = page - 1;
  //     this.dataSource.data = coupons
  //     this.totalLength = coupons.length;
  //   })

  // }

  // onPageChange(page: number): void {
  //   this.router.navigate([], {
  //     queryParams: { page },
  //     queryParamsHandling: 'merge'
  //   });
  // }

  // async onSelect(selectedCoupon: Coupon) {
  //   const modalRef = this.modalService.open(DialogCouponFormComponent, {
  //     animation: true,
  //     centered: true,
  //     size: 'l',
  //     backdrop: 'static',
  //     keyboard: false ,
  //   })
    
  //   modalRef.componentInstance.coupon = selectedCoupon;

  // }

  // OnGetDiscountText(coupon: Coupon){
  //   return Coupon.fromJson(coupon).getDiscountText()
  // }

  // ngOnDestroy() {
  //   if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  // }

}