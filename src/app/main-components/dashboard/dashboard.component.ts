import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Enterprise } from 'src/app/shared/models/enterprise.model';
import { User } from 'src/app/shared/models/user.model';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { UserService } from 'src/app/shared/services/user.service';



@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  enterprise: Enterprise
  users: User[]
  enterpriseSubscription: Subscription
  userServiceSubscription: Subscription

  constructor(
    public loaderService: LoaderService,
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private userService: UserService
  ) {}


  // -----
  totalHours: number
  avgHours: number

  certificatesQty: number
  avgScore: number
  // ----

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.loaderService.setLoading(false)
      }
    })
    this.userServiceSubscription = this.userService.users$.subscribe(users => {
      this.users = users
      this.totalHours = 0
      this.certificatesQty = 0
      let accumulatedAvgGrade = 0
      this.users.forEach(user => {
        this.totalHours += user.studyHours
        this.certificatesQty += user.certificatesQty
        accumulatedAvgGrade += user.avgScore
      })
      this.avgHours = this.users.length > 0 ? this.totalHours / this.users.length : 0
      this.avgScore = this.users.length > 0 ? accumulatedAvgGrade / this.users.length : 0
    })
  }

  ngOnDestroy() {
    this.enterpriseSubscription.unsubscribe()
    this.userServiceSubscription.unsubscribe()
  }
}
