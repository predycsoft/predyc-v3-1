import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { License } from '../models/license.model';
import { BehaviorSubject, Observable, Subscription, switchMap } from 'rxjs';
import { AlertsService } from './alerts.service';
import { EnterpriseService } from './enterprise.service';
import { DialogService } from './dialog.service';
import { User } from '../models/user.model';
import { SubscriptionService } from './subscription.service';

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
    private alertService: AlertsService,
    private enterpriseService: EnterpriseService,
    private subscriptionService: SubscriptionService,
    private dialogService: DialogService
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

  

  getLicensesValue() {
    return this.licensesSubject.value
  }

  async assignLicense(license: License, user: User | any) { // Remove any from user
    const licenses: License[] = this.getLicensesValue()
    let validLicense: License = licenses.find((x: License)=> x.id == license.id)
    if(!validLicense){
      this.dialogService.dialogAlerta("La licencia no existe, contacte a soporte")
    } 
    else {
      if(validLicense.retrieveBy.length >= validLicense.quantity){
        this.alertService.errorAlert("Ya se han agotado los cupos de esta licencia")
      } 
      else{
        this.dialogService.dialogConfirmar().afterClosed().subscribe(async result => {
          if(result){
            // Create user suscription
            this.subscriptionService.createUserSubscription(license, user)
            // Update retrieveBy field in license collection
            validLicense.retrieveBy.push(user.email)
            await this.afs.collection(License.collection).doc(validLicense.id).update({
              retrieveBy: validLicense.retrieveBy
            })
            this.dialogService.dialogExito()
          }
        })
      }
    }
  }




}
