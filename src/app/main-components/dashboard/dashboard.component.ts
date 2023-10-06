import { Component } from '@angular/core';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { LoaderService } from 'src/app/shared/services/loader.service';



@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  enterprise: Enterprise

  constructor(
    public loaderService: LoaderService,
    private enterpriseService: EnterpriseService
  ) {}

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.loaderService.setLoading(false)
      }
    })
  }
}
