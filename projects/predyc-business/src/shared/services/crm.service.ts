import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreDocument, CollectionReference, DocumentReference, Query } from '@angular/fire/compat/firestore';
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


  constructor(
    private afs: AngularFirestore,
  ) {
    console.log("Se instancio el crm service")
    this.getDashboardData()

  }

  private dasboardSubject = new BehaviorSubject<any[]>([]);
  private dasboardData$ = this.dasboardSubject.asObservable();

    // Arguments could be pageSize, sort, currentPage
    getDashboardData() {
      // Query para traer leads
      const leadMatch$ = this.afs.collection<any>('infoRequestRegister').valueChanges();
  
      // Query para traer enterprises
      const enterpriseMatch$ = this.afs.collection<any>('crmEnterpise').valueChanges();
  
      // Combinar ambos queries
      combineLatest([leadMatch$, enterpriseMatch$])
        .pipe(
          map(([matchedLeads, matchedEnterprises]) => ({
            leads: matchedLeads,
            enterprises: matchedEnterprises
          }))
        )
        .subscribe({
          next: result => {
            this.dasboardSubject.next(result as any); // Emitir el objeto completo
          },
          error: error => {
            console.log(error);
            // this.alertService.errorAlert(JSON.stringify(error));
          }
        });
  }
  
  
  

  getDashboardDataObservable(): Observable<any[]> {
    return this.dasboardData$;
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

  async saveLeadEmpresa(idEmpresa: string, lead: any): Promise<void> {
    if (!lead.id) {
      return Promise.reject('El lead no tiene un ID');
    }
  
    const leadRef = this.afs.collection('infoRequestRegister').doc(lead.id).ref;
    const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa).ref;
  
    try {
      // Inicia la transacción para asegurar que ambos documentos se actualizan
      await this.afs.firestore.runTransaction(async (transaction) => {
        // Primero lee el documento de la empresa
        const empresaDoc = await transaction.get(empresaRef);
        if (!empresaDoc.exists) {
          throw new Error(`El documento de la empresa con ID ${idEmpresa} no existe.`);
        }
  
        // Ahora que la lectura está hecha, puedes proceder con la escritura
        // Actualiza el lead en 'infoRequestRegister'
        transaction.update(leadRef, { ...lead });
  
        // Actualiza el arreglo 'leads' en el documento de la empresa
        const empresaData = empresaDoc.data();
        let leads = empresaData['leads'] || [];
  
        // Encuentra el lead a actualizar en el arreglo de leads
        const leadIndex = leads.findIndex((l: any) => l.id === lead.id);
        if (leadIndex !== -1) {
          // Actualiza el lead en el arreglo
          leads[leadIndex] = { ...leads[leadIndex], ...lead };
        } else {
          // Si el lead no existe en el arreglo, lo agrega (opcional)
          leads.push(lead);
        }
  
        // Actualiza el documento de la empresa con el nuevo arreglo de leads
        transaction.update(empresaRef, { leads });
      });
  
      console.log('Lead y empresa actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar el lead o la empresa:', error);
      throw error;
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

saveEmpresa(empresa: any): Promise<void> {
    if (empresa.id) {
        // Si el lead tiene un ID, actualizamos el documento en Firestore
        const leadRef: AngularFirestoreDocument<any> = this.afs.collection('crmEnterpise').doc(empresa.id);
        // Actualiza todos los campos del lead que sean proporcionados
        return leadRef.update({ ...empresa });
    } else {
        // Si no tiene un ID, creamos una nueva empresa
        const leadRef: AngularFirestoreDocument<any> = this.afs.collection('crmEnterpise').doc(); // Genera un nuevo ID
        empresa.id = leadRef.ref.id; // Agrega el ID generado al objeto empresa

        // Agrega el nuevo documento a la colección
        return leadRef.set({ ...empresa });
    }
}


getEmpresabyID(empresaId: string): Observable<any> {
  return this.afs.collection('crmEnterpise').doc(empresaId).valueChanges();
}

addLeadToEnterprise(lead: any, idEmpresa: string): Promise<void> {
  const enterpriseRef = this.afs.collection('crmEnterpise').doc(idEmpresa);

  return enterpriseRef.ref.get().then(async (doc) => {
      if (doc.exists) {
          const enterpriseData = doc.data();
          const leadsArray = enterpriseData['leads'] || []; // Obtén el arreglo existente o inicializa uno nuevo

          // Agrega el nuevo lead al arreglo
          leadsArray.push(lead);

          // Actualiza el documento de la empresa con el nuevo arreglo de leads
          await enterpriseRef.update({ leads: leadsArray });
      } else {
          throw new Error('La empresa no existe');
      }
  });
}



    
  

  


}
