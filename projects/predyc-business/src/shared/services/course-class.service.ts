import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore, DocumentReference} from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable } from 'rxjs'
import { EnterpriseService } from './enterprise.service';
import { AlertsService } from './alerts.service';

import { Skill } from 'projects/shared/models/skill.model';
import { Curso } from 'projects/shared/models/course.model';
import { Clase } from 'projects/shared/models/course-class.model';
import { Modulo } from 'projects/shared/models/module.model';
import { Activity } from 'projects/shared/models/activity-classes.model';
import { Question } from 'projects/shared/models/activity-classes.model';


@Injectable({
  providedIn: 'root'
})
export class CourseClassService {

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private enterpriseService: EnterpriseService,
    private alertService: AlertsService
  ) 
  {

  }

  private skillsSubject = new BehaviorSubject<Skill[]>([]);

  async saveClass(newClass: Clase): Promise<void> {
    try {
      try {
        await this.afs.collection(Clase.collection).doc(newClass?.id).set(newClass.toJson(), { merge: true });
      } catch (error) {
        console.log(error)
        throw error
      }
      console.log('Has agregado una nuevo clase exitosamente.')
    } catch (error) {
      console.log(error)
      this.alertService.errorAlert(JSON.stringify(error))
    }
  }

  async deleteClass(classId: string): Promise<void> {
    try {
      await this.afs.collection(Clase.collection).doc(classId).delete();
    } catch (error) {
      console.error(error);
      // Manejar el error, por ejemplo, mostrando un alerta al usuario.
    }
  }

  async deleteClassReference(courseId: string, moduleId: string, classId: string,activityId: string = null): Promise<void> { // usar solo en borrador
    try {
      const moduleDocRef = this.afs.collection(Curso.collection).doc(courseId).collection(Modulo.collection).doc(moduleId).ref;
      
      // Obtener el documento actual
      const moduleDoc = await moduleDocRef.get();
      if(!moduleDoc.exists) {
        throw new Error('Documento no existe');
      }
  
      // Obtener el array de clases y filtrarlo para remover el id deseado
      const clases = moduleDoc.data()?.['clasesRef'] || [];
      console.log('clases',clases);
      const updatedClases = clases.filter((clasesRef => clasesRef.id !== classId));
      console.log('deletedClassesReference',updatedClases,moduleDocRef);

  
      // Actualizar el documento con el array modificado
      await moduleDocRef.update({clasesRef: updatedClases});

      console.log('ActivityDelete',activityId)


      if(activityId){
      // Obtener la referencia del documento en la colección 'activity'

      const activityDocRef = this.afs.collection(Activity.collection).doc(activityId).ref;

        // Obtener y eliminar todos los documentos en la subcolección
        const subcollectionRef = activityDocRef.collection(Question.collection); // Cambia esto al nombre real de tu subcolección
        const subcollectionSnapshot = await subcollectionRef.get();
        subcollectionSnapshot.forEach(doc => {
          doc.ref.delete();
        });
        
        // Ahora, eliminar el documento principal en la colección 'activity'
        await activityDocRef.delete();
      }



      
    } catch (error) {
      console.error(error);
      // Maneja el error según sea necesario.
    }
  }
  async deleteClassAndReference(classId: string, courseId: string, moduleId: string,activityId:string = null): Promise<void> {
    try {
      await this.deleteClass(classId);
      await this.deleteClassReference(courseId, moduleId, classId,activityId);
      console.log('Clase y referencia borradas exitosamente');
    } catch (error) {
      console.error(error);
      // Manejar el error, por ejemplo, mostrando un alerta al usuario.
    }
  }

}
