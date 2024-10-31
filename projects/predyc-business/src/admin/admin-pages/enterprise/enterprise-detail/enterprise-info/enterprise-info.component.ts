import { Component, Input } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize, firstValueFrom, map, Observable, startWith, Subscription } from "rxjs";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { DialogService } from "projects/predyc-business/src/shared/services/dialog.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { cleanFileName, CourseByStudent, Curso, CursoJson, LicenseJson, titleCase, User } from "projects/shared";
import Swal from 'sweetalert2';
import { DocumentReference } from "@angular/fire/compat/firestore";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { CourseService } from "projects/predyc-business/src/shared/services/course.service";
import { UserService } from "projects/predyc-business/src/shared/services/user.service";

@Component({
	selector: "app-enterprise-info",
	templateUrl: "./enterprise-info.component.html",
	styleUrls: ["./enterprise-info.component.css"],
})
export class EnterpriseInfoComponent {
	@Input() enterprise: Enterprise;

	constructor(
		private fb: FormBuilder,
		private enterpriseService: EnterpriseService,
		private alertService: AlertsService,
		private dialogService: DialogService,
		private router: Router,
		private storage: AngularFireStorage,
		private entepriseService: EnterpriseService,
		private userService: UserService,
		private courseService: CourseService,
		private functions: AngularFireFunctions,
		public icon: IconService
	) {}

	enterpriseForm: FormGroup;
	showError
	enterpriseRef: DocumentReference<Enterprise>

	imageUrl: string | ArrayBuffer | null = null;
	uploadedImage: File | null = null;

	lastDayAdminMail = null
	lastDayUsersMail = null

	allCourses: CursoJson[] = [];
	coursesSubscription: Subscription
	coursesForm = new FormControl();
	filteredCourses: Observable<CursoJson[]>;
	enterpriseCourses: CursoJson[] = [];

	usersSubscription: Subscription
	enterpriseUsers: User[]

	ngOnInit() {
		this.enterpriseRef = this.entepriseService.getEnterpriseRefById(this.enterprise?.id)
		this.coursesSubscription = this.courseService.getAllCourses$().subscribe((courses) => {
			this.allCourses = courses
			// console.log("this.allCourses", this.allCourses)
			this.filteredCourses = this.coursesForm.valueChanges.pipe(
				startWith(''),
				map(value => this._filterCourses(value))
			  );
		})
		this.usersSubscription = this.userService.getUsersByEnterpriseRef$(this.enterpriseRef).subscribe((users) => {
			this.enterpriseUsers = users
		})
		// console.log("this.enterprise", this.enterprise)
		this.setupForm();
		// this.coursesForm.setValue('');
	}

	async sendMailAdmin(){

		let date = new Date()

		this.lastDayAdminMail = (date.getTime());
		let idEmpresa = this.enterprise.id
		await firstValueFrom(this.functions.httpsCallable("mailAccountManagementAdmin")({idEmpresa:idEmpresa}))
	}

	async sendMailUsers(){

		let date = new Date()

		this.lastDayUsersMail = (date.getTime());
		let idEmpresa = this.enterprise.id
		await firstValueFrom(this.functions.httpsCallable("mailAccountManagementUsers")({idEmpresa:idEmpresa}))
	}

	async setupForm() {
		this.enterpriseForm = this.fb.group({
			name: [null, [Validators.required]],
			summary: [null],
			description: [null],
			website: [null],
			linkedin: [null],
			photoUrl: [null],
			examenInicial: [true],
			examenFinal: [true],
			allUsersExtraCourses: [false],
			demo: [false],
			tractian: [false],
			congratulationsEndCourse: [false],
			sendMailtoAdmin: [false],
			sendMailtoUsers: [false],
			mondlyMeetings: [false],
			useWhatsapp: [false],
			showEnterpriseLogoInCertificates: [false],
			accountManagerName: [null],
			accountManagerPhone: [null],
			reportMails: [null],
			requireAccountManagement: [true],
			salesMan: [null],
			phoneContactPerson:[null],
			contactPerson:[null],
			mailContactPerson:[null],
		});
		// For courses mat form 
		this.filteredCourses = this.coursesForm.valueChanges.pipe(
			startWith(''),
			map(value => this._filterCourses(value))
		);
		// Edit mode
		if (this.enterprise) {

			this.lastDayAdminMail = this.enterprise['lastDayAdminMail']?.seconds*1000
			this.lastDayUsersMail = this.enterprise['lastDayUsersMail']?.seconds*1000

			if(this.enterprise.examenInicial  === undefined ) this.enterprise.examenInicial = true
			
			if(this.enterprise.examenFinal  === undefined ) this.enterprise.examenFinal = true
			
			if(this.enterprise.allUsersExtraCourses  === undefined ) this.enterprise.allUsersExtraCourses= false
			
			// if(this.enterprise.demo  === undefined ){
			// 	this.enterprise.demo = true
			// }

			this.enterpriseForm.patchValue({
				name: this.enterprise.name,
				summary: "",
				description: this.enterprise.description,
				website: this.enterprise.socialNetworks.website,
				linkedin: this.enterprise.socialNetworks.linkedin,
				photoUrl: this.enterprise.photoUrl,
				examenInicial:this.enterprise.examenInicial,
				examenFinal:this.enterprise.examenFinal,
				demo:this.enterprise.demo,
				requireAccountManagement:this.enterprise.requireAccountManagement,
				salesMan:this.enterprise.salesMan,
				tractian:this.enterprise.tractian,
				showEnterpriseLogoInCertificates: this.enterprise?.showEnterpriseLogoInCertificates ?this.enterprise?.showEnterpriseLogoInCertificates : false,
				accountManagerName: this.enterprise?.accountManagerName ? this.enterprise.accountManagerName : null,
				accountManagerPhone: this.enterprise?.accountManagerPhone ? this.enterprise.accountManagerPhone : null,
				phoneContactPerson:this.enterprise.phoneContactPerson,
				reportMails: this.enterprise?.reportMails ? this.enterprise.reportMails : null,
				allUsersExtraCourses:this.enterprise.allUsersExtraCourses?this.enterprise.allUsersExtraCourses:false,
				congratulationsEndCourse : this.enterprise.congratulationsEndCourse?this.enterprise.congratulationsEndCourse:false,
				sendMailtoAdmin : this.enterprise.sendMailtoAdmin?this.enterprise.sendMailtoAdmin:false,
				sendMailtoUsers : this.enterprise.sendMailtoUsers?this.enterprise.sendMailtoUsers:false,
				mondlyMeetings : this.enterprise.mondlyMeetings?this.enterprise.mondlyMeetings:false,
				useWhatsapp : this.enterprise.useWhatsapp?this.enterprise.useWhatsapp:false,
				contactPerson:this.enterprise.contactPerson,
				mailContactPerson:this.enterprise.mailContactPerson,
			});
			// this.enterpriseForm.get('name')?.disable();
			if (this.enterprise.photoUrl) this.imageUrl = this.enterprise.photoUrl;
			const coursesIds = this.enterprise.coursesRef.map(x => x.id);
			this.courseService.getCoursesByIds$(coursesIds).subscribe(enterpriseCourses => {
				// console.log("enterpriseCourses", enterpriseCourses)
				this.enterpriseCourses = enterpriseCourses
			})
		} else {
			this.enterprise = Enterprise.fromJson({ ...Enterprise.getEnterpriseTemplate() });
		}
	}

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

	async saveEnterprisePhoto() {
		if (this.uploadedImage) {
			if (this.enterprise.photoUrl) {
				// Existing image must be deleted before
				await firstValueFrom(this.storage.refFromURL(this.enterprise.photoUrl).delete()).catch((error) =>
					console.log(error)
				);
				console.log("Old image has been deleted!");
			}
			// Upload new image
			const fileName = cleanFileName(this.uploadedImage.name);
			const filePath = `${Enterprise.storageProfilePhotoFolder}/${fileName}`;
			const fileRef = this.storage.ref(filePath);
			const task = this.storage.upload(filePath, this.uploadedImage);
			await new Promise<void>((resolve, reject) => {
				task.snapshotChanges()
					.pipe(
						finalize(async () => {
							this.enterprise.photoUrl = await firstValueFrom(fileRef.getDownloadURL());
							console.log("Se ha guardado la imagen");
							this.uploadedImage = null;
							resolve();
						})
					)
					.subscribe({
						next: () => {},
						error: (error) => reject(error),
					});
			});
		} else {
			this.enterprise.photoUrl = null;
		}
	}

	async onSubmit() {
		this.showError = false
		if(!this.enterpriseForm.valid){
			this.showError = true
			return
		}
		await this.saveEnterprisePhoto();
		if (this.enterprise.photoUrl) this.enterpriseForm.patchValue({ photoUrl: this.enterprise.photoUrl });
		const formValue = this.enterpriseForm.value;
		// console.log("form", formValue)

		const coursesReferences = this.enterpriseCourses.map(x => this.courseService.getCourseRefById(x.id))

		let userEnroll = this.enterprise?.allUsersExtraCourses

		const enterprise = this.enterprise;

		enterprise.name = titleCase(formValue.name.trim().toLowerCase())
		// enterprise.summary = formValue.summary
		enterprise.description = formValue.description;
		enterprise.socialNetworks.website = formValue.website;
		enterprise.socialNetworks.linkedin = formValue.linkedin;
		enterprise.photoUrl = formValue.photoUrl;
		enterprise.examenFinal = formValue.examenFinal;
		enterprise.allUsersExtraCourses = formValue.allUsersExtraCourses;
		enterprise.demo = formValue.demo;
		enterprise.tractian = formValue.tractian,
		enterprise.congratulationsEndCourse = formValue.congratulationsEndCourse;
		enterprise.sendMailtoAdmin = formValue.sendMailtoAdmin;
		enterprise.sendMailtoUsers = formValue.sendMailtoUsers;
		enterprise.mondlyMeetings = formValue.mondlyMeetings;
		enterprise.useWhatsapp = formValue.useWhatsapp;
		enterprise.examenInicial = formValue.examenInicial;
		enterprise.showEnterpriseLogoInCertificates = formValue.showEnterpriseLogoInCertificates;
		enterprise.accountManagerName = formValue.accountManagerName;
		enterprise.accountManagerPhone = formValue.accountManagerPhone;
		enterprise.phoneContactPerson = formValue.phoneContactPerson;
		enterprise.reportMails = formValue.reportMails;
		enterprise.requireAccountManagement = formValue.requireAccountManagement;
		enterprise.salesMan= formValue.salesMan;
		enterprise.contactPerson = formValue.contactPerson;
		enterprise.mailContactPerson = formValue.mailContactPerson;
		enterprise.coursesRef = coursesReferences

		console.log("enterprise Actualizado: ", enterprise);

		// console.log(this.enterprise, enterprise, userEnroll)

		try {
			if (this.enterprise.id) {
				Swal.fire({
					title: 'Editando empresa',
					text: 'Por favor, espera.',
					allowOutsideClick: false,
					didOpen: () => {
					  Swal.showLoading()
					}
				});
				await this.enterpriseService.editEnterprise(enterprise);
				if(userEnroll != enterprise.allUsersExtraCourses){
					await this.enterpriseService.changeAllusersEnterpriseEnrollExtra(this.enterprise.id,enterprise.allUsersExtraCourses)
				}
				userEnroll = enterprise.allUsersExtraCourses

				await this.assignEnterpriseCoursesToUsers(enterprise)

				Swal.close();
				this.alertService.succesAlert("Empresa editada exitosamente");
			} else {
				const newEnterpriseId = await this.enterpriseService.addEnterprise(enterprise);
				this.alertService.succesAlert("Empresa agregada exitosamente");
				this.router.navigate(["/admin/enterprises/form/" + newEnterpriseId]);
			}
		} catch (error) {
			this.alertService.errorAlert(error);
		}
	}

	async assignEnterpriseCoursesToUsers(enterprise: Enterprise) {
		if (enterprise.coursesRef && enterprise.coursesRef.length > 0) {
			for (let user of this.enterpriseUsers) {
				const userRef = this.userService.getUserRefById(user.uid)
				const coursesByStudent: CourseByStudent[] = await this.courseService.getCoursesByStudent(userRef)
				const userEnrolledCoursesIds: string[] = coursesByStudent.map(x => x.courseRef.id)

				const coursesToEnroll: DocumentReference<Curso>[] = enterprise.coursesRef.filter(course => !userEnrolledCoursesIds.includes(course.id));

				for (let i = 0; i < coursesToEnroll.length; i++) {
					const courseRef = coursesToEnroll[i]
					await this.courseService.saveCourseByStudent(courseRef, userRef, null, null, true, coursesByStudent.length + i);
				}
			}
		}
	}

	async deleteEnterprise() {

		Swal.fire({
			title: `Borrar empresa ${this.enterpriseForm.controls['name'].value} `,
			text: "Esta operación es irreversible, ¿deseas continuar?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			cancelButtonColor: "#9CA6AF",
			confirmButtonText: "Si, borrar empresa!"
		  }).then(async (result) => {
			if (result.isConfirmed) {
				Swal.fire({
				title: 'Borrando datos...',
				text: 'Por favor, espera.',
				allowOutsideClick: false,
				didOpen: () => {
					Swal.showLoading()
				}
				});
			  await this.enterpriseService.deleteEnterprise(this.enterprise.id)
			  Swal.close();
			  Swal.fire({
				title: "Deleted!",
				text: "Your file has been deleted.",
				icon: "success"
			  });
			  this.router.navigate(["/admin/enterprises"])
			}
		  });



		// const dialogResult = await firstValueFrom(this.dialogService.dialogConfirmar().afterClosed());
		// if (dialogResult) {
		//   //await this.enterpriseService.deleteEnterprise(this.enterprise.id)
		//   this.dialogService.dialogExito();
		//   this.router.navigate(["/admin/enterprises"])
		// }
		// else {
		//   throw new Error('Operación cancelada');
		// }
	}

	getOptionTextCourse(option: CursoJson): string {
		return option ? option.titulo : '';
	}

	changeCourse(course: CursoJson): void {
		if (!this.isCourseSelected(course)) {
		  this.enterpriseCourses.push(course);
		}
		this.coursesForm.setValue(''); // Add the course to the array but reset the mat form field
	}

	isCourseSelected(course: CursoJson): boolean {
		return this.enterpriseCourses.some(selectedCourse => selectedCourse.titulo === course.titulo);
	}

	removeCourse(courseIndex: number) {
		this.enterpriseCourses.splice(courseIndex, 1);
	}

	_filterCourses(value: string | CursoJson): any[] {
		const filterValue = (typeof value === 'string') ? value.toLowerCase() : value.titulo.toLowerCase();
		return this.allCourses.filter(course => course.titulo.toLowerCase().includes(filterValue));
	}

	async onLicenseStatusChange(license: LicenseJson) {
		if (license.status  === "inactive") {
			console.log("All licenses have being disabled:");
			this.enterpriseForm.patchValue({
				sendMailtoAdmin: false,
				sendMailtoUsers: false
			});
			await this.onSubmit()
		}
	}
	
}
