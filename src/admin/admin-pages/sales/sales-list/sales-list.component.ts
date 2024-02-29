import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { chargeData } from 'src/assets/data/charge.data';
import { Charge, ChargeJson } from 'src/shared/models/charges.model';
import { ChargeService } from 'src/shared/services/charge.service';
import { IconService } from 'src/shared/services/icon.service';

@Component({
  selector: 'app-sales-list',
  templateUrl: './sales-list.component.html',
  styleUrls: ['./sales-list.component.css']
})
export class SalesListComponent {

  constructor(
    private router: Router,
    private chargeService: ChargeService,
    private activatedRoute: ActivatedRoute,
    public icon: IconService,

  ){}

  displayedColumns: string[] = [
    "amount",
    "origin",
    "status",
    "product",
    "description",
    "client",
    "createdAt",
    "payAt",
    "refund",
  ];

  dataSource = new MatTableDataSource<Charge>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 8
  totalLength: number

  chargeSubscription: Subscription


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
    this.chargeSubscription = this.chargeService.getCharges$().subscribe(charges => {
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = charges
      this.totalLength = charges.length;
    })

  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getProductData(priceId: string): { IsACompanyProduct: boolean, name: string } {
    return { IsACompanyProduct: false, name: "Nombre producto" }
  }

  getCustomerEmail(priceId: string): string {
    const product = this.getProductData(priceId)
    if (product.IsACompanyProduct) return "Nombre de empresa"
    else return "Nombre de usuario "
  }

  getCustomerName(priceId: string): string {
    const product = this.getProductData(priceId)
    if (product.IsACompanyProduct) return "empresa@email.com"
    else return "usuario@email.com"
  }

  getDate(item: Charge): number | null {
    if (item.payAt) return item.payAt;
    if (item.status === 'succeeded' && item.createdAt) return item.createdAt;
    return null;
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }


  async createTestData() {
    const charges: Charge[] = chargeData.map(coupon => {return Charge.fromJson(coupon)})
    for (let charge of chargeData ) {
      await this.chargeService.saveCharge(charge as Charge)
    }
    console.log(`Finished Creating charges`)
  }
}
