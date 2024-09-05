import { Injectable } from '@angular/core';
import { AngularFirestore, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, Subscription, combineLatest, firstValueFrom, map } from 'rxjs';
import { Enterprise, EnterpriseJson } from 'projects/shared/models/enterprise.model';
import { AlertsService } from './alerts.service';
import { AuthService } from './auth.service';
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import { User } from 'shared';


@Injectable({
  providedIn: 'root'
})
export class CrmService {
  

  private enterpriseSubject = new BehaviorSubject<Enterprise | null>(null)
  public enterprise$ = this.enterpriseSubject.asObservable()
  private enterpriseLoadedSubject = new BehaviorSubject<boolean>(false)
  public enterpriseLoaded$ = this.enterpriseLoadedSubject.asObservable()
  private enterpriseRef: DocumentReference<Enterprise>


  constructor(
    private authService: AuthService,
    private afs: AngularFirestore,
    private fireFunctions: AngularFireFunctions,
  ) {
    console.log("Se instancio el crm service")
    this.getLeads()

  }

  private leadSubject = new BehaviorSubject<any[]>([]);
  private leads$ = this.leadSubject.asObservable();

    // Arguments could be pageSize, sort, currentPage
    getLeads() {

      // Query para traer por enterprise match
      const leadMatch$ = this.afs.collection<any>('infoRequestRegister').valueChanges();

  
      // Combinar ambos queries
      combineLatest([leadMatch$])
        .pipe(
          map(([matched]) => [...matched])
        )
        .subscribe({
          next: lead => {
            this.leadSubject.next(lead);
          },
          error: error => {
            console.log(error);
            // this.alertService.errorAlert(JSON.stringify(error));
          }
        });
    }
    

    getLeadsObservable(): Observable<any[]> {
      return this.leads$;
    }
  

  


}
