import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ArticleJson, ArticleTag } from "projects/shared/models/article.model";
import { Author, AuthorJson } from "projects/shared/models/author.model";
import { combineLatest, Subscription, take } from "rxjs";

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
    public icon: IconService, 
    private router: Router
  ) {}

  tab = 0
  combinedSubscription: Subscription
  articles: ArticleJson[]
  authors: AuthorWithArticleQty[]
  tags: ArticleTag[]
  selectorOptions: { value: string, label: string }[] = [
    {value: "all", label: "Todos los autores"}
  ]

  ngOnInit() {
    this.combinedSubscription = combineLatest([
      this.articleService.getArticles$(),
      this.authorService.getAuthors$(),
      this.articleService.getAllArticleTags$(),
    ])
    .pipe(take(1))
    .subscribe(([articles, authors, tags]) => {
      console.log("articles", articles)
      console.log("authors", authors)
      console.log("tags", tags)
      this.articles = articles
      this.tags = tags

      this.authors = authors.map(author => {
        this.selectorOptions.push({value: author.id, label: author.name})
        const articlesQty = articles.filter(article => article.authorRef.id === author.id).length;
        return { ...author, articlesQty };
      }).sort((a,b) => b.articlesQty - a.articlesQty)
      // console.log("this.authors", this.authors)
      // console.log("this.selectorOptions", this.selectorOptions)

    });
  }

  onAuthorSelected(authorId: string) {
    this.tab = 0;
    this.router.navigate([], {
      queryParams: { status: authorId },
      queryParamsHandling: 'merge'
    });
  }
}
