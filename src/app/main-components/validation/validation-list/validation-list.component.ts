import { Component, ViewChild } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { Observable, Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { Activity } from 'src/app/shared/models/activity-classes.model';
import { ActivityClassesService } from 'src/app/shared/services/activity-classes.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';

@Component({
  selector: 'app-validation-list',
  templateUrl: './validation-list.component.html',
  styleUrls: ['./validation-list.component.css']
})
export class ValidationListComponent {

  constructor(
    public icon: IconService,
    public activityService: ActivityClassesService,
    private enterpriseService: EnterpriseService,

  ) {}

  displayedColumns: string[] = ['title', 'status', 'createdAt', 'updatedAt', 'grade', 'assigned', 'performance'];
  dataSource!: ActivityDataSource;
  enablePagination: boolean = true
  pageSize: number = 4
  @ViewChild(MatPaginator) paginator: MatPaginator;

  combinedObservableSubscription: Subscription
  ngAfterViewInit() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if(isLoaded){
        this.dataSource = new ActivityDataSource(
          this.activityService,
          this.enterpriseService,
          this.paginator,
          this.pageSize,
          this.enablePagination
        );
      }
    })
  }

}

class ActivityDataSource extends DataSource<Activity> {

  private pageIndex: number = 0;
  private previousPageIndex: number = 0;

  private currentActivities: Activity[]
  private previousPageNotification: Activity

  constructor(
    public activityService: ActivityClassesService,
    // private userService: UserService,
    // private notificationService: NotificationService,
    private enterpriseService: EnterpriseService,
    private paginator: MatPaginator,
    private pageSize: number,
    private enablePagination: boolean
  ) {
    super();

    if (this.enablePagination) {
      this.paginator.pageSize = this.pageSize
      this.paginator.page.subscribe(eventObj => {
        this.pageIndex = eventObj.pageIndex
        this.previousPageIndex = eventObj.previousPageIndex
        this.getActivities()
      });
    }

    this.getActivities()
  }

  getActivities() {
    let queryObj: {pageSize: number, startAt?: Activity, startAfter?: Activity} = {
      pageSize: this.pageSize,
    }
    if (this.pageIndex == 0) {
      // first page
    } else if (this.pageIndex > this.previousPageIndex) {
      // next page
      console.log(this.currentActivities)
      queryObj.startAfter = this.currentActivities[this.currentActivities.length - 1]
      this.previousPageNotification = this.currentActivities[0]
    } else {
      // previous page
      queryObj.startAt = this.previousPageNotification
    }
    // console.log("queryObj", queryObj)
    this.activityService.getActivities(queryObj)
  }
  
  connect(): Observable<Activity[]> {

    return combineLatest([this.activityService.activities$, this.enterpriseService.enterprise$]).pipe(
      map(([activities, _]) => {
        // update paginator length
        if (this.enablePagination) {
          this.paginator.length = 5 // Total de actividades. Crear variable en el modelo con este valor?
        }

        this.currentActivities = [...activities]

        // console.log("this.currentActivities", this.currentActivities)
        return this.currentActivities
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    );
    
  }

  disconnect() {}

}
