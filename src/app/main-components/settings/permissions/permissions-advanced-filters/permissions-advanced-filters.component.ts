import { DataSource } from '@angular/cdk/collections';
import { Component, Input, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, of, catchError, Subscription, combineLatest, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Profile } from 'src/app/shared/models/profile.model';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Permissions } from 'src/app/shared/models/permissions.model';

@Component({
  selector: 'app-permissions-advanced-filters',
  templateUrl: './permissions-advanced-filters.component.html',
  styleUrls: ['./permissions-advanced-filters.component.css']
})
export class PermissionsAdvancedFiltersComponent {
  constructor(
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    private profileService: ProfileService,
  ){}

  @Input() changedField: string;
  @Input() changedValue: any;

  displayedColumns: string[] = ['departmentName', 'profileName', 'hours', 'liberty', 'generation', 'attempts'];
  dataSource!: ProfileDataSource;
  enablePagination: boolean = true
  pageSize: number = 4
  @ViewChild(MatPaginator) paginator: MatPaginator;

  combinedObservableSubscription: Subscription
    
  hasFormChanged = false

  ngOnInit() {
    this.departmentService.loadDepartmens()
    this.profileService.loadProfiles()
  }

  ngAfterViewInit() {
    this.combinedObservableSubscription = combineLatest(
      [this.departmentService.departmentsLoaded$, this.profileService.profilesLoaded$]).pipe(
      map(([departmentsLoaded, profilesLoaded]) => {
        return departmentsLoaded && profilesLoaded
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    ).subscribe(isLoaded => {
      if (isLoaded) {
        // console.log("Permisos esta loaded")
        this.dataSource = new ProfileDataSource(
          this.enterpriseService,
          this.departmentService,
          this.profileService,
          this.paginator,
          this.pageSize,
        );
      }
    })
  }

  ngOnChanges() {
    // console.log(`El campo ${this.changedField} cambió a:`, this.changedValue);
    if (this.changedField && this.changedValue) {
      this.dataSource.updateTableData(this.changedField, this.changedValue);
      this.hasFormChanged = true
    }
  }

  ngOnDestroy() {
    this.combinedObservableSubscription.unsubscribe();
  }

  getKeyByValue(object, value) {
    for (const key in object) {
      if (object[key] === value) {
        return key;
      }
    }
    return null;
  }
  
  onSave() {
    this.hasFormChanged = false
    const tableData = this.dataSource.getTableData();
    // console.log("tableData", tableData);
    tableData.map(async data => {
      // liberty y generation vienen como numbers. Los transformamos al formato de nuestro modelo
      const libertyString = this.getKeyByValue(Permissions.STUDY_LIBERTY_NUMBER_OPTS, data.studyLiberty)
      const generationString = this.getKeyByValue(Permissions.STUDYPLAN_GENERATION_NUMBER_OPTS, data.studyplanGeneration)
      const currentProfilePermissions = this.profileService.getProfile(data.id).permissions
      let newProfilePermissions = {...currentProfilePermissions} as Permissions
      newProfilePermissions.attemptsPerTest = data.attemptsPerTest
      newProfilePermissions.studyplanGeneration = generationString
      newProfilePermissions.hoursPerWeek = data.hoursPerWeek
      newProfilePermissions.studyLiberty = libertyString
      if (JSON.stringify(currentProfilePermissions) != JSON.stringify(newProfilePermissions)) {
        let newProfile = this.profileService.getProfile(data.id)
        newProfile.permissions = newProfilePermissions
        await this.profileService.saveProfile(newProfile)
        // console.log(`Los permisos de ${newProfile.name} cambiaron`)
      }
      
    })
  }


}

class ProfileDataSource extends DataSource<Profile> {

  private tableData: any[]
  // private startIndex = this.paginator.pageIndex * this.paginator.pageSize;

  // Borrar cuando funcione el servicio
  public profilesSubject = new BehaviorSubject<Profile[]>([]);
  public profiles$ = this.profilesSubject.asObservable();


  constructor(
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    private profileService: ProfileService,
    private paginator: MatPaginator,
    private pageSize: number,
  ) {
    super();
    this.paginator.pageSize = this.pageSize
  }


  connect(): Observable<any[]> {
    // return merge(this.profileService.getProfilesObservable(), this.paginator.page, this.sort.sortChange).pipe(
    return merge(this.profileService.getProfilesObservable(), this.paginator.page).pipe(
      map(() => {
        const profiles = this.profileService.getProfilesSubjectValue()
        console.log('Perfiles:', profiles);
        this.paginator.length = profiles.length
        
        const data = profiles.map(profile => {
          const departmentName = this.departmentService.getDepartmentByProfileId(profile.id).name
          return {
            id: profile.id,
            name: profile.name,
            departmentName: departmentName,
            hoursPerWeek: profile.permissions.hoursPerWeek,
            studyLiberty: Permissions.STUDY_LIBERTY_NUMBER_OPTS[profile.permissions.studyLiberty],
            studyplanGeneration: Permissions.STUDYPLAN_GENERATION_NUMBER_OPTS[profile.permissions.studyplanGeneration],
            attemptsPerTest: profile.permissions.attemptsPerTest,
            hasDefaultPermissions: profile.permissions.hasDefaultPermissions
          }
        });

        // Sorting
        // if (this.sort.active && this.sort.direction !== '') {
        //   filteredUsers = filteredUsers.sort((a, b) => {
        //     const isAsc = this.sort.direction === 'asc';
        //     console.log('this.sort.active')
        //     console.log(this.sort.active)
        //     switch (this.sort.active) {
        //       case 'displayName': return orderByValueAndDirection(a.displayName as string, b.displayName as string, isAsc);
        //       // case 'status': return this.utilsService.compare(a.status as string, b.status as string, isAsc);
        //       // case 'departament': return 0
        //       // case 'profile': return 0
        //       // case 'ratingPoints': return 0
        //       // case 'performance': return 0
        //       // Add more fields to sort by as needed.
        //       default: return 0;
        //     }
        //   });
        // }

        // Pagination
        const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
        data.sort((a, b) => (a.hasDefaultPermissions ? 1 : 0) - (b.hasDefaultPermissions ? 1 : 0));
        this.tableData = data.splice(startIndex, this.paginator.pageSize)
        console.log("this.tableData", this.tableData)
        return this.tableData;
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    )   
  }

  disconnect() {}

  getTableData(): any[] {
    return this.tableData;
  }
  
  updateTableData(field: string, value: any) {
    this.tableData.forEach((row) => {
      // Actualiza el valor correspondiente según el campo
      switch (field) {
        case 'hoursPerWeek':
          // console.log("Caso de hours")
          row.hoursPerWeek = value;
          break;
        case 'studyLiberty':
          // console.log("Caso de liberty")
          row.studyLiberty = Permissions.STUDY_LIBERTY_NUMBER_OPTS[value];
          break;
        case 'studyplanGeneration':
          // console.log("Caso de generation")
          row.studyplanGeneration = Permissions.STUDYPLAN_GENERATION_NUMBER_OPTS[value];
          break;
        case 'attemptsPerTest':
          // console.log("Caso de attempts")
          row.attemptsPerTest = value;
          break;
        default:
          break;
      }
    });
    this.profilesSubject.next([...this.tableData]);
  }

  
}
