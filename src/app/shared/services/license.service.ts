import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { License } from '../models/license.model';
import { BehaviorSubject, Observable, Subscription, switchMap } from 'rxjs';
import { EnterpriseService } from './enterprise.service';
import { DialogService } from './dialog.service';
import { User } from '../models/user.model';
import { SubscriptionService } from './subscription.service';
import { AlertsService } from './alerts.service';

@Injectable({
  providedIn: 'root'
})
export class LicenseService {

  private licensesSubject = new BehaviorSubject<License[] | null>(null)
  public licenses$ = this.licensesSubject.asObservable()
  private licensesLoadedSubject = new BehaviorSubject<boolean>(false)
  public licensesLoaded$ = this.licensesLoadedSubject.asObservable()

  constructor(
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private subscriptionService: SubscriptionService,
    private dialogService: DialogService,
    private alertService: AlertsService,
  ) {
  }

  geteEnterpriseLicenses$(): Observable<License[]> {
    return this.enterpriseService.enterpriseLoaded$.pipe(
      switchMap(isLoaded => {
        if (!isLoaded) return []
        const enterpriseRef = this.enterpriseService.getEnterpriseRef();
        return this.afs.collection<License>(License.collection, ref => 
          ref.where('enterpriseRef', '==', enterpriseRef).orderBy('createdAt', 'desc')).valueChanges()
      })
    )
  }

  async assignLicense(license: License, usersIds: string[]) {
    const licenseRef: DocumentReference<License> =  this.afs.collection<License>(License.collection).doc(license.id).ref
    if(license.quantityUsed + usersIds.length > license.quantity){
      this.alertService.errorAlert("No tienes suficientes cupos en esta licencia para la cantidad de usuarios seleccionados")
      return
    } 
    else{
      this.dialogService.dialogConfirmar().afterClosed().subscribe(async result => {
        if(result){
          for (let userId of usersIds) {
            await this.subscriptionService.createUserSubscription(license, licenseRef, userId)
          }
          // Update license quantityUsed field OR rotations. 
          await this.afs.collection(License.collection).doc(license.id).set(
            {
              quantityUsed: license.quantityUsed + usersIds.length
            },{ merge: true }
          );
          console.log("Cupo de licencia usada")
          this.dialogService.dialogExito()
        }
      })
    }
  }

  async removeLicense(usersIds: string[]) {
    this.dialogService.dialogConfirmar().afterClosed().subscribe(async result => {
      if(result){
        for (let userId of usersIds) {
          await this.subscriptionService.removeUserSubscription(userId)
        }
        this.dialogService.dialogExito()
      }
    })
  }


}
