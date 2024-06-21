import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  collectionName = "article"

  constructor(
    private afs: AngularFirestore
  ) { }

  async saveArticle(articleData: any): Promise<void> {
    let articleId: string = articleData.id;

    if (!articleId) {
      articleId = this.afs.createId();
      articleData.id = articleId;
      return await this.afs.collection(this.collectionName).doc(articleId).set(articleData);
    } else {
        // Excluding createdAt from the update
        const { createdAt, ...dataToUpdate } = articleData;
        return await this.afs.collection(this.collectionName).doc(articleId).update(dataToUpdate);
    }
  }


  getArticles$(): Observable<any> {
    return this.afs.collection(this.collectionName).valueChanges()
  }

  getArticleById$(articleId: string): Observable<any> {
    return this.afs.collection(this.collectionName).doc(articleId).valueChanges()
  }

}
