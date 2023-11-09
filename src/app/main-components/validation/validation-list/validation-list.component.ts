import { Component, ViewChild } from '@angular/core';
import { IconService } from 'src/app/shared/services/icon.service';
import { DataSource } from '@angular/cdk/collections';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, Subscription, catchError, combineLatest, map, merge, of } from 'rxjs';
import { Activity } from 'src/app/shared/models/activity-classes.model';
import { ActivityClassesService } from 'src/app/shared/services/activity-classes.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { SearchInputService } from 'src/app/shared/services/search-input.service';

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
    private searchInputService: SearchInputService, 
  ) {}

  displayedColumns: string[] = ['title', 'status', 'createdAt', 'updatedAt', 'grade', 'assigned', 'performance', 'options'];
  dataSource!: ActivityDataSource;
  enablePagination: boolean = true
  pageSize: number = 4
  @ViewChild(MatPaginator) paginator: MatPaginator;

  searchSubscription: Subscription

  combinedObservableSubscription: Subscription

  ngOnInit() {
    this.searchSubscription = this.searchInputService.dataObservable$.subscribe(
      filter => this.dataSource.setFilter(filter)
    )
  }
  ngAfterViewInit() {
    this.enterpriseService.enterpriseLoaded$.subscribe(isLoaded => {
      if(isLoaded){
        this.dataSource = new ActivityDataSource(
          this.activityService,
          this.paginator,
          this.pageSize,
          this.enablePagination
        );
      }
    })
  }
  
  ngOnDestroy() {
    this.searchSubscription.unsubscribe()
  }

}

class ActivityDataSource extends DataSource<Activity> {

  private activities: Activity[]

  private filterSubject = new BehaviorSubject<string>('');


  constructor(
    public activityService: ActivityClassesService,
    private paginator: MatPaginator,
    private pageSize: number,
    private enablePagination: boolean
  ) {
    super();

    if (this.enablePagination) {
      this.paginator.pageSize = this.pageSize
    }

  }

  
  connect(): Observable<Activity[]> {
    return merge(this.activityService.activities$, this.filterSubject, this.paginator.page).pipe(
      map(() => {
        const activities = this.activityService.getActivitesSubjectValue()
        if (this.enablePagination) {
          this.paginator.length = activities.length
        }

        this.activities = [...activities]

        let filteredUsers = this.activities.filter(activity => {
          const searchStr = (activity.title as string).toLowerCase();
          return searchStr.indexOf(this.filterSubject.value.toLowerCase()) !== -1;
        });

        // Pagination
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
        return filteredUsers.splice(startIndex, this.paginator.pageSize);
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
