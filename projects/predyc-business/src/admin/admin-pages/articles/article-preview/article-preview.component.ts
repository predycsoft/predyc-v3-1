import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ArticleService } from 'projects/predyc-business/src/shared/services/article.service';
import { ArticleData } from '../articles.component';

@Component({
  selector: 'app-article-preview',
  templateUrl: './article-preview.component.html',
  styleUrls: ['./article-preview.component.css']
})
export class ArticlePreviewComponent {

  constructor(
    private articleService: ArticleService,
    private route: ActivatedRoute
  ) {}

  articleId = this.route.snapshot.paramMap.get("articleId");

  article: ArticleData

  ngOnInit() {
    this.articleService.getArticleWithDataById$(this.articleId).subscribe(article => {
      this.article = article
      console.log("this.article", this.article)
    })
  }

}
