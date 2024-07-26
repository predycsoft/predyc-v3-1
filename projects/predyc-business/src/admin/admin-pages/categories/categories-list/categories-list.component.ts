import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categories-list',
  templateUrl: './categories-list.component.html',
  styleUrls: ['./categories-list.component.css']
})
export class CategoriesListComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private categoriesService: CategoryService,
    public icon: IconService,
    private router: Router,
  ){}

  displayedColumns: string[] = [
    "name",
    "enterprise",
    "actions",
  ];

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  pageSize: number = 16
  totalLength: number
  
  queryParamsSubscription: Subscription

  categoriesSubscription: Subscription

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      // const searchTerm = params['search'] || '';
      this.performSearch(page);
    })
  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch( page: number) {
    this.categoriesSubscription = this.categoriesService.getCategories$().subscribe(category => {
      // console.log('datos',category)
      const categoryInList = category
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = categoryInList
      this.totalLength = categoryInList.length;
    })
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  actions() {

  }
}
