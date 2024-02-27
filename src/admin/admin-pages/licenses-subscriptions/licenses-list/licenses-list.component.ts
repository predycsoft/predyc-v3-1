import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { LicenseService } from 'src/shared/services/license.service';

interface LicensesInList {
  enterpriseName: string,
  product: string,
  date: number,
  acquired: number,
  used: number,
  avaliables: number,
  valid: number,
  status: string,
}

@Component({
  selector: 'app-licenses-list',
  templateUrl: './licenses-list.component.html',
  styleUrls: ['./licenses-list.component.css']
})
export class LicensesListComponent {

  constructor(
    private router: Router,
    private licenseService: LicenseService,
    private enterpriseService: EnterpriseService,
    private activatedRoute: ActivatedRoute,
  ){}

  displayedColumns: string[] = [
    "enterprise",
    "product",
    "date",
    "acquired",
    "used",
    "avaliables",
    "valid",
    "status",
  ];

  licenses$ = this.licenseService.getAllLicenses$()

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  queryParamsSubscription: Subscription
  pageSize: number = 4
  totalLength: number

  licensesSubscription: Subscription
  enterpriseSubscription: Subscription

  enterprises: Enterprise[]

  ngOnInit() {
    this.enterpriseSubscription = this.enterpriseService.getAllEnterprises$().subscribe(enterprises => {
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['licensePage']) || 1;
        // const searchTerm = params['search'] || '';
        this.performSearch(page, enterprises);
      })
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(page: number, enterprises: Enterprise[]) {
    this.licensesSubscription = this.licenseService.getAllLicenses$().subscribe(licenses => {
      const licensesInList: LicensesInList[] = licenses.map(license => {
        const enterprise = enterprises.find(enterprise => enterprise.id === license.enterpriseRef.id)
        return {
          enterpriseName: enterprise?.name,
          product: "Plan Predyc Empresa", //Check this
          date: license.currentPeriodStart,
          acquired: license.quantity,
          used: license.quantityUsed,
          avaliables: license.quantity - license.quantityUsed,
          valid: license.currentPeriodEnd,
          status: license.status
        }
      })
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = licensesInList
      this.totalLength = licensesInList.length;
    })

  }

  onPageChange(licensePage: number): void {
    this.router.navigate([], {
      queryParams: { licensePage },
      queryParamsHandling: 'merge'
    });
  }

  onSelect(subscription) {

  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

}