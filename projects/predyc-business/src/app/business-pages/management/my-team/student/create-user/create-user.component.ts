import { Component, Input } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { finalize, firstValueFrom, map, Observable, startWith, Subscription, take } from "rxjs";
import { Department } from "projects/shared/models/department.model";
import { Profile } from "projects/shared/models/profile.model";
import { User } from "projects/shared/models/user.model";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { DepartmentService } from "projects/predyc-business/src/shared/services/department.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ProfileService } from "projects/predyc-business/src/shared/services/profile.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";
import { cleanFileName, dateFromCalendarToTimestamp, timestampToDateNumbers, obtenerPrimerDiaDelMes } from "projects/shared/utils";
import { countriesData } from "projects/predyc-business/src/assets/data/countries.data";
import { AngularFirestore, DocumentReference } from "@angular/fire/compat/firestore";
import { Enterprise } from "projects/shared/models/enterprise.model";
// import { departmentsData } from '../../../../../../../../../.firebase/predyc-empresa/hosting/assets/data/departments.data';
import Swal from "sweetalert2";
import { CourseService } from "../../../../../../shared/services/course.service";
import { roundNumber } from "projects/shared/utils";
import { formatDate } from "@angular/common";
import { CourseByStudent } from "projects/shared/models/course-by-student.model";
import { Curso } from "projects/shared/models/course.model";

@Component({
  selector: "app-create-user",
  templateUrl: "./create-user.component.html",
  styleUrls: ["./create-user.component.css"],
})
export class CreateUserComponent {
  constructor(private activeModal: NgbActiveModal, private alertService: AlertsService, private enterpriseService: EnterpriseService, private fb: FormBuilder, private profileService: ProfileService, private userService: UserService, public icon: IconService, private departmentService: DepartmentService, private storage: AngularFireStorage, private afs: AngularFirestore, private modalService: NgbModal, private courseService: CourseService) {
    // Obtener la fecha actual
    const today = new Date();

    // Asignar la fecha máxima
    this.maxDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1, // Los meses en JavaScript son de 0 a 11
      day: today.getDate(),
    };
    this.MinDateProfile = formatDate(new Date(), "yyyy-MM-dd", "en");
    this.MinDateEndProfile = formatDate(new Date(), "yyyy-MM-dd", "en");
  }

  @Input() studentToEdit: User | null = null;
  @Input() enterpriseRef: DocumentReference<Enterprise> | null = null;
  @Input() isParticularStudent: boolean = false;

  minDate = { year: 1900, month: 1, day: 1 };
  maxDate;
  MinDateProfile;
  MaxDateProfile;
  MinDateEndProfile;
  userForm: FormGroup;
  displayErrors: boolean = false;
  profiles: Profile[] = [];
  countries: { name: string; code: string; isoCode: string }[] = countriesData;
  profileServiceSubscription: Subscription;
  departmentServiceSubscription: Subscription;
  coursesByStudentSubscription: Subscription;
  departments: Department[] = [];
  courses = [];

  filteredDepartments: Observable<string[]>;

  enterprise: Enterprise = null

  async ngOnInit() {
    this.isDepartmentInvalid = false;
    this.getCourses();
    await this.setupForm();
    this.departmentServiceSubscription = this.departmentService.getDepartments$(this.enterpriseRef).subscribe({
      next: (departments) => {
        let departmentsBase = [];
        departments.forEach((element) => {
          if (element?.baseDepartment?.id) {
            departmentsBase.push(element?.baseDepartment?.id);
          }
        });

        this.departments = departments.filter((department) => !departmentsBase.includes(department.id));
        // console.log("Filtrados", this.departments);

        this.filteredDepartments = this.userForm.controls.department.valueChanges.pipe(
          startWith(""),
          map((value) => this._filter(value || ""))
        );
      },
      error: (error) => {
        this.alertService.errorAlert(error.message);
      },
    });
  }

  cursos = [];

  async getCourses() {
    const cursos = await firstValueFrom(this.courseService.getCourses$(this.enterpriseRef))
    // console.log("cursos", cursos);
    this.cursos = cursos;
    const profiles = await firstValueFrom(this.profileService.getProfiles$(this.enterpriseRef))
    if (profiles) {
      // console.log("profiles", profiles);
      let profilesBase = [];
      profiles.forEach((element) => {
        if (element?.baseProfile?.id) {
          profilesBase.push(element?.baseProfile?.id);
        }
      });

      let profilesFilteres = profiles.filter((profile) => !profilesBase.includes(profile.id));
      profilesFilteres.forEach((perfil) => {
        if (perfil?.coursesRef.length > 0) {
          let cursos = [];
          let duracion = 0;
          perfil.coursesRef
            // .map((item) => item.courseRef)
            .forEach((cursoRef) => {
              let id = cursoRef["courseRef"]["id"];
              let curso = this.cursos.find((x) => x.id == id);
              cursos.push(curso);
              duracion += curso.duracion;
            });
          perfil["cursos"] = cursos;
          perfil["duracion"] = duracion;
        }
      });
      this.profiles = profilesFilteres;
      // console.log("profiles Filtrados", this.profiles);
    }
  }

  private _filter(value: string): string[] {
    // console.log("filter", value, this.departments);
    const filterValue = value.toLowerCase();
    // console.log("this.departments", this.departments, filterValue);
    return this.departments.map((department) => department.name).filter((option) => option.toLowerCase().includes(filterValue));
  }

  formNewDepartment: FormGroup;
  showErrorDepartment = false;
  modalCrearDepartment;

  createDepartment(modal) {
    this.userForm.get("department").patchValue("");
    this.showErrorDepartment = false;
    this.formNewDepartment = new FormGroup({
      nombre: new FormControl(null, Validators.required),
    });

    this.modalCrearDepartment = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "sm",
    });
  }

  async saveNewDepartment() {
    this.showErrorDepartment = false;

    if (this.formNewDepartment.valid) {
      let ValidateName = this.departments.filter((x) => x.name == this.formNewDepartment.value.nombre);

      console.log("ValidateName", ValidateName, this.departments);

      if (ValidateName.length >= 1) {
        Swal.fire({
          title: "Nombre ya en uso!",
          text: `Por favor verifique el nombre del departamento para poder crearlo`,
          icon: "warning",
          confirmButtonColor: "var(--blue-5)",
        });
      } else {
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();
        let deparment = new Department(null, this.formNewDepartment.value.nombre, enterpriseRef, null);
        await this.departmentService.add(deparment);
        this.modalCrearDepartment.close();
        this.userForm.get("department").patchValue(deparment.name);
      }
    } else {
      this.showErrorDepartment = true;
    }
  }

  onRoleChange(event: any): void {
    if (event.checked) {
      this.userForm.get("role").setValue("admin");
    } else {
      this.userForm.get("role").setValue("student");
    }
  }

  async setupForm() {

    if (this.enterpriseRef) {
      this.enterprise = await this.enterpriseService.getEnterpriseByIdPromise(this.enterpriseRef.id);
    } else {
      let enterpriseRef = this.enterpriseService.getEnterpriseRef();
      this.enterprise = await this.enterpriseService.getEnterpriseByIdPromise(enterpriseRef.id);
    }

    // console.log("enterprise", enterprise);
    let canEnrollParticularCourses = false;
    if (this.enterprise.allUsersExtraCourses) {
      canEnrollParticularCourses = true;
    }

    this.userForm = this.fb.group({
      displayName: [null, [Validators.required]],
      profile: [null],
      photoUrl: [null],
      canEnrollParticularCourses: [canEnrollParticularCourses],
      startDateStudy: [null],
      endDateStudy: [null],
      phoneNumber: [null, [Validators.pattern(/^\d*$/)]],
      department: [null],
      country: [null],
      birthdate: [null],
      email: [null, [Validators.required, Validators.email]],
      job: [null],
      hiringDate: [null],
      experience: [null],
      role: ["student"],
    });
    // Edit mode
    if (this.studentToEdit) {
      console.log("this.studentToEdit", this.studentToEdit);
      const department = this.studentToEdit.departmentRef ? (await this.studentToEdit.departmentRef.get()).data() : null;
      const profile = this.studentToEdit.profile ? (await this.studentToEdit.profile.get()).data() : null;
      this.userForm.patchValue({
        displayName: this.studentToEdit.displayName,
        canEnrollParticularCourses: this.studentToEdit.canEnrollParticularCourses,
        profile: profile ? profile.id : null,
        photoUrl: this.studentToEdit.photoUrl,
        phoneNumber: this.studentToEdit.phoneNumber,
        department: department ? department.name : null,
        country: this.studentToEdit.country,
        email: this.studentToEdit.email,
        job: this.studentToEdit.job,
        experience: this.studentToEdit.experience,
        role: this.studentToEdit.role,
      });
      this.studentToEdit.birthdate ? this.timestampToFormFormat(this.studentToEdit.birthdate, "birthdate") : null;
      this.studentToEdit.hiringDate ? this.timestampToFormFormat(this.studentToEdit.hiringDate, "hiringDate") : null;
      this.userForm.get("email")?.disable();
      if (this.studentToEdit.photoUrl) {
        this.imageUrl = this.studentToEdit.photoUrl;
      }

      let userRef = this.afs.collection<User>(User.collection).doc(this.studentToEdit.uid).ref;

      this.coursesByStudentSubscription = this.courseService.getActiveCoursesByStudent$(userRef).pipe(take(1)).subscribe((cursos) => {
        // console.log("cursos", cursos);
        if (cursos && cursos.length > 0) {
          // Inicializar las variables para almacenar los valores mínimos y máximos
          let minStartDate = Number.MAX_SAFE_INTEGER;
          let maxEndDate = 0;
          cursos.forEach((curso) => {
            // Actualizar el valor mínimo de la fecha de inicio si el curso actual tiene una fecha menor
            if (curso.dateStartPlan.seconds < minStartDate) {
              minStartDate = curso.dateStartPlan.seconds;
            }
            // Actualizar el valor máximo de la fecha de fin si el curso actual tiene una fecha mayor
            if (curso.dateEndPlan.seconds > maxEndDate) {
              maxEndDate = curso.dateEndPlan.seconds;
            }
          });

          // Convertir los segundos a fechas para una mejor visualización (opcional)
          const minStartDateFormatted = new Date(minStartDate * 1000);
          const maxEndDateFormatted = this.obtenerUltimoDiaDelMes(maxEndDate);

          console.log("Menor fecha de inicio:", minStartDateFormatted);
          console.log("Mayor fecha de fin:", maxEndDateFormatted);

          if (maxEndDateFormatted) {
            this.MaxDateProfile = formatDate(maxEndDateFormatted, "yyyy-MM-dd", "en");
          }

          this.userForm.patchValue({
            startDateStudy: this.formatDateToInput(minStartDateFormatted),
            endDateStudy: this.formatDateToInput(maxEndDateFormatted),
          });
        }
      });
    }
  }

  changeProfile() {
    this.hoursPlan = 0;

    const profile = this.profiles.find((x) => x.id == this.userForm.get("profile").value);
    const endDate = this.userForm.get("endDateStudy").value;
    const startDate = this.userForm.get("startDateStudy").value;

    if (profile && endDate && startDate) {
      let endDateObjet = this.toDateFromInput(endDate);
      const startDateObjet = this.toDateFromInput(startDate);
      endDateObjet = this.obtenerUltimoDiaDelMes(endDateObjet.getTime() / 1000);
      const difMeses = this.calculateMonthsDifference(startDateObjet, endDateObjet);
      const profile = this.profiles.find((x) => x.id == this.userForm.get("profile").value);
      const duracionPlan = Math.ceil(profile["duracion"] / 60);
      const hoursMes = Math.ceil(duracionPlan / difMeses);
      this.hoursPlan = hoursMes;
    }
    if (profile && (!endDate || !startDate)) {
      console.log(profile.hoursPerMonth);

      let hoursPerMonth = profile.hoursPerMonth;
      let hoursPlan = profile["duracion"] / 60;

      let maxDate = this.calculateEndDate(hoursPerMonth, hoursPlan);

      this.userForm.patchValue({
        startDateStudy: this.formatDateToInput(new Date()),
        endDateStudy: this.formatDateToInput(maxDate),
      });

      this.changedDate(this.formatDateToInput(maxDate), "end");
    }
  }

  calculateEndDate(hoursPerMonth: number, totalHoursPlan: number): Date {
    // Obtiene la fecha actual
    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // Calcula el número total de meses requeridos redondeando hacia arriba
    const totalMonthsNeeded = Math.ceil(totalHoursPlan / hoursPerMonth);

    // Calcula el año y mes finales
    let finalMonth = currentMonth + totalMonthsNeeded - 1; // Resta 1 porque el mes actual cuenta
    let finalYear = currentYear;

    if (finalMonth > 11) {
      finalYear += Math.floor(finalMonth / 12);
      finalMonth %= 12;
    }

    // Encuentra el último día del mes final
    const lastDay = new Date(finalYear, finalMonth + 1, 0); // Usar 0 devuelve el último día del mes anterior, que es nuestro mes final.

    // Ajusta para que sea el último momento del último día del mes
    const finalDateWithLastMoment = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999);

    return finalDateWithLastMoment;
  }

  changedDate(eventOrValue, type) {
    this.messageHoursPlan = "";
    this.hoursPlan = 0;

    let value;

    if (typeof eventOrValue === "string" || eventOrValue instanceof String) {
      // Se llama directamente con un valor
      value = eventOrValue;
    } else {
      // Se llama con un evento
      value = eventOrValue.target.value;
    }

    if (type == "start") {
      const endDate = this.userForm.get("endDateStudy").value;
      let startDateObjet = this.toDateFromInput(value);

      this.MinDateEndProfile = formatDate(startDateObjet, "yyyy-MM-dd", "en");

      if (endDate) {
        const endDateObjet = this.toDateFromInput(endDate);
        startDateObjet = this.obtenerUltimoDiaDelMes(startDateObjet.getTime() / 1000);
        const difMeses = this.calculateMonthsDifference(startDateObjet, endDateObjet);
        const profile = this.profiles.find((x) => x.id == this.userForm.get("profile").value);
        const duracionPlan = Math.ceil(profile["duracion"] / 60);
        const hoursMes = Math.ceil(duracionPlan / difMeses);
        this.hoursPlan = hoursMes;
      }
    } else {
      const startDate = this.userForm.get("startDateStudy").value;
      let endDateObjet = this.toDateFromInput(value);
      this.MaxDateProfile = formatDate(endDateObjet, "yyyy-MM-dd", "en");
      if (startDate) {
        const startDateObjet = this.toDateFromInput(startDate);
        endDateObjet = this.obtenerUltimoDiaDelMes(endDateObjet.getTime() / 1000);
        const difMeses = this.calculateMonthsDifference(startDateObjet, endDateObjet);
        const profile = this.profiles.find((x) => x.id == this.userForm.get("profile").value);
        const duracionPlan = Math.ceil(profile["duracion"] / 60);
        const hoursMes = Math.ceil(duracionPlan / difMeses);
        this.hoursPlan = hoursMes;
      }
    }
  }

  messageHoursPlan;
  hoursPlan = 0;

  calculateMonthsDifference(startDate: Date, endDate: Date): number {
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endMonth = endDate.getMonth();

    const monthsDifference = (endYear - startYear) * 12 + (endMonth - startMonth);
    return monthsDifference >= 0 ? monthsDifference + 1 : 0;
  }

  toDateFromInput(inputValue) {
    const [year, month, day] = inputValue.split("-").map((num) => parseInt(num, 10));
    // Ten en cuenta que los meses en JavaScript son 0-indexados (0 = enero, 11 = diciembre),
    // así que resta 1 al mes al crear el objeto Date.
    return new Date(year, month - 1, day);
  }

  formatDateToInput(date) {
    const d = new Date(date);
    let month = "" + (d.getMonth() + 1),
      day = "" + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = "0" + month;
    if (day.length < 2) day = "0" + day;

    let respuesta = [year, month, day].join("-");
    console.log("formatDateToInput", respuesta);

    return respuesta;
  }

  obtenerUltimoDiaDelMes(fecha: number) {
    fecha = fecha * 1000;
    let fechaOriginal = new Date(fecha);
    const anio = fechaOriginal.getFullYear();
    const mes = fechaOriginal.getMonth();
    const ultimoDiaDelMes = new Date(anio, mes + 1, 0);

    // Establecer la hora a 23:59:59
    ultimoDiaDelMes.setHours(23, 59, 59);

    return ultimoDiaDelMes;
  }

  timestampToFormFormat(timestamp: number, property: "birthdate" | "hiringDate") {
    const date = timestampToDateNumbers(timestamp);
    this.userForm.get(property)?.setValue({
      day: date.day,
      month: date.month,
      year: date.year,
    });
  }

  imageUrl;
  uploadedImage;

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

  isDepartmentInvalid = false;

  validateCurrentModalPage() {
    this.isDepartmentInvalid = false;
    const currentPageGroup = this.userForm;

    if (currentPageGroup && currentPageGroup.invalid) {
      // Object.keys(currentPageGroup['controls']).forEach(field => {
      //   const control = currentPageGroup.get(field);
      //   control.markAsTouched({ onlySelf: true });
      // });
      const formData = this.userForm.getRawValue(); // use getRawValue instead of value because "value" doesnt contain disabled fields (email)

      if (formData.department && formData.department !== "null") {
        const departmentId = this.departments.find((department) => department.name === formData?.department)?.id;
        if (!departmentId) {
          this.isDepartmentInvalid = true;
          return false; // Indicate that the form is invalid
        }
      }

      return false; // Indicate that the form is invalid
    } else {
      const formData = this.userForm.getRawValue(); // use getRawValue instead of value because "value" doesnt contain disabled fields (email)
      if (formData.department && formData.department !== "null") {
        const departmentId = this.departments.find((department) => department.name === formData?.department)?.id;
        if (!departmentId) {
          this.isDepartmentInvalid = true;
          return false; // Indicate that the form is invalid
        }
      }
      return true; // Indicate that the form is valid
    }
  }

  async getUserFromForm() {
    this.isDepartmentInvalid = false;
    // Guarda la imagen
    await this.saveStudentPhoto();

    const formData = this.userForm.getRawValue(); // use getRawValue instead of value because "value" doesnt contain disabled fields (email)
    let department = null;
    if (formData.department && formData.department !== "null") {
      const departmentId = this.departments.find((department) => department.name === formData?.department)?.id;
      if (departmentId) {
        department = departmentId ? this.departmentService.getDepartmentRefById(departmentId) : null;
      } else {
        this.isDepartmentInvalid = true;
      }
    }
    const userObj = {
      name: formData.displayName ? formData.displayName.toLowerCase() : null,
      displayName: formData.displayName ? formData.displayName.toLowerCase() : null,
      phoneNumber: formData.phoneNumber ? formData.phoneNumber : null,
      departmentRef: department,
      canEnrollParticularCourses: formData.canEnrollParticularCourses ? formData.canEnrollParticularCourses : false,
      country: formData.country ? formData.country : null,
      birthdate: formData.birthdate ? dateFromCalendarToTimestamp(formData.birthdate) : null,
      job: formData.job ? formData.job : null,
      hiringDate: formData.hiringDate ? dateFromCalendarToTimestamp(formData.hiringDate) : null,
      experience: formData.experience ? formData.experience : null,
      profile: formData.profile ? this.profileService.getProfileRefById(formData.profile) : null,
      email: formData.email ? formData.email.toLowerCase() : null,
      photoUrl: formData.photoUrl,
      role: formData.role,
    };

    let user = null;
    if (this.isParticularStudent) user = User.getStudentUser();
    else {
      if (this.studentToEdit?.role === User.ROLE_ADMIN) {
        user = User.getEnterpriseAdminUser(this.enterpriseService.getEnterpriseRef());
      } else {
        user = User.getEnterpriseStudentUser(this.enterpriseService.getEnterpriseRef());
      }
    }

    if (this.enterpriseRef) {
      // console.log("this.enterpriseRef", this.enterpriseRef)
      user = User.getEnterpriseStudentUser(this.enterpriseRef);
    }

    let valueToPatch = null;
    if (this.studentToEdit) {
      delete userObj.name;
      valueToPatch = {
        ...this.studentToEdit,
        ...userObj,
      };
    } else {
      valueToPatch = userObj;
    }
    // console.log("valueToPatch", valueToPatch);
    user.patchValue(valueToPatch);
    return user;
  }

  async saveStudentPhoto() {
    if (this.uploadedImage) {
      if (this.userForm.controls.photoUrl) {
        // Existing image must be deleted before
        await firstValueFrom(this.storage.refFromURL(this.userForm.controls.photoUrl.value).delete()).catch((error) => console.log(error));
        console.log("Old image has been deleted!");
      }
      // Upload new image
      const fileName = cleanFileName(this.uploadedImage.name);
      const filePath = `Imagenes/${fileName}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, this.uploadedImage);
      await new Promise<void>((resolve, reject) => {
        task
          .snapshotChanges()
          .pipe(
            finalize(async () => {
              const photoUrl = await firstValueFrom(fileRef.getDownloadURL());
              console.log("image has been uploaded!");
              this.userForm.controls.photoUrl.setValue(photoUrl);
              this.uploadedImage = null;
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

  savingChanges = false;

  async onSubmit() {
    console.log("form", this.userForm.value, this.hoursPlan);
    if (this.validateCurrentModalPage()) {
      this.displayErrors = false;
    } else {
      this.displayErrors = true;
      return;
    }
    const user = await this.getUserFromForm();
    console.log("user", user);
    try {
      this.savingChanges = true;
      // console.log("profiles", this.profiles, user.profile);

      let profileNew = this.profiles.find((x) => x.id == user?.profile?.id);

      if (profileNew && !profileNew.enterpriseRef) {
        // console.log("profileNew", profileNew);
        let baseProfile = this.afs.collection<Profile>(Profile.collection).doc(profileNew.id).ref;
        profileNew.baseProfile = baseProfile;

        const profile: Profile = Profile.fromJson({
          id: null,
          name: profileNew.name,
          description: profileNew.description,
          coursesRef: profileNew.coursesRef,
          baseProfile: baseProfile,
          enterpriseRef: this.enterpriseService.getEnterpriseRef(),
          permissions: profileNew ? profileNew.permissions : null,
          hoursPerMonth: profileNew.hoursPerMonth,
        });
        const profileId = await this.profileService.saveProfile(profile);
        let profileRef = this.afs.collection<Profile>(Profile.collection).doc(profileId).ref;
        user.profile = profileRef;
      }

      let departmentNew = this.departments.find((x) => x?.id == user?.departmentRef?.id);

      if (departmentNew && !departmentNew?.enterpriseRef) {
        let baseDepartment = this.afs.collection<Department>(Department.collection).doc(departmentNew.id).ref;
        let enterpriseRef = this.enterpriseService.getEnterpriseRef();

        let deparment = new Department(null, departmentNew.name, enterpriseRef, baseDepartment);
        console.log("deparmentadd", deparment);
        await this.departmentService.add(deparment);
        let departmentRef = await this.afs.collection<Department>(Department.collection).doc(deparment.id).ref;
        user.departmentRef = departmentRef;
      }

      if (this.studentToEdit) {
        await this.userService.editUser(user.toJson());
      } else {
        await this.userService.addUser(user);
      }

      const enterpriseCoursesToEnroll: DocumentReference<Curso>[] = this.enterprise.coursesRef
      if (enterpriseCoursesToEnroll && enterpriseCoursesToEnroll.length > 0) {
        for (let i = 0; i < enterpriseCoursesToEnroll.length; i++) {
          const courseRef = enterpriseCoursesToEnroll[i]
          await this.courseService.saveCourseByStudent(courseRef, this.userService.getUserRefById(user.uid), null, null, true, i);
        }
      }

      let valores = this.userForm.value;

      if (valores.startDateStudy && valores.profile && this.hoursPlan > 0) {
        console.log(user, valores.startDateStudy, valores.profile, this.hoursPlan);
        let fehcaInicio = this.toDateFromInput(valores.startDateStudy);
        let fechaInicioMes = new Date(obtenerPrimerDiaDelMes(fehcaInicio.getTime()));
        await this.saveInitForm(user.uid, this.hoursPlan, fechaInicioMes, profileNew);
      }

      this.userForm.value.uid = user?.uid;

      this.activeModal.close(this.userForm.value);
      this.alertService.succesAlert("Estudiante agregado exitosamente");
      this.savingChanges = false;
    } catch (error) {
      console.error("Error", error);
      this.alertService.errorAlert("");
      this.savingChanges = false;
    }
  }

  async saveInitForm(uid, hoursPerMonth, startDateStudy, profile) {
    await this.userService.saveStudyPlanHoursPerMonth(uid, hoursPerMonth);
    await this.createStudyPlan(uid, hoursPerMonth, profile, startDateStudy);
  }

  async createStudyPlan(uid, hoursPerMonth, profile, startDateStudy) {
    console.log("startDateStudy", startDateStudy);
    const coursesRefs: any[] = profile.coursesRef.sort((b: { courseRef: DocumentReference<Curso>; studyPlanOrder: number }, a: { courseRef: DocumentReference<Curso>; studyPlanOrder: number }) => b.studyPlanOrder - a.studyPlanOrder);
    // .map((item) => item.courseRef);
    let dateStartPlan: number;
    let dateEndPlan: number;
    let now = new Date();
    let hoy = +new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const hoursPermonth = hoursPerMonth;
    console.log("hoursPermonth", hoursPermonth, coursesRefs);

    const userRef: DocumentReference | DocumentReference<User> = this.userService.getUserRefById(uid);
    for (let i = 0; i < coursesRefs.length; i++) {
      const courseData = this.cursos.find((courseData) => courseData.id === coursesRefs[i].courseRef.id);
      const courseDuration = courseData.duracion;

      if (startDateStudy) {
        dateStartPlan = +startDateStudy;
        startDateStudy = null;
      } else dateStartPlan = dateEndPlan ? dateEndPlan : hoy;

      dateEndPlan = this.courseService.calculatEndDatePlan(dateStartPlan, courseDuration, hoursPermonth);
      console.log("dates", dateStartPlan, dateEndPlan); //estoy aqui
      //  ---------- if it already exists, activate it as studyPlan, otherwise, create it as studyPlan ----------
      const courseByStudent: CourseByStudent | null = await this.courseService.getCourseByStudent(userRef as DocumentReference<User>, coursesRefs[i].courseRef as DocumentReference<Curso>);
      // console.log("courseByStudent", courseByStudent)
      if (courseByStudent) {
        await this.courseService.setCourseByStudentActive(courseByStudent.id, new Date(dateStartPlan), new Date(dateEndPlan));
      } else {
        await this.courseService.saveCourseByStudent(coursesRefs[i].courseRef, userRef, new Date(dateStartPlan), new Date(dateEndPlan), false, i);
      }
    }
  }

  dismiss() {
    this.activeModal.dismiss("User closed modal");
  }

  ngOnDestroy() {
    if (this.profileServiceSubscription) this.profileServiceSubscription.unsubscribe();
    if (this.departmentServiceSubscription) this.departmentServiceSubscription.unsubscribe();
    if (this.coursesByStudentSubscription) this.coursesByStudentSubscription.unsubscribe();
  }

  getFormattedDuration(perfil) {
    const hours = Math.floor(perfil.duracion / 60);
    const minutes = perfil.duracion % 60;
    return `${hours}:${minutes} hrs`;
  }

  modalCourses;

  showCoursesProfile(modal) {
    this.modalCourses = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      size: "md",
    });
  }

  getNameProfileSelected() {
    const id = this.userForm.get("profile").value;
    const profile = this.profiles.find((x) => x.id == id);
    return profile?.name;
  }

  getCoursesProfileSelected() {
    const id = this.userForm.get("profile").value;
    const profile = this.profiles.find((x) => x.id == id);
    let cursos = profile["cursos"];
    if (cursos) {
      return cursos;
    }
    return [];
  }

  roundNumber(number: number) {
    return roundNumber(number);
  }
}
