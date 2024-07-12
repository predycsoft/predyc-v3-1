import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from 'projects/predyc-business/src/shared/services/article.service';
import { ArticleData } from '../articles.component';
import { Subscription, combineLatest, map, switchMap } from 'rxjs';
import { AuthorService } from 'projects/predyc-business/src/shared/services/author.service';
import { ArticleTagJson } from 'projects/shared/models/article.model';

interface ArticleWithExtraData extends ArticleData {
  authorName: string
  tagsData: ArticleTagJson[]
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

  article: ArticleWithExtraData
  articleSubscription: Subscription


  ngOnInit() {
    // this.articleSubscription = this.articleService.getArticleWithDataById$(this.articleId).pipe(
    //   switchMap((article: ArticleData) => {
    //     const tagsIds = article.tagsRef.map(x => x.id)
    //     return combineLatest([
    //       this.authorService.getAuthorById$(article.authorRef.id),
    //       this.articleService.getArticleTagsByIds$(tagsIds)
    //     ]).pipe(
    //       map(([author, tagsData]) => ({
    //         ...article,
    //         authorName: author.name,
    //         tagsData
    //       }))
    //     );
    //   })
    // ).subscribe(articleWithExtraData => {
    //   this.article = articleWithExtraData;
    //   // console.log("this.article", this.article)
    // });

    // TEST
    this.articleSubscription = this.articleService.getArticleById$(this.articleId).subscribe(article => {
      this.article = article
    })

  }

  ngOnDestroy() {
    if (this.articleSubscription) this.articleSubscription.unsubscribe()
  }

}
