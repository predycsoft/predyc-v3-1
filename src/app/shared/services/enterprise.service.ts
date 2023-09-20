import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Enterprise } from '../models/enterprise.model';
import { AuthService } from './auth.service';
import { AlertsService } from './alerts.service';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {
  

  private enterpriseSubject = new BehaviorSubject<Enterprise | null>(null);
  private enterprise$ = this.enterpriseSubject.asObservable();

  constructor(
    private authService: AuthService,
    private alertService: AlertsService,
    private afs: AngularFirestore,

    ) {
    this.authService.user$.subscribe(async user => {
      const enterpriseDocumentReference = await user?.enterprise?.get()
      if (enterpriseDocumentReference) {
        const enterprise = enterpriseDocumentReference.data() as Enterprise
        this.enterpriseSubject.next(enterprise)
      } else {
        this.enterpriseSubject.next(null)
      }
    })
  }

  public getEnterpriseObservable() {
    return this.enterprise$
  }

  async addEnterprise(newEnterprise: Enterprise): Promise<void> {
    try {
      try {
        // const email = newUser.email as string
        // const password = `${this.utilsService.generateSixDigitRandomNumber()}`
        // const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
        // const user = userCredential.user;
        // newUser.uid = user?.uid as string
        await this.afs.collection(Enterprise.collection).doc(newEnterprise?.id).set(newEnterprise.toJson());
      } catch (error) {
        console.log(error)
        throw error
      }
      this.alertService.succesAlert('Has agregado un nuevo usuario exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  public enterprise = {
    id: 'empresaPruebaId',
    name: 'Empresa prueba'
  }
}
