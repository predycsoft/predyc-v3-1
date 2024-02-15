import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { License } from '../models/license.model';
import { BehaviorSubject, Observable, Subscription, firstValueFrom, switchMap } from 'rxjs';
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

  async assignLicense(license: License, usersIds: string[],rotation = false) {
    const licenseRef: DocumentReference<License> =  this.afs.collection<License>(License.collection).doc(license.id).ref
    if(license.quantityUsed + usersIds.length > license.quantity){
      this.alertService.errorAlert("No tienes suficientes cupos en esta licencia para la cantidad de usuarios seleccionados")
      return
    } 
    else{
      //const dialogResult = await firstValueFrom(this.dialogService.dialogConfirmar().afterClosed());
      //if (dialogResult) {
      if (true) {
        const createSubscriptionsPromises = usersIds.map(userId => this.subscriptionService.createUserSubscription(license, licenseRef, userId));
        await Promise.all(createSubscriptionsPromises)
        // Update license quantityUsed field OR rotations.
        console.log(rotation,(license.rotations>license.rotationsUsed),rotation && license.rotations>license.rotationsUsed)
        if(rotation && license.rotations>license.rotationsUsed){

          // license.quantityUsed = license.quantityUsed + usersIds.length
          // license.rotationsUsed = license.rotationsUsed +  usersIds.length
          // license.rotationsWaitingCount = license.rotationsWaitingCount - usersIds.length
          
          await this.afs.collection(License.collection).doc(license.id).set(
            {
              quantityUsed: license.quantityUsed + usersIds.length,
              rotationsUsed: license.rotationsUsed +  usersIds.length,
              rotationsWaitingCount:license.rotationsWaitingCount - usersIds.length
            },{ merge: true }
          );

        }
        else{
          //license.quantityUsed = license.quantityUsed + usersIds.length
          await this.afs.collection(License.collection).doc(license.id).set(
            {
              quantityUsed: license.quantityUsed + usersIds.length
            },{ merge: true }
          );
        }

        console.log("Cupo de licencia usada")
        // this.dialogService.dialogExito()
      }
      else throw new Error('Operación cancelada');
    }
  }

  async removeLicense(usersIds: string[],licenses): Promise<void> {
    const dialogResult = await firstValueFrom(this.dialogService.dialogConfirmar().afterClosed());
    if (dialogResult) {
      // let promises = []
      // for (let userId of usersIds) {
      //   promises.push(this.subscriptionService.removeUserSubscription(userId));
      // }
      console.log("usersIds", usersIds)
      const promises = usersIds.map(userId => this.subscriptionService.removeUserSubscription(userId,licenses));
      await Promise.all(promises)
      this.dialogService.dialogExito();
    } 
    else throw new Error('Operación cancelada');
  }  


}
