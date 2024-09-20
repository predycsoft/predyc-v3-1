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

    saveLead(lead: any): Promise<void> {
      if (lead.id) {
        // Si el lead tiene un ID, actualizamos el documento en Firestore
        const leadRef: DocumentReference = this.afs.collection('infoRequestRegister').doc(lead.id).ref;
        // Actualiza todos los campos del lead que sean proporcionados
        return leadRef.update({ ...lead });
      } else {
        // Si no tiene un ID, podrías lanzar un error o manejarlo de alguna forma
        return Promise.reject('El lead no tiene un ID');
      }
    }

    getUserCRM(): Promise<any[]> {
      return this.afs.collection('user', ref => 
        ref.where('role', '>=', 'crm') // Empieza a partir de 'crm'
           .where('role', '<=', 'crm\uf8ff') // Termina justo después de 'crm'
      ).get().toPromise()
      .then(querySnapshot => {
        const users = [];
        querySnapshot.forEach(doc => {
          const data = doc.data(); // Obtener los datos del documento
          users.push({ id: doc.id, ...data as User}); // Asegúrate de que 'data' es un objeto
        });
        return users; // Retorna un arreglo con los usuarios que cumplen con la condición
      })
      .catch(error => {
        console.error('Error al obtener usuarios:', error);
        throw error; // Manejo de errores
      });
    }
    

    
  

  


}
