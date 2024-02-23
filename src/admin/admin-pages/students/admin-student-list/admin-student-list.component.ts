import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, combineLatest, map } from 'rxjs';
import { Enterprise } from 'src/shared/models/enterprise.model';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { IconService } from 'src/shared/services/icon.service';
import { UserService } from 'src/shared/services/user.service';

interface UserInList {
  displayName: string,
  uid: string,
  photoUrl: string,
  email: string,
  owner: string,
  createdAt: number,
  lastConnection: number,
  enterprise: string,
  phoneNumber: string,
}

@Component({
  selector: 'app-admin-student-list',
  templateUrl: './admin-student-list.component.html',
  styleUrls: ['./admin-student-list.component.css']
})
export class AdminStudentListComponent {

  displayedColumns: string[] = [
    'displayName',
    'email',
    'owner',
    'createdAt',
    'lastConnection',
    'userType',
    'enterprise',
    'phoneNumber',
  ];

  dataSource = new MatTableDataSource<UserInList>();

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() enableNavigateToUser: boolean = true
  @Output() onStudentSelected = new EventEmitter<UserInList>()

  queryParamsSubscription: Subscription
  userServiceSubscription: Subscription
  pageSize: number = 8
  totalLength: number

  enterprises : Enterprise[]

  constructor(
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    private router: Router,
    private userService: UserService,
    private enterpriseService: EnterpriseService,
  ) {}

  ngOnInit() {
    this.enterpriseService.getAllEnterprises$().subscribe(enterprises => {
      this.enterprises = enterprises
    })

    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const page = Number(params['page']) || 1;
      const searchTerm = params['search'] || '';
      this.performSearch(searchTerm, page);
    });
  }
  

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.paginator.pageSize = this.pageSize;
  }

  performSearch(searchTerm: string, page: number) {
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
    this.userServiceSubscription = this.userService.getAllUsers$(searchTerm).subscribe(users => {
      if (this.enterprises){
        const usersInList = users.map(user => {
          const enterprise = this.enterprises.find(enterprise => enterprise.id === user.enterprise?.id);
          return {
            displayName: user.displayName,
            uid: user.uid,
            photoUrl: user.photoUrl,
            email: user.email,
            owner: null,
            createdAt: user.createdAt ,
            lastConnection: user.lastConnection ,
            phoneNumber: user.phoneNumber,
            enterprise: enterprise ? enterprise.name : null 
          };
        });
        console.log("usersInList", usersInList)
        this.paginator.pageIndex = page - 1;
        this.dataSource.data = usersInList;
        this.totalLength = usersInList.length;
      }
    })
  }
  

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  onSelectUser(user: UserInList) {
    if (this.enableNavigateToUser) {
      this.router.navigate([`management/students/${user.uid}`])  // XXXXXXXXXXXXX
    } else {
      this.onStudentSelected.emit(user)
    }
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe()
    if (this.userServiceSubscription) this.userServiceSubscription.unsubscribe()
  }
}

