import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';



@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  enterprise: Enterprise
  enterpriseSubscription: Subscription

  constructor(
    public loaderService: LoaderService,
    public icon: IconService,
    private enterpriseService: EnterpriseService
  ) {}


  // -----
  totalHours = 83.48
  averageHours = 3.25 

  certificates: number = 3
  averageGrade: number = 80.2
  // ----

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.loaderService.setLoading(false)
      }
    })
  }

  ngOnDestroy() {
    this.enterpriseSubscription.unsubscribe()
  }
}
