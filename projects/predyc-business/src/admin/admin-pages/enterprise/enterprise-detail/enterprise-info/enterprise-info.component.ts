import { Component, Input } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize, firstValueFrom } from "rxjs";
import { Enterprise } from "projects/shared/models/enterprise.model";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { DialogService } from "projects/predyc-business/src/shared/services/dialog.service";
import { EnterpriseService } from "projects/predyc-business/src/shared/services/enterprise.service";
import { cleanFileName } from "projects/shared";
import Swal from 'sweetalert2';

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
		private storage: AngularFireStorage
	) {}

	enterpriseForm: FormGroup;
	showError

	imageUrl: string | ArrayBuffer | null = null;
	uploadedImage: File | null = null;

	ngOnInit() {
		// console.log("this.enterprise", this.enterprise)
		this.setupForm();
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
			showEnterpriseLogoInCertificates: [false],
		});
		// Edit mode
		if (this.enterprise) {

			console.log('empresaDatos',this.enterprise)

			if(this.enterprise.examenInicial  === undefined ){
				this.enterprise.examenInicial = true

			}

			if(this.enterprise.examenFinal  === undefined ){
				this.enterprise.examenFinal = true
			}


			this.enterpriseForm.patchValue({
				name: this.enterprise.name,
				summary: "",
				description: this.enterprise.description,
				website: this.enterprise.socialNetworks.website,
				linkedin: this.enterprise.socialNetworks.linkedin,
				photoUrl: this.enterprise.photoUrl,
				examenInicial:this.enterprise.examenInicial,
				examenFinal:this.enterprise.examenFinal,
				showEnterpriseLogoInCertificates: this.enterprise?.showEnterpriseLogoInCertificates ?this.enterprise?.showEnterpriseLogoInCertificates : false,
			});
			// this.enterpriseForm.get('name')?.disable();
			if (this.enterprise.photoUrl) {
				this.imageUrl = this.enterprise.photoUrl;
			}
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

		const enterprise = this.enterprise;
		enterprise.name = formValue.name;
		// enterprise.summary = formValue.summary
		enterprise.description = formValue.description;
		enterprise.socialNetworks.website = formValue.website;
		enterprise.socialNetworks.linkedin = formValue.linkedin;
		enterprise.photoUrl = formValue.photoUrl;
		enterprise.examenFinal = formValue.examenFinal;
		enterprise.examenInicial = formValue.examenInicial;
		enterprise.showEnterpriseLogoInCertificates = formValue.showEnterpriseLogoInCertificates;


		console.log("enterprise Actualizado: ", enterprise);

		try {
			if (this.enterprise.id) {
				await this.enterpriseService.editEnterprise(enterprise);
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
}
