import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, Observable, startWith, Subscription } from 'rxjs';
import { Department } from 'src/app/shared/models/department.model';
import { Profile } from 'src/app/shared/models/profile.model';
import { User } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { DepartmentService } from 'src/app/shared/services/department.service';
import { EnterpriseService } from 'src/app/shared/services/enterprise.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { UserService } from 'src/app/shared/services/user.service';
import { dateFromCalendarToTimestamp } from 'src/app/shared/utils';
import { countriesData } from 'src/assets/data/countries.data'

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent {

  constructor(
    private activeModal: NgbActiveModal,
    private alertService: AlertsService,
    private enterpriseService: EnterpriseService,
    private fb: FormBuilder,
    private profileService: ProfileService,
    private userService: UserService,
    public icon: IconService,
    private departmentService: DepartmentService,
  ) {}

  userForm: FormGroup
  displayErrors: boolean = false
  profiles: Profile[] = []
  countries: {name: string, code: string, isoCode: string}[] = countriesData
  profileServiceSubscription: Subscription
  departmentServiceSubscription: Subscription
  departments: Department[] = []
  filteredDepartments: Observable<string[]>;

  ngOnInit() {
    this.profileServiceSubscription = this.profileService.getProfilesObservable().subscribe(profiles => {if (profiles) this.profiles = profiles})
    const enterpriseRef = this.enterpriseService.getEnterpriseRef()
    this.departmentServiceSubscription = this.departmentService.getDepartments(enterpriseRef).subscribe({
      next: departments => {
        this.departments = departments
      },
      error: error => {
        this.alertService.errorAlert(error.message)
      }
    })
    this.setupForm()
    this.filteredDepartments = this.userForm.controls.department.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
  }


  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.departments.map(department => department.name).filter(option => option.toLowerCase().includes(filterValue));
  }

  createDepartment() {
    console.log("Crear departamento")
  }

  setupForm() {
    this.userForm = this.fb.group({
      name: [null, [Validators.required]],
      profile: [null],
      photoUrl: [null],
      phoneNumber: [null, [Validators.pattern(/^\d*$/)]],
      department: [null],
      country: [null],
      birthdate: [null],
      email: [null, [Validators.required, Validators.email]],
      job: [null],
      hiringDate: [null],
      experience: [null],
    });
  }

  onFileSelected(event) {
    console.log("File selected")
  }

  validateCurrentModalPage() {
    const currentPageGroup = this.userForm;
    
    if (currentPageGroup && currentPageGroup.invalid) {
      // Object.keys(currentPageGroup['controls']).forEach(field => {
      //   const control = currentPageGroup.get(field);
      //   control.markAsTouched({ onlySelf: true });
      // });
      return false; // Indicate that the form is invalid
    }
    return true; // Indicate that the form is valid
  }

  async getUserFromForm(){
    const formData = this.userForm.value 
    // Guarda la imagen
    const photoUrl = await this.saveStudentPhoto()
    let department = null
    if (formData.department && formData.department !== 'null') {
      const departmentId = this.departments.find(department => department.name === formData.department).id
      department = this.departmentService.getDepartmentRefById(departmentId)
    }
    const userObj = {
      name: formData.name ? formData.name.toLowerCase() : null,
      displayName: formData.name ? formData.name.toLowerCase() : null,
      phoneNumber: formData.phoneNumber ? formData.phoneNumber : null,
      departmentRef: department,
      country: formData.country ? formData.country : null,
      birthdate: formData.birthdate ? dateFromCalendarToTimestamp(formData.birthdate): null,
      job: formData.job ? formData.job : null,
      hiringDate: formData.hiringDate ? dateFromCalendarToTimestamp(formData.hiringDate) : null,
      experience: formData.experience ? formData.experience : null,
      profile: formData.profile ? this.profileService.getProfileRefById(formData.profile) : null,
      email: formData.email ? formData.email.toLowerCase() : null,
      photoUrl: photoUrl
    }
    const user = User.getEnterpriseStudentUser(this.enterpriseService.getEnterpriseRef())
    user.patchValue(userObj)
    return user
  }

  async saveStudentPhoto() {
    // if (this.uploadedImage) {
    //   if (this.student.photoUrl) {
    //     // Existing image must be deleted before
    //     await firstValueFrom(
    //       this.storage.refFromURL(this.student.photoUrl).delete()
    //     ).catch((error) => console.log(error));
    //     console.log('Old image has been deleted!');
    //   }
    //   // Upload new image
    //   const fileName = this.uploadedImage.name.replace(' ', '-');
    //   const filePath = `Imagenes/${fileName}`;
    //   const fileRef = this.storage.ref(filePath);
    //   const task = this.storage.upload(filePath, this.uploadedImage);
    //   await new Promise<void>((resolve, reject) => {
    //     task.snapshotChanges().pipe(
    //       finalize(async () => {
    //         this.student.photoUrl = await firstValueFrom(fileRef.getDownloadURL());
    //         console.log(this.student.photoUrl)
    //         console.log("Se ha guardado la imagen");
    //         resolve();
    //       })
    //     ).subscribe({
    //       next: () => {},
    //       error: error => reject(error),
    //     });
    //   });
    // } else {
    //   this.student.photoUrl = null
    // }
    return null
  }

  async onSubmit() {
    console.log("form", this.userForm.value)
    if (this.validateCurrentModalPage()) {
      this.displayErrors = false
    } else {
      this.displayErrors = true
      return
    }
    const user = await this.getUserFromForm()
    console.log("user", user)
    try {
      await this.userService.addUser(user)
      this.activeModal.close();
      this.alertService.succesAlert('Estudiante agregado exitosamente')
    } catch (error) {
      this.alertService.errorAlert(error)
    }
  }

  dismiss() {
    this.activeModal.dismiss()
  }

  ngOnDestroy() {
    this.profileServiceSubscription.unsubscribe()
    this.departmentServiceSubscription.unsubscribe()
  }

}