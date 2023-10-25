import { Component, ViewChild } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Profile } from 'src/app/shared/models/profile.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Department } from 'src/app/shared/models/department.model';
import { Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { deparmentsData } from '../../../../assets/data/departments.data'
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { ProfileService } from '../../../shared/services/profile.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { SearchInputService } from 'src/app/shared/services/search-input.service';
import { UserService } from 'src/app/shared/services/user.service';
import { User } from 'src/app/shared/models/user.model';

@AfterOnInitResetLoading
@Component({
  selector: 'app-departments-profiles',
  templateUrl: './departments-profiles.component.html',
  styleUrls: ['./departments-profiles.component.css']
})
export class DepartmentsProfilesComponent {
  constructor(
    public icon: IconService,
    private afs: AngularFirestore,
    private loaderService: LoaderService,
    private departmentService: DepartmentService,
    private router: Router,
    private profileService: ProfileService,
    private modalService: NgbModal,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService,
    private searchInputService: SearchInputService, 
    private userService: UserService

  ){}

  @ViewChild(MatPaginator) paginator: MatPaginator;
  dataSource = new MatTableDataSource<any>;
  departments: Department[]
  profiles: Profile[];
  displayedColumns: string[] = [
    'name'
  ]
  panelOpenState = false;

  openedDepartment: string | null = null;
  searchSubscription: Subscription

  combinedObservableSubscription


  async ngOnInit() {
    // ---- Esto es para crear departamentos en firestore
    // const profiles = await firstValueFrom(this.afs.collection("profile").valueChanges()) as Profile[]
    // profiles.forEach(perfil => {
    //   let ref = this.afs.collection<Profile>("profile").doc(perfil.id).ref
    //   this.profilesRefs.push(ref)
    // });
    // -----
    // console.log(deparmentsData)
    this.departmentService.loadDepartmens();
    this.profileService.loadProfiles();
  }

  ngAfterViewInit() {
    this.combinedObservableSubscription = combineLatest([this.departmentService.departmentsLoaded$, this.profileService.profilesLoaded$]).pipe(
      map(([departmentsLoaded, profilesLoaded]) => {
        return departmentsLoaded && profilesLoaded
      }),
      catchError(error => {
        console.error('Error occurred:', error);
        return of([]);  // Return an empty array as a fallback.
      })
    ).subscribe(isLoaded => {
      if (isLoaded) {
        this.departmentService.getDepartmentsObservable().subscribe(departments => {
          this.departments = departments
        });
        this.profileService.getProfilesObservable().subscribe(profiles => {
          this.profiles = profiles
        })
        // console.log('respuestas observables dep perf',this.departments,this.profiles)
        //console.log('perfiles another ', profiles);
  
        const departmentsWithProfiles = this.departments.map(department => {
          const departmentProfiles = department.profilesRef
          .map(profileRef => this.profiles.find(profile => profile.id === profileRef.id))
          .filter(profile => profile);  // Filtrar cualquier perfil undefined
          return {
            ...department,
            profiles: departmentProfiles
          };
        });
        console.log('Departments with profiles',departmentsWithProfiles);
        this.dataSource = new MatTableDataSource<any>(departmentsWithProfiles);  
        if (this.dataSource) {
          this.dataSource.paginator = this.paginator;
        }
      }
    })
  }

  // Define a SelectionModel instance to manage the chip selection
  chipSelection = new SelectionModel<string>(true);
  
  // Initialize the userTriggered flag as false
  userTriggered = false;

  onChipClick(departmentName: string) {
    // Set the userTriggered flag to true when the chip is clicked
    this.userTriggered = true;
    
    // Toggle the selection of the corresponding department in the SelectionModel
    this.chipSelection.toggle(departmentName);
  }

  toggleAccordion(departmentName: string) {
    // If the accordion is manually toggled, update the userTriggered flag and synchronize the chip selection
    if (!this.userTriggered) {
      this.chipSelection.toggle(departmentName);
    }
    
    // Reset the userTriggered flag after the accordion is toggled
    this.userTriggered = false;
  }

  isPanelExpanded(departmentName: string): boolean {
    return this.chipSelection.isSelected(departmentName);
  }

  // createDepartmentsCollection(){

  //   deparmentsData.forEach(department => {
  //     console.log(department)
  //     let departmentready = new Department(department.id,department.name)
  //     this.departmentService.addDepartment(departmentready)
      
  //   });


  // }

  createProfileDepartment(department){
    this.router.navigate(["management/create-profile/", department.id,'create','new'])
  }

  editProfile(department,profile){
    this.router.navigate(["management/create-profile/", department.id,'edit',profile.id])
  }


  modalCreateDepartment
  formNewDepartment: FormGroup;
  showErrorDeparment = false


  openModalDepartment(content){

    this.modalCreateDepartment = this.modalService.open(content, {
     ariaLabelledBy: 'modal-basic-title',
     centered: true,
     size:'lg'
   });
 }

  createDepartment(content){

    this.showErrorDeparment=false;
    this.formNewDepartment = new FormGroup({
      id: new FormControl(null),
      enterpriseRef: new FormControl(null),
      name: new FormControl(null, Validators.required),
    })

    this.openModalDepartment(content)
  }

  editDepartment(department,content){
    this.showErrorDeparment=false;

    this.formNewDepartment = new FormGroup({
      id: new FormControl(department.id),
      enterpriseRef: new FormControl(null),
      name: new FormControl(department.name, Validators.required),
    })

    this.openModalDepartment(content)
  }

  async saveDepartment(){

    this.showErrorDeparment=false;

    if(this.formNewDepartment.valid){
      let enterpriseRef =this.enterpriseService.getEnterpriseRef();
      let name = this.formNewDepartment.get('name').value
      let id = this.formNewDepartment.get('id').value
      let departent = new Department(id,name,enterpriseRef, []);
      console.log(departent);
      this.modalCreateDepartment.close()
      const isSuccess = await this.departmentService.saveDepartment(departent)

      if (isSuccess) {
        console.log('Department saved successfully.');
        this.alertService.succesAlert('Has agregado un departamento exitosamente.')
        // Do other things if successful, e.g., show a success message or navigate elsewhere.
      } else {
        console.error('Failed to save department.');
        // Handle the failure case. You can show an error message or take some other action.
      }
    }
    else{
      this.showErrorDeparment = true
    }
    
  }

  async deleteDepartment(departmentId){

    let statusDelete = await this.departmentService.deleteDepartment(departmentId);

    if(statusDelete){
      this.alertService.succesAlert('Has eliminado un departamento exitosamente.')
    }

  }

  applyFilter() {
    this.searchSubscription = this.searchInputService.dataObservable$.subscribe(filter => {
      this.dataSource.filter = filter.trim().toLowerCase();
    })
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getProfileUsers(profileId: string): DocumentReference<User>[] {
    return this.userService.getUsersRefByProfileId(profileId);
  }



  // ------- Para crear perfiles y departamentos en firestore
  // profilesRefs = []
  // profiles: Profile[] = [
  //   {
  //     id:"profileId1",
  //     name: "Primer Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId2",
  //     name: "Segundo Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId3",
  //     name: "Tercer Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId4",
  //     name: "Cuarto Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId5",
  //     name: "Quinto Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId6",
  //     name: "Sexto Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId7",
  //     name: "Septimo Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId8",
  //     name: "Octavo Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId9",
  //     name: "Noveno Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId10",
  //     name: "Decimo Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId11",
  //     name: "undecimo Perfil",
  //     studyPlan: []
  //   },
  //   {
  //     id:"profileId12",
  //     name: "duodecimo Perfil",
  //     studyPlan: []
  //   },
  // ]
  // async submitProfiles() {
  //   this.profiles.forEach(async perfil => {
  //     await this.afs.collection("profile").doc(perfil.id).set(perfil);
  //   });
  // }
  // async submitDepartments() {
  //   const departments: Department[] = [
  //     {
  //       color: "red",
  //       id: "departmentId1",
  //       name: "Mantenimiento",
  //       profiles: [this.profilesRefs[0], this.profilesRefs[1], this.profilesRefs[8]],
  //     },
  //     {
  //       color: "blue",
  //       id: "departmentId2",
  //       name: "Seguridad Industrial",
  //       profiles: [this.profilesRefs[2], this.profilesRefs[9]],
  //     },
  //     {
  //       color: "yellow",
  //       id: "departmentId3",
  //       name: "Equipos Dinámicos",
  //       profiles: [this.profilesRefs[3], this.profilesRefs[10]],
  //     },
  //     {
  //       color: "green",
  //       id: "departmentId4",
  //       name: "Gesti{on de proyectos",
  //       profiles: [this.profilesRefs[4]],
  //     },
  //     {
  //       color: "orange",
  //       id: "departmentId5",
  //       name: "Confiabilidad",
  //       profiles: [this.profilesRefs[5]],
  //     },
  //     {
  //       color: "pink",
  //       id: "departmentId6",
  //       name: "Operaciones",
  //       profiles: [this.profilesRefs[6]],
  //     },
  //     {
  //       color: "black",
  //       id: "departmentId7",
  //       name: "Equipos estáticos",
  //       profiles: null,
  //     },
  //   ]
  //   departments.forEach(async department => {
  //     await this.afs.collection("department").doc(department.id).set(department);
  //   });
  // }
  // ------

}
