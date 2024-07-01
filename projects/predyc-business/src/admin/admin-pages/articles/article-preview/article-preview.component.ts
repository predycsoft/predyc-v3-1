import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from 'projects/predyc-business/src/shared/services/article.service';
import { ArticleData } from '../articles.component';
import { Subscription, map, switchMap } from 'rxjs';
import { AuthorService } from 'projects/predyc-business/src/shared/services/author.service';

interface ArticleWithAuthorName extends ArticleData {
  authorName: string
}

@Component({
  selector: 'app-article-preview',
  templateUrl: './article-preview.component.html',
  styleUrls: ['./article-preview.component.css']
})
export class ArticlePreviewComponent {

  constructor(
    private articleService: ArticleService,
    private authorService: AuthorService,
    private route: ActivatedRoute
  ) {}

  articleId = this.route.snapshot.paramMap.get("articleId");

  article: ArticleWithAuthorName
  articleSubscription: Subscription


  ngOnInit() {
    this.articleSubscription =this.articleService.getArticleWithDataById$(this.articleId).pipe(
      switchMap((article: ArticleData) => {
          return this.authorService.getAuthorById$(article.author.id).pipe(
            map(author => ({
              ...article,
              authorName: author.name
            }))
          );
      })
    )
    .subscribe(articleWithAuthorName => {
      this.article = articleWithAuthorName
      // console.log("this.article", this.article)
    })
  }

  ngOnDestroy() {
    if (this.articleSubscription) this.articleSubscription.unsubscribe()
  }

}
