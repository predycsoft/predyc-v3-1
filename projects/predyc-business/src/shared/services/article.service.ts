import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable, combineLatest, map, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  collectionName = "article"
  subcollectionName = "dataChunks"

  constructor(
    private afs: AngularFirestore
  ) { }

  async saveArticle(articleData: any, isEditMode: boolean): Promise<void> {
    let articleId: string = articleData.id;
  
    if (!articleId) {
      articleId = this.afs.createId();
      articleData.id = articleId;
    }

    const articleDocRef = this.afs.collection(this.collectionName).doc(articleId);
  
    // Exclude "data" property
    const { data, ...metadata } = articleData;
  
    // Save rest of data
    if (!isEditMode) await articleDocRef.set(metadata);
    else {
      // Excluding createdAt from the update
      const { createdAt, ...dataToUpdate } = articleData;
      await articleDocRef.update(dataToUpdate);
    }
  
    // Save "data" in subcollection
    await this.saveContentChunks(articleId, data);
  
  }

  checkDocSize(docData) {
    // Convert the document data to a JSON string
    const docDataJson = JSON.stringify(docData);

    // Get the size of the document data in bytes
    const docSizeInBytes = new TextEncoder().encode(docDataJson).length;

    // console.log("Document size in bytes:", docSizeInBytes);
    return docSizeInBytes < 1000000 // the limit is 1.048.576 bytes
  }
  
  async saveContentChunks(articleId: string, content: any[]): Promise<void> {
    const articleDocRef = this.afs.collection(this.collectionName).doc(articleId).ref;
  
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
    
    // Save each chunk in the dataChunks subcollection
    const batch = this.afs.firestore.batch();
    contentChunks.forEach((chunk, index) => {
      const chunkDocRef = articleDocRef.collection(this.subcollectionName).doc(`${index}`);
      batch.set(chunkDocRef, { content: chunk });
    });
  
    await batch.commit();
  }
  
  getArticles$(): Observable<any> {
    return this.afs.collection(this.collectionName).valueChanges()
  }

  getArticleById$(articleId: string): Observable<any> {
    return combineLatest([
      this.afs.collection(this.collectionName).doc(articleId).valueChanges(),
      this.afs.collection(this.collectionName).doc(articleId).collection(this.subcollectionName).valueChanges()
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

}
