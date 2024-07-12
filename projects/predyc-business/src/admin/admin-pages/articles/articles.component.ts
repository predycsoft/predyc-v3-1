import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { ArticleJson, ArticleTag } from "projects/shared/models/article.model";
import { Author } from "projects/shared/models/author.model";
import { combineLatest, Subscription } from "rxjs";

export interface ArticleData extends ArticleJson {
  data: Object[]
  dataHTML:string
}

@Component({
  selector: "app-articles",
  templateUrl: "./articles.component.html",
  styleUrls: ["./articles.component.css"],
})
export class ArticlesComponent {

  constructor(
    private articleService: ArticleService,
    private authorService: AuthorService,
  ) {}

  tab = 0
  combinedSubscription: Subscription
  articles: ArticleJson[]
  authors: Author[]
  tags: ArticleTag[]

  ngOnInit() {
    this.combinedSubscription = combineLatest([
      this.articleService.getArticles$(),
      this.authorService.getAuthors$(),
      this.articleService.getAllArticleTags$(),
    ]).subscribe(([articles, authors, tags]) => {
      this.articles = articles
      this.authors = authors
      this.tags = tags
    });
  }
}
