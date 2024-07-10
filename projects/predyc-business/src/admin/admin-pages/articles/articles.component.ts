import { Component } from "@angular/core";
import { ArticleJson } from "projects/shared/models/article.model";

export interface ArticleData extends ArticleJson {
  data: Object[]
}

@Component({
  selector: "app-articles",
  templateUrl: "./articles.component.html",
  styleUrls: ["./articles.component.css"],
})
export class ArticlesComponent {
  tab = 0
}
