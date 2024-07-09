import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Article, ArticleJson, ArticleTag, ArticleTagJson } from 'projects/shared/models/article.model';
import { Observable, combineLatest, map, of } from 'rxjs';
import { ArticleData } from '../../admin/admin-pages/articles/articles.component';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  constructor(
    private afs: AngularFirestore
  ) { }

  async saveArticle(articleData: ArticleData, isEditMode: boolean): Promise<string> {
    let articleId: string = articleData.id;
  
    if (!articleId) {
      articleId = this.afs.createId();
      articleData.id = articleId;
    }

    const articleDocRef = this.afs.collection<ArticleJson>(Article.collection).doc(articleId);
  
    // Exclude "data" property
    const { data, ...metadata } = articleData;
  
    // Save rest of data
    if (!isEditMode) await articleDocRef.set(metadata);
    else {
      // Excluding createdAt from the update
      const { createdAt, ...dataToUpdate } = metadata;
      // console.log("dataToUpdate", dataToUpdate)
      await articleDocRef.update(dataToUpdate);

    }
  
    // Save "data" in subcollection
    await this.saveContentChunks(articleId, data);
    return articleId
  }

  async saveContentChunks(articleId: string, content: Object[]): Promise<void> {
    const articleDocRef = this.afs.collection<ArticleJson>(Article.collection).doc(articleId).ref;
    const dataChunksCollectionRef = articleDocRef.collection(Article.subcollectionName);
  
    const contentChunks = [];
    let currentChunk = [];
  
    for (const item of content) {
      const tempChunk = [...currentChunk, item];
  
      if (this.checkDocSize(tempChunk)) {
        currentChunk = tempChunk;
      } else {
        console.log("Exceeds size limit")
        contentChunks.push(currentChunk);
        currentChunk = [item];
      }
    }
  
    if (currentChunk.length > 0) {
      contentChunks.push(currentChunk);
    }
    
    const batch = this.afs.firestore.batch();
    // Delete existing docs in dataChunks subcollection
    const dataChunksQuerySnapshot = await dataChunksCollectionRef.get();
    dataChunksQuerySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    // Save each new chunk in the dataChunks subcollection
    contentChunks.forEach((chunk, index) => {
      const chunkDocRef = dataChunksCollectionRef.doc(`${index}`);
      batch.set(chunkDocRef, { content: chunk });
    });
  
    await batch.commit();
  }

  checkDocSize(docData: any[]) {
    // Convert the document data to a JSON string
    const docDataJson = JSON.stringify(docData);

    // Get the size of the document data in bytes
    const docSizeInBytes = new TextEncoder().encode(docDataJson).length;

    // console.log("Document size in bytes:", docSizeInBytes);
    return docSizeInBytes < 1000000 // the limit is 1.048.576 bytes
  }
  
  getArticles$(): Observable<ArticleJson[]> {
    return this.afs.collection<ArticleJson>(Article.collection).valueChanges()
  }

  getArticleWithDataById$(articleId: string): Observable<ArticleData> {
    return combineLatest([
      this.afs.collection(Article.collection).doc(articleId).valueChanges(),
      this.afs.collection(Article.collection).doc(articleId).collection(Article.subcollectionName).valueChanges()
    ]).pipe(
      map(([articleMainData, dataChunks]: [any, any[]]) => {
        // console.log("dataChunks", dataChunks);
        const data = []
        dataChunks.forEach(chunk => {
          const chunkContent: any[] = chunk.content
          data.push(...chunkContent)
        });
        return {
          ...articleMainData,
          data
        };
      })
    );
  }

  async deleteArticleById(articleId: string): Promise<void> {
    const articleDocRef = this.afs.collection(Article.collection).doc(articleId);
    const dataChunksCollectionRef = articleDocRef.collection(Article.subcollectionName);
  
    // Get all documents in the subcollection
    const dataChunksQuerySnapshot = await dataChunksCollectionRef.ref.get();
    const batch = this.afs.firestore.batch();
  
    dataChunksQuerySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
  
    batch.delete(articleDocRef.ref);
  
    await batch.commit();
  }

  
  // --------- TAGS
  async saveArticleTags(tagDataArray: ArticleTagJson[]): Promise<ArticleTagJson[]> {
    const batch = this.afs.firestore.batch();
    const tagsWithId: ArticleTagJson[] = [];
  
    tagDataArray.forEach(tagData => {
      const tagId = this.afs.createId();
      tagData.id = tagId;
      const tagRef = this.afs.collection<ArticleTagJson>(ArticleTag.collection).doc(tagId).ref;
      batch.set(tagRef, tagData);
      tagsWithId.push(tagData);
    });
  
    try {
      await batch.commit();
      return tagsWithId;
    } catch (error) {
      console.error("Error saving tags: ", error);
      throw error;
    }
  }

  getArticleTagRefById(tagId: string): DocumentReference<ArticleTag> {
    return this.afs.collection<ArticleTag>(ArticleTag.collection).doc(tagId).ref
  }

  getAllArticleTags$() {
    return this.afs.collection<ArticleTag>(ArticleTag.collection).valueChanges()
  }

  getArticleTagsByIds$(tagsIds: string[]): Observable<ArticleTagJson[]> {
    if (!tagsIds || tagsIds.length === 0) {
      return of([]);
    }

    const tagObservables = tagsIds.map(tagId => this.afs.collection<ArticleTagJson>(ArticleTag.collection).doc(tagId).valueChanges());
    return combineLatest(tagObservables)
  }
  
}
