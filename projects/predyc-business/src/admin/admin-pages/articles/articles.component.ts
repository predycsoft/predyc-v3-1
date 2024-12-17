import { Component } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ArticleJson, ArticleTag } from "projects/shared/models/article.model";
import { Author, AuthorJson } from "projects/shared/models/author.model";
import { combineLatest, Subscription, take } from "rxjs";
import * as XLSX from 'xlsx-js-style';


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
  revistas: any[]
  tags: ArticleTag[]
  selectorOptions: { value: string, label: string }[] = [
    {value: "all", label: "Todos los autores"}
  ]

  selectorpaginaOptions: { value: string, label: string }[] = [
    {value: "all", label: "Todos las paginas"},
    {value: "predyc", label: "Artículos Predyc"},
    {value: "predictiva", label: "Artículos Predictiva"},
    {value: "revista", label: "Artículos Revista"},

  ]

  ngOnInit() {
    this.combinedSubscription = combineLatest([
      this.articleService.getArticles$(),
      this.authorService.getAuthors$(),
      this.articleService.getAllArticleTags$(),
      this.articleService.getAllRevistas$(),

    ])
    // .pipe(take(1))
    .subscribe(([articles, authors, tags,revistas]) => {
      // console.log("articles", articles)
      // console.log("authors", authors)
      // console.log("tags", tags)
      this.articles = articles
      this.revistas = revistas
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

  isMobile = false
  articleHTML
  importArticlesP21(evt){

    const target: DataTransfer = <DataTransfer>(evt.target);
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      let data = XLSX.utils.sheet_to_json(ws);


    // Obtener el contenido y minificarlo
    const rawContent = data[3]['Content'];
    const minifiedContent = rawContent.replace(/\s{2,}/g, ' ') // Eliminar espacios múltiples
                                      .replace(/>\s+</g, '><') // Eliminar espacios entre etiquetas
                                      .trim(); // Eliminar espacios al inicio y final

    console.log('Minified Content:', minifiedContent);
    this.articleHTML = minifiedContent;
    };
    reader.readAsBinaryString(target.files[0]); 

  }
}
