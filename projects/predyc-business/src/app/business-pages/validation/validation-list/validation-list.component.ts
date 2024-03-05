import { Component, ViewChild } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, Subject, Subscription, catchError, combineLatest, map, merge, of } from 'rxjs';
import { Activity } from 'projects/predyc-business/src/shared/models/activity-classes.model';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { MatSort } from '@angular/material/sort';
import { orderByValueAndDirection } from 'projects/predyc-business/src/shared/utils';

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

  displayedColumns: string[] = ['title', 'status', 'createdAt', 'updatedAt', 'grade', 'assigned', 'performance', 'options'];
  dataSource!: ActivityDataSource;
  enablePagination: boolean = true
  pageSize: number = 4
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;


  searchSubscription: Subscription

  combinedObservableSubscription: Subscription

  ngOnInit() {
    // this.searchSubscription = this.searchInputService.dataObservable$.subscribe(
    //   filter => this.dataSource.setFilter(filter)
    // )
  }

  ngAfterViewInit() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if(isLoaded){
        this.dataSource = new ActivityDataSource(
          this.activityService,
          this.paginator,
          this.pageSize,
          this.enablePagination,
          this.sort
        );
      }
    })
  }
  
  ngOnDestroy() {
    // this.searchSubscription.unsubscribe()
  }

  async onDelete(activity: Activity) {
    this.activityService.deleteActivity(activity.id)
  }

}

class ActivityDataSource extends DataSource<Activity> {

  private activities: Activity[]

  private filterSubject = new BehaviorSubject<string>('');

  private sortSubject = new Subject<void>();


  constructor(
    public activityService: ActivityClassesService,
    private paginator: MatPaginator,
    private pageSize: number,
    private enablePagination: boolean,
    private sort: MatSort,
  ) {
    super();

    if (this.enablePagination) {
      this.paginator.pageSize = this.pageSize
    }
    this.sort.sortChange.subscribe(() => this.sortSubject.next());

  }

  
  connect(): Observable<Activity[]> {
    return merge(this.activityService.activities$, this.filterSubject, this.paginator.page, this.sortSubject).pipe(
      map(() => {
        const activities = this.activityService.getActivitesSubjectValue()
        if (this.enablePagination) {
          this.paginator.length = activities.length
        }

        this.activities = [...activities]

        // Search bar
        let filteredActivities = this.activities.filter(activity => {
          const searchStr = (activity.title as string).toLowerCase();
          return searchStr.indexOf(this.filterSubject.value.toLowerCase()) !== -1;
        });

        // Sorting
        if (this.sort.active && this.sort.direction !== '') {
          filteredActivities = filteredActivities.sort((a, b) => {
            const isAsc = this.sort.direction === 'asc';
            // console.log('this.sort.active')
            // console.log(this.sort.active)
            switch (this.sort.active) {
              case 'title': return orderByValueAndDirection(a.title as string, b.title as string, isAsc);
              // case 'status': return this.utilsService.compare(a.status as string, b.status as string, isAsc);
              // case 'createdAt': return 0
              // case 'updatedAt': return 0
              // case 'grade': return 0
              // case 'assigned': return 0
              // case 'performance': return 0
              // Add more fields to sort by as needed.
              default: return 0;
            }
          });
        }

        // Pagination
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
        return filteredActivities.splice(startIndex, this.paginator.pageSize);
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    );
    
  }

  setFilter(filter: string) {
    this.filterSubject.next(filter)
    this.paginator.firstPage();
  }

  disconnect() {}

}
