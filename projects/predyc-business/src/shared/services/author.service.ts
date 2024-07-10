import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Author, AuthorJson } from 'projects/shared/models/author.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {

  constructor(
    private afs: AngularFirestore
  ) { }

  getAuthors$(): Observable<Author[]> {
    return this.afs.collection<Author>(Author.collection).valueChanges()
  }

  getAuthorById$(authorId: string): Observable<Author> {
    return this.afs.collection<Author>(Author.collection).doc(authorId).valueChanges()
  }

  getAuthorRefById(authorId: string): DocumentReference<Author> {
    return this.afs.collection<Author>(Author.collection).doc(authorId).ref
  }

  async saveAuthor(authorData: AuthorJson): Promise<void> {
    let authorId = authorData.id
    if (!authorId) {
      authorId = (this.afs.collection(Author.collection).doc().ref).id
      authorData.id = authorId
    }
    return await this.afs.collection(Author.collection).doc(authorId).set(authorData)
  }

  async deleteAuthorById(authorId: string): Promise<void> {
    return await this.afs.collection(Author.collection).doc(authorId).delete()
  }
}
