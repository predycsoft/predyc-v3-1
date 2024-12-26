import { Component, Input, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription, combineLatest, firstValueFrom, take } from 'rxjs';
import { Charge } from 'projects/shared/models/charges.model';
import { Enterprise } from 'projects/shared/models/enterprise.model';
import { Product } from 'projects/shared/models/product.model';
import { User } from 'projects/shared/models/user.model';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ActivityClassesService } from 'projects/predyc-business/src/shared/services/activity-classes.service';
import { CourseService } from 'projects/predyc-business/src/shared/services/course.service';
import { ProfileService } from '../../../../shared/services/profile.service';
import { DiplomadoService } from '../../../../shared/services/diplomado.service';



@Component({
  selector: 'app-diplomados-list',
  templateUrl: './diplomados-list.component.html',
  styleUrls: ['./diplomados-list.component.css']
})
export class DiplomadosListComponent {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private activityClassesService:ActivityClassesService,
    public icon: IconService,
    public courseService: CourseService,
    public profileService : ProfileService,
    private diplomadoService: DiplomadoService
  ){}

  displayedColumns: string[] = [
    "name",
    "courses",
    "type",
    "hasTest"
  ];

  dataSource = new MatTableDataSource<any>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true

  pageSize: number = 16
  totalLength: number
  
  combinedServicesSubscription: Subscription
  queryParamsSubscription: Subscription
  chargeSubscription: Subscription
  activitySubscription: Subscription
  activities

  products: Product[]
  users: User[]
  enterprises: Enterprise[]

  ngOnInit() {

    this.activitySubscription = this.activityClassesService.getActivityCertifications().pipe(take(1)).subscribe(activities => {
      // console.log('activities',activities)
      this.activities = activities;
      this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
        const page = Number(params['page']) || 1;
        const searchTerm = params['search'] || '';
        this.performSearch(searchTerm, page);
      })
    })

  }


  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm:string, page: number) {
    this.chargeSubscription = this.diplomadoService.getDiplomados$().pipe(take(1)).subscribe(diplomados => {
      // console.log('diplomados',diplomados)
      const chargesInList = diplomados
      const filteredCharges = chargesInList
      this.paginator.pageIndex = page - 1;
      this.dataSource.data = filteredCharges
      this.totalLength = filteredCharges.length;
    })
  }


  getTypeFullName(type){

    if(type == 'diplomado'){
      return 'Diplomado'
    }
    else if(type == 'pack'){
      return 'Pack de cursos'
    }
    else{
      return 'Plan de capacitación'
    }

  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  getProductData(productId: string): Product {
    return this.products.find(product => product.id === productId)
  }

  getCustomerEmail(charge: Charge): string {
    const userData: User = this.users.find(user => user.uid === charge.customer.id)
    if (userData) return userData.email
    else return "Empresa"
  
  }

  getCustomerName(charge: Charge): string {
    const userData: User = this.users.find(user => user.uid === charge.customer.id)
    if (userData) return userData.displayName
    else {
      const enterpriseData: Enterprise = this.enterprises.find(enterprise => enterprise.id === charge.customer.id)
      return enterpriseData.name
    }
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
  }

  async changeStatusPrev(activity){
    if(activity.status){
      if(activity.status == 'inactive'){
        activity.status = 'active'
      }
      else{
        activity.status = 'inactive'
      }
    }
    else{
      activity.status = 'inactive'
    }
    await this.activityClassesService.saveActivity(activity);
  }

  editDiplomado(data){

    this.router.navigate([`/admin/diplomados/form/${data.id}`]);

    console.log('data',data)

  }

  async fixData(){

    await this.diplomadoService.updateDiplomadosSlugs()
    
  }

  


}
