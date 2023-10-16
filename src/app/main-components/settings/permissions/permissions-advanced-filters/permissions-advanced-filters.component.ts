import { DataSource } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, of, catchError, Subscription, combineLatest} from 'rxjs';
import { map } from 'rxjs/operators';
import { Profile } from 'src/app/shared/models/profile.model';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { SkillService } from 'src/app/shared/services/skill.service';
import { UserService } from 'src/app/shared/services/user.service';

@Component({
  selector: 'app-permissions-advanced-filters',
  templateUrl: './permissions-advanced-filters.component.html',
  styleUrls: ['./permissions-advanced-filters.component.css']
})
export class PermissionsAdvancedFiltersComponent {
  constructor(
    private afs: AngularFirestore,
    private userService: UserService,
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    private skillService: SkillService,
  ){}

  // dataSource = [
  //   {
  //     departamento: 'Confiabilidad',
  //     perfil: 'Ingeniero de Confiabilidad',
  //     horas: '7:00',
  //     libertad: 'Libre',
  //     generacion: 'Optimizada',
  //     intentos: 5
  //   },
  //   {
  //     departamento: 'Planificación', 
  //     perfil: 'Especialista en Programación de la Producción', 
  //     horas: '8:00', 
  //     libertad: 'Estricto', 
  //     generacion: 'Confirmar', 
  //     intentos: 3
  //   },
  //   {
  //     departamento: 'Mantenimiento', 
  //     perfil: 'Técnico de Mantenimiento Eléctrico', 
  //     horas: '4:00', 
  //     libertad: 'Solicitudes', 
  //     generacion: 'Por defecto', 
  //     intentos: 4
  //   }
  // ];

  libertyOpts = {
    "Libre": 1,
    "Estricto": 2,
    "Solicitudes": 3,
  }

  generationOpts = {
    "Optimizada": 1,
    "Confirmar": 2,
    "Por defecto": 3,
  }

  combinedObservableSubscription: Subscription


  ngOnInit() {
    this.departmentService.loadDepartmens()
  }

  ngAfterViewInit() {
    this.combinedObservableSubscription = combineLatest(
      [this.userService.usersLoaded$, this.enterpriseService.enterpriseLoaded$, this.departmentService.departmentsLoaded$]).pipe(
      map(([usersLoaded, notificationsLoaded, departmentLoaded]) => {
        return usersLoaded && notificationsLoaded && departmentLoaded
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    ).subscribe(isLoaded => {
      if (isLoaded) {
        this.dataSource = new ProfileDataSource(
          this.userService,
          this.enterpriseService,
          this.departmentService,
          this.skillService,
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
  
  debug() {
    console.log("this.dataSource", this.dataSource)
  }

  debug2(value: number) {
    console.log("value", value)
  }

  // profiles = [
  //   {
  //     id: null,
  //     name: "Perfil de prueba 1",
  //     description: "Descripcion del 2do perfil",
  //     responsabilities: "Responsabilidad del 2do perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 2",
  //     description: "Descripcion del 3er perfil",
  //     responsabilities: "Responsabilidad del 3er perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 3",
  //     description: "Descripcion del 4to perfil",
  //     responsabilities: "Responsabilidad del 4to perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 4",
  //     description: "Descripcion del 5to perfil",
  //     responsabilities: "Responsabilidad del 5to perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  //   {
  //     id: null,
  //     name: "Perfil de prueba 5",
  //     description: "Descripcion del 6to perfil",
  //     responsabilities: "Responsabilidad del 6to perfil",
  //     departmentRef: null,
  //     skillsRef: [],
  //     usersRef: [],
  //     coursesRef:[],
  //     enterpriseRef: [],
  //   },
  // ]


  // async addProfiles() {
  //   const departmentRef: DocumentReference = this.afs.doc('department/GV7Mn8c0e4inIBaqY3TC').ref;
  //   const skillsRef: DocumentReference = this.afs.doc('skill/6WqV0sdn0gi8DMsjvsAt').ref;
  //   const usersRef: DocumentReference = this.afs.doc('user/4S2my2ixk0imeZq0HKhQOAaHXx81').ref;
  //   const enterpriseRef: DocumentReference = this.afs.doc('enterprise/CT6ApoO3YMFvIbOEMzVM').ref;
  //   for (const profile of this.profiles) {
  //     const docRef = this.afs.collection(Profile.collection).doc();
  //     const id = docRef.ref.id;
  //     await docRef.set({
  //       ...profile, 
  //       id: id,
  //       departmentRef: departmentRef,
  //       skillsRef: [skillsRef],
  //       usersRef: [usersRef],
  //       enterpriseRef: [enterpriseRef],

  //     });
  //     console.log("id", id)
  //   }
  // }


  displayedColumns: string[] = ['departamento', 'perfil', 'horas', 'libertad', 'generacion', 'intentos'];

  dataSource!: ProfileDataSource;
  enablePagination: boolean = true
  pageSize: number = 10
  @ViewChild(MatPaginator) paginator: MatPaginator;

}

class ProfileDataSource extends DataSource<Profile> {
  private pageIndex: number = 0;
  private previousPageIndex: number = 0;
  private currentProfiles: Profile[]
  private previousPageProfile: Profile
  public profilesSubject = new BehaviorSubject<Profile[]>([]);
  public profiles$ = this.profilesSubject.asObservable();


  constructor(
    private userService: UserService,
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    private skillService: SkillService,
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
    let queryObj: {
      pageSize: number
      startAt?: Profile
      startAfter?: Profile
    } = {
      pageSize: this.pageSize,
    }
    if (this.pageIndex == 0) {
      // first page
    } else if (this.pageIndex > this.previousPageIndex) {
      // next page
      queryObj.startAfter = this.currentProfiles[this.currentProfiles.length - 1]
      this.previousPageProfile = this.currentProfiles[0]
    } else {
      // previous page
      queryObj.startAt = this.previousPageProfile
    }
    // this.notificationService.getNotifications(queryObj)
    // ACOMODAR LA PETICION DE DATOS SEGUN LOS queryObj
    this.afs.collection(Profile.collection).valueChanges().subscribe(profiles => {
      this.profilesSubject.next(profiles as Profile[])
    })
  }

  connect(): Observable<any[]> {
    return this.profiles$.pipe(
      map(profiles => {
        console.log("profiles", profiles)
        if (this.enablePagination) {
          this.paginator.length = profiles.length
        }
        this.currentProfiles = [...profiles]

        return profiles.map(profile => {
          const profileDepartment = this.departmentService.getDepartment(profile.departmentRef.id)
          const profileUser = this.userService.getUser(profile.usersRef[0].id)
          const profileSkill = this.skillService.getSkill(profile.skillsRef[0].id)
          const profileEnterprise = this.enterpriseService.getEnterprise() //chequear por que es un array de empresas
          let newProfile = {
            ...profile,
            department: profileDepartment,
            user: profileUser,
            skill: profileSkill,
            enterprise: profileEnterprise
          }
          console.log("newProfile", newProfile)
          return newProfile
        })
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    )
    
  }

  disconnect() {}
}
