import { Component } from '@angular/core';
import { ArticleService } from 'projects/predyc-business/src/shared/services/article.service';

interface Article {
  data: any[]
}

@Component({
  selector: 'app-article-preview',
  templateUrl: './article-preview.component.html',
  styleUrls: ['./article-preview.component.css']
})
export class ArticlePreviewComponent {

  constructor(
    private articleService: ArticleService,
  ) {}

  article: Article

  ngOnInit() {
    this.articleService.getArticles().subscribe(articles => {
      this.article = articles[0]
      console.log("this.article", this.article)
    })
  }

}
