import { Component } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Subscription, combineLatest } from 'rxjs';
import { DialogDownloadReportComponent } from 'projects/predyc-business/src/shared/components/dialogs/dialog-download-report/dialog-download-report.component';
import { AfterOnInitResetLoading } from 'projects/predyc-business/src/shared/decorators/loading.decorator';
import { CourseByStudent } from 'projects/predyc-business/src/shared/models/course-by-student.model';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { LoaderService } from 'projects/predyc-business/src/shared/services/loader.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';

@AfterOnInitResetLoading
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent {

  enterprise: Enterprise
  enterpriseSubscription: Subscription
  combinedSubscription: Subscription
  userServiceSubscription: Subscription
  performances = []

  // rythms
  rythms = {
    high: 0,
    medium: 0,
    low: 0,
    noPlan: 0,
  }

  constructor(
    public loaderService: LoaderService,  
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private userService: UserService,
    private courseService: CourseService,
    private modalService: NgbModal,
  ) {}

  ngOnInit() {
    this.loaderService.setLoading(true)
    this.enterpriseSubscription = this.enterpriseService.enterprise$.subscribe(enterprise => {
      if (enterprise) {
        this.enterprise = enterprise
        this.loaderService.setLoading(false)
      }
    })
    this.userServiceSubscription = this.userService.users$.subscribe(async users => {
      if (users && users.length > 1) { // first response is an 1 element array corresponded to admin
        const performances = []
        for (const user of users) {
          const userRef = this.userService.getUserRefById(user.uid);
          const studyPlan: CourseByStudent[] = await this.courseService.getActiveCoursesByStudent(userRef);
          const userPerformance: "no plan" | "high" | "medium" | "low" | "no iniciado" = this.userService.getPerformanceWithDetails(studyPlan);
          performances.push(userPerformance);
        }
        this.getUsersRythmData(performances)
        // if (this.loaderService.loading > 0) this.loaderService.setLoading(false)
      }
    })
  }

  ngOnDestroy() {
    this.enterpriseSubscription.unsubscribe()
    this.userServiceSubscription.unsubscribe()
  }

  openDownloadReportModal(): NgbModalRef {
    const modalRef = this.modalService.open(DialogDownloadReportComponent, {
      animation: true,
      centered: true,
      size: 'auto',
      backdrop: 'static',
      keyboard: false 
    })
    return modalRef
  }

  getUsersRythmData(performances: Array<"no plan" | "high" | "medium" | "low"| "no iniciado"  >){
    this.rythms = {
      high: 0,
      medium: 0,
      low: 0,
      noPlan: 0,
    }
    // Iterar sobre el array de performances
    for (const performance of performances) {
      switch (performance) {
        case "no plan":
          this.rythms.noPlan += 1;
          break;
        case "high":
          this.rythms.high += 1;
          break;
        case "medium":
          this.rythms.medium += 1;
          break;
        case "low":
          this.rythms.low += 1;
          break;
          case "no iniciado":
          this.rythms.noPlan += 1;
          break;
      }
    }
    // console.log(`No Plan: ${this.rythms.noPlan}, High: ${this.rythms.high}, Medium: ${this.rythms.medium}, Low: ${this.rythms.low}`);
  }

}
