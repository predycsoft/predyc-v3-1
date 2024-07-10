import { Component, ViewChild } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { AuthorService } from 'projects/predyc-business/src/shared/services/author.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-authors-list',
  templateUrl: './authors-list.component.html',
  styleUrls: ['./authors-list.component.css']
})
export class AuthorsListComponent {

  constructor(
    private authorService: AuthorService,
    private alertService: AlertsService,
    public icon: IconService,
    private modalService: NgbModal,
    private storage: AngularFireStorage,
    private fb: FormBuilder

  ){}

  @ViewChild('createAuthorModal') createAuthorModal: any;
  createTagModal
  authorForm: FormGroup;
  showFormError: boolean = false;
  selectedFile: File | null = null;
  savingAuthor = false

  ngOnInit() {
    this.loadAuthorForm()
  }

  loadAuthorForm() {
    this.authorForm = this.fb.group({
      description: ['', Validators.required],
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      linkedin: ['', Validators.required],
      photoUrl: ['', Validators.required],
    });
  }

  openAuthorModal(modal) {
    this.createTagModal = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      backdrop: 'static'
    });
  }

  setImage(event: any): void {
    if (!event.target.files[0] || event.target.files[0].length === 0) {
      Swal.fire({
        title: "Aviso!",
        text: `Debe seleccionar una imagen`,
        icon: "warning",
        confirmButtonColor: "var(--blue-5)",
      });
      return;
    }
    this.selectedFile = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(this.selectedFile);
    reader.onload = () => {
      this.authorForm.get('photoUrl')?.patchValue(reader.result as string);
    };
  }

  async createAuthor(): Promise<void> {
    if (this.authorForm.valid) {
      this.savingAuthor = true
      try {
        const downloadURL = await this.uploadImage();
        this.authorForm.get("photoUrl")?.patchValue(downloadURL);
        const authorData = {
          ...this.authorForm.value,
          id: null
        };
        await this.authorService.saveAuthor(authorData);
        this.savingAuthor = false
        this.alertService.succesAlert("El autor se ha guardado exitosamente.");
        this.createTagModal.close();
      } catch (error) {
        this.savingAuthor = false
        console.error("Error uploading image:", error);
      }
    } else {
      this.showFormError = true;
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      throw new Error('No file selected');
    }
    let fileBaseName = this.selectedFile.name.split('.').slice(0, -1).join('.');
    let fileExtension = this.selectedFile.name.split('.').pop();
    let authorName = this.authorForm.get("name")?.value || "Temporal";
    let endName = `${fileBaseName}-${Date.now().toString()}.${fileExtension}`;
    const filePath = `Autores/${authorName}/${endName}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, this.selectedFile);
  
    await task;
    return firstValueFrom(fileRef.getDownloadURL());
  }
}
