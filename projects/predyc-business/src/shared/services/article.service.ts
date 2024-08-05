import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Article, ArticleCategory, ArticleCategoryJson, ArticleJson, ArticleTag, ArticleTagJson } from 'projects/shared/models/article.model';
import { Observable, combineLatest, map, of } from 'rxjs';
import { ArticleData } from '../../admin/admin-pages/articles/articles.component';

@Injectable({
  providedIn: 'root'
})
export class ArticleService {

  constructor(
    private afs: AngularFirestore
  ) { }

  async saveArticle(articleData: ArticleData, isEditMode: boolean, prevOrderNumber: number): Promise<string> {
    let articleId: string = articleData.id;
  
    if (!articleId) {
      articleId = this.afs.createId();
      articleData.id = articleId;
    }

    const articleDocRef = this.afs.collection<ArticleJson>(Article.collection).doc(articleId);
  
    // Exclude "data" and "dataHTML" properties
    const { data, dataHTML, ...metadata } = articleData;
  
    // Save rest of data
    if (!isEditMode) await articleDocRef.set(metadata);
    else {
      // Excluding createdAt from the update
      const { createdAt, ...dataToUpdate } = metadata;
      // console.log("dataToUpdate", dataToUpdate)
      await articleDocRef.update(dataToUpdate);

    }

    // Save "data" in subcollection
    await this.saveChunks(articleId, data);
    // Save "dataHTML" in subcollection
    await this.saveChunks(articleId, dataHTML);
    // Update orderNumber of all articles
    await this.updateOrderNumbers(articleId, prevOrderNumber) // Check this
    return articleId
  }

  async saveChunks(articleId: string, content: Object[] | string): Promise<void> {
    const subcollection = typeof content === 'string' ? Article.HTMLSubcollectionName : Article.objectSubcollectionName
    const articleDocRef = this.afs.collection<ArticleJson>(Article.collection).doc(articleId).ref;
    const dataChunksCollectionRef = articleDocRef.collection(subcollection);
  
    const contentChunks = [];

    if (typeof content !== 'string') {
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
    } else {
      let currentChunk = '';
      for (let i = 0; i < content.length; i++) {
        const tempChunk = currentChunk + content[i];
    
        if (this.checkDocSize(tempChunk)) {
          currentChunk = tempChunk;
        } else {
          console.log("Exceeds size limit");
          contentChunks.push(currentChunk);
          currentChunk = content[i];
        }
      }
    
      if (currentChunk.length > 0) {
        contentChunks.push(currentChunk);
      }
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

  // async saveHTMLChunks(articleId: string, content: string): Promise<void> {
  //   const articleDocRef = this.afs.collection<ArticleJson>(Article.collection).doc(articleId).ref;
  //   const dataChunksCollectionRef = articleDocRef.collection(Article.HTMLSubcollectionName);
  
  //   const contentChunks = [];
  //   let currentChunk = '';
  
  //   for (let i = 0; i < content.length; i++) {
  //     const tempChunk = currentChunk + content[i];
  
  //     if (this.checkDocSize(tempChunk)) {
  //       currentChunk = tempChunk;
  //     } else {
  //       console.log("Exceeds size limit");
  //       contentChunks.push(currentChunk);
  //       currentChunk = content[i];
  //     }
  //   }
  
  //   if (currentChunk.length > 0) {
  //     contentChunks.push(currentChunk);
  //   }
  
  //   const batch = this.afs.firestore.batch();
  //   // Delete existing docs in the specified subcollection
  //   const dataChunksQuerySnapshot = await dataChunksCollectionRef.get();
  //   dataChunksQuerySnapshot.forEach(doc => {
  //     batch.delete(doc.ref);
  //   });
  //   // Save each new chunk in the specified subcollection
  //   contentChunks.forEach((chunk, index) => {
  //     const chunkDocRef = dataChunksCollectionRef.doc(`${index}`);
  //     batch.set(chunkDocRef, { content: chunk });
  //   });
  
  //   await batch.commit();
  // } 
  
  checkDocSize(docData: any[] | string): boolean {
    let docDataJson: string
    if (typeof docData !== "string" ) {
      // Convert the document data to a JSON string
      docDataJson = JSON.stringify(docData);
    } else {
      docDataJson = docData
    }

    // Get the size of the document data in bytes
    const docSizeInBytes = new TextEncoder().encode(docDataJson).length;

    // console.log("Document size in bytes:", docSizeInBytes);
    return docSizeInBytes < 1000000 // the limit is 1.048.576 bytes
  }
  
  getArticles$(): Observable<ArticleJson[]> {
    return this.afs.collection<ArticleJson>(Article.collection, ref => ref.orderBy("orderNumber", "asc")).valueChanges()
  }

  async getArticles(): Promise<ArticleJson[]> {
    try {
      const snapshot = await this.afs.collection<ArticleJson>(Article.collection,ref => ref.orderBy('orderNumber', 'asc')).ref.get();
      const articles: ArticleJson[] = snapshot.docs.map(doc => doc.data() as ArticleJson);
      return articles;
    } catch (error) {
      console.error('Error getting articles: ', error);
      throw new Error('Failed to get articles');
    }
  }

  getArticleById$(articleId: string): Observable<ArticleJson> {
    return this.afs.collection<ArticleJson>(Article.collection).doc(articleId).valueChanges()
  }

  getArticleWithDataById$(articleId: string): Observable<ArticleData> {
    return combineLatest([
      this.afs.collection(Article.collection).doc(articleId).valueChanges(),
      this.afs.collection(Article.collection).doc(articleId).collection(Article.objectSubcollectionName).valueChanges(),
      this.afs.collection(Article.collection).doc(articleId).collection(Article.HTMLSubcollectionName).valueChanges()
    ]).pipe(
      map(([articleMainData, dataChunks, htmlChunks]: [any, any[], any[]]) => {
        const data = [];
        dataChunks.forEach(chunk => {
          const chunkContent: any[] = chunk.content;
          data.push(...chunkContent);
        });
        const dataHTML = htmlChunks.map(chunk => chunk.content).join('');
        return {
          ...articleMainData,
          data,
          dataHTML
        };
      })
    );
  }

  getArticlesByIds$(articlesIds: string[]): Observable<ArticleJson[]> {
    if (!articlesIds || articlesIds.length === 0) {
      return of([]);
    }

    const articleObservables = articlesIds.map(articleId => this.afs.collection<ArticleJson>(Article.collection).doc(articleId).valueChanges());
    return combineLatest(articleObservables)
  }

  getArticleRefById(id: string): DocumentReference<Article> {
    return this.afs.collection<Article>(Article.collection).doc(id).ref;
  }

  async deleteArticleById(articleId: string): Promise<void> {
    const articleDocRef = this.afs.collection(Article.collection).doc(articleId);
    const dataChunksCollectionRef = articleDocRef.collection(Article.objectSubcollectionName);
    const htmlChunksCollectionRef = articleDocRef.collection(Article.HTMLSubcollectionName);
  
    const batch = this.afs.firestore.batch();
  
    // Get all documents in the object subcollection
    const dataChunksQuerySnapshot = await dataChunksCollectionRef.ref.get();
    dataChunksQuerySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
  
    // Get all documents in the HTML subcollection
    const htmlChunksQuerySnapshot = await htmlChunksCollectionRef.ref.get();
    htmlChunksQuerySnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
  
    // Delete the main article document
    batch.delete(articleDocRef.ref);
  
    // Update order numbers of the remaining articles
    await this.updateOrderNumbersAfterDeletion(articleId);
    await batch.commit();

  }

  async updateOrderNumbers(articleId: string, prevOrderNumber: number) {
    let allArticles = (await this.getArticles()).sort((a, b) => a.orderNumber -b.orderNumber );
    // console.log("allArticles", allArticles.map(x => {return {orderNumbe: x.orderNumber, title: x.title}}));

    // Find the index of the updated article
    const updatedArticleIndex = allArticles.findIndex(article => article.id === articleId);
    // console.log("updatedArticleIndex", updatedArticleIndex)
    const updatedArticle = allArticles[updatedArticleIndex];
    const updatedOrderNumber = updatedArticle.orderNumber;

    const batch = this.afs.firestore.batch();

    // Remove the updated article from its current position
    allArticles.splice(updatedArticleIndex, 1);

    // Determine the new position of the updated article
    let newArticleIndex = allArticles.findIndex(article => article.orderNumber >= updatedOrderNumber);
    // console.log("newArticleIndex", newArticleIndex)

    if (prevOrderNumber && prevOrderNumber < updatedOrderNumber) {
      // Place after the article with the same orderNumber
      newArticleIndex++;
    }

    if (newArticleIndex === -1) {
      newArticleIndex = allArticles.length;
    }

    // Insert the updated article at the new position
    allArticles.splice(newArticleIndex, 0, updatedArticle);

    // console.log("Final allArticles", allArticles.map(x => {return {orderNumbe: x.orderNumber, title: x.title}}))
    // Reorder all articles based on the sorted array
    for (let index = 0; index < allArticles.length; index++) {
      const article = allArticles[index];
      const articleRef = this.afs.collection('article').doc(article.id).ref;
      if (article.orderNumber !== index + 1) {
        console.log(article.title, " order number updated")
        batch.update(articleRef, { orderNumber: index + 1 });
      } else {
        console.log(article.title, "order number didnt need to be updated")
      }
    }

    // Commit the batch update
    await batch.commit();
    console.log('Order numbers updated successfully');
  }

  async updateOrderNumbersAfterDeletion(articleId: string) {
    let allArticles = (await this.getArticles()).sort((a, b) => a.orderNumber - b.orderNumber);
    // console.log("allArticles before deletion", allArticles.map(x => { return { orderNumber: x.orderNumber, title: x.title } }));
  
    // Find the index of the article to be deleted
    const deletedArticleIndex = allArticles.findIndex(article => article.id === articleId);
  
    const batch = this.afs.firestore.batch();
  
    // Remove the article to be deleted from the list
    allArticles.splice(deletedArticleIndex, 1);
  
    // Reorder the remaining articles
    for (let index = 0; index < allArticles.length; index++) {
      const article = allArticles[index];
      const articleRef = this.afs.collection('article').doc(article.id).ref;
      if (article.orderNumber !== index + 1) {
        console.log(article.title, " order number updated");
        batch.update(articleRef, { orderNumber: index + 1 });
      } else {
        console.log(article.title, "order number didn't need to be updated");
      }
    }
  
    // Commit the batch update
    await batch.commit();
    // console.log('Order numbers updated successfully before deletion');
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


  // --------- Categories

  getAllArticleCategories$() {
    return this.afs.collection<ArticleCategory>(ArticleCategory.collection).valueChanges()
  }
  
  getArticleCategoriesByIds$(categoriesIds: string[]): Observable<ArticleCategoryJson[]> {
    if (!categoriesIds || categoriesIds.length === 0) {
      return of([]);
    }

    const categoryObservables = categoriesIds.map(categoryId => this.afs.collection<ArticleCategoryJson>(ArticleCategory.collection).doc(categoryId).valueChanges());
    return combineLatest(categoryObservables)
  }

  async saveArticleCategories(categoryDataArray: ArticleCategoryJson[]): Promise<ArticleCategoryJson[]> {
    const batch = this.afs.firestore.batch();
    const categoriesWithId: ArticleCategoryJson[] = [];
  
    categoryDataArray.forEach(categoryData => {
      const categoryId = this.afs.createId();
      categoryData.id = categoryId;
      const categoryRef = this.afs.collection<ArticleCategoryJson>(ArticleCategory.collection).doc(categoryId).ref;
      batch.set(categoryRef, categoryData);
      categoriesWithId.push(categoryData);
    });
  
    try {
      await batch.commit();
      return categoriesWithId;
    } catch (error) {
      console.error("Error saving categories: ", error);
      throw error;
    }
  }

  getArticleCategoryRefById(categoryId: string): DocumentReference<ArticleCategory> {
    return this.afs.collection<ArticleCategory>(ArticleCategory.collection).doc(categoryId).ref
  }
}
