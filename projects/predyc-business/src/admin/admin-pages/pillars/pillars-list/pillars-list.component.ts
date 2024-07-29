import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryService } from 'projects/predyc-business/src/shared/services/category.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { CategoryJson } from 'projects/shared/models/category.model';
import { combineLatest, map, of, Subscription, switchMap } from 'rxjs';
import { DialogPillarsFormComponent } from '../dialog-pillars-form/dialog-pillars-form.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-pillars-list',
  templateUrl: './pillars-list.component.html',
  styleUrls: ['./pillars-list.component.css']
})
export class PillarsListComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    private categoriesService: CategoryService,
    private enterpriseService: EnterpriseService,
    public icon: IconService,
    private router: Router,
		private modalService: NgbModal,
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

  performSearch(page: number) {
    this.categoriesSubscription = this.categoriesService.getAllCategories$().pipe(
      switchMap(categories => {
        if (categories.length === 0) return of(categories);
        const categoriesWithEnterpriseNames$ = categories.map(category =>
          category.enterprise ? 
            this.enterpriseService.getEnterpriseById$(category.enterprise.id).pipe(
              map(enterprise => ({ ...category, enterpriseName: enterprise.name }))
            ) : 
            of({ ...category, enterpriseName: 'Sin empresa' })
        );
        return combineLatest(categoriesWithEnterpriseNames$);
      })
    ).subscribe(categoryInList => {
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = categoryInList;
      this.totalLength = categoryInList.length;
    });
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  openEditPillarModal(pillar: CategoryJson) {
    const modalRef = this.modalService.open(DialogPillarsFormComponent, {
      ariaLabelledBy: 'modal-basic-title',
      centered: true,
      backdrop: 'static'
    });
    modalRef.componentInstance.pillar = pillar;

  }

  async deletePillar(pillarId: string) {
    Swal.fire({
      title: "Eliminando pilar...",
      text: "Por favor, espera.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await this.categoriesService.deleteCategoryById(pillarId)
    Swal.close();
  }

}
