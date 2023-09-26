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
  ) {}

  public loadEnterpriseData() {
    this.enterpriseLoaded = new Promise<void>((resolve) => {
      this.authService.user$.subscribe(async (user) => {
        if (user) {
          // Load the enterprise data based on the authenticated user
          console.log("This runs by only calling this function")
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
      await ref.set({...enterprise.toJson(), id: ref.id}, { merge: true });
      enterprise.id = ref.id;
      this.alertService.succesAlert('Has agregado una nueva empresa exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async editEnterprise(enteprise): Promise<void> {
    try {
      await this.afs.collection(Enterprise.collection).doc(enteprise.id as string).set(
        enteprise, { merge: true }
      );
      this.alertService.infoAlert('Has editado la informacion de la empresa exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  public getEnterpriseRefById(id: string): DocumentReference<Enterprise> {
    return this.afs.collection<Enterprise>(Enterprise.collection).doc(id).ref
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
