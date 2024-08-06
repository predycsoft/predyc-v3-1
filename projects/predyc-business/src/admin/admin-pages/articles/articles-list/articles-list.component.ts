import { ChangeDetectorRef, Component, Input, ViewChild } from "@angular/core";
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
import { ArticleJson, ArticleTag, ArticleTagJson } from "projects/shared/models/article.model";
import { Author, AuthorJson } from "projects/shared/models/author.model";
import { Subscription, combineLatest, finalize, firstValueFrom } from "rxjs";
import { firestoreTimestampToNumberTimestamp } from "shared";
import Swal from "sweetalert2";
import { AuthorWithArticleQty } from "../articles.component";

interface ArticleWithExtraData extends ArticleJson {
  authorName: string
  authorId: string
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
    private alertService: AlertsService,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() articles: ArticleJson[]
  @Input() authors: AuthorWithArticleQty[]
  @Input() tags: ArticleTag[]

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ["title", "order", "owner", "tags", "updatedAt", "isDraft", "actions"];
  pageSize: number = 5;
  totalLength: number;

  queryParamsSubscription: Subscription;
  articleServiceSubscription: Subscription;

  dataSource = new MatTableDataSource<ArticleWithExtraData>();

  createTagModal 

  queryParamPage:number
  queryParamsSearch:string
  queryParamStatus:string

  ngOnChanges() {
    if (this.articles && this.authors && this.tags) this.performSearch(this.articles, this.authors, this.tags);
  }

  ngOnInit() {
  }
  
  ngAfterViewInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      this.queryParamPage = Number(params["page"]) || 1;
      this.queryParamsSearch = params["search"] || "";
      this.queryParamStatus =params["status"] || "all"
      if (this.articles && this.authors && this.tags) {
        this.performSearch(this.articles, this.authors, this.tags);
      }
      this.cdr.detectChanges(); // Manually trigger change detection
    });
  }

  performSearch(articles: ArticleJson[], authors: AuthorWithArticleQty[], tags: ArticleTag[]) {
    const dataToShow: ArticleWithExtraData[] = articles.map(article => {
      const author = authors.find(x => x.id === article.authorRef.id);
      const tagsData = this.getMatchingTags(article.tagsRef, tags);
      const tagsNames = tagsData.map(x => x.name);
      return {
        ...article,
        updatedAt: article.updatedAt ? firestoreTimestampToNumberTimestamp(article.updatedAt) : null,
        authorName: author.name,
        authorId: author.id,
        tagsNames
      };
    });

    const articlesSearchFilter = dataToShow.filter(x => {
      if (!this.queryParamsSearch || this.queryParamsSearch === '') return true;
      return this.removeAccents(x.title.toLocaleLowerCase()).includes(this.removeAccents(this.queryParamsSearch.toLocaleLowerCase()));
    });

    const filteredArticlesByAuthor = articlesSearchFilter.filter(x => {
      const matchesAuthor = this.queryParamStatus ? 
      this.queryParamStatus === "all" ? true :
      x.authorId === this.queryParamStatus : 
      true;
      return matchesAuthor;
    }); 

    this.totalLength = filteredArticlesByAuthor.length;
    const startIndex = (this.queryParamPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dataSource.data = filteredArticlesByAuthor.slice(startIndex, endIndex);
    if (this.paginator) this.paginator.pageIndex = this.queryParamPage - 1; 
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

  removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
    if (this.articleServiceSubscription) this.articleServiceSubscription.unsubscribe();
  }
}
