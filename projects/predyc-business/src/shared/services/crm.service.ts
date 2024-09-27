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

  async saveCardEmpresa(idEmpresa: string, lead: any): Promise<void> {

    if (!lead.id) {
      return Promise.reject('El lead no tiene un ID');
    }

    let leadRef = null

    // Verifica que lead.id existe y no es numérico
    if (lead.id && isNaN(Number(lead.id))) {
      leadRef = this.afs.collection('infoRequestRegister').doc(lead.id).ref;
    }
    const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa).ref;
  
    try {
      // Inicia la transacción para asegurar que ambos documentos se actualizan
      await this.afs.firestore.runTransaction(async (transaction) => {
        // Primero lee el documento de la empresa
        const empresaDoc = await transaction.get(empresaRef);
        if (!empresaDoc.exists) {
          throw new Error(`El documento de la empresa con ID ${idEmpresa} no existe.`);
        }
  
        // Actualiza el lead en 'infoRequestRegister' si existe
        if (leadRef) {
          transaction.update(leadRef, { ...lead });
        }
  
        // Actualiza los arreglos 'opened', 'inprocess', 'closing', 'closed', 'lost' en el documento de la empresa
        const empresaData = empresaDoc.data();
        
        // List of arrays to search in
        const leadArrays = ['opened', 'inprocess', 'closing', 'closed', 'lost'];
        
        // Recorre todos los arreglos para encontrar y actualizar el lead
        leadArrays.forEach((arrayName) => {
          let leads = empresaData[arrayName] || [];
          const leadIndex = leads.findIndex((l: any) => l.id == lead.id);
  
          if (leadIndex !== -1) {
            // Actualiza el lead en el arreglo
            leads[leadIndex] = { ...leads[leadIndex], ...lead };
            empresaData[arrayName] = leads; // Guarda los cambios en el arreglo de leads
          }
        });
  
        // Actualiza el documento de la empresa con los nuevos arreglos de leads
        transaction.update(empresaRef, empresaData);
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
          const leadsArray = enterpriseData['opened'] || []; // Obtén el arreglo existente o inicializa uno nuevo

          // Agrega el nuevo lead al arreglo
          leadsArray.push(lead);

          // Actualiza el documento de la empresa con el nuevo arreglo de leads
          await enterpriseRef.update({ opened: leadsArray });
      } else {
          throw new Error('La empresa no existe');
      }
  });
}

moveCardEmpresa(idEmpresa: string, cardID: string, origen: string, destino: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      // Obtén la referencia al documento de la empresa
      const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa);

      // Obtener el documento actual de la empresa
      const empresaDoc = await empresaRef.get().toPromise();
      if (!empresaDoc.exists) {
        return reject('La empresa no existe.');
      }

      const empresaData = empresaDoc.data();

      // Elimina la tarjeta del arreglo de origen
      console.log(empresaData[origen],cardID)
      const index = empresaData[origen].findIndex((item: any) => item.id == cardID);
      if (index !== -1) {
        // Eliminar la tarjeta del arreglo de origen
        const cardToMove = empresaData[origen][index]; // Guarda la tarjeta a mover
        empresaData[origen].splice(index, 1); // Eliminar la tarjeta

        // Agrega la tarjeta al arreglo de destino
        if (!empresaData[destino]) {
          // Si no existe el arreglo de destino, créalo
          empresaData[destino] = [];
        }
        empresaData[destino].push(cardToMove); // Mover la tarjeta al nuevo arreglo

        // Actualiza el documento de la empresa en Firestore
        await empresaRef.set(empresaData, { merge: true });
        resolve(); // Resuelve la promesa
      } else {
        reject('La tarjeta no se encontró en el origen.');
      }
    } catch (error) {
      console.error('Error al mover la tarjeta:', error);
      reject(error); // Rechaza la promesa si hay un error
    }
  });
}

updateEmpresaIndustria(idEmpresa: string, industria: string): Promise<void> {
  const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa);

  // Actualizar el campo "industria" en el documento de la empresa
  return empresaRef.update({ industria: industria })
    .then(() => {
      console.log('Industria actualizada correctamente');
    })
    .catch((error) => {
      console.error('Error al actualizar la industria:', error);
      throw error; // Propaga el error si es necesario
    });
}

async saveNoteEmpresa(texto: string, idEmpresa: string, idUser: string): Promise<void> {
  const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa);
  const notaId = Date.now(); // También puedes usar: new Date().getTime()

  // Creación de la nota con los parámetros proporcionados
  const nuevaNota = {
    id:notaId,
    texto: texto,
    date: new Date(), // Fecha actual
    idUser: idUser
  };

  try {
    // Inicia la transacción para asegurar la integridad de los datos
    await this.afs.firestore.runTransaction(async (transaction) => {
      const empresaDoc = await transaction.get(empresaRef.ref);

      if (!empresaDoc.exists) {
        throw new Error(`La empresa con ID ${idEmpresa} no existe.`);
      }

      // Aserción de tipo para los datos de la empresa
      const empresaData = empresaDoc.data() as { notas?: any[] };

      // Obtener el arreglo de notas o inicializarlo si no existe
      const notas = empresaData?.notas || [];

      // Agregar la nueva nota al arreglo de notas
      notas.push(nuevaNota);

      // Actualizar el documento de la empresa con el nuevo arreglo de notas
      transaction.update(empresaRef.ref, { notas: notas });
    });

    console.log('Nota guardada correctamente en la empresa.');
  } catch (error) {
    console.error('Error al guardar la nota:', error);
    throw error;
  }
}

async updateNoteColor(idEmpresa: string, idNote: string, color: string): Promise<void> {
  const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa);

  try {
    // Inicia la transacción para asegurar la integridad de los datos
    await this.afs.firestore.runTransaction(async (transaction) => {
      const empresaDoc = await transaction.get(empresaRef.ref);

      if (!empresaDoc.exists) {
        throw new Error(`La empresa con ID ${idEmpresa} no existe.`);
      }

      // Aserción de tipo para los datos de la empresa
      const empresaData = empresaDoc.data() as { notas?: any[] };

      // Obtener el arreglo de notas o inicializarlo si no existe
      const notas = empresaData?.notas || [];

      // Encontrar la nota por su ID
      const noteIndex = notas.findIndex((note: any) => note.id === idNote);
      if (noteIndex === -1) {
        throw new Error(`La nota con ID ${idNote} no existe.`);
      }

      // Actualizar el color de la nota
      notas[noteIndex].color = color;

      // Actualizar el documento de la empresa con el nuevo arreglo de notas
      transaction.update(empresaRef.ref, { notas: notas });
    });

    console.log('Color de la nota actualizado correctamente.');
  } catch (error) {
    console.error('Error al actualizar el color de la nota:', error);
    throw error;
  }
}
async deleteNote(idEmpresa: string, idNote: string): Promise<void> {
  const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa);

  try {
    await this.afs.firestore.runTransaction(async (transaction) => {
      const empresaDoc = await transaction.get(empresaRef.ref);

      if (!empresaDoc.exists) {
        throw new Error(`La empresa con ID ${idEmpresa} no existe.`);
      }

      const empresaData = empresaDoc.data() as { notas?: any[] };
      const notas = empresaData?.notas || [];

      // Filtrar las notas para eliminar la que tiene el ID especificado
      const updatedNotas = notas.filter((note: any) => note.id !== idNote);

      // Actualizar el documento con el nuevo arreglo de notas
      transaction.update(empresaRef.ref, { notas: updatedNotas });
    });

    console.log('Nota eliminada correctamente.');
  } catch (error) {
    console.error('Error al eliminar la nota:', error);
    throw error;
  }
}
async addToOpened(idEmpresa: string, nuevoObjeto: any): Promise<void> {
  const empresaRef = this.afs.collection('crmEnterpise').doc(idEmpresa);

  try {
    // Genera un ID basado en el timestamp actual
    const objetoConId = {
      ...nuevoObjeto,
      id: Date.now() // Asignar un ID único usando el timestamp
    };

    // Inicia la transacción para asegurar que el dato se actualiza correctamente
    await this.afs.firestore.runTransaction(async (transaction) => {
      const empresaDoc = await transaction.get(empresaRef.ref);

      if (!empresaDoc.exists) {
        throw new Error(`La empresa con ID ${idEmpresa} no existe.`);
      }

      // Obtener los datos de la empresa
      const empresaData = empresaDoc.data() as { opened?: any[] };

      // Obtener el arreglo 'opened' o inicializarlo si no existe
      const opened = empresaData?.opened || [];

      // Agregar el nuevo objeto al arreglo 'opened'
      opened.push(objetoConId);

      // Actualizar el documento de la empresa con el nuevo arreglo 'opened'
      transaction.update(empresaRef.ref, { opened: opened });
    });

    console.log('Objeto agregado correctamente al arreglo opened.');
  } catch (error) {
    console.error('Error al agregar el objeto al arreglo opened:', error);
    throw error;
  }
}







    
  

  


}
