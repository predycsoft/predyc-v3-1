import { DataSource } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, of, catchError, Subscription, combineLatest } from 'rxjs';
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
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    private profileService: ProfileService,
  ){}

  displayedColumns: string[] = ['departmentName', 'profileName', 'hours', 'liberty', 'generation', 'attempts'];
  dataSource!: ProfileDataSource;
  enablePagination: boolean = true
  pageSize: number = 4
  @ViewChild(MatPaginator) paginator: MatPaginator;

  combinedObservableSubscription: Subscription


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
        console.log("Permisos esta loaded")
        this.dataSource = new ProfileDataSource(
          this.enterpriseService,
          this.departmentService,
          // this.profileService,
          this.afs,
          this.paginator,
          this.pageSize,
          this.enablePagination,
        );
      }
    })
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
    const tableData = this.dataSource.getTableData();
    // console.log("tableData", tableData);
    // Transformamos a formato del modelo
    tableData.map(async data => {
      const libertyString = this.getKeyByValue(Permissions.STUDY_LIBERTY_NUMBER_OPTS, data.liberty)
      const generationString = this.getKeyByValue(Permissions.STUDYPLAN_GENERATION_NUMBER_OPTS, data.generation)
      const currentProfilePermissions = this.profileService.getProfile(data.id).permissions
      let newProfilePermissions = {...currentProfilePermissions} as Permissions
      newProfilePermissions.attemptsPerTest = data.attempts
      newProfilePermissions.studyplanGeneration = generationString
      newProfilePermissions.hoursPerWeek = data.hours
      newProfilePermissions.studyLiberty = libertyString
      if (JSON.stringify(currentProfilePermissions) != JSON.stringify(newProfilePermissions)) {
        let newProfile = this.profileService.getProfile(data.id)
        newProfile.permissions = newProfilePermissions
        await this.profileService.saveProfile(newProfile)
        console.log(`Los permisos de ${newProfile.name} cambiaron`)
      }
      
    })
  }

}

class ProfileDataSource extends DataSource<Profile> {
  private pageIndex: number = 0;
  private previousPageIndex: number = 0;
  private tableData: any[]
  private previousPageProfile: any

  // Borrar cuando funcione el servicio
  public profilesSubject = new BehaviorSubject<Profile[]>([]);
  public profiles$ = this.profilesSubject.asObservable();


  constructor(
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    // private profileService: ProfileService,
    private afs: AngularFirestore,
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
        this.getProfiles()
      });
    }
    this.getProfiles()
  }

  getProfiles() {
    // console.log("Corriendo get profiles")
    let queryObj: {
      pageSize: number
      startAt?: any
      startAfter?: any
    } = {
      pageSize: this.pageSize,
    }
    if (this.pageIndex == 0) {
      // first page
    } else if (this.pageIndex > this.previousPageIndex) {
      // next page
      queryObj.startAfter = this.tableData[this.tableData.length - 1]
      this.previousPageProfile = this.tableData[0]
    } else {
      // previous page
      queryObj.startAt = this.previousPageProfile
    }
    // Actualmente los perfiles se piden apenas se inicializa el servicio.
    // Cambiar para que se pidan con un metodo que acepte el queryObj como param de entrada

    // ---- Estoy pidiendo aqui porque en el servicio no me funciona ----
    this.afs.collection<Profile>(Profile.collection, ref => {
      let query = ref as any
      query = query.where('enterpriseRef', '==', this.enterpriseService.getEnterpriseRef())
      query = query.orderBy('name', 'asc')
      if (queryObj.startAt) {
        query = query.startAt(queryObj.startAt.name)
      } else if (queryObj.startAfter) {
        query = query.startAfter(queryObj.startAfter.name)
      }
      return query.limit(queryObj.pageSize)
    }
    ).valueChanges().subscribe(profiles => {
      // console.log("New profiles", profiles)
      this.profilesSubject.next(profiles)
    })
  }

  connect(): Observable<any[]> {
    // return this.profileService.getProfilesObservable().pipe(
    return this.profiles$.pipe( // Quitar cuando funcione el servicio
      map(profiles => {
        // console.log("profiles", profiles)
        if (this.enablePagination) {
          // this.paginator.length = profiles.length
          this.paginator.length = this.enterpriseService.getEnterprise().profilesNo
        }
        this.tableData = profiles.map(profile => {
          const departmentName = this.departmentService.getDepartmentByProfileId(profile.id).name //Solo hace falta departmentName
          return {
            id: profile.id,
            name: profile.name,
            departmentName: departmentName,
            hours: profile.permissions.hoursPerWeek,
            liberty: Permissions.STUDY_LIBERTY_NUMBER_OPTS[profile.permissions.studyLiberty],
            generation: Permissions.STUDYPLAN_GENERATION_NUMBER_OPTS[profile.permissions.studyplanGeneration],
            attempts: profile.permissions.attemptsPerTest
          }
        });
        return this.tableData
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

  
}
