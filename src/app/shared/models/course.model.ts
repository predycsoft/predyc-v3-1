import { Modulo } from "./module.model";
import { Skill } from './skill.model';
import { DocumentReference } from "@angular/fire/compat/firestore"


export class Curso {


  public static collection = 'course'

  categoria: string = ""
  descripcion: string = ""
  duracion: number = 0
  foto: string = ""
  id: string = ""
  instructorFoto: string = ""
  instructorNombre: string = ""
  instructorResumen: string = ""
  modulos: Modulo[] = []
  skillsRef: DocumentReference[] = []
  nivel: string = ""
  titulo: string = ""
  instructorDescripcion: string = ""
  vimeoFolderId: string = ""
  enterpriseRef: DocumentReference = null




  }
