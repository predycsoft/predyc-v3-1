import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { Enterprise, EnterpriseJson } from 'projects/shared/models/enterprise.model';
import { AlertsService } from './alerts.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  

  private enterpriseSubject = new BehaviorSubject<Enterprise | null>(null)
  public enterprise$ = this.enterpriseSubject.asObservable()
  private enterpriseLoadedSubject = new BehaviorSubject<boolean>(false)
  public enterpriseLoaded$ = this.enterpriseLoadedSubject.asObservable()
  private enterpriseRef: DocumentReference<Enterprise>


  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private alertService: AlertsService
  ) {
    console.log("Se instancio el enterprise service")
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        // Load the enterprise data based on the authenticated user
        // const enterpriseDocumentReference = await ((user.enterprise as DocumentReference).get())
        // const enterprise = enterpriseDocumentReference.data() as Enterprise
        this.afs.doc<Enterprise>((user.enterprise as DocumentReference).path).valueChanges().subscribe(enterprise => {
          this.enterpriseSubject.next(enterprise)
          this.enterpriseRef = this.afs.collection<Enterprise>(Enterprise.collection).doc(enterprise.id).ref
          if (!this.enterpriseLoadedSubject.value) {
            this.enterpriseLoadedSubject.next(true)
            console.log("La empresa fue cargada", enterprise)
          }
        })
      }
    });
  }

  getAllEnterprises$(): Observable<Enterprise[]> {
    return this.afs.collection<Enterprise>(Enterprise.collection).valueChanges()
  }

  async addEnterprise(enterprise: Enterprise): Promise<string> {
    const ref = this.afs.collection<Enterprise>(Enterprise.collection).doc().ref;
    await ref.set({...enterprise.toJson(), id: ref.id}, { merge: true });
    enterprise.id = ref.id;

    return ref.id
  }

  async editEnterprise(enteprise: EnterpriseJson): Promise<void> {
    await this.afs.collection(Enterprise.collection).doc(enteprise.id as string).set(
      enteprise, { merge: true }
    );
  }

  public getEnterpriseRefById(id: string): DocumentReference<Enterprise> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(id).ref
  }

  public enterpriseIsLoaded(): boolean {
    return this.enterpriseLoadedSubject.value;
  }

  public getEnterpriseRef(): DocumentReference<Enterprise> {
    return this.enterpriseRef
  }

  public getEnterprise() {
    return this.enterpriseSubject.value
  }

  public getEnterprises$(searchTerm=null): Observable<Enterprise[]> {
    return this.afs.collection<Enterprise>(Enterprise.collection, ref => {
      let query: CollectionReference | Query = ref;
      if (searchTerm) {
        query = query.where('name', '>=', searchTerm).where('name', '<=', searchTerm+ '\uf8ff')
      }
      return query.orderBy('name')
    }).valueChanges()
  }

  public getEnterpriseById$(enterpriseId: string): Observable<Enterprise> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(enterpriseId).valueChanges()
  }

  public async deleteEnterprise(enterpriseId: string): Promise<void> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(enterpriseId).delete();
  }

  public async updateVimeoFolder(enterprise: Enterprise, idFolder: string, folderUri: string): Promise<void> {
    await this.afs.collection(Enterprise.collection).doc(enterprise.id).update({
      vimeoFolderId: idFolder,
      vimeoFolderUri: folderUri
    })
  }

}
