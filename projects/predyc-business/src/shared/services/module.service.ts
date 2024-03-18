import { Injectable } from '@angular/core';
import { AngularFirestore, DocumentReference } from '@angular/fire/compat/firestore';
import { AlertsService } from './alerts.service';
import { Curso } from 'projects/shared/models/course.model';
import { Modulo } from 'projects/shared/models/module.model';
import { Observable } from 'rxjs/internal/Observable';

@Injectable({
  providedIn: 'root'
})
export class ModuleService {

  constructor(
    private afs: AngularFirestore,
    private alertService: AlertsService
  ) 
  {

  }

  async saveModulo(newModulo: Modulo,idCourse): Promise<void> {
    try {
      try {
        await this.afs.collection(Curso.collection) // Referenciamos la colección principal
        .doc(idCourse) // Referenciamos el documento principal
        .collection(Modulo.collection) // Referenciamos la subcolección
        .doc(newModulo.id) // Referenciamos el documento en la subcolección, o .add() para crear uno con ID automático
        .set(newModulo.toJson(), { merge: true }); // Guardamos/actualizamos el documento en la subcolección
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado un modulo curso exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async deleteModulo(moduloId: string, idCourse: string): Promise<void> {
    try {
      await this.afs.collection(Curso.collection) // Referenciamos la colección principal
        .doc(idCourse) // Referenciamos el documento principal
        .collection(Modulo.collection) // Referenciamos la subcolección
        .doc(moduloId) // Referenciamos el documento en la subcolección que deseamos eliminar
        .delete(); // Eliminamos el documento de la subcolección
      
      console.log('Has eliminado un modulo curso exitosamente.')
  
    } catch (error) {
      console.log(error);
      this.alertService.errorAlert(JSON.stringify(error));
    }
  }

  getModules$(courseId: string): Observable<Modulo[]> {
    return this.afs.collection<Curso>(Curso.collection).doc(courseId).collection<Modulo>(Modulo.collection).valueChanges()
  }

}
