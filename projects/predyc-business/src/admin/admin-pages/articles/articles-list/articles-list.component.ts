import { Component } from "@angular/core";
import { DocumentReference } from "@angular/fire/compat/firestore";
import { Router } from "@angular/router";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { UserJson } from "projects/shared";
import { Observable, of } from "rxjs";

interface Owner {
  id: string;
  name: string;
  photoUrl: string;
}

interface Article {
  createdAt: number;
  updatedAt: number;
  title: string;
  photoUrl: string;
  tags: string[];
  html: string;
  owner: Owner;
}

const TEST_ARTICLES: Article[] = [
  {
    createdAt: 1672531200,
    updatedAt: 1672531200,
    title: "Articulo 1",
    photoUrl: null,
    tags: ["Tag 1", "Tag 2", "Tag 3"],
    html: null,
    owner: {
      id: null,
      name: "Diego",
      photoUrl: null,
    },
  },
  {
    createdAt: 1688256000,
    updatedAt: 1688256000,
    title: "Articulo 2",
    photoUrl: null,
    tags: ["Tag 2", "Tag 3"],
    html: null,
    owner: {
      id: null,
      name: "Diego",
      photoUrl: null,
    },
  },
  {
    createdAt: 1703980800,
    updatedAt: 1703980800,
    title: "Articulo 3",
    photoUrl: null,
    tags: ["Tag 1", "Tag 3"],
    html: null,
    owner: {
      id: null,
      name: "Diego",
      photoUrl: null,
    },
  },
];

@Component({
  selector: "app-articles-list",
  templateUrl: "./articles-list.component.html",
  styleUrls: ["./articles-list.component.css"],
})
export class ArticlesListComponent {
  constructor(public icon: IconService, private _router: Router) {}

  displayedColumns: string[] = ["title", "owner", "tags", "createdAt"];
  pageSize: number = 5;
  totalLength: number;

  public dataSource: Observable<Article[]>;

  ngOnInit() {
    this.dataSource = of(TEST_ARTICLES);
  }

  public onPageChange(page: number): void {
    this._router.navigate([], {
      queryParams: { page },
      queryParamsHandling: "merge",
    });
  }

  public delete(id: string): void {}
}
