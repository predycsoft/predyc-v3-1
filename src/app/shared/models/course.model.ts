import { Modulo } from "./module.model";
import { Skill } from './skill.model';
import { DocumentReference } from "@angular/fire/compat/firestore"


export class Curso {


  public static collection = 'course'

  //categoria: string = ""
  descripcion: string = ""
  resumen: string = ""
  nuevo: boolean = false
  proximamente: boolean = false;
  idioma: string = "Español"
  //duracion: number = 0
  imagen: string = ""
  contenido: string = ""
  instructor: string = ""
  imagen_instructor: string = ""
  resumen_instructor: string = ""
  foto: string = ""
  id: string = ""
  //instructorFoto: string = ""
  instructorRef: DocumentReference = null
  instructorNombre: string = ""
  //instructorResumen: string = ""
  //modulos: Modulo[] = []
  skillsRef: DocumentReference[] = []
  nivel: string = ""
  titulo: string = ""
  instructorDescripcion: string = ""
  vimeoFolderId: string = ""
  enterpriseRef: DocumentReference = null
  idOld: string = ""




  }
