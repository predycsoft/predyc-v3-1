import { Component } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';
import { UserService } from 'src/app/shared/services/user.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { Profile } from 'src/app/shared/models/profile.model';
import { CreateUserComponent } from './student/create-user/create-user.component';

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
  ){}

  profiles: Profile[] = []
  selectedProfile: string
  private profileSubscription: Subscription
  private queryParamsSubscription: Subscription

  ngOnInit() {
    this.profileService.loadProfiles()
    this.profileSubscription = this.profileService.getProfilesObservable().subscribe(profiles => {if (profiles) this.profiles = profiles})
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
    console.log(`Selected student ${student}`)
  }

  openCreateUserModal(): NgbModalRef {
    const modalRef = this.modalService.open(CreateUserComponent, {
      animation: true,
      centered: true,
      size: 'lg'
    })
    return modalRef
  }

  createNewStudent() {
    this.openCreateUserModal()
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
