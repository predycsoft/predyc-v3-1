import { Component, Input } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormBuilder, Validators } from "@angular/forms";
import { NgbActiveModal } from "@ng-bootstrap/ng-bootstrap";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { FREEBIE_TYPE_CHOICES, Freebie, cleanFileName } from "projects/shared";
import { firstValueFrom } from "rxjs/internal/firstValueFrom";
import { finalize } from "rxjs/operators";

@Component({
	selector: "app-dialog-freebies-form",
	templateUrl: "./dialog-freebies-form.component.html",
	styleUrls: ["./dialog-freebies-form.component.css"],
})
export class DialogFreebiesFormComponent {
	constructor(
		public activeModal: NgbActiveModal,
		public icon: IconService,
		public alertService: AlertsService,
		private fb: FormBuilder,
		private afs: AngularFirestore,
		private storage: AngularFireStorage
	) {}

	@Input() freebie: Freebie;

	typeOptions: string[] = FREEBIE_TYPE_CHOICES;

	displayErrors: boolean = false;

	freebieForm = this.fb.group({
		name: ["", Validators.required],
		photoUrl: [""],
		description: [""],
		type: ["", Validators.required],
		file: ["", Validators.required],
		extension: ["", Validators.required],
		customUrl: [""],
	});

	ngOnInit(): void {
		if (this.freebie) {
			this.freebieForm.patchValue(this.freebie);
			this.photoUrl = this.freebie.photoUrl;
		}
	}

	async onSubmit() {
		await this.saveFileUrl();
		// || (!this.freebieForm.controls.file.value && !this.uploadedFile)
		if (this.freebieForm.invalid) {
			this.displayErrors = true;
			return;
		}
		try {
			await this.savePhotoUrl();
			const ref = this.freebie
				? this.afs.collection<Freebie>("freebie").doc(this.freebie.id).ref
				: this.afs.collection<Freebie>("freebie").doc().ref;
			await ref.set({ ...this.freebieForm.value, id: ref.id, updatedAt: new Date() }, { merge: true });
			this.closeDialog();
		} catch (error) {
			this.alertService.errorAlert(error);
		}
	}

	onFileSelected(event, type) {
		const input = event.target as HTMLInputElement;
		if (!input || !input.files || !input.files[0]) {
			this.alertService.errorAlert(`Debe seleccionar un archivo`);
			return;
		}
		const file = input.files[0];

		/* checking size here - 10MB */
		if (type === "photoUrl") {
			const imageMaxSize = 10000000;
			if (file.size > imageMaxSize) {
				this.alertService.errorAlert(`El archivo es mayor a 1MB por favor incluya una imagen de menor tamaño`);
				return;
			}
		} else if (type === "file") {
			// Do something
		} else {
			return;
		}

		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = (_event) => {
			if (type === "photoUrl") {
				this.photoUrl = reader.result;
				this.uploadedImage = file;
			} else if (type === "file") {
				this.uploadedFile = file;
				const fileName = cleanFileName(this.uploadedFile.name);
				this.uploadedFileName = fileName
			}
		};
	}

	photoUrl;
	uploadedImage;
	uploadedFile;
	uploadedFileName

	async savePhotoUrl() {
		if (this.uploadedImage) {
			// Upload new image
			const fileName = cleanFileName(this.uploadedImage.name);
			const filePath = `Freebies/${this.freebieForm.controls.name.value}/${fileName}`;
			const fileRef = this.storage.ref(filePath);
			const task = this.storage.upload(filePath, this.uploadedImage);
			await new Promise<void>((resolve, reject) => {
				task.snapshotChanges()
					.pipe(
						finalize(async () => {
							const photoUrl = await firstValueFrom(fileRef.getDownloadURL());
							console.log("photoUrl has been uploaded!");
							this.freebieForm.controls.photoUrl.setValue(photoUrl);
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
	async saveFileUrl() {
		if (this.uploadedFile) {
			// Upload new image
			const fileName = cleanFileName(this.uploadedFile.name);
			const [_, extension] = this.uploadedFile.name.split(".");
			if (!extension) throw new Error("Esta subiendo un archivo sin extension");
			const filePath = `Freebies/${this.freebieForm.controls.name.value}/${fileName}`;
			const fileRef = this.storage.ref(filePath);
			const task = this.storage.upload(filePath, this.uploadedFile);
			await new Promise<void>((resolve, reject) => {
				task.snapshotChanges()
					.pipe(
						finalize(async () => {
							const fileUrl = await firstValueFrom(fileRef.getDownloadURL());
							console.log("fileUrl has been uploaded!");
							this.freebieForm.controls.file.setValue(fileUrl);
							this.freebieForm.controls.extension.setValue(extension);
							this.uploadedFile = null;
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

	closeDialog() {
		this.activeModal.dismiss("Cross click");
	}
}
