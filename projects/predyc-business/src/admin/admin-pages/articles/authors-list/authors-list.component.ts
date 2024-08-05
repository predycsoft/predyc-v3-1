import { ChangeDetectorRef, Component, Input, ViewChild } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AlertsService } from 'projects/predyc-business/src/shared/services/alerts.service';
import { AuthorService } from 'projects/predyc-business/src/shared/services/author.service';
import { IconService } from 'projects/predyc-business/src/shared/services/icon.service';
import { Author } from 'projects/shared/models/author.model';
import { firstValueFrom, Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthorWithArticleQty } from '../articles.component';

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
    private fb: FormBuilder,
    private router: Router, 
    private activatedRoute: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ){}

  @Input() authors: AuthorWithArticleQty[]

  @ViewChild('createAuthorModal') createAuthorModal: any;
  modal
  authorForm: FormGroup;
  showFormError: boolean = false;
  selectedFile: File | null = null;
  savingAuthor = false
  editingAuthorId: string | null = null;  // To keep track if we are editing

  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumns: string[] = ["name", "email", "articlesQty", "linkedin", "actions"];
  pageSize: number = 5;
  totalLength: number;

  dataSource = new MatTableDataSource<AuthorWithArticleQty>();
  queryParamsSubscription: Subscription;
  queryParamsPage:number

  ngOnChanges() {
    if (this.authors) this.performSearch(this.authors, this.queryParamsPage);
  }

  ngOnInit() {
  }
  
  ngAfterViewInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      this.queryParamsPage = Number(params["authorsPage"]) || 1;
      if (this.authors) this.performSearch(this.authors, this.queryParamsPage);
      this.cdr.detectChanges();
    });
  }

  performSearch(authors: AuthorWithArticleQty[], page: number) {
    this.totalLength = authors.length;
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dataSource.data = authors.slice(startIndex, endIndex);
    if (this.paginator) this.paginator.pageIndex = page - 1; 
  }

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { authorsPage: page },
      queryParamsHandling: "merge",
    });
  }

  async deleteAuthor(authorId: string) {
    Swal.fire({
      title: "Eliminaremos el autor",
      text: "¿Deseas continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      confirmButtonColor: 'var(--blue-5)',
    }).then(async (result) => {
      if (result.isConfirmed) {
        // await this.authorService.deleteAuthorById(authorId)
        this.alertService.succesAlert("El autor se ha eliminado exitosamente");
      } 
      else {}
    }); 
  }

  // ---- For the form
  loadAuthorForm(author) {
    if (!author) {
      this.authorForm = this.fb.group({
        description: ['', Validators.required],
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        linkedin: ['', Validators.required],
        photoUrl: ['', Validators.required],
      });
    } else {
      this.authorForm = this.fb.group({
        description: [author.description, Validators.required],
        name: [author.name, Validators.required],
        email: [author.email, [Validators.required, Validators.email]],
        linkedin: [author.linkedin, Validators.required],
        photoUrl: [author.photoUrl, Validators.required],
      });
    }
  }

  openCreateAuthorModal(modal) {
    this.loadAuthorForm(null)
    this.modal = this.modalService.open(modal, {
      ariaLabelledBy: "modal-basic-title",
      centered: true,
      backdrop: 'static'
    });
  }

  openEditAuthorModal(author: Author, modal) {
    this.editingAuthorId = author.id;
    this.loadAuthorForm(author); 
    this.modal = this.modalService.open(modal, {  // Open the modal
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
    
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const image = new Image();
      image.src = reader.result as string;
      image.onload = () => {
        const width = image.width;
        const height = image.height;

        if (width !== height) {
          Swal.fire({
            title: "Error!",
            text: `Debe seleccionar una imagen de dimensiones 1:1`,
            icon: "warning",
            confirmButtonColor: "var(--blue-5)",
          });
          return;
        }
  
        this.selectedFile = file;
        this.authorForm.get('photoUrl')?.patchValue(reader.result as string);
      };
    };
  }

  async createAuthor(): Promise<void> {
    if (this.authorForm.valid) {
      this.savingAuthor = true
      try {
        let downloadURL = this.authorForm.get("photoUrl")?.value;
        if (this.selectedFile) {
          downloadURL = await this.uploadImage();
          this.authorForm.get("photoUrl")?.patchValue(downloadURL);
        }
        const authorData = {
          ...this.authorForm.value,
          id: this.editingAuthorId ? this.editingAuthorId : null
        };
        await this.authorService.saveAuthor(authorData);
        this.savingAuthor = false
        this.alertService.succesAlert("El autor se ha guardado exitosamente.");
        this.modal.close();
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

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
  }


}
