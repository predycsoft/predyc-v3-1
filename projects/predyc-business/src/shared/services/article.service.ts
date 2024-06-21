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

  // ---------- TO SAVE IN SUBCOLLECTIONS
  // async saveArticle(articleData: any, isEditMode: boolean): Promise<void> {
  //   let articleId: string = articleData.id;
  
  //   if (!articleId) {
  //     articleId = this.afs.createId();
  //     articleData.id = articleId;
  //   }

  //   const articleDocRef = this.afs.collection(this.collectionName).doc(articleId);
  
  //   // Exclude "data" property
  //   const { data, ...metadata } = articleData;
  
  //   // Save rest of data
  //   if (!isEditMode) {
  //     await articleDocRef.set(metadata);
  //   } else {
  //     // Excluding createdAt from the update
  //     const { createdAt, ...dataToUpdate } = articleData;
  //     await articleDocRef.update(dataToUpdate);
  //   }
  
  //   // Save "data" in subcollection
  //   if (this.checkDocSize(data)) {
  //     console.log("Do not exceed size limit")
  //     await this.afs.collection(this.collectionName).doc(articleId).set({ data }, {merge: true});
  //   } 
  //   else {
  //     console.log("Exceeds size limit")
  //     await this.saveContentChunks(articleId, data);
  //   } 
  
  // }

  // checkDocSize(docData) {

  //   // Convert the document data to a JSON string
  //   const docDataJson = JSON.stringify(docData);

  //   // Get the size of the document data in bytes
  //   const docSizeInBytes = new TextEncoder().encode(docDataJson).length;

  //   // Optionally, convert the size to kilobytes or megabytes
  //   const docSizeInKB = docSizeInBytes / 1024;
  //   const docSizeInMB = docSizeInKB / 1024;

  //   console.log("Document size in bytes:", docSizeInBytes);
  //   console.log("Document size in megabytes:", docSizeInMB);

  //   return docSizeInBytes < 1048570 // the limit is 1.048.576 bytes
    
  // }
  
  // async saveContentChunks(articleId: string, content: any): Promise<void> {
  //   const articleDocRef = this.afs.collection(this.collectionName).doc(articleId).ref;
  
  //   // Split the content into three parts
  //   const contentKeys = Object.keys(content);
  //   const chunkSize = Math.ceil(contentKeys.length / 3); // save in 3 docs. It should be dinamycally
  //   const contentChunks = [];
  
  //   for (let i = 0; i < contentKeys.length; i += chunkSize) {
  //     const chunk = {};
  //     contentKeys.slice(i, i + chunkSize).forEach(key => {
  //       chunk[key] = content[key];
  //     });
  //     contentChunks.push(chunk);
  //   }
  
  //   // Save each chunk in the dataChunks subcollection
  //   const batch = this.afs.firestore.batch();
  //   contentChunks.forEach((chunk, index) => {
  //     const chunkDocRef = articleDocRef.collection('dataChunks').doc(`${index}`);
  //     batch.set(chunkDocRef, chunk);
  //   });
  
  //   await batch.commit();
  // }
  // -------------


  getArticles$(): Observable<any> {
    return this.afs.collection(this.collectionName).valueChanges()
  }

  getArticleById$(articleId: string): Observable<any> {
    return this.afs.collection(this.collectionName).doc(articleId).valueChanges()
  }

}
