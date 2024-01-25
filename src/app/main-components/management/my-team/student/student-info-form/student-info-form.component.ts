import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription, finalize, firstValueFrom } from 'rxjs';
import { Profile } from 'src/app/shared/models/profile.model';
import { User, UserJson } from 'src/app/shared/models/user.model';
import { AlertsService } from 'src/app/shared/services/alerts.service';
import { IconService } from 'src/app/shared/services/icon.service';
import { ProfileService } from 'src/app/shared/services/profile.service';
import { capitalizeFirstLetter } from 'src/app/shared/utils';
import { countriesData } from 'src/assets/data/countries.data';

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
  isEditing = false;
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

    ) {}

  ngOnInit() {
    this.profileService.loadProfiles()
    this.profileSubscription = this.profileService.getProfilesObservable().subscribe(profiles => {if (profiles) this.profiles = profiles})

    this.studentForm = new FormGroup({
      displayName: new FormControl(''),
      email: new FormControl(''),
      phoneNumber: new FormControl(''),
      country: new FormControl(''),
      profile: new FormControl(null),
      photoUrl: new FormControl(''),
    });

    if (this.student) {
      this.studentForm.patchValue({
        displayName: this.student.displayName,
        email: this.student.email,
        phoneNumber: this.student.phoneNumber,
        country: this.student.country,
        profile: this.studentProfile.id,
        photoUrl: this.student.photoUrl
      });
    }

    if (this.student.photoUrl) {
      this.imageUrl = this.student.photoUrl;
    }

  }

  async save() {
    if (this.isEditing) {
      const formData = this.studentForm.value 
      console.log("Guardando...", formData);
      await this.saveStudentPhoto() //this.student.photoUrl
      this.student.displayName = formData.displayName
      this.student.phoneNumber = formData.phoneNumber
      this.student.country = formData.country
      this.student.profile = formData.profile ? this.profileService.getProfileRefById(formData.profile) : null
      this.onStudentSave.emit(this.student)
    }
    this.isEditing = false
  }

  displayProfileName(id: string): string {
    const profile: Profile = this.profiles.find(x => x.id === id)
    if (profile) return profile.name
    return null
  }

  // photo
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || !input.files[0] || input.files[0].length === 0) {
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

  async saveStudentPhoto() {
    if (this.uploadedImage) {
      if (this.student.photoUrl) {
        // Existing image must be deleted before
        await firstValueFrom(
          this.storage.refFromURL(this.student.photoUrl).delete()
        ).catch((error) => console.log(error));
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
            this.student.photoUrl = await firstValueFrom(fileRef.getDownloadURL());
            console.log("image has been uploaded!");
            this.uploadedImage = null
            resolve();
          })
        ).subscribe({
          next: () => {},
          error: error => reject(error),
        });
      });
    } else {
      // this.student.photoUrl = null
    }

  }
}
