import { Component, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertsService } from "projects/predyc-business/src/shared/services/alerts.service";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ArticleJson } from "projects/shared/models/article.model";
import { Subscription } from "rxjs";
import { firestoreTimestampToNumberTimestamp } from "shared";
import Swal from "sweetalert2";

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
  ) {}

  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns: string[] = ["title", "owner", "tags", "updatedAt", "actions"];
  pageSize: number = 5;
  totalLength: number;

  queryParamsSubscription: Subscription;
  articleServiceSubscription: Subscription;

  dataSource = new MatTableDataSource<ArticleJson>();

  ngOnInit() {
    this.queryParamsSubscription = this.activatedRoute.queryParams.subscribe((params) => {
      const page = Number(params["page"]) || 1;
      this.performSearch(page);
    });
  }

  performSearch(page: number) {
    this.articleServiceSubscription = this.articleService.getArticles$().subscribe((articles) => {
      console.log("articles", articles);
      articles.forEach(article => {
        article.createdAt = firestoreTimestampToNumberTimestamp(article.createdAt)
      });
      this.totalLength = articles.length;
      const startIndex = (page - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      this.dataSource.data = articles.slice(startIndex, endIndex);
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
  }
}
