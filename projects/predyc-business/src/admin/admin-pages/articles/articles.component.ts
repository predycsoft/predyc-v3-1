import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { ArticleJson, ArticleTag } from "projects/shared/models/article.model";
import { Author, AuthorJson } from "projects/shared/models/author.model";
import { combineLatest, Subscription } from "rxjs";

export interface ArticleData extends ArticleJson {
  data: Object[]
  dataHTML:string
}

export interface AuthorWithArticleQty extends AuthorJson {
  articlesQty: number
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
  authors: AuthorWithArticleQty[]
  tags: ArticleTag[]

  ngOnInit() {
    this.combinedSubscription = combineLatest([
      this.articleService.getArticles$(),
      this.authorService.getAuthors$(),
      this.articleService.getAllArticleTags$(),
    ]).subscribe(([articles, authors, tags]) => {
      this.articles = articles
      this.tags = tags

      this.authors = authors.map(author => {
        const articlesQty = articles.filter(article => article.authorRef.id === author.id).length;
        return { ...author, articlesQty };
      }).sort((a,b) => b.articlesQty - a.articlesQty)
      // console.log("this.authors", this.authors)
    });
  }
}
