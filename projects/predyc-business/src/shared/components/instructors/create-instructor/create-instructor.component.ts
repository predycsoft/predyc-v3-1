import { Component, Input } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormBuilder, FormControl, FormGroup, Validators,} from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { finalize, firstValueFrom, map, Observable, startWith, Subscription, take,} from "rxjs";
import { Department } from "projects/shared/models/department.model";
import { Profile } from "projects/shared/models/profile.model";
import { User } from "projects/shared/models/user.model";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { DepartmentService } from "projects/predyc-business/src/shared/services/department.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ProfileService } from "projects/predyc-business/src/shared/services/profile.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { cleanFileName, dateFromCalendarToTimestamp, timestampToDateNumbers,obtenerPrimerDiaDelMes} from "projects/shared/utils";
import { countriesData } from "projects/predyc-business/src/assets/data/countries.data";
import { AngularFirestore, DocumentReference,} from "@angular/fire/compat/firestore";
import { Enterprise } from "projects/shared/models/enterprise.model";
// import { departmentsData } from '../../../../../../../../../.firebase/predyc-empresa/hosting/assets/data/departments.data';
import Swal from "sweetalert2";
import { roundNumber } from "projects/shared/utils";
import { formatDate } from "@angular/common";
import { CourseByStudent, Curso } from "shared";
import { CourseService } from "../../../services/course.service";

@Component({
  selector: "app-create-instructor",
  templateUrl: "./create-instructor.component.html",
  styleUrls: ["./create-instructor.component.css"],
})
export class CreateInstrcutorComponent {
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
    private modalService: NgbModal,
    private courseService: CourseService
  ) 
  {

  }

  @Input() instructorToEdit: any | null = null;
  @Input() enterpriseRef: DocumentReference<Enterprise> | null = null;

  instructorForm: FormGroup;


  async setupForm() {

    let enterprise = null

    if(this.enterpriseRef){
      enterprise  = await this.enterpriseService.getEnterpriseByIdPromise(this.enterpriseRef.id);
    }
    else {
      let enterpriseRef = this.enterpriseService.getEnterpriseRef()
      enterprise = await this.enterpriseService.getEnterpriseByIdPromise(enterpriseRef.id);
    }

    console.log('enterprise',enterprise)

    this.instructorForm = this.fb.group({
      nombre: [null, [Validators.required]],
      descripcion: [null, [Validators.required]],
      email: [null, [Validators.required,Validators.email]],
      foto: [null, [Validators.required]],
      firma:[null],
      porcentaje:[null],
      enterpriseRef:[null],
    });

    if (this.instructorToEdit) {

      let enterpriseRef = null
      if(this.instructorToEdit?.enterpriseId){
        enterpriseRef = await this.afs.collection<Enterprise>(Enterprise.collection).doc(this.instructorToEdit.enterpriseId).ref;
      }

      this.instructorForm.patchValue({
        nombre: this.instructorToEdit.nombre,
        descripcion:this.instructorToEdit.descripcion,
        foto: this.instructorToEdit.foto,
        firma: this.instructorToEdit.firma,
        porcentaje: this.instructorToEdit.porcentaje,
        email:this.instructorToEdit.email,
        enterpriseRef: enterpriseRef,
     })

     if (this.instructorToEdit.foto) {
      this.imageUrlPhoto = this.instructorToEdit.foto;
      }
      if (this.instructorToEdit.firma) {
        this.imageUrlFirma = this.instructorToEdit.firma;
      }
    }

  }

  imageLoadError = false

  handleImageError() {
    this.imageLoadError = true;
  }

  displayErrors: boolean = false;

  imageUrlPhoto
  uploadedImagePhoto
  imageUrlFirma
  uploadedImageFirma

  savingChanges

  async onSubmit(){

    this.displayErrors = false

    if(this.instructorForm.valid){

      await this.saveInstrcutorFirma();
      await this.saveInstrcutorPhoto();

      let valores = this.instructorForm.value;
      valores.id = null;
      if(this.instructorToEdit){
        valores.id = this.instructorToEdit.id
      }

      this.activeModal.close(this.instructorForm.value);
      this.alertService.succesAlert("Instructor guardado exitosamente");


    }
    else{
      console.log(this.instructorForm)
      this.displayErrors = true
    }




  }

  ngOnInit(): void {

    console.log('instructorToEdit',this.instructorToEdit)
    this.setupForm()
  }

  roundNumber(number: number) {
    return roundNumber(number);
  }

  dismiss() {
    this.activeModal.dismiss("User closed modal");
  }

  onFileSelected(event,type) {
    const input = event.target as HTMLInputElement;
    if (!input || !input.files || !input.files[0]) {
      this.alertService.errorAlert(`Debe seleccionar una imagen`);
      return;
    }
    const file = input.files[0];
    /* checking size here - 10MB */
    const imageMaxSize = 10000000;
    if (file.size > imageMaxSize) {
      this.alertService.errorAlert(
        `El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`
      );
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (_event) => {

      if(type=='foto'){
        this.imageUrlPhoto = reader.result;
        this.uploadedImagePhoto = file;
        this.instructorForm.get("foto").patchValue(this.imageUrlPhoto);

      }
      else if (type=='firma'){
        this.imageUrlFirma = reader.result;
        this.uploadedImageFirma = file;
        this.instructorForm.get("firma").patchValue(this.imageUrlFirma);
      }

    };
  }


  async saveInstrcutorFirma() {
    if (this.uploadedImageFirma) {
      if (this.instructorForm.controls.firma) {
        try {
          await firstValueFrom(
            this.storage.refFromURL(this.instructorForm.controls.firma.value).delete()
          );
          console.log("Old image has been deleted!");
        } catch (error) {
          console.log("Error deleting old image:", error);
        }
      }
      // Upload new image
      const fileName = cleanFileName(this.uploadedImageFirma.name);
      const filePath = `Clientes/predyc/Instructores/${this.instructorForm.controls.nombre.value}/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImageFirma);
      await new Promise<void>((resolve, reject) => {
        task
          .snapshotChanges()
          .pipe(
            finalize(async () => {
              const photoUrl = await firstValueFrom(fileRef.getDownloadURL());
              console.log("image has been uploaded!");
              this.instructorForm.controls.firma.setValue(photoUrl);
              this.uploadedImageFirma = null;
              resolve();
            })
          )
          .subscribe({
            next: () => {},
            error: (error) => reject(error),
          });
      });
    }
  }

  async saveInstrcutorPhoto() {
    if (this.uploadedImagePhoto) {
      if (this.instructorForm.controls.foto) {
        try {
          await firstValueFrom(
            this.storage.refFromURL(this.instructorForm.controls.foto.value).delete()
          );
          console.log("Old image has been deleted!");
        } catch (error) {
          console.log("Error deleting old image:", error);
        }
      }
      // Upload new image
      const fileName = cleanFileName(this.uploadedImagePhoto.name);
      const filePath = `Clientes/predyc/Instructor/${this.instructorForm.controls.nombre.value}/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImagePhoto);
      await new Promise<void>((resolve, reject) => {
        task
          .snapshotChanges()
          .pipe(
            finalize(async () => {
              const photoUrl = await firstValueFrom(fileRef.getDownloadURL());
              console.log("image has been uploaded!");
              this.instructorForm.controls.foto.setValue(photoUrl);
              this.uploadedImagePhoto = null;
              resolve();
            })
          )
          .subscribe({
            next: () => {},
            error: (error) => reject(error),
          });
      });
    }
  }
}
