import { Component, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ArticleJson } from "projects/shared/models/article.model";
import { Subscription, combineLatest } from "rxjs";
import { firestoreTimestampToNumberTimestamp } from "shared";
import Swal from "sweetalert2";

interface ArticleWithAuthorName extends ArticleJson {
  authorName: string
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
  ) {}

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ["title", "owner", "tags", "updatedAt", "actions"];
  pageSize: number = 5;
  totalLength: number;

  queryParamsSubscription: Subscription;
  articleServiceSubscription: Subscription;

  dataSource = new MatTableDataSource<ArticleWithAuthorName>();

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      const page = Number(params["page"]) || 1;
      this.performSearch(page);
    });
  }

  performSearch(page: number) {
    this.articleServiceSubscription = combineLatest([this.articleService.getArticles$(), this.authorService.getAuthors$()]).subscribe(([articles, authors]) => {
      console.log("articles", articles);

      const dataToShow: ArticleWithAuthorName[] = articles.map(article => {
        const author = authors.find( x => x.id === article.author.id)
        return {
          ...article,
          updatedAt: article.updatedAt ? firestoreTimestampToNumberTimestamp(article.updatedAt) : null,
          authorName: author.name
        }
      })
      this.totalLength = dataToShow.length;
      const startIndex = (page - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.dataSource.data = dataToShow.slice(startIndex, endIndex);
      this.paginator.pageIndex = page - 1;
    });
  }

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

  ngOnDestroy() {
    if (this.queryParamsSubscription) this.queryParamsSubscription.unsubscribe();
    if (this.articleServiceSubscription) this.articleServiceSubscription.unsubscribe();
  }
}
