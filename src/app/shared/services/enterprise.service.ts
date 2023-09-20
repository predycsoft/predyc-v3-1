import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from '../models/enterprise.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  

  private enterpriseLoaded: Promise<void>
  private enterprise: Enterprise
  private enterpriseRef: DocumentReference

  constructor(private authService: AuthService, private afs: AngularFirestore) {
    this.loadEnterpriseData()
  }

  private async loadEnterpriseData() {
    this.enterpriseLoaded = new Promise<void>((resolve) => {
      this.authService.user$.subscribe(async (user) => {
        if (user) {
          // Load the enterprise data based on the authenticated user
          const enterpriseDocumentReference = await ((user.enterprise as DocumentReference).get())
          this.enterprise = enterpriseDocumentReference.data() as Enterprise
          this.enterpriseRef = this.afs.collection<Enterprise>(Enterprise.collection).doc(this.enterprise.id).ref
          resolve();
        }
      });
    });
  }

  whenEnterpriseLoaded(): Promise<void> {
    return this.enterpriseLoaded;
  }

  public getEnterprise() {
    return this.enterprise
  }

  public getEnterpriseRef() {
    return this.enterpriseRef
  }

}
