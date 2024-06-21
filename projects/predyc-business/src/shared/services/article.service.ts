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

  async saveArticle(articleData:any): Promise<void> {
    const articleId = (this.afs.collection(this.collectionName).doc().ref).id
    articleData.id = articleId

    return await this.afs.collection(this.collectionName).doc(articleId).set(articleData);
  }

  getArticles(): Observable<any> {
    return this.afs.collection(this.collectionName).valueChanges()
  }

}
