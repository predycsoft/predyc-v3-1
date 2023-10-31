import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { LoaderService } from 'src/app/shared/services/loader.service';
import { AfterOnInitResetLoading } from 'src/app/shared/decorators/loading.decorator';
import { Profile } from 'src/app/shared/models/profile.model';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Department } from 'src/app/shared/models/department.model';
import { Subscription, catchError, combineLatest, map, of } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
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
    private userService: UserService,
    private changeDetectorRef: ChangeDetectorRef

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
  pageSize = 5


  async ngOnInit() {
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
          this.paginator.pageSize = this.pageSize
          this.dataSource.paginator = this.paginator;
        }
      }
    })
  }

  // ngAfterViewChecked() {
  //   // Establece la propiedad userTriggered a false después de que se hayan completado las detecciones de cambios
  //   if (this.userTriggered) {
  //     this.userTriggered = false;
  //   }
  // }

  // Define a SelectionModel instance to manage the chip selection
  chipSelection = new SelectionModel<string>(true);
  
  userTriggered = false;
  selectedChip: string | null = null;

  onChipClick(departmentName: string) {
    this.userTriggered = true;

    // Deseleccionar todos los chips
    // this.chipSelection.clear();
    let selection: string[] = []
    if (this.selectedChip === departmentName) {
      // Si el chip seleccionado es el mismo que el actual, deselecciónalo
      this.selectedChip = null;
    } else {
      // Si el chip seleccionado es diferente, selecciónalo
      console.log("chipClick")
      // this.chipSelection.select(departmentName);
      this.selectedChip = departmentName;
      selection = [departmentName]
    }
    
    this.chipSelection.setSelection(...selection)
    // Verificar si el departamento seleccionado no está en la página actual
    const indexOfDepartment = this.departments.findIndex(department => department.name === departmentName);
    if (indexOfDepartment > -1) {
      // Obtener el índice de la página actual y la cantidad de elementos por página
      const pageIndex = Math.floor(indexOfDepartment / this.paginator.pageSize);
      // Verificar si es necesario cambiar de página
      if (pageIndex !== this.paginator.pageIndex) {
        // Navegar a la página que contiene el departamento
        this.paginator.pageIndex = pageIndex;
        this.paginator.page.emit({
          pageIndex: pageIndex,
          pageSize: this.paginator.pageSize,
          length: this.paginator.length,
        });
      }
    }
  }


  paginatorPageChange(event: PageEvent) {
    // Restablecer el chip seleccionado cuando cambia de página
    this.selectedChip = null;
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
        this.refreshDataSource()
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
  
  refreshDataSource() {
    const departmentsWithProfiles = this.departments.map(department => {
      const departmentProfiles = department.profilesRef
      .map(profileRef => this.profiles.find(profile => profile.id === profileRef.id))
      .filter(profile => profile); 
      return {
        ...department,
        profiles: departmentProfiles
      };
    });
    this.dataSource = new MatTableDataSource<any>(departmentsWithProfiles);  
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
  }
  

  async deleteDepartment(departmentId){

    let statusDelete = await this.departmentService.deleteDepartment(departmentId);

    if(statusDelete){
      this.refreshDataSource()
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
}
