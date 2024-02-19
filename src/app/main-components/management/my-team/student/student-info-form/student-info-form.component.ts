import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { Profile } from 'src/app/shared/models/profile.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';
import { capitalizeFirstLetter } from 'src/app/shared/utils';
import { countriesData } from 'src/assets/data/countries.data';
import { CreateUserComponent } from '../create-user/create-user.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-student-info-form',
  templateUrl: './student-info-form.component.html',
  styleUrls: ['./student-info-form.component.css']
})
export class StudentInfoFormComponent {
  @Input() student: User;
  @Input() studentProfile: Profile;
  @Output() onStudentSave: EventEmitter<User> = new EventEmitter<User>()
  studentForm: FormGroup;
  profiles: Profile[] = []
  profileSubscription: Subscription
  countries: {name: string, code: string, isoCode: string}[] = countriesData

  imageUrl: string | ArrayBuffer | null = null
  uploadedImage: File | null = null

  constructor(
    public icon: IconService,
    private profileService: ProfileService,
    private alertService: AlertsService,
    private storage: AngularFireStorage,
    private modalService: NgbModal,
    private userService: UserService
    ) {}

  ngOnInit() {
    this.profileService.loadProfiles()
    this.profileSubscription = this.profileService.getProfilesObservable().subscribe(profiles => {if (profiles) this.profiles = profiles})

    this.studentForm = new FormGroup({
      canEnrollParticularCourses: new FormControl(false),
      displayName: new FormControl(''),
      email: new FormControl(''),
      phoneNumber: new FormControl(''),
      country: new FormControl(''),
      profile: new FormControl(null),
      photoUrl: new FormControl(''),
    });

    if (this.student) {
      this.studentForm.patchValue({
        canEnrollParticularCourses: this.student.canEnrollParticularCourses,
        displayName: this.student.displayName,
        email: this.student.email,
        phoneNumber: this.student.phoneNumber,
        country: this.student.country,
        profile: this.studentProfile ? this.studentProfile.id : null,
        photoUrl: this.student.photoUrl
      });
    }
    if (this.student.photoUrl) {
      this.imageUrl = this.student.photoUrl;
    }
  }

  async toggleCanEnrollParticularCourses() {
    try {
      const canEnrollParticularCourses = this.studentForm.controls.canEnrollParticularCourses.value
      await this.userService.canEnrollParticularCourses(this.student.uid, canEnrollParticularCourses)
      this.student.canEnrollParticularCourses = canEnrollParticularCourses
      this.onStudentSave.emit(this.student)
      this.alertService.succesAlert("Se ha actualizado su configuración")
    } catch(error) {
      console.log(error)
      this.alertService.errorAlert(error)
    }
    
  }

  openCreateUserModal(student: User | null) {
    const modalRef = this.modalService.open(CreateUserComponent, {
      animation: true,
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false 
    })
    modalRef.componentInstance.studentToEdit = student;
    modalRef.result.then(result => {
      this.save(result)
    }).catch(error => {
      console.log(error)
    })
  }

  async save(formData) {
    console.log('formData', formData)
    this.studentForm.patchValue(formData)
    this.student.displayName = formData.displayName
    this.student.phoneNumber = formData.phoneNumber
    this.student.country = formData.country
    this.student.profile = formData.profile ? this.profileService.getProfileRefById(formData.profile) : null
    this.onStudentSave.emit(this.student)
  }

  displayProfileName(id: string): string {
    const profile: Profile = this.profiles.find(x => x.id === id)
    if (profile) return profile.name
    return null
  }
}
