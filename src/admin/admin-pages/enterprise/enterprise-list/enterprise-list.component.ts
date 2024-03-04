import { Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, map, of, switchMap } from 'rxjs';
import { License } from 'src/shared/models/license.model';
import { User } from 'src/shared/models/user.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { UserService } from 'src/shared/services/user.service';

interface EnterpriseInfo {
  name: string
  photoUrl: string
  userQty: number
  totalLicenses: number
  availableLicenses: number
  availableRotations: number
  rotacionWarningCount: number
  expirationDate: Date
}

@Component({
  selector: 'app-enterprise-list',
  templateUrl: './enterprise-list.component.html',
  styleUrls: ['./enterprise-list.component.css']
})
export class EnterpriseListComponent {

  displayedColumns: string[] = [
    'name',
    'userQty',
    'availableLicenses',
    'inUseLicenses',
    'rotations',
    'expirationDate',
  ];

  dataSource = new MatTableDataSource<EnterpriseInfo>();
  pageSize: number = 8
  totalLength: number

  @ViewChild(MatPaginator) paginator: MatPaginator;

  queryParamsSubscription: Subscription
  enterpriseSubscription: Subscription

  constructor(
    private activatedRoute: ActivatedRoute,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private router: Router
  ) {}

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      const searchTerm = params['search'] || '';
      this.performSearch(searchTerm, page);
    })
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  performSearch(searchTerm: string, page: number) {
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe()
    this.enterpriseSubscription = this.enterpriseService.getEnterprises$(searchTerm).pipe(
      // Users Qty
      switchMap(enterprises => {
        // For each enterprise, query their active students
        const observables = enterprises.map(enterprise => {
          const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterprise.id)
          return this.afs.collection<User>(User.collection, ref => ref.where('enterprise', '==', enterpriseRef)).valueChanges()
            .pipe(
              map(users => ({enterprise, userQty: users.length})),
            )
        });
        return observables.length > 0 ? combineLatest(observables) : of([])
      }),
      // License Information
      switchMap(enterprisesInfo => {
        const observables = enterprisesInfo.map(enterpriseInfo => {
          const enterpriseRef = this.enterpriseService.getEnterpriseRefById(enterpriseInfo.enterprise.id)          
          return this.afs.collection<License>(License.collection, ref => ref.where('enterpriseRef', '==', enterpriseRef).orderBy('createdAt', 'desc')).valueChanges()
            .pipe(
              map(licenses => {
                let totalLicenses = 0
                let rotationsWaitingCount = 0
                let availableLicenses = 0
                let availableRotations = 0
                let rotacionWarningCount = 0
                let expirationDate = null
                licenses.forEach(license => {
                  if (license.status !== 'active') return
                  totalLicenses += license.quantity
                  rotationsWaitingCount += license.rotationsWaitingCount
                  availableLicenses += license.quantity - license.quantityUsed
                  availableRotations += license.rotations - license.rotationsUsed
                  rotacionWarningCount += license.failedRotationCount
                  if (!expirationDate || expirationDate < license.currentPeriodEnd) expirationDate = license.currentPeriodEnd
                })
                return {
                  ...enterpriseInfo,
                  rotationsWaitingCount,
                  totalLicenses,
                  availableLicenses,
                  availableRotations,
                  expirationDate,
                  rotacionWarningCount,
                }
              }),
            )
        });
        return observables.length > 0 ? combineLatest(observables) : of([])
      }),
      ).subscribe(response => {
        console.log(response)
        const enterprises: EnterpriseInfo[] = response.map((enterpriseInfo) => {
          return {
            name: enterpriseInfo.enterprise.name,
            photoUrl: enterpriseInfo.enterprise.photoUrl,
            userQty: enterpriseInfo.userQty,
            totalLicenses: enterpriseInfo.totalLicenses,
            availableLicenses: enterpriseInfo.availableLicenses,
            availableRotations: enterpriseInfo.availableRotations,
            rotacionWarningCount: enterpriseInfo.rotacionWarningCount,
            expirationDate: enterpriseInfo.expirationDate,
            id: enterpriseInfo.enterprise.id
          }
        })
        this.paginator.pageIndex = page - 1; // Update the paginator's page index
        this.dataSource.data = enterprises; // Assuming the data is in 'items'
        this.totalLength = response.length; // Assuming total length is returned
      }
    );
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.enterpriseSubscription) this.enterpriseSubscription.unsubscribe()
  }

}
