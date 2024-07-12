import { Component } from '@angular/core';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { Profile } from 'projects/shared/models/profile.model';
import { CreateUserComponent } from './student/create-user/create-user.component';
import { User } from 'projects/shared/models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta } from '@angular/platform-browser';


@Component({
  selector: 'app-my-team',
  templateUrl: './my-team.component.html',
  styleUrls: ['./my-team.component.css'],
})
export class MyTeamComponent {
  constructor(
    private activatedRoute: ActivatedRoute,
    public icon: IconService,
    private enterpriseService: EnterpriseService,
    private modalService: NgbModal,
    private profileService: ProfileService,
    private router: Router,
    private userService: UserService,
    private _snackBar: MatSnackBar,
    private metaService: Meta

  ){}

  profiles: Profile[] = []
  profilesPredyc: Profile[] = []
  selectedProfile: string
  private profileSubscription: Subscription
  private queryParamsSubscription: Subscription

  filter = false

  ngOnInit() {
    // this.metaService.updateTag({ name: 'description', content: 'Descripción detallada de estudiantes' })
    // this.metaService.updateTag({ name: 'keywords', content: 'students' })
    // this.metaService.removeTag( "name = 'author'" )
    
    this.profileService.loadProfiles()
    this.profileSubscription = this.profileService.getProfiles$().subscribe(profiles => {
      if (profiles){
        this.profiles = profiles.filter(x=>x.enterpriseRef)
        this.profilesPredyc = profiles.filter(x=>!x.enterpriseRef)
      }
    })
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      this.filter = false; // Inicializar filter en false

      // Verificar si params tiene alguna clave y si no es solo 'page' con valor 1
      const keys = Object.keys(params);
      if (keys.length > 0) {
        // Excluir el caso donde solo hay 'page' con valor 1
        if (!(keys.length === 1 && keys[0] === 'page' && params['page'] === '1')) {
          this.filter = true;
        }
      }
      const profile = params['profile'] || '';
      this.selectedProfile = profile
    })
  }

  removeAllFilter(){
    this.router.navigate(["/management/students"])
  }

  onProfileSelectedChange(profile) {
    this.selectedProfile = profile.id
    this.updateQueryParams()
  }

  updateQueryParams() {
    this.router.navigate([], {
      queryParams: { profile: this.selectedProfile ? this.selectedProfile : null },
      queryParamsHandling: 'merge'
    });
  }

  onStudentSelected(student) {
    // console.log('student',student)
    const studentData: User = this.userService.getUser(student.uid)
    this.openCreateUserModal(studentData,student)
  }

  openCreateUserModal(student: User | null,user = null): NgbModalRef {
    let openModal = false
    let isNewUser = false
    if (student) {
      if (!student.profile || user['targetHours'] ==0 ){
        openModal = true
        student['targetHours'] = user['targetHours']
      }
    }
    else openModal = true, isNewUser = true

    // console.log('openModal',openModal,isNewUser,student)

    if (openModal) {
      const modalRef = this.modalService.open(CreateUserComponent, {
        animation: true,
        centered: true,
        size: 'lg',
        backdrop: 'static',
        keyboard: false 
      })
      if (!isNewUser) modalRef.componentInstance.studentToEdit = student;
      return modalRef
    }
    else return null
  }
  usersMails = null

  usersOnListProcess(users){

    if(users){
      // console.log('usersOnListProcess',users)
      let respuesta = [];
      users.forEach(usuario => {
        respuesta.push(usuario.mail)
      });
  
      this.usersMails = respuesta.toString();
    }
    else{
      this.usersMails = null;
    }

  }

  copiaExitosa(message: string = 'Correos copiados', action: string = '') {
    navigator.clipboard.writeText(this.usersMails).then(() => {
      this._snackBar.open(message, action, {
        duration: 1000,
        panelClass: ['gray-snackbar'],
      });
    }).catch(err => {
      console.error('Error al copiar al portapapeles: ', err);
    });
  }

  createNewStudent() {
    this.openCreateUserModal(null)
  }

  ngOnDestroy() {
    this.profileSubscription.unsubscribe()
    this.queryParamsSubscription.unsubscribe()
  }

}
