import { DataSource } from '@angular/cdk/collections';
import { Component, ViewChild } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { MatPaginator } from '@angular/material/paginator';
import { BehaviorSubject, Observable, of, catchError, Subscription, combineLatest} from 'rxjs';
import { map } from 'rxjs/operators';
import { Profile } from 'src/app/shared/models/profile.model';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { ProfileService } from 'src/app/shared/services/profile.service';

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
        console.log("Esta loaded")
        this.dataSource = new ProfileDataSource(
          this.enterpriseService,
          this.departmentService,
          this.profileService,
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
    return null; // Retornar null (o cualquier otro valor) si el valor no se encuentra en el objeto
  }
  
  debug() {
    const currentProfiles = this.dataSource.getCurrentProfiles();
    console.log("currentProfiles", currentProfiles);
    // Formato de "data"
    const advancedFilterescontent = currentProfiles.map(profile => {
      const libertyString = this.getKeyByValue(this.dataSource.libertyOpts, profile.liberty)
      const generationString = this.getKeyByValue(this.dataSource.generationOpts, profile.generation)
      return {
        ...profile,
        liberty: libertyString,
        generation: generationString,
      }
    })
    console.log("advancedFilterescontent", advancedFilterescontent)
  }


  // profiles = [
  //   {
  //     id: null,
  //     name: "Ingeniero de Confiabilidad",
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
  //     name: "Especialista en Programación de la Producción",
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
  //     name: "Técnico de Mantenimiento Eléctrico",
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
  //     name: "Especialista en seguridad industrial",
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
  //     name: "Especialista en vibraciones",
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


  displayedColumns: string[] = ['departmentName', 'profileName', 'hours', 'liberty', 'generation', 'attempts'];

  dataSource!: ProfileDataSource;
  enablePagination: boolean = true
  pageSize: number =4
  @ViewChild(MatPaginator) paginator: MatPaginator;

}

class ProfileDataSource extends DataSource<Profile> {
  private pageIndex: number = 0;
  private previousPageIndex: number = 0;
  private currentProfiles: any[]
  private previousPageProfile: any

  // Borrar cuando funcione el servicio
  public profilesSubject = new BehaviorSubject<Profile[]>([]);
  public profiles$ = this.profilesSubject.asObservable();


  constructor(
    private enterpriseService: EnterpriseService,
    private departmentService: DepartmentService,
    private profileService: ProfileService,
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

    // Proveniente de firebase
    data = [
      {
        departmentName: 'Confiabilidad',
        profileName: 'Ingeniero de Confiabilidad',
        profilesId: 'DqdsI5e7gZup7tXVc5X5',
        hours: 7,
        liberty: 'Libre',
        generation: 'Optimizada',
        attempts: 5
      },
      {
        departmentName: 'Planificación', 
        profileName: 'Especialista en Programación de la Producción', 
        profilesId: 'LHwYQPJIUI7wzk99xYUO',
        hours: 8, 
        liberty: 'Estricto', 
        generation: 'Confirmar', 
        attempts: 3
      },
      {
        departmentName: 'Mantenimiento', 
        profileName: 'Técnico de Mantenimiento Eléctrico', 
        profilesId: 'TSzxIiYrU6DHFw0UeEXH',
        hours: 4, 
        liberty: 'Solicitudes', 
        generation: 'Por defecto', 
        attempts: 4
      },
      {
        departmentName: 'Seguridad Industrial', 
        profileName: 'Especialista en seguridad industrial', 
        profilesId: 'aBx3B1lGKSXSr2ooEcKs',
        hours: 6, 
        liberty: 'Solicitudes', 
        generation: 'Confirmar', 
        attempts: 4
      },
      {
        departmentName: 'Equipos dinamicos', 
        profileName: 'Especialista en vibraciones', 
        profilesId: 'wjj7rnfn7IuWg8cpI2AU',
        hours: 5, 
        liberty: 'Estricto', 
        generation: 'Optimizada', 
        attempts: 4
      },
    ];
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

  getProfiles() {
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
      queryObj.startAfter = this.currentProfiles[this.currentProfiles.length - 1]
      this.previousPageProfile = this.currentProfiles[0]
    } else {
      // previous page
      queryObj.startAt = this.previousPageProfile
    }
    // Actualmente los perfiles se piden apenas se inicializa el servicio.
    // Cambiar para que se pidan con un metodo que acepte el queryObj como param de entrada

    // ---- Estoy pidiendo aqui porque en el servicio no me funciona ----
    this.afs.collection<Profile>(Profile.collection, ref => {
      let query = ref as any
      query = query.where('enterpriseRef', 'array-contains', this.enterpriseService.getEnterpriseRef())
      query = query.orderBy('name', 'asc')
      if (queryObj.startAt) {
        query = query.startAt(queryObj.startAt.name)
      } else if (queryObj.startAfter) {
        query = query.startAfter(queryObj.startAfter.name)
      }
      return query.limit(queryObj.pageSize)
    }
    ).valueChanges().subscribe(profiles => {
      console.log("New profiles", profiles)
      this.profilesSubject.next(profiles)
    })
  }

  connect(): Observable<any[]> {
    // return this.profileService.getProfilesObservable().pipe(
    return this.profiles$.pipe( // Quitar cuando funcione el servicio
      map(profiles => {
        console.log("profiles", profiles)
        if (this.enablePagination) {
          // this.paginator.length = profiles.length
          this.paginator.length = 5
        }
        this.currentProfiles = profiles.map(profile => {
          const profileDepartment = this.departmentService.getDepartment(profile.departmentRef.id)
          profile.department = profileDepartment
          // Valores por defecto
          let hours = 1
          let liberty = 1
          let generation = 1
          let attempts = 4
          const matchingData = this.data.find(item => item.profilesId === profile.id); 
          if (matchingData) { 
            hours = matchingData.hours;
            liberty = this.libertyOpts[matchingData.liberty];
            generation = this.generationOpts[matchingData.generation];
            attempts = matchingData.attempts;
          }
          return {
            id: profile.id,
            name: profile.name,
            department: profileDepartment,
            hours,
            liberty,
            generation,
            attempts
          }
        });
        return this.currentProfiles
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    )   
  }

  disconnect() {}

  getCurrentProfiles(): any[] {
    return this.currentProfiles;
  }

  
}
