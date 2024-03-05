import { Component } from '@angular/core';
import { IconService } from 'src/shared/services/icon.service';
import { UserService } from 'src/shared/services/user.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'src/shared/services/enterprise.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/shared/services/profile.service';
import { Profile } from 'src/shared/models/profile.model';
import { CreateUserComponent } from './student/create-user/create-user.component';
import { User } from 'src/shared/models/user.model';

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
  ){}

  profiles: Profile[] = []
  profilesPredyc: Profile[] = []
  selectedProfile: string
  private profileSubscription: Subscription
  private queryParamsSubscription: Subscription

  ngOnInit() {
    this.profileService.loadProfiles()
    this.profileSubscription = this.profileService.getProfiles$().subscribe(profiles => {
      if (profiles){
        this.profiles = profiles.filter(x=>x.enterpriseRef)
        this.profilesPredyc = profiles.filter(x=>!x.enterpriseRef)
      }
    })
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe(params => {
      const profile = params['profile'] || '';
      this.selectedProfile = profile
    })
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
    const studentData: User = this.userService.getUser(student.uid)
    this.openCreateUserModal(studentData)
  }

  openCreateUserModal(student: User | null): NgbModalRef {
    let openModal = false
    let isNewUser = false
    if (student) {
      if (!student.profile) openModal = true  
    }
    else openModal = true, isNewUser = true

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

  createNewStudent() {
    this.openCreateUserModal(null)
  }

  // async onStudentSaveHandler(student: User) {
  //   try {
  //     if (student.uid) {
  //       await this.userService.editUser(student)
  //     } else {
  //       await this.userService.addUser(student)
  //     }
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  ngOnDestroy() {
    this.profileSubscription.unsubscribe()
    this.queryParamsSubscription.unsubscribe()
  }

}
