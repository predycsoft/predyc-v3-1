import { Clase } from "./course-class.model";
import { DocumentReference } from "@angular/fire/compat/firestore"

  export class Modulo {
    public static collection = 'module'
    public static backupCollection = 'module-backup'
    id: string = ""
    titulo: string = ""
    numero: number = 0
    duracion: number = 0
    clasesRef: DocumentReference[] = [];


    public toJson() {
      return {
          id: this.id,
          titulo: this.titulo,
          numero: this.numero,
          duracion: this.duracion,
          clasesRef: this.clasesRef
      }
    }
    
  }
  