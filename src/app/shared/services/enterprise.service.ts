import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { Enterprise } from '../models/enterprise.model';
import { AlertsService } from './alerts.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  

  private enterpriseLoaded: Promise<void>
  private enterprise: Enterprise
  private enterpriseRef: DocumentReference

  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private alertService: AlertsService
  ) {
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

  async addEnterprise(enterprise: Enterprise): Promise<void> {
    try {
      const ref = this.afs.collection<Enterprise>(Enterprise.collection).doc().ref;
      enterprise.id = ref.id;
      await ref.set(enterprise.toJson(), { merge: true });
      this.alertService.succesAlert('Has agregado una nueva empresa exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  public getEnterpriseRefById(enterpriseId: string): DocumentReference<Enterprise> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(enterpriseId).ref
  }

  public whenEnterpriseLoaded(): Promise<void> {
    return this.enterpriseLoaded;
  }

  public getEnterprise() {
    return this.enterprise
  }

  public getEnterpriseRef() {
    return this.enterpriseRef
  }

}
