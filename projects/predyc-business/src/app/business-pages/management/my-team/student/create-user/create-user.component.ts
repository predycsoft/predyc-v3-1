import { Component, Input } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TimeScale } from 'chart.js/dist';
import { finalize, firstValueFrom, map, Observable, startWith, Subscription } from 'rxjs';
import { Department } from 'projects/predyc-business/src/shared/models/department.model';
import { Profile } from 'projects/predyc-business/src/shared/models/profile.model';
import { User } from 'projects/predyc-business/src/shared/models/user.model';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { DepartmentService } from 'projects/predyc-business/src/shared/services/department.service';
import { EnterpriseService } from 'projects/predyc-business/src/shared/services/enterprise.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { ProfileService } from 'projects/predyc-business/src/shared/services/profile.service';
import { UserService } from 'projects/predyc-business/src/shared/services/user.service';
import { dateFromCalendarToTimestamp, timestampToDateNumbers } from 'projects/predyc-business/src/shared/utils';
import { countriesData } from 'projects/predyc-business/src/assets/data/countries.data'
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from 'projects/predyc-business/src/shared/models/enterprise.model';

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
    private storage: AngularFireStorage,
    private afs: AngularFirestore,

  ) {

      // Obtener la fecha actual
  const today = new Date();

  // Asignar la fecha máxima
  this.maxDate = {
    year: today.getFullYear(),
    month: today.getMonth() + 1, // Los meses en JavaScript son de 0 a 11
    day: today.getDate()
  };
  }
  
  @Input() studentToEdit: User | null = null;
  @Input() enterpriseRef: DocumentReference<Enterprise> | null = null;


  minDate = {year: 1900, month: 1, day: 1};
  maxDate
  userForm: FormGroup
  displayErrors: boolean = false
  profiles: Profile[] = []
  countries: {name: string, code: string, isoCode: string}[] = countriesData
  profileServiceSubscription: Subscription
  departmentServiceSubscription: Subscription
  departments: Department[] = []
  
  filteredDepartments: Observable<string[]>;

  async ngOnInit() {
    this.isDepartmentInvalid = false

    this.profileServiceSubscription = this.profileService.getProfiles$().subscribe(profiles => {
      if (profiles) {
        console.log('profiles',profiles)
        let profilesBase=[]
        profiles.forEach(element => {
          if(element?.baseProfile?.id){
            profilesBase.push(element?.baseProfile?.id)
          }
        });

        this.profiles = profiles.filter(profile => !profilesBase.includes(profile.id));
        console.log('Filtrados', this.profiles);

      }
    })
    this.departmentServiceSubscription = this.departmentService.getDepartments$().subscribe({
      next: departments => {
        this.departments = departments
      },
      error: error => {
        this.alertService.errorAlert(error.message)
      }
    })
    await this.setupForm()
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

  async setupForm() {
    this.userForm = this.fb.group({
      displayName: [null, [Validators.required]],
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
    // Edit mode
    if (this.studentToEdit) {
      const department = this.studentToEdit.departmentRef ? (await this.studentToEdit.departmentRef.get()).data() : null
      const profile = this.studentToEdit.profile ? (await this.studentToEdit.profile.get()).data() : null
      this.userForm.patchValue({
        displayName: this.studentToEdit.displayName,
        profile: profile ? profile.id : null,
        photoUrl: this.studentToEdit.photoUrl,
        phoneNumber: this.studentToEdit.phoneNumber,
        department: department ? department.name : null,
        country: this.studentToEdit.country,
        email: this.studentToEdit.email,
        job: this.studentToEdit.job,
        experience: this.studentToEdit.experience,
      });
      this.studentToEdit.birthdate ? this.timestampToFormFormat(this.studentToEdit.birthdate, "birthdate") : null
      this.studentToEdit.hiringDate ? this.timestampToFormFormat(this.studentToEdit.hiringDate, "hiringDate") : null
      this.userForm.get('email')?.disable();
      if (this.studentToEdit.photoUrl) {
        this.imageUrl = this.studentToEdit.photoUrl;
      }
    }

  }
  
  timestampToFormFormat(timestamp: number, property: ("birthdate" | "hiringDate")) {
    const date = timestampToDateNumbers(timestamp)
    this.userForm.get(property)?.setValue({
      day: date.day, month: date.month, year: date.year
    });
  }

  imageUrl
  uploadedImage

  onFileSelected(event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || !input.files[0]) {
      this.alertService.errorAlert(`Debe seleccionar una imagen`);
      return;
    }
    const file = input.files[0];
    // if (file.type !== 'image/webp') {
    //   this.alertService.errorAlert(`La imagen seleccionada debe tener formato:  WEBP`);
    //   return;
    // }
    /* checking size here - 10MB */
    const imageMaxSize = 10000000;
    if (file.size > imageMaxSize) {
      this.alertService.errorAlert(`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {
      this.imageUrl = reader.result;
      this.uploadedImage = file;
    };
  }

  isDepartmentInvalid = false

  validateCurrentModalPage() {
    this.isDepartmentInvalid = false
    const currentPageGroup = this.userForm;
    
    if (currentPageGroup && currentPageGroup.invalid) {
      // Object.keys(currentPageGroup['controls']).forEach(field => {
      //   const control = currentPageGroup.get(field);
      //   control.markAsTouched({ onlySelf: true });
      // });
      const formData = this.userForm.getRawValue() // use getRawValue instead of value because "value" doesnt contain disabled fields (email)

      if (formData.department && formData.department !== 'null') {
        const departmentId = this.departments.find(department => department.name === formData?.department)?.id
        if(!departmentId){
          this.isDepartmentInvalid = true
          return false; // Indicate that the form is invalid
        }
      }

      return false; // Indicate that the form is invalid
    }
    else{
      const formData = this.userForm.getRawValue() // use getRawValue instead of value because "value" doesnt contain disabled fields (email)
      if (formData.department && formData.department !== 'null') {
        const departmentId = this.departments.find(department => department.name === formData?.department)?.id
        if(!departmentId){
          this.isDepartmentInvalid = true
          return false; // Indicate that the form is invalid
        }
      }
      return true; // Indicate that the form is valid
    }
  }

  async getUserFromForm(){
    this.isDepartmentInvalid = false
    // Guarda la imagen
    await this.saveStudentPhoto()
  
    const formData = this.userForm.getRawValue() // use getRawValue instead of value because "value" doesnt contain disabled fields (email)
    let department = null
    if (formData.department && formData.department !== 'null') {
      const departmentId = this.departments.find(department => department.name === formData?.department)?.id
      if(departmentId){
        department = departmentId ? this.departmentService.getDepartmentRefById(departmentId) : null
      }
      else{
        this.isDepartmentInvalid = true
      }
    }
    const userObj = {
      name: formData.displayName ? formData.displayName.toLowerCase() : null,
      displayName: formData.displayName ? formData.displayName.toLowerCase() : null,
      phoneNumber: formData.phoneNumber ? formData.phoneNumber : null,
      departmentRef: department,
      country: formData.country ? formData.country : null,
      birthdate: formData.birthdate ? dateFromCalendarToTimestamp(formData.birthdate): null,
      job: formData.job ? formData.job : null,
      hiringDate: formData.hiringDate ? dateFromCalendarToTimestamp(formData.hiringDate) : null,
      experience: formData.experience ? formData.experience : null,
      profile: formData.profile ? this.profileService.getProfileRefById(formData.profile) : null,
      email: formData.email ? formData.email.toLowerCase() : null,
      photoUrl: formData.photoUrl
    }
    let user = null
    if (this.studentToEdit?.role === User.ROLE_ADMIN) {
      user = User.getEnterpriseAdminUser(this.enterpriseService.getEnterpriseRef())
    } else {
      user = User.getEnterpriseStudentUser(this.enterpriseService.getEnterpriseRef())
    }

    if (this.enterpriseRef) {
      // console.log("this.enterpriseRef", this.enterpriseRef)
      user = User.getEnterpriseStudentUser(this.enterpriseRef)
    }

    let valueToPatch = null
    if (this.studentToEdit) {
      delete userObj.name
      valueToPatch = {
        ...this.studentToEdit,
        ...userObj
      }
    } else {
      valueToPatch = userObj
    }
    console.log("valueToPatch", valueToPatch)
    user.patchValue(valueToPatch)
    return user
  }

  async saveStudentPhoto() {
    if (this.uploadedImage) {
      if (this.userForm.controls.photoUrl) {
        // Existing image must be deleted before
        await firstValueFrom(
          this.storage.refFromURL((this.userForm.controls.photoUrl.value)).delete()
        ).catch((error) => console.log(error))
        console.log('Old image has been deleted!');
      }
      // Upload new image
      const fileName = this.uploadedImage.name.replace(' ', '-');
      const filePath = `Imagenes/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImage);
      await new Promise<void>((resolve, reject) => {
        task.snapshotChanges().pipe(
          finalize(async () => {
            const photoUrl = await firstValueFrom(fileRef.getDownloadURL());
            console.log("image has been uploaded!");
            this.userForm.controls.photoUrl.setValue(photoUrl)
            this.uploadedImage = null
            resolve();
          })
        ).subscribe({
          next: () => {},
          error: error => reject(error),
        });
      });
    }
  }


  savingChanges = false;

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
      this.savingChanges = true;
      console.log('profiles',this.profiles,user.profile) 

      let profileNew = this.profiles.find(x=>x.id == user?.profile?.id)
      
      if(profileNew &&!profileNew.enterpriseRef){

        console.log('profileNew',profileNew)
        let baseProfile = this.afs.collection<Profile>(Profile.collection).doc(profileNew.id).ref;
        profileNew.baseProfile = baseProfile

        const profile: Profile = Profile.fromJson({
          id: null,
          name: profileNew.name,
          description: profileNew.description,
          coursesRef: profileNew.coursesRef,
          baseProfile:baseProfile,
          enterpriseRef: this.enterpriseService.getEnterpriseRef(),
          permissions: profileNew ? profileNew.permissions : null,
          hoursPerMonth:profileNew.hoursPerMonth
        })
        const profileId = await this.profileService.saveProfile(profile)
        let profileRef = await  this.afs.collection<Profile>(Profile.collection).doc(profileId).ref;
        user.profile = profileRef;

      }

      if (this.studentToEdit) {
       await this.userService.editUser(user.toJson())
      }
      else{
       await this.userService.addUser(user)
      } 
      this.activeModal.close(this.userForm.value);
      this.alertService.succesAlert('Estudiante agregado exitosamente')
      this.savingChanges = false;
    } catch (error) {
      this.alertService.errorAlert(error)
    }
  }

  dismiss() {
    this.activeModal.dismiss('User closed modal')
  }

  ngOnDestroy() {
    this.profileServiceSubscription.unsubscribe()
    this.departmentServiceSubscription.unsubscribe()
  }

}
