import { Component } from "@angular/core";
import { AngularFireStorage } from "@angular/fire/compat/storage";
import { ActivatedRoute, Router } from "@angular/router";
import { ArticleService } from "projects/predyc-business/src/shared/services/article.service";
import { AuthorService } from "projects/predyc-business/src/shared/services/author.service";
import { IconService } from "projects/predyc-business/src/shared/services/icon.service";
import { ArticleJson, ArticleTag } from "projects/shared/models/article.model";
import { Author, AuthorJson } from "projects/shared/models/author.model";
import { combineLatest, Subscription, take } from "rxjs";
import * as XLSX from 'xlsx-js-style';
import { HttpClient } from '@angular/common/http';

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
    private router: Router,
    private storage: AngularFireStorage,
    private http: HttpClient,
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
  getImagesP21(evt) {
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
      let data: any[] = XLSX.utils.sheet_to_json(ws);
  
      const imageHrefs = []; // Arreglo para almacenar los enlaces de imágenes
  
      data.forEach((articulo) => {
        // Obtener el contenido y minificarlo
        const rawContent = articulo?.Content;
        if (rawContent && articulo.Title && articulo.Slug) {
          const minifiedContent = rawContent
            .replace(/\s{2,}/g, ' ') // Eliminar espacios múltiples
            .replace(/>\s+</g, '><') // Eliminar espacios entre etiquetas
            .trim(); // Eliminar espacios al inicio y final
          articulo['Content'] = minifiedContent;
  
          // Extraer los enlaces de imágenes (src)
          const imgRegex = /<img[^>]+src="([^">]+)"/g; // Expresión regular para src
          let match;
  
          while ((match = imgRegex.exec(minifiedContent)) !== null) {
            const imageUrl = match[1];
            const fileName = this.getFileNameFromUrl(imageUrl);
            let img = {
              slug: articulo.Slug,
              url: imageUrl,
              name: fileName,
            };
            imageHrefs.push(img);
          }
  
          // Manejar la columna 'Image URL'
          if (articulo['Image URL']) {
            const imageUrl = articulo['Image URL'].split('|')[0].trim();
            const fileName = this.getFileNameFromUrl(imageUrl);
            let img = {
              slug: articulo.Slug,
              url: imageUrl,
              name: fileName,
            };
            imageHrefs.push(img);
          }
        }
      });
  
      console.log('Enlaces de imágenes:', imageHrefs);
  
      // Exportar los enlaces de imágenes a Excel
      const wsOutput: XLSX.WorkSheet = XLSX.utils.json_to_sheet(imageHrefs);
      const wbOutput: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbOutput, wsOutput, 'ImageLinks');
      XLSX.writeFile(wbOutput, 'image_links.xlsx');
    };
  
    reader.readAsBinaryString(target.files[0]);
  }

  getFileNameFromUrl(url: string): string {
    // Eliminar parámetros como ?size=large
    const cleanedUrl = url.split('?')[0];
    // Extraer la última parte del URL (nombre del archivo)
    return cleanedUrl.split('/').pop() || '';
  }
  async uploadImage(slug: string, file: Blob, fileName: string): Promise<string> {
    if (!file) throw new Error('No file selected');
    const filePath = `ArticulosP21/${slug}/${fileName}`;
    const fileRef = this.storage.ref(filePath);
    const task = this.storage.upload(filePath, file);

    try {
      await task;
      return await fileRef.getDownloadURL().toPromise();
    } catch (error) {
      console.error(`Error uploading image ${fileName}:`, error);
      throw error;
    }
  }

  async uploadP21Images(evt: Event) {
    const target: DataTransfer = <DataTransfer>(<unknown>(<HTMLInputElement>evt.target));
    if (target.files.length !== 1) {
      throw new Error('Cannot use multiple files');
    }
  
    const reader: FileReader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      let data: any[] = XLSX.utils.sheet_to_json(ws);
  
      const updatedData = [];
      for (let index = 0; index < data.length; index++) {
        const item = data[index];
        const { slug, url, name } = item;
  
        if (!url || !slug || !name) {
          updatedData.push({ ...item, status: 'error', message: 'Missing data', newUrl: '' });
          continue;
        }
  
        let encodedUrl = encodeURI(url.startsWith('http:') ? url.replace('http:', 'https:') : url);
        let newUrl = '';
        let success = false;
  
        console.log(`Attempting HTTPS for: ${encodedUrl}`);
  
        try {
          // Descargar la imagen usando HTTPS con reintentos
          const response: Blob = await this.retryWithDelay(() => this.downloadImage(encodedUrl), 200, 3);
          success = true;
  
          // Subir la imagen a Firebase Storage
          newUrl = await this.uploadImage(slug, response, name);
          updatedData.push({ ...item, status: 'success', message: 'Uploaded successfully', newUrl });
        } catch (error) {
          console.warn(`Failed with HTTPS: ${encodedUrl}`);
  
          // Intentar con HTTP original si HTTPS falla
          if (url.startsWith('http:')) {
            try {
              const httpUrl = encodeURI(url);
              console.log(`Reverting to HTTP: ${httpUrl}`);
              const response: Blob = await this.retryWithDelay(() => this.downloadImage(httpUrl), 200, 3);
  
              newUrl = await this.uploadImage(slug, response, name);
              success = true;
              updatedData.push({ ...item, status: 'success', message: 'Uploaded successfully', newUrl });
            } catch (httpError) {
              console.error(`Failed with HTTP: ${url}`);
              updatedData.push({ ...item, status: 'error', message: 'CORS issue or download failed', newUrl: '' });
            }
          } else {
            updatedData.push({ ...item, status: 'error', message: 'CORS issue or download failed', newUrl: '' });
          }
        }
  
        // Mostrar progreso
        const progress = ((index + 1) / data.length) * 100;
        console.log(`Progreso: ${progress.toFixed(2)}%`);
      }
  
      // Exportar el archivo Excel con el estado actualizado
      const wsOutput: XLSX.WorkSheet = XLSX.utils.json_to_sheet(updatedData);
      const wbOutput: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wbOutput, wsOutput, 'UpdatedImageStatus');
      XLSX.writeFile(wbOutput, 'updated_image_status.xlsx');
  
      console.log('Process completed. Updated Excel exported.');
    };
  
    reader.readAsBinaryString(target.files[0]);
  }
  
  // Función para descargar la imagen con tipos correctos
  private async downloadImage(url: string): Promise<Blob> {
    return this.http.get(url, { responseType: 'blob' }).toPromise();
  }
  
  // Función para reintentar con retraso reducido
  private retryWithDelay(fn: () => Promise<any>, delay: number, retries: number): Promise<any> {
    return new Promise((resolve, reject) => {
      fn()
        .then(resolve)
        .catch((error) => {
          if (retries > 0) {
            setTimeout(() => {
              console.log(`Retrying... (${retries} attempts left)`);
              this.retryWithDelay(fn, delay, retries - 1).then(resolve).catch(reject);
            }, delay);
          } else {
            reject(error);
          }
        });
    });
  }
  


  
  
  
}
