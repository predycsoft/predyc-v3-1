import { Component, ViewChild } from "@angular/core";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ArticleJson, ArticleTagJson } from "projects/shared/models/article.model";
import { AuthorJson } from "projects/shared/models/author.model";
import { Subscription, combineLatest, finalize, firstValueFrom } from "rxjs";
import { firestoreTimestampToNumberTimestamp } from "shared";
import Swal from "sweetalert2";

interface ArticleWithExtraData extends ArticleJson {
  authorName: string
  tagsNames: string[]

}

@Component({
  selector: "app-articles-list",
  templateUrl: "./articles-list.component.html",
  styleUrls: ["./articles-list.component.css"],
})
export class ArticlesListComponent {
  constructor(
    public icon: IconService, 
    private router: Router, 
    private activatedRoute: ActivatedRoute, 
    private articleService: ArticleService,
    private authorService: AuthorService,
    private alertService: AlertsService,
    private modalService: NgbModal,
    private storage: AngularFireStorage,
    private fb: FormBuilder

  ) {}

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ["title", "owner", "tags", "updatedAt", "actions"];
  pageSize: number = 5;
  totalLength: number;

  queryParamsSubscription: Subscription;
  articleServiceSubscription: Subscription;

  dataSource = new MatTableDataSource<ArticleWithExtraData>();

  createTagModal 
  @ViewChild('createAuthorModal') createAuthorModal: any;
  authorForm: FormGroup;
  showFormError: boolean = false;
  selectedFile: File | null = null;
  savingAuthor = false


  ngOnInit() {
    this.loadAuthorForm()
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      const page = Number(params["page"]) || 1;
      this.performSearch(page);
    });
  }

  loadAuthorForm() {
    this.authorForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      linkedin: ['', Validators.required],
      photoUrl: ['', Validators.required]
    });
  }

  performSearch(page: number) {
    this.articleServiceSubscription = combineLatest(
      [
        this.articleService.getArticles$(), 
        this.authorService.getAuthors$(),
        this.articleService.getAllArticleTags$(),
      ]
    ).subscribe(([articles, authors, tags]) => {
      // console.log("articles", articles);

      const dataToShow: ArticleWithExtraData[] = articles.map(article => {
        const author = authors.find( x => x.id === article.authorRef.id)
        const tagsData = this.getMatchingTags(article.tagsRef, tags)
        const tagsNames = tagsData.map(x => x.name)
        return {
          ...article,
          updatedAt: article.updatedAt ? firestoreTimestampToNumberTimestamp(article.updatedAt) : null,
          authorName: author.name,
          tagsNames
        }
      })
      this.totalLength = dataToShow.length;
      const startIndex = (page - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.dataSource.data = dataToShow.slice(startIndex, endIndex);
      this.paginator.pageIndex = page - 1;
    });
  }

  getMatchingTags(articleTagsRef: DocumentReference[], allTags: ArticleTagJson[]) {
    return articleTagsRef.map(tagRef => {
      return allTags.find(tag => tag.id === tagRef.id);
    }).filter(tag => tag);
  };

  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: "merge",
    });
  }

  public delete(id: string): void {}

  async deleteArticle(articleId: string) {
    Swal.fire({
      title: "Eliminaremos el artículo",
      text: "¿Deseas continuar?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      confirmButtonColor: 'var(--blue-5)',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await this.articleService.deleteArticleById(articleId)
        this.alertService.succesAlert("El artículo se ha eliminado exitosamente");
      } 
      else {}
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
  

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
    if (this.articleServiceSubscription) this.articleServiceSubscription.unsubscribe();
  }
}
