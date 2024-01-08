import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Enterprise, EnterpriseJson } from '../models/enterprise.model';
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

  async addEnterprise(enterprise: Enterprise): Promise<void> {
    const ref = this.afs.collection<Enterprise>(Enterprise.collection).doc().ref;
    await ref.set({...enterprise.toJson(), id: ref.id}, { merge: true });
    enterprise.id = ref.id;
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

  public async updateVimeoFolder(enterprise: Enterprise, idFolder: string, folderUri: string): Promise<void> {
    await this.afs.collection(Enterprise.collection).doc(enterprise.id).update({
      vimeoFolderId: idFolder,
      vimeoFolderUri: folderUri
    })
  }

}
